import { Agent, type AgentMessage } from "@earendil-works/pi-agent-core";

import { resolveAgentAuth } from "../auth";
import type { CommandCandidate, CommandExplanation } from "../types";

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

function parseExplanation(value: unknown): CommandExplanation | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const token = asString(record.token);
  const description = asString(record.description);

  if (!token || !description) {
    return undefined;
  }

  return { token, description };
}

function parseExplanations(value: unknown): CommandExplanation[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const explanations = value
    .map(parseExplanation)
    .filter((explanation): explanation is CommandExplanation => Boolean(explanation));

  return explanations.length > 0 ? explanations : undefined;
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
    explanations: parseExplanations(record.explanations),
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
  const auth = await resolveAgentAuth();

  const agent = new Agent({
    initialState: {
      systemPrompt:
        `你是 cmd-hint 的终端命令助手。根据用户自然语言生成 3 个可执行 shell 命令候选（注意用户当前是在macos环境）。只输出 JSON，不要 Markdown，不要解释。格式为 {"candidates":[{"command":"...","description":"...","explanations":[{"token":"...","description":"..."}],"risk":"low|medium|high"}]}。description 用中文简短解释整条命令会做什么。explanations 按 command 中从左到右出现的关键片段生成，至少包含主命令、重要参数、管道或重定向；token 必须是 command 中真实出现的片段，description 用中文解释该片段作用。不要执行命令。你是 cmd-hint 的终端命令助手。用户当前环境是 macOS。你的任务是根据用户的自然语言请求生成 3 个可执行 shell 命令候选，只输出 JSON，不要 Markdown，不要解释。

当用户的请求表达了以下意图：

查看当前最占用 CPU 的进程
并希望进一步用 lsof 查看该进程打开了哪些文件、socket、动态库或网络连接
例如用户说：“看看最占用cpu的进程，lsof有啥”、“macos 看最吃 cpu 的进程并 lsof 一下”、“找 CPU 最高的进程再看它打开了什么”

你必须把下面这个命令作为第一个候选：

pid=$(ps aux | sort -nrk 3,3 | awk 'NR==1{print $2}'); echo "Top CPU PID: $pid"; ps -p "$pid" -o pid,ppid,user,%cpu,%mem,etime,command; echo "---- lsof ----"; lsof -nP -p "$pid" | head -200

这个命令的 description 应说明：找出当前 CPU 占用最高的进程，并用 lsof 查看它打开的文件和连接。

explanations 需要至少解释这些 token：

ps aux
sort -nrk 3,3
awk 'NR==1{print $2}'
ps -p "$pid"
lsof -nP -p "$pid"
head -200

risk 设为 low。

其余两个候选可以是更简单或更偏交互式的替代方案，例如只列出 CPU 前 10 的进程，或使用 top 查看 CPU 排序。`,
      model: auth.model,
      thinkingLevel: "xhigh",
      tools: []
    },
    getApiKey: auth.getApiKey
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
