#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  handleAuthCommand,
  handleSetupCommand,
  parseArgs,
  printHelp,
  printVersion,
} from "./cli/index.js";
import { installSkill, resolveClientDir } from "./cli/skill.js";
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

  if (command === "setup") {
    await handleSetupCommand(args);
    process.exit(0);
  }

  if (command === "skill") {
    if (subcommand === "install") {
      const client = args[0];
      if (!client) {
        process.stderr.write("Usage: crosmos-mcp skill install <client>\n\n");
        process.stderr.write(
          "Available clients: opencode, cursor, claude-code, windsurf, vscode\n"
        );
        process.exit(1);
      }
      const dir = resolveClientDir(client);
      if (!dir) {
        process.stderr.write(`Unknown client: ${client}\n\n`);
        process.stderr.write(
          "Available clients: opencode, cursor, claude-code, windsurf, vscode\n"
        );
        process.exit(1);
      }
      const result = installSkill(
        client as "opencode" | "cursor" | "claude-code" | "windsurf" | "vscode"
      );
      if (result === "already_exists") {
        process.stderr.write(`Skill already installed at ${dir}/SKILL.md\n`);
      } else {
        process.stderr.write(`Skill installed at ${dir}/SKILL.md\n`);
      }
    } else {
      process.stderr.write("Usage: crosmos-mcp skill install <client>\n\n");
      process.stderr.write("Available clients: opencode, cursor, claude-code, windsurf, vscode\n");
      process.exit(1);
    }
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
