#!/usr/bin/env node
import { authLogin } from "./cli/auth.js";
import { readCredentials } from "./cli/credentials.js";

async function main(): Promise<void> {
  if (process.env.CROSMOS_API_KEY) {
    process.exit(0);
  }

  const existing = readCredentials();
  if (existing) {
    process.exit(0);
  }

  if (!process.stdout.isTTY && !process.stderr.isTTY) {
    process.stderr.write(
      "\nCrosmos MCP: No API key configured. Run `npx @crosmos/mcp-server auth login` to authenticate.\n\n"
    );
    process.exit(0);
  }

  process.stderr.write("\n Crosmos MCP Server installed!\n\n");
  process.stderr.write("No API key found. Would you like to set one up now?\n");
  process.stderr.write("(Press Enter to skip — you can run `crosmos-mcp auth login` later)\n\n");

  const { createInterface } = await import("node:readline");
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  const answer = await new Promise<string>((resolve) => {
    rl.question("Authenticate now? [Y/n] ", (a) => {
      rl.close();
      resolve(a.trim().toLowerCase());
    });
  });

  if (answer === "n" || answer === "no") {
    process.stderr.write("\nSkipped. Run `crosmos-mcp auth login` anytime to authenticate.\n\n");
    process.exit(0);
  }

  await authLogin();
  process.stderr.write("\nYou're all set! Crosmos MCP is ready to use.\n\n");
  process.exit(0);
}

main().catch(() => process.exit(0));
