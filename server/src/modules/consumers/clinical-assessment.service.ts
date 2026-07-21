import { BadRequestError, NotFoundError } from "routing-controllers";
import type {
  ConfirmClinicalAssessmentDto,
  SaveClinicalAssessmentDto,
} from "../coaches/coach.dto";
import { ensureCoachCanAccessClient } from "../meals/coach-scope.util";
import { consumerProfilesRepository } from "./consumer-profiles.repository";
import { clinicalAssessmentsRepository } from "./clinical-assessments.repository";
import { usersRepository } from "../users/users.repository";
import {
  calculateTargetsForProfile,
  mergedCalculationProfile,
  profileWithCalculatedTargets,
} from "./profile-targets.util";
import { isValidDateOfBirth } from "./date-of-birth.util";
import { sanitizeClinicalAssessmentData } from "./clinical-assessment.sanitize";
import { adminAuditService } from "../admin/admin-audit.service";
import { assertCoachModule } from "../../middlewares/entitlements";

const PROFILE_BASIC_KEYS = [
  "goal",
  "goalPace",
  "targetWeightKg",
  "activityLevel",
  "mealsPerDay",
  "dietaryPreferences",
  "allergies",
] as const;

function assessmentDto(
  row: Awaited<ReturnType<typeof clinicalAssessmentsRepository.findByClientId>>,
  clientId: string,
) {
  if (!row) {
    return {
      clientId,
      status: "incomplete" as const,
      data: {},
      targetSnapshot: null,
      lastEditedBy: null,
      confirmedBy: null,
      confirmedAt: null,
      updatedAt: null,
    };
  }
  return {
    clientId: row.clientId,
    status: row.status,
    data: row.data,
    targetSnapshot: row.targetSnapshot,
    lastEditedBy: row.lastEditedBy,
    confirmedBy: row.confirmedBy,
    confirmedAt: row.confirmedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function validateForConfirmation(
  profile: Record<string, unknown>,
  data: Record<string, unknown>,
) {
  const source = mergedCalculationProfile(profile, data);
  const missing: string[] = [];
  if (!isValidDateOfBirth(source.dateOfBirth)) missing.push("verified date of birth");
  if (source.sex !== "male" && source.sex !== "female") missing.push("calculation sex");
  if (typeof source.heightCm !== "number") missing.push("verified height");
  if (typeof source.weightKg !== "number") missing.push("verified weight");
  if (typeof source.activityLevel !== "string") missing.push("activity level");
  if (typeof source.goal !== "string") missing.push("goal");

  if (source.pregnant === true) {
    if (source.trimester !== 1 && source.trimester !== 2 && source.trimester !== 3) {
      missing.push("pregnancy trimester");
    }
    if (source.numberOfBabies !== 1 && source.numberOfBabies !== 2) {
      missing.push("number of babies");
    }
    if (typeof source.prePregnancyWeightKg !== "number") {
      missing.push("pre-pregnancy weight");
    }
  }
  if (source.pregnant === true && source.lactating === true) {
    throw new BadRequestError("Pregnancy and lactation cannot both be active in this assessment.");
  }
  if (missing.length) {
    throw new BadRequestError(`Complete the following before confirmation: ${missing.join(", ")}`);
  }
}

export const clinicalAssessmentService = {
  async listWorkflow() {
    const [profiles, assessments] = await Promise.all([
      consumerProfilesRepository.findAll(),
      clinicalAssessmentsRepository.list(),
    ]);
    const byClientId = new Map(assessments.map((assessment) => [assessment.clientId, assessment]));
    const editorIds = [
      ...new Set(
        assessments
          .flatMap((assessment) => [assessment.confirmedBy, assessment.lastEditedBy])
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const editors = await Promise.all(editorIds.map((id) => usersRepository.findById(id)));
    const editorName = new Map(
      editors.filter(Boolean).map((user) => [user!.id, user!.displayName]),
    );

    return profiles.map((profile) => {
      const assessment = byClientId.get(profile.id);
      const snapshot = assessment?.targetSnapshot as {
        safetyFlags?: unknown;
        targetStatus?: unknown;
      } | null | undefined;
      const safetyFlags = Array.isArray(snapshot?.safetyFlags)
        ? snapshot.safetyFlags.filter((flag): flag is string => typeof flag === "string")
        : [];
      const highRisk = safetyFlags.some((flag) =>
        [
          "pediatric_review_required",
          "bmi_over_40_coach_review",
          "condition_kidney_disease",
          "condition_diabetes",
          "condition_heart_disease",
        ].includes(flag),
      );
      const status = assessment?.status ?? "incomplete";
      const risk = highRisk ? "high" : status === "confirmed" ? "low" : "medium";
      const coachId = assessment?.confirmedBy ?? assessment?.lastEditedBy ?? null;
      return {
        clientId: profile.id,
        displayName:
          typeof profile.profile.displayName === "string"
            ? profile.profile.displayName
            : "Patient",
        status,
        risk,
        assignedCoach: coachId ? (editorName.get(coachId) ?? "Coach") : null,
        targetStatus:
          typeof snapshot?.targetStatus === "string" ? snapshot.targetStatus : "unavailable",
        safetyFlags,
        updatedAt: assessment?.updatedAt.toISOString() ?? null,
      };
    });
  },

  async get(clientId: string, coachUserId: string) {
    await ensureCoachCanAccessClient(coachUserId, clientId);
    return this.getByClientId(clientId);
  },

  async getByClientId(clientId: string) {
    const profile = await consumerProfilesRepository.findById(clientId);
    if (!profile) throw new NotFoundError("Patient not found");
    const assessment = await clinicalAssessmentsRepository.findByClientId(clientId);
    return {
      ...assessmentDto(assessment, clientId),
      patientBasics: {
        age: profile.profile.age ?? null,
        dateOfBirth: profile.profile.dateOfBirth ?? null,
        sex: profile.profile.sex ?? null,
        heightCm: profile.profile.heightCm ?? null,
        weightKg: profile.profile.weightKg ?? null,
        goal: profile.profile.goal ?? null,
        goalPace: profile.profile.goalPace ?? null,
        targetWeightKg: profile.profile.targetWeightKg ?? null,
        activityLevel: profile.profile.activityLevel ?? null,
        mealsPerDay: profile.profile.mealsPerDay ?? null,
        dietaryPreferences: profile.profile.dietaryPreferences ?? [],
        allergies: profile.profile.allergies ?? [],
      },
    };
  },

  async saveDraft(clientId: string, coachUserId: string, dto: SaveClinicalAssessmentDto) {
    await ensureCoachCanAccessClient(coachUserId, clientId);
    return this.saveDraftByClientId(clientId, coachUserId, dto);
  },

  async saveDraftByClientId(clientId: string, editorUserId: string, dto: SaveClinicalAssessmentDto) {
    const profile = await consumerProfilesRepository.findById(clientId);
    if (!profile) throw new NotFoundError("Patient not found");

    let assessment = await clinicalAssessmentsRepository.findByClientId(clientId);
    if (!assessment) {
      assessment = clinicalAssessmentsRepository.create({
        clientId,
        status: "draft",
        data: {},
        targetSnapshot: null,
      });
    }
    assessment.status = "draft";

    const dtoRecord = dto as unknown as Record<string, unknown>;
    const assessmentPatch: Record<string, unknown> = { ...dtoRecord };
    for (const key of PROFILE_BASIC_KEYS) {
      delete assessmentPatch[key];
    }

    const merged = sanitizeClinicalAssessmentData({
      ...(assessment.data ?? {}),
      ...assessmentPatch,
    });
    if (dto.verifiedDateOfBirth) {
      delete merged.verifiedAge;
    }
    assessment.data = merged;
    assessment.lastEditedBy = editorUserId;
    assessment.confirmedBy = null;
    assessment.confirmedAt = null;

    const nextProfile = { ...profile.profile };
    for (const key of PROFILE_BASIC_KEYS) {
      if (key in dtoRecord && dtoRecord[key] !== undefined) {
        nextProfile[key] = dtoRecord[key];
      }
    }
    profile.profile = nextProfile;

    const calculation = calculateTargetsForProfile(profile.profile, assessment.data, "draft");
    assessment.targetSnapshot = calculation as unknown as Record<string, unknown> | null;
    await clinicalAssessmentsRepository.save(assessment);

    profile.profile = profileWithCalculatedTargets(profile.profile, calculation, "draft");
    await consumerProfilesRepository.save(profile);

    return this.getByClientId(clientId);
  },

  async confirm(
    clientId: string,
    coachUserId: string,
    dto: ConfirmClinicalAssessmentDto,
  ) {
    await ensureCoachCanAccessClient(coachUserId, clientId);
    await assertCoachModule(coachUserId, "clinical");
    return this.confirmByClientId(clientId, coachUserId, dto);
  },

  async confirmByClientId(
    clientId: string,
    editorUserId: string,
    dto: ConfirmClinicalAssessmentDto,
  ) {
    const profile = await consumerProfilesRepository.findById(clientId);
    if (!profile) throw new NotFoundError("Patient not found");
    const assessment = await clinicalAssessmentsRepository.findByClientId(clientId);
    if (!assessment) throw new BadRequestError("Save the clinical assessment before confirming it.");

    validateForConfirmation(profile.profile, assessment.data);
    assessment.data = sanitizeClinicalAssessmentData(assessment.data ?? {});
    const calculation = calculateTargetsForProfile(
      profile.profile,
      assessment.data,
      "confirmed",
      dto.allowProtectedWeightLoss === true,
    );
    if (!calculation) throw new BadRequestError("The patient profile is missing calculation inputs.");

    assessment.status = "confirmed";
    assessment.targetSnapshot = {
      ...calculation,
      confirmationNote: dto.confirmationNote ?? null,
      allowProtectedWeightLoss: dto.allowProtectedWeightLoss === true,
    };
    assessment.lastEditedBy = editorUserId;
    assessment.confirmedBy = editorUserId;
    assessment.confirmedAt = new Date();
    await clinicalAssessmentsRepository.save(assessment);

    profile.profile = profileWithCalculatedTargets(profile.profile, calculation, "confirmed");
    await consumerProfilesRepository.save(profile);

    await adminAuditService.log(editorUserId, "clinical_assessment.confirm", {
      targetType: "consumer",
      targetId: clientId,
      meta: {
        equationUsed: calculation.equationUsed ?? null,
        calories: calculation.macroTargets?.calories ?? null,
        allowProtectedWeightLoss: dto.allowProtectedWeightLoss === true,
      },
    });

    return this.getByClientId(clientId);
  },
};
