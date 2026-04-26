#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { parseArgs, handleAuthCommand, printHelp, printVersion } from "./cli/index.js";

async function main(): Promise<void> {
  const { command, subcommand } = parseArgs(process.argv);

  switch (command) {
    case "help":
      printHelp();
      process.exit(0);
    case "version":
      printVersion();
      process.exit(0);
    case "auth":
      await handleAuthCommand(subcommand!);
      process.exit(0);
    case "server":
      break;
  }

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});