import { getModels, type Api, type Model } from "@earendil-works/pi-ai";
import { getOAuthApiKey } from "@earendil-works/pi-ai/oauth";

import { loadAuthConfig, saveAuthConfig, type AuthConfig, type CodexAuth } from "./store";

function resolveModel(provider: "openai" | "openai-codex", modelId: string, baseUrl?: string): Model<Api> {
  const model = (getModels(provider) as Model<Api>[]).find((candidate) => candidate.id === modelId);

  if (!model) {
    throw new Error(`unknown ${provider} model: ${modelId}`);
  }

  return baseUrl ? { ...model, baseUrl } : model;
}

async function saveRefreshedCodexCredentials(config: AuthConfig, codex: CodexAuth): Promise<void> {
  const latestConfig = await loadAuthConfig();
  const latestCodex = latestConfig.codex ?? codex;

  await saveAuthConfig({
    ...latestConfig,
    active: latestConfig.active ?? config.active,
    codex: {
      ...latestCodex,
      credentials: codex.credentials
    }
  });
}

function resolveCodexAuth(config: AuthConfig, codex: CodexAuth) {
  return {
    model: resolveModel("openai-codex", process.env.CMD_HINT_MODEL?.trim() || codex.model),
    getApiKey: async (provider: string) => {
      if (provider !== "openai-codex") {
        throw new Error(`unexpected provider for Codex auth: ${provider}`);
      }

      const result = await getOAuthApiKey("openai-codex", {
        "openai-codex": codex.credentials
      });

      if (!result) {
        throw new Error("missing API key. run: cmd-hint auth login or export CMD_HINT_API_KEY=your_api_key");
      }

      if (result.newCredentials !== codex.credentials) {
        await saveRefreshedCodexCredentials(config, {
          ...codex,
          credentials: result.newCredentials
        });
      }

      return result.apiKey;
    }
  };
}

export async function resolveAgentAuth() {
  const config = await loadAuthConfig();

  if (config.active === "codex" && config.codex) {
    return resolveCodexAuth(config, config.codex);
  }

  if (config.active === "openai-compatible" && config.openaiCompatible) {
    const apiKey = process.env.CMD_HINT_API_KEY?.trim();
    const baseUrl = process.env.CMD_HINT_BASE_URL?.trim();

    const missing: string[] = [];

    if (!apiKey) {
      missing.push("CMD_HINT_API_KEY");
    }

    if (!baseUrl) {
      missing.push("CMD_HINT_BASE_URL");
    }

    if (missing.length > 0) {
      throw new Error(`missing OpenAI-compatible env: ${missing.join(", ")}`);
    }

    return {
      model: resolveModel("openai", process.env.CMD_HINT_MODEL?.trim() || config.openaiCompatible.model, baseUrl),
      getApiKey: () => apiKey
    };
  }

  throw new Error("missing API key. run: cmd-hint auth login or export CMD_HINT_API_KEY=your_api_key");
}
