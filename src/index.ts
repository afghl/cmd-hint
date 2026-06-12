#!/usr/bin/env node

import { runCommand } from "./cmd/command";

try {
  await runCommand(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
