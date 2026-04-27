import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import * as p from "./clack.js";

const HOME = homedir();
const PLATFORM = process.platform;
const SERVER_NAME = "crosmos-memory";
const SERVER_CMD = "npx";
const SERVER_ARGS = ["-y", "@crosmos/crosmos-mcp"];

export type ClientId =
  | "claude-desktop"
  | "claude-code"
  | "opencode"
  | "cursor"
  | "vscode"
  | "windsurf"
  | "cline"
  | "roo-cline"
  | "zed";

interface ClientDef {
  id: ClientId;
  name: string;
  section: string;
  configPath: string;
  detectPaths: string[];
  isCli: boolean;
}

function resolveTilde(path: string): string {
  return path.replace(/^~(?=\/)/, HOME);
}

function pPath(paths: { darwin?: string; linux?: string; win32?: string }): string {
  const raw = (paths as Record<string, string | undefined>)[PLATFORM] ?? paths.linux ?? "";
  return resolveTilde(raw)
    .replace("%APPDATA%", process.env.APPDATA ?? join(HOME, "AppData", "Roaming"))
    .replace("%USERPROFILE%", HOME);
}

function buildClients(): ClientDef[] {
  return [
    {
      id: "claude-desktop",
      name: "Claude Desktop",
      section: "mcpServers",
      configPath: pPath({
        darwin: "~/Library/Application Support/Claude/claude_desktop_config.json",
        linux: "~/.config/Claude/claude_desktop_config.json",
        win32: "%APPDATA%/Claude/claude_desktop_config.json",
      }),
      detectPaths:
        PLATFORM === "darwin" ? ["/Applications/Claude.app"] : [join(HOME, ".config", "Claude")],
      isCli: false,
    },
    {
      id: "claude-code",
      name: "Claude Code",
      section: "",
      configPath: "",
      detectPaths: [join(HOME, ".claude")],
      isCli: true,
    },
    {
      id: "opencode",
      name: "opencode",
      section: "mcp",
      configPath: (() => {
        if (PLATFORM === "win32") {
          return join(
            process.env.APPDATA ?? join(HOME, "AppData", "Roaming"),
            "opencode",
            "opencode.json"
          );
        }
        const xdg = process.env.XDG_CONFIG_HOME || join(HOME, ".config");
        return join(xdg, "opencode", "opencode.json");
      })(),
      detectPaths: [
        join(process.env.XDG_CONFIG_HOME || join(HOME, ".config"), "opencode"),
        join(HOME, ".opencode"),
      ],
      isCli: false,
    },
    {
      id: "cursor",
      name: "Cursor",
      section: "mcpServers",
      configPath: pPath({
        darwin: "~/.cursor/mcp.json",
        linux: "~/.cursor/mcp.json",
        win32: "%APPDATA%/Cursor/mcp.json",
      }),
      detectPaths: [join(HOME, ".cursor")],
      isCli: false,
    },
    {
      id: "vscode",
      name: "VS Code",
      section: "servers",
      configPath: pPath({
        darwin: "~/Library/Application Support/Code/User/mcp.json",
        linux: "~/.config/Code/User/mcp.json",
        win32: "%APPDATA%/Code/User/mcp.json",
      }),
      detectPaths: [
        ...(PLATFORM === "darwin" ? ["/Applications/Visual Studio Code.app"] : []),
        ...(PLATFORM === "linux" ? ["/usr/bin/code", "/snap/bin/code"] : []),
        join(HOME, ".config", "Code"),
      ],
      isCli: false,
    },
    {
      id: "windsurf",
      name: "Windsurf",
      section: "mcpServers",
      configPath: pPath({
        darwin: "~/.codeium/windsurf/mcp_config.json",
        linux: "~/.codeium/windsurf/mcp_config.json",
        win32: "%USERPROFILE%/.codeium/windsurf/mcp_config.json",
      }),
      detectPaths: [join(HOME, ".codeium", "windsurf")],
      isCli: false,
    },
    {
      id: "cline",
      name: "Cline",
      section: "mcpServers",
      configPath: pPath({
        darwin:
          "~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
        linux:
          "~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
        win32:
          "%APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json",
      }),
      detectPaths: [
        pPath({
          darwin: "~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev",
          linux: "~/.config/Code/User/globalStorage/saoudrizwan.claude-dev",
          win32: "%APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev",
        }),
      ],
      isCli: false,
    },
    {
      id: "roo-cline",
      name: "Roo-Cline",
      section: "mcpServers",
      configPath: pPath({
        darwin:
          "~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json",
        linux:
          "~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json",
        win32:
          "%APPDATA%/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json",
      }),
      detectPaths: [
        pPath({
          darwin:
            "~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline",
          linux: "~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline",
          win32: "%APPDATA%/Code/User/globalStorage/rooveterinaryinc.roo-cline",
        }),
      ],
      isCli: false,
    },
    {
      id: "zed",
      name: "Zed",
      section: "context_servers",
      configPath: join(HOME, ".config", "zed", "settings.json"),
      detectPaths: [
        join(HOME, ".config", "zed"),
        ...(PLATFORM === "darwin" ? ["/Applications/Zed.app"] : []),
      ],
      isCli: false,
    },
  ];
}

