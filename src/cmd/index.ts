import { Command, CommanderError } from "commander";
import { registerAuthCommands } from "./auth";
import { llmCommand } from "./natural-language";

const program = new Command().name("cmd-hint")
  .description("Use Agent in your shell.")
  .version("0.0.1")
  .allowUnknownOption()
  // .showHelpAfterError()
  .exitOverride();

registerAuthCommands(program);

function maybeCommand(args: string[]): boolean {
  const [first] = args;

  if (!first) return true;

  if (first === "-h" || first === "--help" || first === "-V" || first === "--version") {
    return true;
  }

  return program.commands.some((command) => {
    return command.name() === first || command.alias() === first;
  });
}

export async function run(args: string[]): Promise<void> {
  if (args.length === 0) {
    program.outputHelp();
    return;
  }

  if (maybeCommand(args)) {
    try {
      await program.parseAsync(args, { from: "user" });
    } catch (error) {
      if (error instanceof CommanderError) {
        process.exitCode = error.exitCode;
        return;
      }

      throw error;
    }

    return;
  }

  await llmCommand(args);
}

void run(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
