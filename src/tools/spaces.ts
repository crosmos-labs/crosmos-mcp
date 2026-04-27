import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { memoryClient } from "../client/index.js";
import { type SpaceListResponse, SpaceListResponseSchema } from "../schemas/spaces.js";

export const listSpacesToolDefinition: Tool = {
  name: "list_spaces",
  description:
    "List all memory spaces owned by the authenticated user. " +
    "Use this to discover available space IDs for searching and adding memories.",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export async function handleListSpaces(authToken?: string): Promise<SpaceListResponse> {
  const response = await memoryClient.listSpaces(authToken);
  const parsed = SpaceListResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new Error(`Invalid response: ${parsed.error.message}`);
  }

  return parsed.data;
}

export function formatListSpacesResult(response: SpaceListResponse): string {
  if (response.spaces.length === 0) {
    return "No memory spaces found. Create a space first using the Crosmos API.";
  }

  const spaces = response.spaces.map((space, index) => {
    const description = space.description ? ` - ${space.description}` : "";
    return `${index + 1}. ${space.name} (id: ${space.id})${description}`;
  });

  return `Found ${response.total} memory spaces:\n\n${spaces.join("\n")}`;
}
