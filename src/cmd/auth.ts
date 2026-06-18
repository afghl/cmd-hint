import { Command } from "commander";

import { login } from "./auth-login";

export function registerAuthCommands(program: Command): void {
  const auth = program.command("auth");

  auth.command("login").description("Login to a model provider.").action(login);
}
