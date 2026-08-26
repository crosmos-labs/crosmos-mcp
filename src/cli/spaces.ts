import { MemoryClient } from "../client/memory.js";
import {
  type SpaceListResponse,
  SpaceListResponseSchema,
  type SpaceResponse,
} from "../schemas/spaces.js";
import * as p from "./clack.js";
import { readSavedDefaultSpace, writeSavedDefaultSpace } from "./config.js";
import { getApiKey, getBaseUrl } from "./credentials.js";

type DefaultSource = "DEFAULT_SPACE_ID" | "DEFAULT_SPACE_NAME" | "saved config" | "automatic";

interface CurrentSpace {
  source: DefaultSource;
  space: SpaceResponse | null;
  configuredValue?: string;
}

function createClient(): MemoryClient {
  return new MemoryClient(getBaseUrl(), undefined, getApiKey());
}

async function fetchSpaces(): Promise<SpaceListResponse> {
  const response = await createClient().listSpaces();
  const parsed = SpaceListResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new Error(`Invalid response from API: ${parsed.error.message}`);
  }
  return parsed.data;
}

function findCurrentSpace(spaces: SpaceResponse[]): CurrentSpace {
  const envId = process.env.DEFAULT_SPACE_ID;
  if (envId) {
    return {
      source: "DEFAULT_SPACE_ID",
      space: spaces.find((space) => space.id === envId) ?? null,
      configuredValue: envId,
    };
  }

  const envName = process.env.DEFAULT_SPACE_NAME;
  if (envName) {
    return {
      source: "DEFAULT_SPACE_NAME",
      space: spaces.find((space) => space.name === envName) ?? null,
      configuredValue: envName,
    };
  }

  const saved = readSavedDefaultSpace();
  if (saved) {
    return {
      source: "saved config",
      space: spaces.find((space) => space.id === saved.id) ?? null,
      configuredValue: saved.id,
    };
  }

  return { source: "automatic", space: spaces[0] ?? null };
}

function formatSpace(space: SpaceResponse): string {
  const description = space.description ? ` - ${space.description}` : "";
  return `${space.name} [${space.id}]${description}`;
}

async function listSpaces(): Promise<void> {
  const response = await fetchSpaces();
  if (response.spaces.length === 0) {
    process.stderr.write("No memory spaces found.\n");
    return;
  }

  const current = findCurrentSpace(response.spaces);
  for (const space of response.spaces) {
    const marker = current.space?.id === space.id ? "*" : " ";
    process.stdout.write(`${marker} ${formatSpace(space)}\n`);
  }
  process.stdout.write("\n* current default\n");
}

async function showCurrentSpace(): Promise<void> {
  const response = await fetchSpaces();
  const current = findCurrentSpace(response.spaces);

  if (current.space) {
    process.stdout.write(`${formatSpace(current.space)}\n`);
    process.stdout.write(`Source: ${current.source}\n`);
    return;
  }

  if (current.configuredValue) {
    throw new Error(
      `Configured space ${current.configuredValue} (${current.source}) was not found in your spaces.`
    );
  }

  throw new Error("No memory spaces found. Create a space before selecting a default.");
}

function selectSpace(spaces: SpaceResponse[], selector: string): SpaceResponse {
  const byId = spaces.find((space) => space.id === selector);
  if (byId) return byId;

  const byName = spaces.filter((space) => space.name === selector);
  if (byName.length === 1) return byName[0];

  if (byName.length > 1) {
    const matches = byName.map((space) => `  ${formatSpace(space)}`).join("\n");
    throw new Error(`Multiple spaces are named "${selector}". Use a space ID:\n${matches}`);
  }

  throw new Error(`No space found with name or ID "${selector}".`);
}

async function useSpace(args: string[]): Promise<void> {
  const selector = args.join(" ").trim();
  if (!selector) {
    throw new Error("Usage: crosmos-mcp spaces use <name-or-id>");
  }

  const response = await fetchSpaces();
  const space = selectSpace(response.spaces, selector);
  writeSavedDefaultSpace({ id: space.id, name: space.name });

  process.stdout.write(`Default space set to ${space.name} [${space.id}]\n`);

  if (process.env.DEFAULT_SPACE_ID || process.env.DEFAULT_SPACE_NAME) {
    process.stderr.write(
      "Warning: DEFAULT_SPACE_ID or DEFAULT_SPACE_NAME is set and overrides this saved selection.\n"
    );
  }
}

export async function promptDefaultSpace(): Promise<void> {
  try {
    const response = await fetchSpaces();
    if (response.spaces.length === 0) {
      p.log.warn("No memory spaces found. Create one in the crosmos console after setup.");
      return;
    }

    if (response.spaces.length === 1) {
      const [space] = response.spaces;
      writeSavedDefaultSpace({ id: space.id, name: space.name });
      p.log.success(`Default space: ${space.name}`);
      return;
    }

    const current = findCurrentSpace(response.spaces).space;
    const selected = await p.select({
      message: "Choose your default memory space",
      options: response.spaces.map((space) => ({
        value: space.id,
        label: space.name,
        hint: space.description ?? space.id,
      })),
      initialValue: current?.id,
    });

    if (p.isCancel(selected)) {
      p.log.info("Default space selection skipped.");
      return;
    }

    const space = response.spaces.find((candidate) => candidate.id === selected);
    if (!space) {
      p.log.warn("Selected space was not found. Default space selection skipped.");
      return;
    }

    writeSavedDefaultSpace({ id: space.id, name: space.name });
    p.log.success(`Default space: ${space.name}`);

    if (process.env.DEFAULT_SPACE_ID || process.env.DEFAULT_SPACE_NAME) {
      p.log.warn(
        "DEFAULT_SPACE_ID or DEFAULT_SPACE_NAME is set and overrides this saved selection."
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    p.log.warn(`Could not configure a default space: ${message}`);
  }
}

export async function handleSpacesCommand(subcommand: string, args: string[]): Promise<boolean> {
  try {
    switch (subcommand) {
      case "list":
        await listSpaces();
        return true;
      case "current":
        await showCurrentSpace();
        return true;
      case "use":
        await useSpace(args);
        return true;
      default:
        process.stderr.write(`Unknown spaces subcommand: ${subcommand}\n`);
        process.stderr.write("\nAvailable commands:\n");
        process.stderr.write("  crosmos-mcp spaces list\n");
        process.stderr.write("  crosmos-mcp spaces current\n");
        process.stderr.write("  crosmos-mcp spaces use <name-or-id>\n");
        return false;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    process.stderr.write(`Error: ${message}\n`);
    return false;
  }
}
