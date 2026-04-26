#!/usr/bin/env node
import { readCredentials } from "./cli/credentials.js";

if (!process.env.CROSMOS_API_KEY && !readCredentials()) {
  process.stderr.write(
    "\nCrosmos MCP Server installed! Run `npx @crosmos/mcp-server setup` to configure.\n\n"
  );
}

process.exit(0);
