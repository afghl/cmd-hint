import type { OAuthLoginCallbacks, OAuthPrompt, OAuthSelectPrompt } from "@earendil-works/pi-ai/oauth";

import { loginWithCodex, loginWithOpenAiCompatible } from "../auth/login";
import { promptAuthInput } from "../tui/auth-input";
import { selectAuthMethod } from "../tui/select-auth-method";
import { selectOption } from "../tui/select-option";

const defaultBaseUrl = "https://api.openai.com/v1";

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => value?.trim());
}

function readApiKey(): string | undefined {
  return process.env.CMD_HINT_API_KEY
}

function readBaseUrl(): string | undefined {
  return process.env.CMD_HINT_BASE_URL
}


function failLogin(message: string): void {
  console.error(message);
  process.exitCode = 1;
}

async function promptRequired(prompt: OAuthPrompt): Promise<string> {
  const value = await promptAuthInput({
    title: prompt.message,
    placeholder: prompt.placeholder,
    allowEmpty: prompt.allowEmpty
  });

  if (value === undefined) {
    throw new Error("Login cancelled");
  }

  return value;
}

async function selectOAuthOption(prompt: OAuthSelectPrompt): Promise<string | undefined> {
  return selectOption(
    prompt.message,
    prompt.options.map((option) => ({
      id: option.id,
      label: option.label
    }))
  );
}

function createCodexCallbacks(): OAuthLoginCallbacks {
  return {
    onAuth: (info) => {
      console.log("\nOpen this URL in your browser:");
      console.log(info.url);

      if (info.instructions) {
        console.log(info.instructions);
      }
    },
    onDeviceCode: (info) => {
      console.log("\nOpen this URL in your browser:");
      console.log(info.verificationUri);
      console.log(`Enter code: ${info.userCode}`);
    },
    onPrompt: promptRequired,
    onSelect: selectOAuthOption,
    onProgress: (message) => {
      console.log(message);
    }
  };
}

async function runCodexLogin(): Promise<void> {
  await loginWithCodex(createCodexCallbacks(), process.env.CMD_HINT_MODEL);
  console.log("Codex login saved.");
}

export async function login(): Promise<void> {
  const method = await selectAuthMethod();

  if (!method) {
    console.log("Login cancelled.");
    return;
  }

  if (method === "codex") {
    await runCodexLogin();
    return;
  }

  if (method === "openai-compatible") {
    console.log("Provide CMD_HINT_BASE_URL and CMD_HINT_API_KEY in env. Cmd-hint will automatically use them.");
  }
}
