import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const CROSMOS_DIR = ".crosmos";
const CONFIG_FILE = "config.json";

export interface SavedDefaultSpace {
  id: string;
  name: string;
}

interface UserConfig {
  default_space?: SavedDefaultSpace;
  [key: string]: unknown;
}

function getConfigDir(): string {
  const override = process.env.CROSMOS_CONFIG_DIR;
  if (override) return override;
  return join(homedir(), CROSMOS_DIR);
}

export function getConfigPath(): string {
  return join(getConfigDir(), CONFIG_FILE);
}

function readConfig(): UserConfig {
  const filePath = getConfigPath();
  if (!existsSync(filePath)) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    throw new Error(`Invalid JSON in crosmos config: ${filePath}`);
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Invalid crosmos config: ${filePath}`);
  }

  return parsed as UserConfig;
}

export function readSavedDefaultSpace(): SavedDefaultSpace | null {
  const config = readConfig();
  const value = config.default_space;
  if (value === undefined) return null;

  if (
    value === null ||
    typeof value !== "object" ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    value.id.length === 0 ||
    value.name.length === 0
  ) {
    throw new Error(`Invalid default_space in crosmos config: ${getConfigPath()}`);
  }

  return { id: value.id, name: value.name };
}

export function writeSavedDefaultSpace(space: SavedDefaultSpace): void {
  const filePath = getConfigPath();
  const config = readConfig();
  config.default_space = space;

  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  writeFileSync(filePath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
}
