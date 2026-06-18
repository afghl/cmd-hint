import { mkdir, readFile, writeFile, chmod } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

import type { OAuthCredentials } from "@earendil-works/pi-ai/oauth";

export type AuthMethod = "codex" | "openai-compatible";

export interface CodexAuth {
  type: "codex";
  provider: "openai-codex";
  model: string;
  credentials: OAuthCredentials;
}

export interface OpenAiCompatibleAuth {
  type: "openai-compatible";
  provider: "openai";
  model: string;
  baseUrl: string;
  apiKey: string;
}

export interface AuthConfig {
  version: 1;
  active?: AuthMethod;
  codex?: CodexAuth;
  openaiCompatible?: OpenAiCompatibleAuth;
}

const authConfigVersion = 1;
const configRoot = process.env.XDG_CONFIG_HOME?.trim() || join(homedir(), ".config");
const authConfigPath = join(configRoot, "cmd-hint", "auth.json");

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isAuthMethod(value: unknown): value is AuthMethod {
  return value === "codex" || value === "openai-compatible";
}

function parseOAuthCredentials(value: unknown): OAuthCredentials | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const refresh = asString(value.refresh);
  const access = asString(value.access);
  const expires = typeof value.expires === "number" ? value.expires : undefined;

  if (!refresh || !access || !expires) {
    return undefined;
  }

  return { ...value, refresh, access, expires };
}

function parseCodexAuth(value: unknown): CodexAuth | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const model = asString(value.model);
  const credentials = parseOAuthCredentials(value.credentials);

  if (value.type !== "codex" || value.provider !== "openai-codex" || !model || !credentials) {
    return undefined;
  }

  return {
    type: "codex",
    provider: "openai-codex",
    model,
    credentials
  };
}

function parseOpenAiCompatibleAuth(value: unknown): OpenAiCompatibleAuth | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const model = asString(value.model);
  const baseUrl = asString(value.baseUrl);
  const apiKey = asString(value.apiKey);

  if (value.type !== "openai-compatible" || value.provider !== "openai" || !model || !baseUrl || !apiKey) {
    return undefined;
  }

  return {
    type: "openai-compatible",
    provider: "openai",
    model,
    baseUrl,
    apiKey
  };
}

function parseAuthConfig(value: unknown): AuthConfig {
  if (!isRecord(value)) {
    return { version: authConfigVersion };
  }

  return {
    version: authConfigVersion,
    active: isAuthMethod(value.active) ? value.active : undefined,
    codex: parseCodexAuth(value.codex),
    openaiCompatible: parseOpenAiCompatibleAuth(value.openaiCompatible)
  };
}

export function getAuthConfigPath(): string {
  return authConfigPath;
}

export async function loadAuthConfig(): Promise<AuthConfig> {

  try {
    console.log(authConfigPath)
    const content = await readFile(authConfigPath, "utf-8");
    return parseAuthConfig(JSON.parse(content) as unknown);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { version: authConfigVersion };
    }

    throw error;
  }
}

export async function saveAuthConfig(config: AuthConfig): Promise<void> {
  await mkdir(dirname(authConfigPath), { recursive: true, mode: 0o700 });
  await writeFile(authConfigPath, `${JSON.stringify(config, null, 2)}\n`, { encoding: "utf-8", mode: 0o600 });
  await chmod(authConfigPath, 0o600);
}
