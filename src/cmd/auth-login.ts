import type { OAuthLoginCallbacks, OAuthPrompt, OAuthSelectPrompt } from "@earendil-works/pi-ai/oauth";

import { activateOpenAiCompatible, loginWithCodex } from "../auth";
import { promptAuthInput } from "../tui/auth-input";
import { selectAuthMethod } from "../tui/select-auth-method";
import { selectOption } from "../tui/select-option";

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

export async function login(): Promise<void> {
  const method = await selectAuthMethod();

  if (!method) {
    console.log("Login cancelled.");
    return;
  }

  if (method === "codex") {
    await loginWithCodex(createCodexCallbacks(), process.env.CMD_HINT_MODEL);
    console.log("Codex login saved.");
    return;
  }

  if (method === "openai-compatible") {
    await activateOpenAiCompatible(process.env.CMD_HINT_MODEL);
    console.log("OpenAI-compatible auth activated.");
  }
}
