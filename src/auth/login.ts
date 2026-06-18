import { getOAuthProvider, type OAuthCredentials, type OAuthLoginCallbacks } from "@earendil-works/pi-ai/oauth";

import { loadAuthConfig, saveAuthConfig, type AuthConfig, type OpenAiCompatibleAuth } from "./store";

export const defaultAuthModel = "gpt-5.5";
export const openAiCodexProvider = "openai-codex";

function resolveModel(model: string | undefined): string {
  return model?.trim() || defaultAuthModel;
}

function assertBaseUrl(baseUrl: string): void {
  try {
    new URL(baseUrl);
  } catch {
    throw new Error("invalid base URL");
  }
}

function withCodexAuth(config: AuthConfig, credentials: OAuthCredentials, model?: string): AuthConfig {
  return {
    ...config,
    version: 1,
    active: "codex",
    codex: {
      type: "codex",
      provider: openAiCodexProvider,
      model: resolveModel(model ?? config.codex?.model),
      credentials
    }
  };
}

function withOpenAiCompatibleAuth(
  config: AuthConfig,
  input: Pick<OpenAiCompatibleAuth, "baseUrl" | "apiKey"> & { model?: string }
): AuthConfig {
  const baseUrl = input.baseUrl.trim();
  const apiKey = input.apiKey.trim();

  if (!apiKey) {
    throw new Error("API key is required");
  }

  assertBaseUrl(baseUrl);

  return {
    ...config,
    version: 1,
    active: "openai-compatible",
    openaiCompatible: {
      type: "openai-compatible",
      provider: "openai",
      model: resolveModel(input.model ?? config.openaiCompatible?.model),
      baseUrl,
      apiKey
    }
  };
}

export async function loginWithCodex(callbacks: OAuthLoginCallbacks, model?: string): Promise<void> {
  const provider = getOAuthProvider(openAiCodexProvider);

  if (!provider) {
    throw new Error("OpenAI Codex OAuth provider is unavailable");
  }

  const credentials = await provider.login(callbacks);
  const config = await loadAuthConfig();

  await saveAuthConfig(withCodexAuth(config, credentials, model));
}

export async function loginWithOpenAiCompatible(
  input: Pick<OpenAiCompatibleAuth, "baseUrl" | "apiKey"> & { model?: string }
): Promise<void> {
  const config = await loadAuthConfig();

  await saveAuthConfig(withOpenAiCompatibleAuth(config, input));
}
