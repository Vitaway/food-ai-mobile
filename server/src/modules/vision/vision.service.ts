import { BadRequestError, HttpError } from "routing-controllers";
import { env } from "../../config/env";
import { openRouterService } from "../ai/openrouter.service";
import { SYSTEM_PROMPT, USER_PROMPT } from "../ai/prompts";
import {
  MEAL_ANALYSIS_IMAGE_USER_PROMPT,
  MEAL_ANALYSIS_IMAGE_WITH_DESCRIPTION_USER_PROMPT,
  MEAL_ANALYSIS_SYSTEM_PROMPT,
  MEAL_ANALYSIS_TEXT_USER_PROMPT,
} from "../ai/meal-analysis.prompts";
import { buildAnalysisContext } from "./metadata-context";
import { resolveDiameterCm, resolveEffectiveDistanceCm, roundDiameterCm } from "./diameter-math";
import {
  applyPlatePortionScale,
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

function parseJsonResponse(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned) as Record<string, unknown>;
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

  if (
    detected &&
    typeof fraction === "number" &&
    Number.isFinite(fraction)
  ) {
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

export const visionService = {
  async detectPlate(imageBuffer: Buffer, mimeType: string, metadataRaw: string): Promise<PlateDetectResult> {
    const keyStatus = openRouterService.getApiKeyStatus();
    if (keyStatus === "missing") {
      throw new HttpError(500, "OPENROUTER_API_KEY is not set on the server");
    }
    if (keyStatus !== "configured") {
      throw new HttpError(
        500,
        "OPENROUTER_API_KEY on the server is missing or invalid. Create a regular API key at https://openrouter.ai/keys",
      );
    }

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
    const b64 = imageBuffer.toString("base64");
    const dataUrl = `data:${mime};base64,${b64}`;
    const analysisContext = buildAnalysisContext(metadata);
    const client = openRouterService.createClient();

    let content: string;
    try {
      const response = await client.chat.completions.create({
        model: env.OPENROUTER_MODEL,
        temperature: env.OPENROUTER_TEMPERATURE,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: USER_PROMPT.replace(
                  "{context}",
                  JSON.stringify(analysisContext, null, 2),
                ),
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl,
                  detail: env.OPENROUTER_IMAGE_DETAIL,
                },
              },
            ],
          },
        ],
      });
      content = response.choices[0]?.message?.content ?? "{}";
    } catch (exc) {
      const authError = openRouterService.authErrorMessage(exc);
      if (authError) throw new HttpError(502, authError);
      throw new HttpError(502, `OpenRouter request failed: ${String(exc)}`);
    }

    try {
      const raw = parseJsonResponse(content);
      return normalizeResult(raw, analysisContext);
    } catch (exc) {
      throw new HttpError(502, `Could not parse model response: ${String(exc)}`);
    }
  },

  async analyzeMealFromImage(
    imageBuffer: Buffer,
    mimeType: string,
    opts: { plateDiameterCm?: number | null; note?: string | null; metadataRaw?: string },
  ): Promise<MealAnalysisResult> {
    const keyStatus = openRouterService.getApiKeyStatus();
    if (keyStatus !== "configured") {
      throw new HttpError(
        500,
        "OPENROUTER_API_KEY is not configured. Add a valid sk-or- key to server/.env",
      );
    }
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
    const dataUrl = `data:${mime};base64,${imageBuffer.toString("base64")}`;
    const userDescription = opts.note?.trim() || null;
    const analysisContext = {
      ...buildAnalysisContext(metadata),
      plateDiameterCm: opts.plateDiameterCm ?? null,
      userDescription,
    };
    const contextJson = JSON.stringify(analysisContext, null, 2);
    const imagePrompt = userDescription
      ? MEAL_ANALYSIS_IMAGE_WITH_DESCRIPTION_USER_PROMPT.replace(
          "{userDescription}",
          userDescription.replace(/"/g, "'"),
        ).replace("{context}", contextJson)
      : MEAL_ANALYSIS_IMAGE_USER_PROMPT.replace("{context}", contextJson);

    const raw = await this.callMealAnalysisModel([
      { role: "system", content: MEAL_ANALYSIS_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: imagePrompt,
          },
          {
            type: "image_url",
            image_url: { url: dataUrl, detail: env.OPENROUTER_IMAGE_DETAIL },
          },
        ],
      },
    ]);

    const normalized = sanitizeMealAnalysisResult(
      normalizeMealAnalysisRaw(raw, env.OPENROUTER_MODEL),
    );
    const scaled = applyPlatePortionScale(normalized, opts.plateDiameterCm ?? null);
    return enrichMealAnalysisWithNutritionDb(scaled);
  },

  async analyzeMealFromText(
    text: string,
    plateDiameterCm?: number | null,
  ): Promise<MealAnalysisResult> {
    const cleaned = text.trim();
    if (!cleaned) {
      throw new BadRequestError("text is required");
    }

    const keyStatus = openRouterService.getApiKeyStatus();
    if (keyStatus !== "configured") {
      throw new HttpError(
        500,
        "OPENROUTER_API_KEY is not configured. Add a valid sk-or- key to server/.env",
      );
    }

    const raw = await this.callMealAnalysisModel([
      { role: "system", content: MEAL_ANALYSIS_SYSTEM_PROMPT },
      {
        role: "user",
        content: MEAL_ANALYSIS_TEXT_USER_PROMPT.replace("{description}", cleaned.replace(/"/g, "'")),
      },
    ]);

    const normalized = sanitizeMealAnalysisResult(
      normalizeMealAnalysisRaw(raw, env.OPENROUTER_MODEL),
    );
    const scaled = applyPlatePortionScale(normalized, plateDiameterCm ?? null);
    return enrichMealAnalysisWithNutritionDb(scaled);
  },

  async callMealAnalysisModel(
    messages: Array<{
      role: "system" | "user";
      content: string | Array<Record<string, unknown>>;
    }>,
  ): Promise<Record<string, unknown>> {
    const client = openRouterService.createClient();
    try {
      const response = await client.chat.completions.create({
        model: env.OPENROUTER_MODEL,
        temperature: Math.min(0.2, env.OPENROUTER_TEMPERATURE + 0.1),
        response_format: { type: "json_object" },
        messages: messages as never,
      });
      const content = response.choices[0]?.message?.content ?? "{}";
      return parseJsonResponse(content);
    } catch (exc) {
      const authError = openRouterService.authErrorMessage(exc);
      if (authError) throw new HttpError(502, authError);
      throw new HttpError(502, `OpenRouter meal analysis failed: ${String(exc)}`);
    }
  },
};
