import { NotFoundError, BadRequestError, ForbiddenError } from "routing-controllers";
import bcrypt from "bcryptjs";
import { mealsRepository } from "./meals.repository";
import { mealCoachReviewsRepository } from "./meal-coach-reviews.repository";
import { consumerProfilesRepository } from "../consumers/consumer-profiles.repository";
import { coachAssignmentsRepository } from "../coaches/coach-assignments.repository";
import { cohortsRepository } from "../coaches/cohorts.repository";
import { coachMessagesRepository } from "../coaches/coach-messages.repository";
import { chatRepository } from "../chat/chat.repository";
import { chatService } from "../chat/chat.service";
import { coachProfilesRepository } from "../coaches/coach-profiles.repository";
import { buildOrganizationRoster } from "../coaches/team-roster.util";
import { notificationsService } from "../notifications/notifications.service";
import { usersRepository } from "../users/users.repository";
import { emailService } from "../../services/email.service";
import { broadcastCoachQueueToAll } from "../../services/coach-realtime.service";
import { logger } from "../../config/logger";
import { adminAuditService } from "../admin/admin-audit.service";
import { assertCoachModule } from "../../middlewares/entitlements";
import { computeDashboard } from "../consumers/dashboard.util";
import { asDetectedItems, normalizeMealItems, sumNutrition } from "./nutrition.util";
import { assessMealAllergens } from "./allergen-match.util";
import {
  mealToCoachDto,
  waitingMinutes,
  reviewToDto,
} from "./meal-effective.util";
import {
  ensureCoachCanAccessClient,
  filterConsumersForCoach,
  filterMealsForCoach,
  resolveCoachCaseloadIds,
  resolveCoachQueueClientIds,
  slaLevel,
  SLA_WARNING_MINUTES,
} from "./coach-scope.util";
import {
  deriveClassificationLabel,
  deriveMealComplexity,
  slaMinutesRemaining,
} from "./meal-metrics.util";
import { mealReviewTasksRepository } from "./meal-review-tasks.repository";
import { coachReviewDraftsRepository } from "./coach-review-drafts.repository";
import type { MealSubmission } from "./meal-submission.entity";
import type { MealCoachReview } from "./meal-coach-review.entity";
import type { ReviewMealDto } from "./meals.dto";

function coachSafeFirstName(displayName: unknown): string {
  if (typeof displayName !== "string" || !displayName.trim()) return "Patient";
  return displayName.trim().split(/\s+/)[0];
}

function toClientDto(
  consumer: { id: string; profile: Record<string, unknown>; dashboard: Record<string, unknown> },
  meals: MealSubmission[],
  reviewsByMealId: Map<string, MealCoachReview>,
  extras?: {
    lastMealAt?: string | null;
    inReviewCount?: number;
    cohortIds?: string[];
    unreadMessages?: number;
    adherenceTrend?: "improving" | "stable" | "declining";
    openFlags?: number;
  },
) {
  const approvedMeals = meals.filter((m) => m.status === "approved");
  const dashboard = computeDashboard(consumer.profile, consumer.dashboard, approvedMeals, reviewsByMealId);
  const allergies = Array.isArray(consumer.profile.allergies)
    ? (consumer.profile.allergies as string[])
    : [];
  return {
    patientId: consumer.id,
    profile: {
      ...consumer.profile,
      displayName: coachSafeFirstName(consumer.profile.displayName),
      allergies,
    },
    dashboard,
    lastMealAt: extras?.lastMealAt ?? null,
    inReviewCount: extras?.inReviewCount ?? 0,
    cohortIds: extras?.cohortIds ?? [],
    unreadMessages: extras?.unreadMessages ?? 0,
    adherenceTrend: extras?.adherenceTrend ?? "stable",
    openFlags: extras?.openFlags ?? 0,
    hasAllergies: allergies.length > 0,
    clientHasAllergies: allergies.length > 0,
  };
}

