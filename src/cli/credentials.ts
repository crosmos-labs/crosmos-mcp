import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const CROSMOS_DIR = ".crosmos";
const CREDENTIALS_FILE = "credentials.json";

export interface Credentials {
  api_key: string;
  base_url: string;
}

function getCredentialsDir(): string {
  const override = process.env.CROSMOS_CREDENTIALS_DIR;
  if (override) return override;
  return join(homedir(), CROSMOS_DIR);
}

function getCredentialsPath(): string {
  return join(getCredentialsDir(), CREDENTIALS_FILE);
}

function ensureDir(filePath: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}

export function readCredentials(): Credentials | null {
  const filePath = getCredentialsPath();
  if (!existsSync(filePath)) return null;

  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as Credentials;
    if (!parsed.api_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCredentials(credentials: Credentials): void {
  const filePath = getCredentialsPath();
  ensureDir(filePath);
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  writeFileSync(filePath, JSON.stringify(credentials, null, 2) + "\n", { mode: 0o600 });
}

export function deleteCredentials(): boolean {
  const filePath = getCredentialsPath();
  if (!existsSync(filePath)) return false;

  unlinkSync(filePath);
  return true;
}

export function getApiKey(): string | undefined {
  if (process.env.CROSMOS_API_KEY) return process.env.CROSMOS_API_KEY;

  const creds = readCredentials();
  return creds?.api_key;
}

export function getBaseUrl(): string {
  if (process.env.CROSMOS_API_BASE_URL) {
    return process.env.CROSMOS_API_BASE_URL.replace(/\/$/, "");
  }

  const creds = readCredentials();
  if (creds?.base_url) return creds.base_url.replace(/\/$/, "");

  return "https://api.crosmos.dev";
}