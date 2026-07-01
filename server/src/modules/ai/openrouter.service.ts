import OpenAI from "openai";
import { env } from "../../config/env";

function sanitizeEnv(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "");
}

export type ApiKeyStatus = "missing" | "placeholder" | "invalid_format" | "configured";

export const openRouterService = {
  getApiKeyStatus(): ApiKeyStatus {
    const key = sanitizeEnv(env.OPENROUTER_API_KEY);
    if (!key) return "missing";
    if (key.toLowerCase().includes("your-key") || key.endsWith("...")) return "placeholder";
    if (!key.startsWith("sk-or-")) return "invalid_format";
    return "configured";
  },

  createClient(): OpenAI {
    return new OpenAI({
      baseURL: env.OPENROUTER_BASE_URL,
      apiKey: sanitizeEnv(env.OPENROUTER_API_KEY),
      defaultHeaders: {
        "HTTP-Referer": env.OPENROUTER_SITE_URL,
        "X-Title": env.OPENROUTER_APP_NAME,
      },
    });
  },

  authErrorMessage(exc: unknown): string | null {
    const text = String(exc);
    if (!text.includes("401") && !text.includes("User not found")) return null;
    return (
      "OpenRouter rejected the server API key. Set a regular inference key " +
      "(not a provisioning/management key) as OPENROUTER_API_KEY in server/.env"
    );
  },
};
