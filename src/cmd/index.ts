import { Command } from "commander";


import { llmCommand } from "./natural-language";

const program = new Command().name("cmd-hint")
  .description("Use Agent in your shell.")
  .version("0.0.1")
  .allowUnknownOption()
  // .showHelpAfterError()
  .exitOverride()


export function register(ns: string, fn: (cmd: Command) => void) {
  fn(program.command(ns))
}

import "../auth";

export async function run(args: string[]): Promise<void> {
  try {
    const result = await program.parseAsync(args, { from: "user" })
    console.log(result)
  } catch (error) {
    console.log("something unexpecetd")
    console.log(typeof (error))
    // await llmCommand(args);
  }
}

run(process.argv.slice(2))