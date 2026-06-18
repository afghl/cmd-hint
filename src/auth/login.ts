import { getOAuthProvider, type OAuthLoginCallbacks } from "@earendil-works/pi-ai/oauth";

import { loadAuthConfig, saveAuthConfig } from "./store";

export async function loginWithCodex(callbacks: OAuthLoginCallbacks, model?: string): Promise<void> {
  const provider = getOAuthProvider("openai-codex");

  if (!provider) {
    throw new Error("OpenAI Codex OAuth provider is unavailable");
  }

  const credentials = await provider.login(callbacks);
  const config = await loadAuthConfig();

  await saveAuthConfig({
    ...config,
    version: 1,
    active: "codex",
    codex: {
      type: "codex",
      provider: "openai-codex",
      model: model?.trim() || config.codex?.model || "gpt-5.5",
      credentials
    }
  });
}

export async function activateOpenAiCompatible(model?: string): Promise<void> {
  const missing: string[] = [];

  if (!process.env.CMD_HINT_API_KEY?.trim()) {
    missing.push("CMD_HINT_API_KEY");
  }

  if (!process.env.CMD_HINT_BASE_URL?.trim()) {
    missing.push("CMD_HINT_BASE_URL");
  }

  if (missing.length > 0) {
    throw new Error(`missing OpenAI-compatible env: ${missing.join(", ")}`);
  }

  const config = await loadAuthConfig();

  await saveAuthConfig({
    ...config,
    version: 1,
    active: "openai-compatible",
    openaiCompatible: {
      type: "openai-compatible",
      provider: "openai",
      model: model?.trim() || config.openaiCompatible?.model || "gpt-5.5"
    }
  });
}
