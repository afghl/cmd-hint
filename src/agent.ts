import { Agent, type AgentMessage } from "@earendil-works/pi-agent-core";
import { getEnvApiKey, getModels, type Api, type Model } from "@earendil-works/pi-ai";

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

export async function runNaturalLanguageAgent(input: string): Promise<void> {
  const runtime = resolveRuntime();

  const streamed: string[] = [];
  const agent = new Agent({
    initialState: {
      systemPrompt: "你是 cmd-hint 的终端命令助手。把用户的自然语言转换成一条 shell 命令。只输出命令本身，不解释，不执行。",
      model: runtime.model,
      thinkingLevel: "off",
      tools: []
    },
    getApiKey: () => runtime.apiKey
  });

  agent.subscribe((event) => {
    if (event.type !== "message_update" || event.assistantMessageEvent.type !== "text_delta") {
      return;
    }

    streamed.push(event.assistantMessageEvent.delta);
    process.stdout.write(event.assistantMessageEvent.delta);
  });

  await agent.prompt(input);

  if (streamed.length > 0) {
    process.stdout.write("\n");
    return;
  }

  const message = agent.state.messages.findLast((item) => item.role === "assistant");
  const error = extractError(message);

  if (error) {
    throw new Error(error);
  }

  const text = message ? extractText(message) : "";

  if (text) {
    console.log(text);
  }
}
