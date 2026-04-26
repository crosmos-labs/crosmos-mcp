import { createInterface } from "node:readline";
import {
  type Credentials,
  deleteCredentials,
  getBaseUrl,
  readCredentials,
  writeCredentials,
} from "./credentials.js";

function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function validateApiKey(apiKey: string, baseUrl: string): Promise<boolean> {
  try {
    const url = `${baseUrl}/health`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function authLogin(baseUrlOverride?: string): Promise<void> {
  const existing = readCredentials();

  if (existing) {
    const masked = `${existing.api_key.slice(0, 8)}...${existing.api_key.slice(-4)}`;
    process.stderr.write(`Existing credentials found (key: ${masked})\n`);
    const answer = await prompt("Replace? [y/N] ");
    if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
      process.stderr.write("Login cancelled.\n");
      return;
    }
  }

  const baseUrl = (baseUrlOverride ?? process.env.CROSMOS_API_BASE_URL ?? getBaseUrl()).replace(
    /\/$/,
    ""
  );

  const apiKey = await prompt("Enter your Crosmos API key: ");

  if (!apiKey) {
    process.stderr.write(
      "\nSkipped. Set the CROSMOS_API_KEY environment variable to authenticate at runtime.\n"
    );
    return;
  }

  process.stderr.write("Validating API key...\n");
  const valid = await validateApiKey(apiKey, baseUrl);

  if (!valid) {
    process.stderr.write("Invalid API key. Could not authenticate with the Crosmos API.\n");
    process.stderr.write("Please check your key and try again.\n");
    return;
  }

  writeCredentials({
    api_key: apiKey,
    base_url: baseUrl,
  });

  process.stderr.write("Credentials saved successfully.\n");
}

export async function authLogout(): Promise<void> {
  const existing = readCredentials();

  if (!existing) {
    process.stderr.write("No credentials found.\n");
    return;
  }

  const masked = `${existing.api_key.slice(0, 8)}...${existing.api_key.slice(-4)}`;
  process.stderr.write(`Removing credentials for key: ${masked}\n`);

  deleteCredentials();
  process.stderr.write("Credentials removed.\n");
}

export async function authStatus(): Promise<void> {
  const envKey = process.env.CROSMOS_API_KEY;
  const envUrl = process.env.CROSMOS_API_BASE_URL;
  const creds = readCredentials();

  process.stderr.write("Crosmos MCP Authentication Status\n");
  process.stderr.write("──────────────────────────────────\n");

  if (envKey) {
    process.stderr.write("API key: set via CROSMOS_API_KEY (env var)\n");
  } else if (creds) {
    const masked = `${creds.api_key.slice(0, 8)}...${creds.api_key.slice(-4)}`;
    process.stderr.write(`API key: ${masked} (from ~/.crosmos/credentials.json)\n`);
  } else {
    process.stderr.write("API key: not configured\n");
    process.stderr.write("\nRun `crosmos-mcp auth login` to authenticate.\n");
    return;
  }

  const baseUrl = envUrl?.replace(/\/$/, "") ?? creds?.base_url ?? "https://api.crosmos.dev";
  process.stderr.write(
    `Base URL: ${baseUrl}${envUrl ? " (from CROSMOS_API_BASE_URL env var)" : creds?.base_url ? " (from credentials)" : " (default)"}\n`
  );
}
