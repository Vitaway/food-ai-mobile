import { BadRequestError, NotFoundError } from "routing-controllers";
import { consumerProfilesRepository } from "../consumers/consumer-profiles.repository";
import { notificationsService } from "../notifications/notifications.service";
import { ensureCoachCanAccessClient } from "../meals/coach-scope.util";
import { assertCoachModule } from "../../middlewares/entitlements";
import { coachInsightsRepository } from "./coach-insights.repository";
import type { CoachInsight } from "./coach-insight.entity";

const ALLOWED_TYPES = new Set(["tip", "celebration", "reminder", "coach_note", "trend"]);

function toDto(row: CoachInsight) {
  return {
    id: row.id,
    coachUserId: row.coachUserId,
    clientId: row.clientId,
    type: row.type,
    title: row.title,
    body: row.body,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export const coachInsightsService = {
  async listForCoach(coachUserId: string) {
    await assertCoachModule(coachUserId, "coaching");
    const rows = await coachInsightsRepository.findByCoachUserId(coachUserId);
    return rows.map(toDto);
  },

  async listForClient(coachUserId: string, clientId: string) {
    await assertCoachModule(coachUserId, "coaching");
    await ensureCoachCanAccessClient(coachUserId, clientId);
    const rows = await coachInsightsRepository.findByClientId(clientId);
    return rows.map(toDto);
  },

  async create(
    coachUserId: string,
    input: { clientId: string; title: string; body: string; type?: string },
  ) {
    await assertCoachModule(coachUserId, "coaching");
    const title = input.title?.trim() ?? "";
    const body = input.body?.trim() ?? "";
    if (title.length < 2) throw new BadRequestError("Title is required");
    if (body.length < 3) throw new BadRequestError("Body is required");
    const type = (input.type?.trim() || "coach_note") as CoachInsight["type"];
    if (!ALLOWED_TYPES.has(type)) throw new BadRequestError("Invalid insight type");

    await ensureCoachCanAccessClient(coachUserId, input.clientId);
    const client = await consumerProfilesRepository.findById(input.clientId);
    if (!client) throw new NotFoundError("Client not found");

    const row = await coachInsightsRepository.create({
      coachUserId,
      clientId: input.clientId,
      type,
      title: title.slice(0, 160),
      body,
    });

    if (client.userId) {
      void notificationsService.create({
        userId: client.userId,
        kind: "system",
        title: "New coaching insight",
        message: title,
        data: { insightId: row.id, kind: "coach_insight" },
      });
    }

    return toDto(row);
  },
};
