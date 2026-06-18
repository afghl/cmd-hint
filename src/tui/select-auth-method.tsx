import { selectOption } from "./select-option";

export type AuthMethod = "codex" | "openai-compatible";

export async function selectAuthMethod(): Promise<AuthMethod | undefined> {
  return selectOption<AuthMethod>("选择登录方式", [
    {
      id: "codex",
      label: "Codex",
    },
    {
      id: "openai-compatible",
      label: "OpenAI-compatible Base url and API key",
    }
  ]);
}
