import * as p from "./clack.js";
import {
  type Credentials,
  deleteCredentials,
  getBaseUrl,
  readCredentials,
  writeCredentials,
} from "./credentials.js";

async function validateApiKey(apiKey: string, baseUrl: string): Promise<boolean> {
  try {
    const url = `${baseUrl}/api/v1/auth/keys/validate`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) return false;

    const result = (await response.json()) as { valid?: unknown };
    return result.valid === true;
  } catch {
    return false;
  }
}

export async function authLogin(baseUrlOverride?: string): Promise<boolean> {
  const existing = readCredentials();

  if (existing) {
    const masked = `${existing.api_key.slice(0, 8)}...${existing.api_key.slice(-4)}`;
    const replace = await p.confirm({
      message: `Found existing key (${masked}). Replace?`,
      initialValue: false,
    });
    if (p.isCancel(replace) || !replace) {
      p.log.info("Login cancelled.");
      return false;
    }
  }

  const baseUrl = (baseUrlOverride ?? process.env.CROSMOS_API_BASE_URL ?? getBaseUrl()).replace(
    /\/$/,
    ""
  );

  const apiKey = await p.text({
    message: "Enter your Crosmos API key",
    placeholder: "csk_...",
    validate: (v) => {
      if (!v) return "Press Enter to skip, or paste your key";
    },
  });

  if (p.isCancel(apiKey) || !apiKey) {
    p.log.info("Skipped. Get a key at https://console.crosmos.dev/");
    return false;
  }

  const s = p.spinner();
  s.start("Validating API key...");

  const valid = await validateApiKey(apiKey as string, baseUrl);

  if (!valid) {
    s.stop("Invalid API key");
    p.log.error("Could not authenticate with the Crosmos API.");
    p.log.info("Check your key at https://console.crosmos.dev/");
    return false;
  }

  s.stop("Valid API key");

  writeCredentials({
    api_key: apiKey as string,
    base_url: baseUrl,
  });

  p.log.success("Credentials saved.");
  return true;
}

export async function authLogout(): Promise<void> {
  const existing = readCredentials();

  if (!existing) {
    p.log.info("No credentials found.");
    return;
  }

  const masked = `${existing.api_key.slice(0, 8)}...${existing.api_key.slice(-4)}`;

  const confirm = await p.confirm({
    message: `Remove key ${masked}?`,
    initialValue: true,
  });

  if (p.isCancel(confirm) || !confirm) {
    p.log.info("Logout cancelled.");
    return;
  }

  deleteCredentials();
  p.log.success("Credentials removed.");
}

export async function authStatus(): Promise<void> {
  const envKey = process.env.CROSMOS_API_KEY;
  const envUrl = process.env.CROSMOS_API_BASE_URL;
  const creds = readCredentials();

  if (envKey) {
    p.log.success("API key: set via CROSMOS_API_KEY");
  } else if (creds) {
    const masked = `${creds.api_key.slice(0, 8)}...${creds.api_key.slice(-4)}`;
    p.log.success(`API key: ${masked}`);
  } else {
    p.log.warn("API key: not configured");
    p.log.info("Run `crosmos-mcp auth login` or get a key at https://console.crosmos.dev/");
    return;
  }

  const baseUrl = envUrl?.replace(/\/$/, "") ?? creds?.base_url ?? "https://api.crosmos.dev";
  const source = envUrl ? " (env)" : creds?.base_url ? " (saved)" : " (default)";
  p.log.info(`Base URL: ${baseUrl}${source}`);
}