function computeAdherenceTrend(meals: MealSubmission[]): "improving" | "stable" | "declining" {
  const days = [0, 1, 2, 3, 4, 5, 6].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const key = d.toISOString().slice(0, 10);
    return meals.some((m) => m.submittedAt.toISOString().slice(0, 10) === key) ? 1 : 0;
  });
  const recent = days.slice(0, 3).reduce<number>((a, b) => a + b, 0);
  const prior = days.slice(4, 7).reduce<number>((a, b) => a + b, 0);
  if (recent > prior) return "improving";
  if (recent < prior) return "declining";
  return "stable";
}

function groupMealsByClient(meals: MealSubmission[]) {
  const map = new Map<string, MealSubmission[]>();
  for (const meal of meals) {
    const list = map.get(meal.clientId) ?? [];
    list.push(meal);
    map.set(meal.clientId, list);
  }
  return map;
}

async function buildReviewsMap(mealIds: string[]) {
  const reviews = await mealCoachReviewsRepository.findByMealIds(mealIds);
  return new Map(reviews.map((r) => [r.mealId, r]));
}

export const coachMealsService = {
  async getStats(coachUserId: string, cohortId?: string) {
    const [allMeals, reviews, queueClientIds] = await Promise.all([
      mealsRepository.findAllMeals(),
      mealCoachReviewsRepository.findAll(),
      resolveCoachQueueClientIds(cohortId),
    ]);
    const queueMeals = filterMealsForCoach(allMeals, queueClientIds);
    const coachReviews = reviews.filter((r) => r.coachId === coachUserId);

    const today = new Date().toISOString().slice(0, 10);
    const inReviewMeals = queueMeals.filter((m) => m.status === "in_review");
    const inReview = inReviewMeals.length;
    const analyzing = queueMeals.filter((m) => m.status === "analyzing").length;
    const flagged = inReviewMeals.filter((m) => m.data.fraudCheckResult === "flag").length;
    const approvedToday = coachReviews.filter(
      (r) =>
        r.action === "approve" &&
        r.reviewedAt.toISOString().slice(0, 10) === today,
    ).length;

    const durations = coachReviews
      .map((r) => r.reviewDurationSeconds)
      .filter((v): v is number => typeof v === "number" && v > 0);
    const avgReviewMinutes =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60)
        : 0;

    const waitingOverHour = inReviewMeals.filter(
      (m) => waitingMinutes(m.submittedAt) >= SLA_WARNING_MINUTES,
    ).length;

    const inactiveClients = await this.countInactiveClients(coachUserId, cohortId);

    return {
      inReview,
      analyzing,
      approvedToday,
      flagged,
      avgReviewMinutes,
      waitingOverHour,
      inactiveClients,
      unreadMessages: await chatRepository.countUnreadForUser(coachUserId),
    };
  },

  async countInactiveClients(coachUserId: string, cohortId?: string) {
    const [consumers, meals, clientIds] = await Promise.all([
      mealsRepository.findAllConsumers(),
      mealsRepository.findAllMeals(),
      resolveCoachCaseloadIds(coachUserId, cohortId),
    ]);
    const scopedConsumers = filterConsumersForCoach(consumers, clientIds);
    const scopedMeals = clientIds.size
      ? meals.filter((m) => clientIds.has(m.clientId))
      : [];
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    let inactive = 0;
    for (const consumer of scopedConsumers) {
      const clientMeals = scopedMeals.filter((m) => m.clientId === consumer.id);
      const lastAt = clientMeals.reduce(
        (max, m) => Math.max(max, m.submittedAt.getTime()),
        0,
      );
      if (!lastAt || lastAt < cutoff) inactive++;
    }
    return inactive;
  },

  async getQueue(
    coachUserId: string,
    options: {
      search?: string;
      sort?: "oldest" | "newest" | "flagged" | "low_confidence" | "sla_urgency";
      cohortId?: string;
    } = {},
  ) {
    const [allMeals, clientIds] = await Promise.all([
      mealsRepository.findAllMeals(),
      resolveCoachQueueClientIds(options.cohortId),
    ]);
    const meals = filterMealsForCoach(allMeals, clientIds);
    const mealsByClient = groupMealsByClient(meals);
    const reviewsByMealId = await buildReviewsMap(meals.map((m) => m.id));

    let queue = meals.filter((m) => m.status === "in_review");

    if (options.search?.trim()) {
      const q = options.search.trim().toLowerCase();
      queue = queue.filter((m) => {
        const mealName = String(m.data.mealName ?? "").toLowerCase();
        return m.clientId.toLowerCase().includes(q) || mealName.includes(q);
      });
    }

    const sort = options.sort ?? "oldest";
    queue.sort((a, b) => {
      const aManual = a.data.manualReviewRequired === true ? 1 : 0;
      const bManual = b.data.manualReviewRequired === true ? 1 : 0;
      if (bManual !== aManual) return bManual - aManual;

      if (sort === "newest") return b.submittedAt.getTime() - a.submittedAt.getTime();
      if (sort === "flagged") {
        const af = a.data.fraudCheckResult === "flag" ? 1 : 0;
        const bf = b.data.fraudCheckResult === "flag" ? 1 : 0;
        if (bf !== af) return bf - af;
      }
      if (sort === "low_confidence") {
        const ac = Number(a.data.confidenceAvg ?? 1);
        const bc = Number(b.data.confidenceAvg ?? 1);
        if (ac !== bc) return ac - bc;
      }
      if (sort === "sla_urgency") {
        const ar = slaMinutesRemaining(a.submittedAt);
        const br = slaMinutesRemaining(b.submittedAt);
        if (ar !== br) return ar - br;
      }
      return a.submittedAt.getTime() - b.submittedAt.getTime();
    });

    const items = [];
    for (const meal of queue) {
      const consumer = await mealsRepository.findConsumerById(meal.clientId);
      if (!consumer) continue;
      const review = reviewsByMealId.get(meal.id);
      const allergies = Array.isArray(consumer.profile.allergies)
        ? (consumer.profile.allergies as string[])
        : [];
      const allergenAssessment =
        (meal.data.allergenAssessment as ReturnType<typeof assessMealAllergens> | undefined) ??
        assessMealAllergens(allergies, asDetectedItems(review?.items ?? meal.data.items));
      items.push({
        meal: {
          ...mealToCoachDto(meal, review),
          waitingMinutes: waitingMinutes(meal.submittedAt),
          slaLevel: slaLevel(waitingMinutes(meal.submittedAt)),
          slaMinutesRemaining: slaMinutesRemaining(meal.submittedAt),
          complexity: deriveMealComplexity(meal),
          classificationLabel: deriveClassificationLabel(meal),
          hasAllergies: allergenAssessment.allergenMatch || allergenAssessment.possibleAllergenMatch,
          clientHasAllergies: allergies.length > 0,
          allergenMatch: allergenAssessment.allergenMatch,
          possibleAllergenMatch: allergenAssessment.possibleAllergenMatch,
          matchedAllergens: allergenAssessment.matchedAllergens,
          possibleAllergens: allergenAssessment.possibleAllergens,
        },
        client: toClientDto(consumer, mealsByClient.get(consumer.id) ?? [], reviewsByMealId),
      });
    }
    return items;
  },

  async getPastReviews(
    coachUserId: string,
    options: {
      search?: string;
      action?: "approve" | "reject";
      limit?: number;
    } = {},
  ) {
    const limit = Math.min(options.limit ?? 50, 100);

    const [allMeals, coachReviews] = await Promise.all([
      mealsRepository.findAllMeals(),
      mealCoachReviewsRepository.findByCoachId(coachUserId),
    ]);

    const mealMap = new Map(allMeals.map((m) => [m.id, m]));
    const reviewedMealIds = new Set<string>();

    type ReviewEntry = { mealId: string; review: ReturnType<typeof reviewToDto> };
    const entries: ReviewEntry[] = [];

    for (const review of coachReviews) {
      if (!mealMap.has(review.mealId)) continue;
      if (options.action && review.action !== options.action) continue;
      reviewedMealIds.add(review.mealId);
      entries.push({ mealId: review.mealId, review: reviewToDto(review) });
    }

    for (const meal of allMeals) {
      if (meal.status !== "approved" && meal.status !== "rejected") continue;
      if (reviewedMealIds.has(meal.id)) continue;
      const legacy = meal.data.coachReview as
        | { coachId?: string; note?: string; reviewedAt?: string }
        | undefined;
      if (!legacy?.reviewedAt) continue;
      if (legacy.coachId && legacy.coachId !== coachUserId) continue;
      if (options.action === "approve" && meal.status !== "approved") continue;
      if (options.action === "reject" && meal.status !== "rejected") continue;
      entries.push({
        mealId: meal.id,
        review: {
          id: `legacy_${meal.id}`,
          mealId: meal.id,
          coachId: legacy.coachId ?? "unknown",
          note: legacy.note,
          reviewedAt: legacy.reviewedAt,
          action: meal.status === "approved" ? "approve" : "reject",
          mealName: (meal.data.mealName as string | undefined) ?? undefined,
          items: asDetectedItems(meal.data.items),
          totalNutrition: meal.data.totalNutrition as Record<string, number> | undefined,
        },
      });
    }

    entries.sort(
      (a, b) =>
        new Date(b.review.reviewedAt ?? 0).getTime() -
        new Date(a.review.reviewedAt ?? 0).getTime(),
    );

    let filtered = entries;
    if (options.search?.trim()) {
      const q = options.search.trim().toLowerCase();
      filtered = entries.filter(({ mealId, review }) => {
        const meal = mealMap.get(mealId);
        if (!meal) return false;
        const clientId = meal.clientId.toLowerCase();
        const name = String(review.mealName ?? meal.data.mealName ?? "").toLowerCase();
        return clientId.includes(q) || name.includes(q);
      });
    }

    filtered = filtered.slice(0, limit);

    const mealsByClient = groupMealsByClient(allMeals);
    const reviewsByMealId = await buildReviewsMap(filtered.map((e) => e.mealId));
    const consumerCache = new Map<string, Awaited<ReturnType<typeof mealsRepository.findConsumerById>>>();

    const result = [];
    for (const { mealId, review } of filtered) {
      const meal = mealMap.get(mealId);
      if (!meal) continue;

      let consumer = consumerCache.get(meal.clientId);
      if (consumer === undefined) {
        consumer = await mealsRepository.findConsumerById(meal.clientId);
        consumerCache.set(meal.clientId, consumer);
      }
      if (!consumer) continue;

      const reviewRecord = reviewsByMealId.get(mealId);
      result.push({
        meal: mealToCoachDto(meal, reviewRecord),
        client: toClientDto(consumer, mealsByClient.get(consumer.id) ?? [], reviewsByMealId),
        review,
      });
    }

    return result;
  },

  async getMealById(id: string, coachUserId: string) {
    const meal = await mealsRepository.findMealById(id);
    if (!meal) return null;
    await ensureCoachCanAccessClient(coachUserId, meal.clientId);

    const [consumer, clientMeals, review] = await Promise.all([
      mealsRepository.findConsumerById(meal.clientId),
      mealsRepository.findMealsByClientId(meal.clientId),
      mealCoachReviewsRepository.findByMealId(id),
    ]);
    if (!consumer) return null;

    const reviewsByMealId = await buildReviewsMap(clientMeals.map((m) => m.id));
    const recentMeals = clientMeals
      .filter((m) => m.id !== id)
      .slice(0, 8)
      .map((m) => mealToCoachDto(m, reviewsByMealId.get(m.id)));

    const reviewHistory = review
      ? [reviewToDto(review)]
      : meal.status === "approved" || meal.status === "rejected"
        ? (() => {
            const legacy = meal.data.coachReview as
              | { coachId?: string; note?: string; reviewedAt?: string }
              | undefined;
            if (!legacy?.reviewedAt) return [];
            return [
              {
                coachId: legacy.coachId,
                note: legacy.note,
                reviewedAt: legacy.reviewedAt,
                action: meal.status === "approved" ? ("approve" as const) : ("reject" as const),
              },
            ];
          })()
        : [];

    return {
      meal: {
        ...mealToCoachDto(meal, review),
        waitingMinutes: waitingMinutes(meal.submittedAt),
        slaLevel: slaLevel(waitingMinutes(meal.submittedAt)),
      },
      client: toClientDto(consumer, clientMeals, reviewsByMealId, {
        inReviewCount: clientMeals.filter((m) => m.status === "in_review").length,
      }),
      recentMeals,
      reviewHistory,
    };
  },

  async getClients(coachUserId: string, cohortId?: string) {
    const [consumers, allMeals, clientIds] = await Promise.all([
      mealsRepository.findAllConsumers(),
      mealsRepository.findAllMeals(),
      resolveCoachCaseloadIds(coachUserId, cohortId),
    ]);
    const scopedConsumers = filterConsumersForCoach(consumers, clientIds);
    const meals = allMeals.filter((m) => clientIds.has(m.clientId));
    const mealsByClient = groupMealsByClient(meals);
    const reviewsByMealId = await buildReviewsMap(meals.map((m) => m.id));
    const coachProfile = await coachProfilesRepository.findByUserId(coachUserId);
    const conversations = await chatRepository.listCoachConversations(
      coachUserId,
      coachProfile?.organization ?? null,
    );
    const unreadRows = await chatRepository.unreadByConversation(
      coachUserId,
      conversations.map((c) => c.id),
    );
    const unreadByClient = new Map<string, number>();
    for (const conv of conversations) {
      if (conv.type !== "patient" || !conv.clientId) continue;
      const row = unreadRows.find((r) => r.conversationId === conv.id);
      if (row?.count) unreadByClient.set(conv.clientId, Number(row.count));
    }

    return scopedConsumers.map((consumer) => {
      const clientMeals = mealsByClient.get(consumer.id) ?? [];
      const lastMeal = clientMeals.reduce<MealSubmission | null>((best, m) => {
        if (!best || m.submittedAt > best.submittedAt) return m;
        return best;
      }, null);
      return toClientDto(consumer, clientMeals, reviewsByMealId, {
        lastMealAt: lastMeal?.submittedAt.toISOString() ?? null,
        inReviewCount: clientMeals.filter((m) => m.status === "in_review").length,
        unreadMessages: unreadByClient.get(consumer.id) ?? 0,
        adherenceTrend: computeAdherenceTrend(clientMeals),
        openFlags:
          (clientMeals.filter((m) => m.status === "in_review").length > 0 ? 1 : 0) +
          ((unreadByClient.get(consumer.id) ?? 0) > 0 ? 1 : 0),
      });
    });
  },

  async getClientById(clientId: string, coachUserId: string) {
    await ensureCoachCanAccessClient(coachUserId, clientId);
    const [consumer, clientMeals] = await Promise.all([
      mealsRepository.findConsumerById(clientId),
      mealsRepository.findMealsByClientId(clientId),
    ]);
    if (!consumer) throw new NotFoundError("Client not found");

    const reviewsByMealId = await buildReviewsMap(clientMeals.map((m) => m.id));
    const meals = clientMeals.map((m) => mealToCoachDto(m, reviewsByMealId.get(m.id)));
    const assignments = await coachAssignmentsRepository.findByClientId(clientId);
    const cohortMemberships = await cohortsRepository.findCohortsForClient(clientId);

    return {
      client: toClientDto(consumer, clientMeals, reviewsByMealId, {
        inReviewCount: clientMeals.filter((m) => m.status === "in_review").length,
        cohortIds: cohortMemberships.map((m) => m.cohortId),
      }),
      meals,
      assignedCoachIds: assignments.map((a) => a.coachUserId),
    };
  },

  async getClientWeeklySummary(clientId: string, coachUserId: string) {
    await ensureCoachCanAccessClient(coachUserId, clientId);
    const consumer = await mealsRepository.findConsumerById(clientId);
    if (!consumer) throw new NotFoundError("Client not found");

    const meals = await mealsRepository.findMealsByClientId(clientId);
    const reviewsByMealId = await buildReviewsMap(meals.map((m) => m.id));
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);

    let approvedCount = 0;
    let rejectedCount = 0;
    let calories = 0;
    let proteinG = 0;
    let carbsG = 0;
    let fatG = 0;
    const daysLogged = new Set<string>();

    for (const meal of meals) {
      if (meal.submittedAt < weekStart) continue;
      const day = meal.submittedAt.toISOString().slice(0, 10);
      daysLogged.add(day);
      if (meal.status === "approved") {
        approvedCount++;
        const review = reviewsByMealId.get(meal.id);
        const dto = mealToCoachDto(meal, review);
        const n = dto.totalNutrition;
        if (n) {
          calories += n.caloriesKcal ?? 0;
          proteinG += n.proteinG ?? 0;
          carbsG += n.carbsG ?? 0;
          fatG += n.fatG ?? 0;
        }
      } else if (meal.status === "rejected") {
        rejectedCount++;
      }
    }

    const macroTargets = (consumer.profile.macroTargets as Record<string, number>) ?? {};
    return {
      clientId,
      weekStart: weekStart.toISOString().slice(0, 10),
      daysLogged: daysLogged.size,
      mealsSubmitted: meals.filter((m) => m.submittedAt >= weekStart).length,
      approvedCount,
      rejectedCount,
      avgDailyCalories: daysLogged.size ? Math.round(calories / daysLogged.size) : 0,
      totals: {
        calories: Math.round(calories),
        proteinG: Math.round(proteinG),
        carbsG: Math.round(carbsG),
        fatG: Math.round(fatG),
      },
      targets: {
        calories: macroTargets.calories ?? 0,
        proteinG: macroTargets.proteinG ?? 0,
        carbsG: macroTargets.carbsG ?? 0,
        fatG: macroTargets.fatG ?? 0,
      },
      adherenceRate:
        approvedCount + rejectedCount > 0
          ? Math.round((approvedCount / (approvedCount + rejectedCount)) * 100)
          : 0,
    };
  },

  async reviewMeal(mealId: string, coachId: string, dto: ReviewMealDto) {
    await assertCoachModule(coachId, "coaching");
    const meal = await mealsRepository.findMealById(mealId);
    if (!meal) throw new NotFoundError("Meal not found");
    await ensureCoachCanAccessClient(coachId, meal.clientId);

    const existingReview = await mealCoachReviewsRepository.findByMealId(mealId);
    if (existingReview) {
      throw new BadRequestError("This meal has already been reviewed");
    }

    const items = dto.items
      ? normalizeMealItems(dto.items)
      : normalizeMealItems(meal.data.items);
    const totalNutrition = items.length ? sumNutrition(items) : undefined;
    const reviewedAt = new Date();
    const reviewDurationSeconds = Math.max(
      0,
      Math.round((reviewedAt.getTime() - meal.submittedAt.getTime()) / 1000),
    );

    const consumerForAllergen = await consumerProfilesRepository.findById(meal.clientId);
    const allergenAssessment = assessMealAllergens(
      consumerForAllergen?.profile?.allergies,
      items,
    );
    meal.data = { ...meal.data, allergenAssessment };
    meal.status = dto.action === "approve" ? "approved" : "rejected";
    await mealsRepository.saveMeal(meal);

    const review = await mealCoachReviewsRepository.save({
      mealId,
      coachId,
      action: dto.action,
      note: dto.note ?? null,
      trainingNote: dto.trainingNote ?? null,
      mealName: dto.mealName ?? (meal.data.mealName as string | undefined) ?? null,
      items: items.length ? items : null,
      totalNutrition: totalNutrition ?? null,
      reviewDurationSeconds,
      reviewedAt,
    });

    await coachReviewDraftsRepository.delete(mealId, coachId);

    await adminAuditService.log(coachId, `meal.review.${dto.action}`, {
      targetType: "meal",
      targetId: mealId,
      meta: {
        clientId: meal.clientId,
        allergenMatch: allergenAssessment.allergenMatch,
        possibleAllergenMatch: allergenAssessment.possibleAllergenMatch,
      },
    });

    const consumer = consumerForAllergen;
    if (consumer?.userId) {
      const mealName = review.mealName ?? (meal.data.mealName as string | undefined);
      void notificationsService.notifyMealStatus(consumer.userId, {
        id: meal.id,
        mealName,
        status: meal.status,
      });

      if (meal.status === "approved" || meal.status === "rejected") {
        const user = await usersRepository.findById(consumer.userId);
        if (user?.email) {
          const profile = consumer.profile as Record<string, unknown>;
          void emailService
            .sendMealStatusEmail(user.email, {
              displayName:
                typeof profile.displayName === "string"
                  ? profile.displayName
                  : user.displayName,
              mealName: mealName ?? "Your meal",
              status: meal.status,
              coachNote: dto.note ?? null,
            })
            .catch((err) =>
              logger.error({ err, userId: user.id }, "Failed to send meal status email"),
            );
        }
      }
    }

    broadcastCoachQueueToAll({ type: "queue_updated", reason: "reviewed", mealId });

    return mealToCoachDto(meal, review);
  },

  async getCohorts(coachUserId: string) {
    const profile = await coachProfilesRepository.findByUserId(coachUserId);
    const cohorts = await cohortsRepository.findAll();
    const scoped = profile?.organization
      ? cohorts.filter(
          (c) => !c.organization || c.organization === profile.organization,
        )
      : cohorts;

    const result = [];
    for (const cohort of scoped) {
      const memberCount = await cohortsRepository.memberCount(cohort.id);
      result.push({
        id: cohort.id,
        name: cohort.name,
        organization: cohort.organization,
        description: cohort.description,
        memberCount,
      });
    }
    return result;
  },

  async assignClient(coachUserId: string, clientId: string, assignedBy?: string) {
    const consumer = await mealsRepository.findConsumerById(clientId);
    if (!consumer) throw new NotFoundError("Client not found");
    const assignment = await coachAssignmentsRepository.assign(
      coachUserId,
      clientId,
      assignedBy,
    );
    return {
      coachUserId: assignment.coachUserId,
      clientId: assignment.clientId,
      assignedAt: assignment.assignedAt.toISOString(),
    };
  },

  async unassignClient(coachUserId: string, clientId: string) {
    const removed = await coachAssignmentsRepository.unassign(coachUserId, clientId);
    if (!removed) throw new NotFoundError("Assignment not found");
    return { ok: true };
  },

  async getTeamStats(coachUserId: string) {
    const profile = await coachProfilesRepository.findByUserId(coachUserId);
    if (!profile?.organization) {
      return { organization: null, coaches: [] };
    }

    const roster = await buildOrganizationRoster(profile.organization, coachUserId);

    return {
      organization: profile.organization,
      coaches: roster.map((member) => ({
        coachUserId: member.userId,
        displayName: member.displayName,
        email: member.email,
        avatarUrl: member.avatarUrl,
        role: member.role,
        title: member.title,
        approvedToday: member.approvedToday,
        totalReviews: member.totalReviews,
        avgReviewMinutes: member.avgReviewMinutes,
        caseload: member.caseload,
        isSelf: member.isSelf,
      })),
    };
  },

  async getMessages(coachUserId: string, clientId: string) {
    await ensureCoachCanAccessClient(coachUserId, clientId);
    const messages = await coachMessagesRepository.findThread(coachUserId, clientId);
    await coachMessagesRepository.markReadForCoach(coachUserId, clientId);
    return messages.map((m) => ({
      id: m.id,
      senderRole: m.senderRole,
      body: m.body,
      mealId: m.mealId,
      readAt: m.readAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    }));
  },

  async sendMessage(
    coachUserId: string,
    clientId: string,
    body: string,
    mealId?: string,
  ) {
    await ensureCoachCanAccessClient(coachUserId, clientId);
    const trimmed = body.trim();
    if (!trimmed) throw new BadRequestError("Message cannot be empty");

    const message = await coachMessagesRepository.save({
      coachUserId,
      clientId,
      senderRole: "coach",
      body: trimmed,
      mealId,
    });

    const consumer = await consumerProfilesRepository.findById(clientId);
    if (consumer?.userId) {
      void notificationsService.create({
        userId: consumer.userId,
        kind: "system",
        title: "Message from your coach",
        message: trimmed.slice(0, 120),
        data: { clientId, coachUserId, type: "coach_message" },
      });
    }

    return {
      id: message.id,
      senderRole: message.senderRole,
      body: message.body,
      mealId: message.mealId,
      createdAt: message.createdAt.toISOString(),
    };
  },

  async getReviewDraft(mealId: string, coachId: string) {
    await this.getMealById(mealId, coachId);
    const draft = await coachReviewDraftsRepository.findByMealAndCoach(mealId, coachId);
    if (!draft) return null;
    return {
      mealId: draft.mealId,
      mealName: draft.mealName ?? undefined,
      items: draft.items?.length ? asDetectedItems(draft.items) : [],
      note: draft.note ?? undefined,
      trainingNote: draft.trainingNote ?? undefined,
      updatedAt: draft.updatedAt.toISOString(),
    };
  },

  async saveReviewDraft(
    mealId: string,
    coachId: string,
    dto: {
      mealName?: string;
      items?: unknown[];
      note?: string;
      trainingNote?: string;
    },
  ) {
    await this.getMealById(mealId, coachId);
    await coachReviewDraftsRepository.upsert({
      mealId,
      coachId,
      mealName: dto.mealName ?? null,
      items: (dto.items ?? []) as Record<string, unknown>[],
      note: dto.note ?? null,
      trainingNote: dto.trainingNote ?? null,
    });
    return { ok: true };
  },

  async listReviewTasks(mealId: string, coachId: string) {
    await this.getMealById(mealId, coachId);
    const tasks = await mealReviewTasksRepository.findByMealId(mealId);
    return tasks.map((t) => ({
      id: t.id,
      mealId: t.mealId,
      type: t.type,
      status: t.status,
      note: t.note,
      notifyUser: t.notifyUser,
      requesterCoachId: t.requesterCoachId,
      assigneeCoachId: t.assigneeCoachId,
      createdAt: t.createdAt.toISOString(),
    }));
  },

  async createReviewTask(
    mealId: string,
    coachId: string,
    dto: { type: "second_opinion" | "escalation"; note?: string; notifyUser?: boolean },
  ) {
    await this.getMealById(mealId, coachId);
    const task = await mealReviewTasksRepository.create({
      mealId,
      requesterCoachId: coachId,
      type: dto.type,
      note: dto.note?.trim() || null,
      notifyUser: dto.notifyUser ?? false,
      status: "open",
    });

    try {
      const coach = await usersRepository.findById(coachId);
      const profile = await coachProfilesRepository.findByUserId(coachId);
      if (coach?.role === "coach" && profile?.organization?.trim()) {
        const team = await chatService.ensureTeamChannel(coach);
        const meal = await mealsRepository.findMealById(mealId);
        const mealName =
          (typeof meal?.data?.mealName === "string" && meal.data.mealName) ||
          (typeof meal?.data?.aiAnalysis === "object" &&
            meal.data.aiAnalysis &&
            typeof (meal.data.aiAnalysis as { mealName?: string }).mealName === "string" &&
            (meal.data.aiAnalysis as { mealName: string }).mealName) ||
          mealId;
        const label =
          dto.type === "second_opinion" ? "Second opinion requested" : "Review escalated";
        const body = dto.note?.trim()
          ? `${label} on “${mealName}”: ${dto.note.trim()}`
          : `${label} on “${mealName}”.`;
        await chatService.sendMessage(coach, team.id, body, mealId);
      }
    } catch (err) {
      logger.warn({ err, mealId, coachId }, "Failed to mirror review task to team chat");
    }

    return {
      id: task.id,
      mealId: task.mealId,
      type: task.type,
      status: task.status,
      note: task.note,
      notifyUser: task.notifyUser,
      createdAt: task.createdAt.toISOString(),
    };
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await usersRepository.findById(userId);
    if (!user?.passwordHash) throw new BadRequestError("Account cannot change password");
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestError("Current password is incorrect");
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await usersRepository.save(user);
    return { ok: true };
  },
};
