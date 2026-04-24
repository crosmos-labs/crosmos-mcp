import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { memoryClient } from "../client/index.js";
import {
  type SearchRequest,
  SearchRequestSchema,
  type SearchResponse,
  SearchResponseSchema,
} from "../schemas/search.js";

export const searchToolDefinition: Tool = {
  name: "search_memories",
  description:
    "Search memories in Crosmos Memory Engine using hybrid retrieval. " +
    "Combines semantic (vector), keyword (full-text), and graph-based retrieval.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query text",
        minLength: 1,
      },
      space_id: {
        type: "string",
        format: "uuid",
        description: "The memory space to search within. If omitted, uses DEFAULT_SPACE_ID env var or auto-detects from available spaces.",
      },
    },
    required: ["query"],
  },
};

export interface SearchToolInput {
  query: string;
  space_id?: string;
}

export async function handleSearch(input: unknown, authToken?: string): Promise<SearchResponse> {
  const rawInput = input as SearchToolInput;
  const spaceId = await memoryClient.resolveSpaceId(rawInput.space_id, authToken);

  const parsed = SearchRequestSchema.safeParse({
    query: rawInput.query,
    space_id: spaceId,
  });

  if (!parsed.success) {
    throw new Error(`Invalid input: ${parsed.error.message}`);
  }

  const response = await memoryClient.search(parsed.data, authToken);
  const parsedResponse = SearchResponseSchema.safeParse(response);
  if (!parsedResponse.success) {
    throw new Error(`Invalid response from API: ${parsedResponse.error.message}`);
  }
  return parsedResponse.data;
}

export function formatSearchResult(response: SearchResponse): string {
  if (response.candidates.length === 0) {
    return "No memories found matching your query.";
  }

  const results = response.candidates.map((candidate, index) => {
    const eventTime = candidate.event_time ? ` (event: ${candidate.event_time})` : "";
    return `${index + 1}. (score: ${candidate.score.toFixed(3)}, type: ${candidate.memory_type})${eventTime}\n   ${candidate.content}`;
  });

  return `Found ${response.candidates.length} memories for "${response.query}":\n\n${results.join("\n\n")}`;
}
