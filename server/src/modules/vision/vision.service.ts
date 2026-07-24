import { BadRequestError, HttpError } from "routing-controllers";
import { env } from "../../config/env";
import { claudeService } from "../ai/claude.service";
import { SYSTEM_PROMPT, USER_PROMPT } from "../ai/prompts";
import {
  MEAL_ANALYSIS_IMAGE_USER_PROMPT,
  MEAL_ANALYSIS_IMAGE_WITH_DESCRIPTION_USER_PROMPT,
  MEAL_ANALYSIS_SYSTEM_PROMPT,
  MEAL_ANALYSIS_TEXT_USER_PROMPT,
  MEAL_TITLE_SYSTEM_PROMPT,
  MEAL_TITLE_USER_PROMPT,
} from "../ai/meal-analysis.prompts";
import { buildAnalysisContext } from "./metadata-context";
import { resolveDiameterCm, resolveEffectiveDistanceCm, roundDiameterCm } from "./diameter-math";
import {
  normalizeMealAnalysisRaw,
  type MealAnalysisResult,
} from "./meal-analysis";
import { sanitizeMealAnalysisResult } from "./meal-analysis-sanitize";
import { enrichMealAnalysisWithNutritionDb } from "./nutrition-db-enrich.util";

export interface PlateDetectResult {
  detected: boolean;
  containerType: "plate" | "bowl" | null;
  diameterCm: number | null;
  confidence: number | null;
  message: string;
  diameterSource: "computed" | null;
  effectiveDistanceCm?: number;
  shotAngle?: unknown;
  plateDiameterFractionOfImageWidth?: unknown;
  estimatedCameraDistanceCm?: unknown;
  matchedReference?: unknown;
  estimationNotes?: unknown;
}

function requireClaudeConfigured() {
  const keyStatus = claudeService.getApiKeyStatus();
  if (keyStatus === "missing") {
    throw new HttpError(500, "ANTHROPIC_API_KEY is not set on the server");
  }
  if (keyStatus !== "configured") {
    throw new HttpError(
      500,
      "ANTHROPIC_API_KEY on the server is missing or invalid. Create a Claude API key at https://console.anthropic.com/settings/keys",
    );
  }
}

function normalizeResult(
  raw: Record<string, unknown>,
  analysisContext: Record<string, unknown>,
): PlateDetectResult {
  let detected = Boolean(raw.detected);
  let container = raw.containerType;
  if (container !== "plate" && container !== "bowl") {
    container = null;
  }

  const fraction = raw.plateDiameterFractionOfImageWidth;
  const cameraExif =
    analysisContext.cameraExif && typeof analysisContext.cameraExif === "object"
      ? (analysisContext.cameraExif as Record<string, unknown>)
      : {};
  const focal35 = cameraExif.focalLength35mmEquivalent;
  const modelDistance = raw.estimatedCameraDistanceCm;

  let diameterCm = detected ? resolveDiameterCm(raw, analysisContext) : null;
  if (!detected || diameterCm == null || diameterCm <= 0) {
    detected = false;
    container = null;
    diameterCm = null;
  } else {
    diameterCm = roundDiameterCm(diameterCm);
  }

  let confidenceVal: number | null = null;
  if (typeof raw.confidence === "number") {
    confidenceVal = Math.max(0, Math.min(1, raw.confidence));
  }

  let message: string;
  if (typeof raw.message === "string") {
    message = raw.message;
  } else if (detected && container && diameterCm != null) {
    const label = container === "bowl" ? "Bowl" : "Plate";
    message = `${label} detected — ${diameterCm.toFixed(2)} cm`;
  } else {
    message = "No plate or bowl detected";
  }

  const result: PlateDetectResult = {
    detected,
    containerType: container as "plate" | "bowl" | null,
    diameterCm,
    confidence: confidenceVal,
    message,
    diameterSource: detected ? "computed" : null,
  };

  if (detected && typeof fraction === "number" && Number.isFinite(fraction)) {
    result.effectiveDistanceCm = resolveEffectiveDistanceCm(
      fraction,
      typeof focal35 === "number" ? focal35 : null,
      typeof modelDistance === "number" ? modelDistance : null,
    );
  }

  for (const key of [
    "shotAngle",
    "plateDiameterFractionOfImageWidth",
    "estimatedCameraDistanceCm",
    "matchedReference",
    "estimationNotes",
  ] as const) {
    if (raw[key] != null) {
      Object.assign(result, { [key]: raw[key] });
    }
  }

  return result;
}

async function callClaudeJson(opts: {
  system: string;
  userText: string;
  image?: { mimeType: string; base64: string };
  temperature?: number;
}): Promise<Record<string, unknown>> {
  try {
    return await claudeService.completeJson({
      system: opts.system,
      userText: opts.userText,
      image: opts.image,
      temperature: opts.temperature,
    });
  } catch (exc) {
    const authError = claudeService.authErrorMessage(exc);
    if (authError) throw new HttpError(502, authError);
    throw new HttpError(502, `Claude request failed: ${String(exc)}`);
  }
}

