#!/usr/bin/env bun

const args = Bun.argv.slice(2);
const input = args.join(" ").trim();

if (!input) {
  console.log("cmd-hint");
  console.log("usage: cmd-hint -login");
  console.log('usage: cmd-hint "列出当前目录文件"');
} else if (args[0] === "-login") {
  console.log("login");
} else {
  console.log(`natural language: ${input}`);
}
