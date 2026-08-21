import { BadRequestError, HttpError } from "routing-controllers";
import { env } from "../../config/env";
import { claudeService } from "../ai/claude.service";
import {
  MEAL_ANALYSIS_IMAGE_USER_PROMPT,
  MEAL_ANALYSIS_IMAGE_WITH_DESCRIPTION_USER_PROMPT,
  MEAL_ANALYSIS_SYSTEM_PROMPT,
  MEAL_ANALYSIS_TEXT_USER_PROMPT,
  MEAL_TITLE_SYSTEM_PROMPT,
  MEAL_TITLE_USER_PROMPT,
} from "../ai/meal-analysis.prompts";
import { buildAnalysisContext } from "./metadata-context";
import {
  normalizeMealAnalysisRaw,
  type MealAnalysisResult,
} from "./meal-analysis";
import { sanitizeMealAnalysisResult } from "./meal-analysis-sanitize";
import { enrichMealAnalysisWithNutritionDb } from "./nutrition-db-enrich.util";

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