export const visionService = {
  async detectPlate(imageBuffer: Buffer, mimeType: string, metadataRaw: string): Promise<PlateDetectResult> {
    requireClaudeConfigured();

    if (!imageBuffer.length) {
      throw new BadRequestError("Empty image file");
    }

    let metadata: Record<string, unknown> = {};
    try {
      metadata = JSON.parse(metadataRaw || "{}") as Record<string, unknown>;
    } catch {
      throw new BadRequestError("metadata must be valid JSON");
    }

    const mime = mimeType?.startsWith("image/") ? mimeType : "image/jpeg";
    const analysisContext = buildAnalysisContext(metadata);

    let raw: Record<string, unknown>;
    try {
      raw = await callClaudeJson({
        system: SYSTEM_PROMPT,
        userText: USER_PROMPT.replace("{context}", JSON.stringify(analysisContext, null, 2)),
        image: { mimeType: mime, base64: imageBuffer.toString("base64") },
        temperature: env.ANTHROPIC_TEMPERATURE,
      });
    } catch (exc) {
      if (exc instanceof HttpError) throw exc;
      throw new HttpError(502, `Could not parse model response: ${String(exc)}`);
    }

    try {
      return normalizeResult(raw, analysisContext);
    } catch (exc) {
      throw new HttpError(502, `Could not parse model response: ${String(exc)}`);
    }
  },

  async analyzeMealFromImage(
    imageBuffer: Buffer,
    mimeType: string,
    opts: { note?: string | null; metadataRaw?: string } = {},
  ): Promise<MealAnalysisResult> {
    requireClaudeConfigured();
    if (!imageBuffer.length) {
      throw new BadRequestError("Empty image file");
    }

    let metadata: Record<string, unknown> = {};
    try {
      metadata = JSON.parse(opts.metadataRaw || "{}") as Record<string, unknown>;
    } catch {
      throw new BadRequestError("metadata must be valid JSON");
    }

    const mime = mimeType?.startsWith("image/") ? mimeType : "image/jpeg";
    const userDescription = opts.note?.trim() || null;
    // Plate-size detection/scaling is intentionally disabled — estimate portions from the photo/description only.
    const analysisContext = {
      ...buildAnalysisContext(metadata),
      userDescription,
    };
    const contextJson = JSON.stringify(analysisContext, null, 2);
    const imagePrompt = userDescription
      ? MEAL_ANALYSIS_IMAGE_WITH_DESCRIPTION_USER_PROMPT.replace(
          "{userDescription}",
          userDescription.replace(/"/g, "'"),
        ).replace("{context}", contextJson)
      : MEAL_ANALYSIS_IMAGE_USER_PROMPT.replace("{context}", contextJson);

    const raw = await callClaudeJson({
      system: MEAL_ANALYSIS_SYSTEM_PROMPT,
      userText: imagePrompt,
      image: { mimeType: mime, base64: imageBuffer.toString("base64") },
      temperature: Math.min(0.2, env.ANTHROPIC_TEMPERATURE + 0.1),
    });

    const normalized = sanitizeMealAnalysisResult(
      normalizeMealAnalysisRaw(raw, env.ANTHROPIC_MODEL),
    );
    return enrichMealAnalysisWithNutritionDb(normalized);
  },

  async analyzeMealFromText(text: string): Promise<MealAnalysisResult> {
    const cleaned = text.trim();
    if (!cleaned) {
      throw new BadRequestError("text is required");
    }

    requireClaudeConfigured();

    const raw = await callClaudeJson({
      system: MEAL_ANALYSIS_SYSTEM_PROMPT,
      userText: MEAL_ANALYSIS_TEXT_USER_PROMPT.replace("{description}", cleaned.replace(/"/g, "'")),
      temperature: Math.min(0.2, env.ANTHROPIC_TEMPERATURE + 0.1),
    });

    const normalized = sanitizeMealAnalysisResult(
      normalizeMealAnalysisRaw(raw, env.ANTHROPIC_MODEL),
    );
    return enrichMealAnalysisWithNutritionDb(normalized);
  },

  /** Lightweight title for coach-first patient submissions (no nutrition). */
  async suggestMealTitle(description: string): Promise<{ mealName: string }> {
    const cleaned = description.trim();
    if (!cleaned) {
      throw new BadRequestError("description is required");
    }

    requireClaudeConfigured();

    const raw = await callClaudeJson({
      system: MEAL_TITLE_SYSTEM_PROMPT,
      userText: MEAL_TITLE_USER_PROMPT.replace("{description}", cleaned.replace(/"/g, "'")),
      temperature: Math.min(0.3, env.ANTHROPIC_TEMPERATURE + 0.15),
    });

    const mealName =
      typeof raw.mealName === "string" && raw.mealName.trim()
        ? raw.mealName.trim().slice(0, 80)
        : cleaned.length > 48
          ? `${cleaned.slice(0, 45)}…`
          : cleaned;

    return { mealName };
  },
};
