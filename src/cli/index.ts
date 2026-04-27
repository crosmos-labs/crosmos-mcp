import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { authLogin, authLogout, authStatus } from "./auth.js";
import * as p from "./clack.js";
import { promptClientInstall } from "./client-install.js";
import { promptSkillInstall } from "./skill.js";

function getVersion(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const pkgPath = join(__dirname, "..", "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function printHelp(): void {
  process.stderr.write(`crosmos-mcp — Crosmos Memory Engine MCP Server

Usage:
  crosmos-mcp                            Start the MCP server (stdio transport)
  crosmos-mcp setup                      Interactive setup (auth + client install + skill)
  crosmos-mcp auth login                 Authenticate with your API key
  crosmos-mcp auth login --base-url URL  Use a custom API base URL
  crosmos-mcp auth logout                Remove stored credentials
  crosmos-mcp auth status                Show current auth state
  crosmos-mcp skill install <client>     Install the Crosmos skill

Options:
  --help, -h               Show this help message
  --version, -v            Show version

Environment Variables:
  CROSMOS_API_KEY           API key (overrides credentials file)
  CROSMOS_API_BASE_URL      API base URL (default: https://api.crosmos.dev)
  CROSMOS_API_TIMEOUT       Request timeout in ms (default: 30000)
  DEFAULT_SPACE_ID          Default space UUID to use
  DEFAULT_SPACE_NAME        Default space name (resolved to UUID via /spaces?name=); ignored if DEFAULT_SPACE_ID is set
`);
}

export function printVersion(): void {
  process.stderr.write(`crosmos-mcp v${getVersion()}\n`);
}

export async function handleAuthCommand(subcommand: string, args: string[]): Promise<void> {
  switch (subcommand) {
    case "login": {
      const baseUrl = parseBaseUrlFlag(args);
      await authLogin(baseUrl);
      break;
    }
    case "logout":
      await authLogout();
      break;
    case "status":
      await authStatus();
      break;
    default:
      p.log.error(`Unknown auth subcommand: ${subcommand}`);
      process.stderr.write("\nAvailable commands:\n");
      process.stderr.write("  crosmos-mcp auth login [--base-url URL]\n");
      process.stderr.write("  crosmos-mcp auth logout\n");
      process.stderr.write("  crosmos-mcp auth status\n");
      process.exit(1);
  }
}

export async function handleSetupCommand(args: string[]): Promise<void> {
  const baseUrl = parseBaseUrlFlag(args);
  const envKey = process.env.CROSMOS_API_KEY;
  const { readCredentials } = await import("./credentials.js");
  const creds = readCredentials();

  p.intro("Crosmos MCP Setup");

  const needsAuth = !envKey && !creds;

  if (needsAuth) {
    p.log.info("Get an API key at https://console.crosmos.dev/");
    await authLogin(baseUrl);
  } else {
    p.log.success("Already authenticated");
  }

  await promptClientInstall();

  await promptSkillInstall();

  const outros = [
    "Have a great day :)",
    "Have a razzmatazz day :)",
    "Have a banger day :)",
    "Have a cattywampus day :)",
    "Have a whizzbang day :)",
    "Have a hullabaloo day :)",
    "Have a dope day :)",
    "Have a brouhaha day :)",
    "Have a zhuzhed day :)",
    "Have a kickflipping day :)",
    "Have a snazzy day :)",
    "Have a kerfuffled day :)",
    "Have a gas day :)",
    "Have a lit day :)",
    "Have a fire day :)",
    "Have an unskippable day :)",
    "Have a w day :)",
  ];
  p.outro(outros[Math.floor(Math.random() * outros.length)]);
}

function parseBaseUrlFlag(args: string[]): string | undefined {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--base-url" && args[i + 1]) {
      return args[i + 1];
    }
  }
  return undefined;
}

export function parseArgs(argv: string[]): {
  command: "server" | "auth" | "setup" | "skill" | "help" | "version";
  subcommand?: string;
  args: string[];
} {
  const args = argv.slice(2);

  if (args.length === 0) {
    return { command: "server", args: [] };
  }

  const first = args[0];

  if (first === "--help" || first === "-h") {
    return { command: "help", args };
  }

  if (first === "--version" || first === "-v") {
    return { command: "version", args };
  }

  if (first === "auth") {
    const subcommand = args[1] ?? "login";
    return { command: "auth", subcommand, args: args.slice(2) };
  }

  if (first === "setup") {
    return { command: "setup", args: args.slice(1) };
  }

  if (first === "skill") {
    return { command: "skill", subcommand: args[1], args: args.slice(2) };
  }

  return { command: "server", args };
}
