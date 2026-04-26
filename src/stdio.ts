#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { handleAuthCommand, parseArgs, printHelp, printVersion } from "./cli/index.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const { command, subcommand, args } = parseArgs(process.argv);

  if (command === "help") {
    printHelp();
    process.exit(0);
  }

  if (command === "version") {
    printVersion();
    process.exit(0);
  }

  if (command === "auth") {
    await handleAuthCommand(subcommand ?? "login", args);
    process.exit(0);
  }

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