const CLIENT_ORDER: ClientId[] = [
  "claude-desktop",
  "claude-code",
  "opencode",
  "cursor",
  "vscode",
  "windsurf",
  "cline",
  "roo-cline",
  "zed",
];

function getServerEntry(section: string): Record<string, unknown> {
  if (section === "mcp") {
    return {
      type: "local",
      command: [SERVER_CMD, ...SERVER_ARGS],
    };
  }
  return {
    command: SERVER_CMD,
    args: SERVER_ARGS,
  };
}

function mergeJsonConfig(
  filePath: string,
  section: string,
  key: string,
  entry: Record<string, unknown>
): "installed" | "already_exists" | "error" {
  let config: Record<string, unknown> = {};

  if (existsSync(filePath)) {
    try {
      config = JSON.parse(readFileSync(filePath, "utf-8"));
    } catch {
      config = {};
    }
  }

  const raw = config[section];
  const sectionData: Record<string, unknown> =
    raw != null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  if (sectionData[key] != null && JSON.stringify(sectionData[key]) === JSON.stringify(entry)) {
    return "already_exists";
  }

  sectionData[key] = entry;
  config[section] = sectionData;

  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(filePath, `${JSON.stringify(config, null, 2)}\n`);
  return "installed";
}

function installToClient(clientId: ClientId): "installed" | "already_exists" | "error" {
  const client = buildClients().find((c) => c.id === clientId);
  if (!client) return "error";

  if (client.isCli) {
    try {
      execSync(`claude mcp add ${SERVER_NAME} -- ${SERVER_CMD} ${SERVER_ARGS.join(" ")}`, {
        stdio: "pipe",
        timeout: 30_000,
      });
      return "installed";
    } catch {
      try {
        const list = execSync("claude mcp list", {
          stdio: "pipe",
          encoding: "utf-8",
        });
        if (list.includes(SERVER_NAME)) return "already_exists";
      } catch {
        // ignore — will return error below
      }
      return "error";
    }
  }

  const entry = getServerEntry(client.section);
  return mergeJsonConfig(client.configPath, client.section, SERVER_NAME, entry);
}

export function detectInstalledClients(): ClientId[] {
  const clients = buildClients();
  return clients.filter((c) => c.detectPaths.some((p) => existsSync(p))).map((c) => c.id);
}

export async function promptClientInstall(): Promise<void> {
  const clients = buildClients();
  const detected = detectInstalledClients();

  if (detected.length === 0) {
    p.log.info("No MCP clients detected on this system. Configure manually — see README.");
    return;
  }

  const selected = await p.multiselect({
    message: "Install MCP server to:",
    options: CLIENT_ORDER.map((id) => {
      const client = clients.find((c) => c.id === id);
      if (!client) return { value: id, label: id, hint: undefined };
      const isDetected = detected.includes(id);
      return {
        value: id,
        label: client.name,
        hint: isDetected ? "detected" : undefined,
      };
    }),
    initialValues: detected,
    required: false,
  });

  if (p.isCancel(selected) || !Array.isArray(selected) || selected.length === 0) {
    p.log.info("Skipped client installation. You can configure manually — see README.");
    return;
  }

  const installed: string[] = [];
  const existing: string[] = [];
  const errored: string[] = [];

  for (const clientId of selected as ClientId[]) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) continue;
    const result = installToClient(clientId);
    if (result === "already_exists") {
      existing.push(client.name);
    } else if (result === "installed") {
      installed.push(client.name);
    } else {
      errored.push(client.name);
    }
  }

  if (installed.length > 0) {
    p.log.success(`MCP server installed: ${installed.join(", ")}`);
  }
  if (existing.length > 0) {
    p.log.success(`Already configured: ${existing.join(", ")}`);
  }
  if (errored.length > 0) {
    p.log.warn(`Failed: ${errored.join(", ")} — configure manually`);
  }
}
