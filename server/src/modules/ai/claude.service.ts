import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env";

function sanitizeEnv(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

export type ApiKeyStatus = "missing" | "placeholder" | "invalid_format" | "configured";

export type ClaudeImageInput = {
  mimeType: string;
  base64: string;
};

export type ClaudeJsonRequest = {
  system: string;
  userText: string;
  image?: ClaudeImageInput;
  temperature?: number;
  maxTokens?: number;
};

export const claudeService = {
  getApiKeyStatus(): ApiKeyStatus {
    const key = sanitizeEnv(env.ANTHROPIC_API_KEY);
    if (!key) return "missing";
    if (key.toLowerCase().includes("your-key") || key.endsWith("...")) return "placeholder";
    // Anthropic keys are typically `sk-ant-...`
    if (!key.startsWith("sk-ant-")) return "invalid_format";
    return "configured";
  },

  createClient(): Anthropic {
    return new Anthropic({
      apiKey: sanitizeEnv(env.ANTHROPIC_API_KEY),
    });
  },

  authErrorMessage(exc: unknown): string | null {
    const text = String(exc);
    if (!text.includes("401") && !/authentication|invalid.?api.?key|unauthorized/i.test(text)) {
      return null;
    }
    return (
      "Anthropic rejected the server API key. Set a valid Claude key " +
      "(sk-ant-...) as ANTHROPIC_API_KEY in server/.env"
    );
  },

  /** Call Claude and parse a JSON object response (strips optional markdown fences). */
  async completeJson(request: ClaudeJsonRequest): Promise<Record<string, unknown>> {
    const client = this.createClient();
    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    if (request.image) {
      const mediaType = request.image.mimeType.startsWith("image/")
        ? (request.image.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
        : "image/jpeg";
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: request.image.base64,
        },
      });
    }

    content.push({
      type: "text",
      text: `${request.userText}\n\nRespond with valid JSON only. No markdown fences.`,
    });

    const response = await client.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? env.ANTHROPIC_TEMPERATURE,
      system: request.system,
      messages: [{ role: "user", content }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const rawText = textBlock && textBlock.type === "text" ? textBlock.text : "{}";
    return parseJsonResponse(rawText);
  },
};

function parseJsonResponse(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned) as Record<string, unknown>;
}
