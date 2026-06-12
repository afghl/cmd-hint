import { Command } from "commander";

import { runLoginCommand } from "./login";
import { runNaturalLanguageCommand } from "./natural-language";

const commandArgs = new Set(["-login", "login", "-h", "--help", "-V", "--version"]);

function createProgram(): Command {
  const program = new Command();

  program
    .name("cmd-hint")
    .description("Turn natural language into shell command hints.")
    .version("0.0.1")
    .allowUnknownOption()
    .showHelpAfterError();

  program.command("login").description("Login placeholder for future pi auth.").action(runLoginCommand);

  return program;
}

export async function runCommand(args: string[]): Promise<void> {
  const program = createProgram();
  const inputArgs = args[0] === "--" ? args.slice(1) : args;
  const firstArg = inputArgs[0];

  if (!firstArg) {
    program.help();
    return;
  }

  if (firstArg === "-login") {
    await program.parseAsync(["login", ...inputArgs.slice(1)], { from: "user" });
    return;
  }

  if (commandArgs.has(firstArg)) {
    await program.parseAsync(inputArgs, { from: "user" });
    return;
  }

  await runNaturalLanguageCommand(inputArgs);
}
