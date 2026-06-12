import { Agent, type AgentMessage } from "@earendil-works/pi-agent-core";
import { getEnvApiKey, getModels, type Api, type Model } from "@earendil-works/pi-ai";

import type { CommandCandidate } from "./types";

const openAiProvider = "openai";

interface AgentRuntime {
  model: Model<Api>;
  apiKey: string;
}

function readApiKey(): string | undefined {
  return process.env.CMD_HINT_API_KEY ?? process.env.OPEN_API_KEY ?? getEnvApiKey(openAiProvider);
}

function readBaseUrl(): string | undefined {
  return process.env.CMD_HINT_BASE_URL ?? process.env.OPEN_BASE_URL ?? process.env.OPENAI_BASE_URL;
}

function resolveOpenAiModel(): Model<Api> {
  const modelId = process.env.CMD_HINT_MODEL ?? "gpt-4o-mini";
  const model = getModels(openAiProvider).find((candidate) => candidate.id === modelId);

  if (!model) {
    throw new Error(`unknown ${openAiProvider} model: ${modelId}`);
  }

  const baseUrl = readBaseUrl();

  return baseUrl ? { ...model, baseUrl } : model;
}

function getApiKeyHelp(): string {
  return "missing API key. run: export OPENAI_API_KEY=your_api_key";
}

function resolveRuntime(): AgentRuntime {
  const apiKey = readApiKey();

  if (!apiKey) {
    throw new Error(getApiKeyHelp());
  }

  return {
    model: resolveOpenAiModel(),
    apiKey
  };
}

function extractText(message: AgentMessage): string {
  if (message.role !== "assistant") {
    return "";
  }

  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}

function extractError(message: AgentMessage | undefined): string | undefined {
  if (message?.role !== "assistant") {
    return undefined;
  }

  return message.errorMessage;
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return match ? match[1].trim() : trimmed;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseCandidate(value: unknown): CommandCandidate | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const command = asString(record.command);

  if (!command) {
    return undefined;
  }

  const risk =
    record.risk === "low" || record.risk === "medium" || record.risk === "high"
      ? record.risk
      : undefined;

  return {
    command,
    description: asString(record.description),
    risk
  };
}

function parseCandidates(text: string): CommandCandidate[] {
  const json = JSON.parse(stripJsonFence(text)) as unknown;
  const values = Array.isArray(json) ? json : (json as { candidates?: unknown }).candidates;

  if (!Array.isArray(values)) {
    throw new Error("agent response missing candidates array");
  }

  const candidates = values.map(parseCandidate).filter((candidate): candidate is CommandCandidate => Boolean(candidate));

  if (candidates.length === 0) {
    throw new Error("agent response contains no command candidates");
  }

  return candidates;
}

export async function runNaturalLanguageAgent(input: string): Promise<CommandCandidate[]> {
  const runtime = resolveRuntime();

  const agent = new Agent({
    initialState: {
      systemPrompt:
        '你是 cmd-hint 的终端命令助手。根据用户自然语言生成 3 个可执行 shell 命令候选。只输出 JSON，不要 Markdown，不要解释。格式为 {"candidates":[{"command":"...","description":"...","risk":"low|medium|high"}]}。description 用中文简短说明差异或适用场景。不要执行命令。',
      model: runtime.model,
      thinkingLevel: "off",
      tools: []
    },
    getApiKey: () => runtime.apiKey
  });

  await agent.prompt(input);

  const message = agent.state.messages.findLast((item) => item.role === "assistant");
  const error = extractError(message);

  if (error) {
    throw new Error(error);
  }

  const text = message ? extractText(message) : "";

  if (!text) {
    throw new Error("agent returned empty response");
  }

  return parseCandidates(text);
}
