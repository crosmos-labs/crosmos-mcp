#!/usr/bin/env node
import { handleSetupCommand } from "./cli/index.js";

if (!process.stdout.isTTY && !process.stderr.isTTY) {
  process.stderr.write(
    "\nCrosmos MCP Server installed! Run `npx @crosmos/mcp-server setup` to configure.\n\n"
  );
  process.exit(0);
}

handleSetupCommand([])
  .then(() => process.exit(0))
  .catch(() => process.exit(0));
