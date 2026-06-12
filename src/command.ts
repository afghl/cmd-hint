import { Command } from "commander";

import { runNaturalLanguageAgent } from "./agent";
import { selectCommand } from "./ui/select-command";

const commandArgs = new Set(["-login", "login", "-h", "--help", "-V", "--version"]);

export async function runCommand(args: string[]): Promise<void> {
  const program = new Command();

  program
    .name("cmd-hint")
    .description("Turn natural language into shell command hints.")
    .version("0.0.1")
    .allowUnknownOption()
    .showHelpAfterError();

  const inputArgs = args[0] === "--" ? args.slice(1) : args;
  const firstArg = inputArgs[0];

  program
    .command("login")
    .description("Login placeholder for future pi auth.")
    .action(() => {
      console.log("login");
      console.log("for now, set OPENAI_API_KEY to use the agent");
    });

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

  const candidates = await runNaturalLanguageAgent(inputArgs.join(" ").trim());
  const selected = await selectCommand(candidates);

  if (!selected) {
    process.exitCode = 1;
    return;
  }

  console.log(selected.command);
}
