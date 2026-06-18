import { runNaturalLanguageAgent } from "../agent/agent";
import { selectCommand } from "../tui/select-command";

export async function llmCommand(args: string[]): Promise<void> {
  const candidates = await runNaturalLanguageAgent(args.join(" ").trim());
  const selected = await selectCommand(candidates);

  if (!selected) {
    process.exitCode = 1;
    return;
  }

  console.log(selected.command);
}
