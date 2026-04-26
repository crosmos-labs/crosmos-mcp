import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { authLogin, authLogout, authStatus } from "./auth.js";

function getVersion(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const pkgPath = join(__dirname, "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function printHelp(): void {
  process.stderr.write(`crosmos-mcp — Crosmos Memory Engine MCP Server

Usage:
  crosmos-mcp              Start the MCP server (stdio transport)
  crosmos-mcp auth login   Authenticate with your Crosmos API key
  crosmos-mcp auth logout  Remove stored credentials
  crosmos-mcp auth status  Show current authentication state

Options:
  --help, -h               Show this help message
  --version, -v            Show version

Environment Variables:
  CROSMOS_API_KEY           API key (overrides credentials file)
  CROSMOS_API_BASE_URL      API base URL (default: https://api.crosmos.dev)
  CROSMOS_API_TIMEOUT       Request timeout in ms (default: 30000)
  DEFAULT_SPACE_ID          Default space ID to use
`);
}

export function printVersion(): void {
  process.stderr.write(`crosmos-mcp v${getVersion()}\n`);
}

export async function handleAuthCommand(subcommand: string): Promise<void> {
  switch (subcommand) {
    case "login":
      await authLogin();
      break;
    case "logout":
      await authLogout();
      break;
    case "status":
      await authStatus();
      break;
    default:
      process.stderr.write(`Unknown auth subcommand: ${subcommand}\n\n`);
      process.stderr.write("Available commands:\n");
      process.stderr.write("  crosmos-mcp auth login   Authenticate with your Crosmos API key\n");
      process.stderr.write("  crosmos-mcp auth logout  Remove stored credentials\n");
      process.stderr.write("  crosmos-mcp auth status  Show current authentication state\n");
      process.exit(1);
  }
}

export function parseArgs(argv: string[]): { command: "server" | "auth" | "help" | "version"; subcommand?: string } {
  const args = argv.slice(2);

  if (args.length === 0) {
    return { command: "server" };
  }

  const first = args[0];

  if (first === "--help" || first === "-h") {
    return { command: "help" };
  }

  if (first === "--version" || first === "-v") {
    return { command: "version" };
  }

  if (first === "auth") {
    const subcommand = args[1] ?? "login";
    return { command: "auth", subcommand };
  }

  return { command: "server" };
}