import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { memoryClient } from "../client/index.js";
import { config } from "../config/index.js";
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
        type: "integer",
        description: "The memory space to search within",
        default: config.defaults.spaceId,
      },
    },
    required: ["query"],
  },
};

export interface SearchToolInput {
  query: string;
  space_id?: number;
}

export async function handleSearch(input: unknown, authToken?: string): Promise<SearchResponse> {
  const parsed = SearchRequestSchema.safeParse({
    query: (input as SearchToolInput).query,
    space_id: (input as SearchToolInput).space_id ?? config.defaults.spaceId,
  });

  if (!parsed.success) {
    throw new Error(`Invalid input: ${parsed.error.message}`);
  }

  return memoryClient.search(parsed.data, authToken);
}

export function formatSearchResult(response: SearchResponse): string {
  if (response.candidates.length === 0) {
    return "No memories found matching your query.";
  }

  const results = response.candidates.map((candidate, index) => {
    const eventTime = candidate.event_time ? ` (event: ${candidate.event_time})` : "";
    const sourceSignals = candidate.source_signals.length > 0
      ? ` [${candidate.source_signals.join(", ")}]`
      : "";
    const sourceChunk = candidate.source_chunk
      ? `\n   Source: ${candidate.source_chunk.slice(0, 200)}${candidate.source_chunk.length > 200 ? "..." : ""}`
      : "";
    return `${index + 1}. (score: ${candidate.final_score.toFixed(3)}, type: ${candidate.memory_type})${eventTime}${sourceSignals}\n   ${candidate.content}${sourceChunk}`;
  });

  return `Found ${response.candidates.length} memories for "${response.query}":\n\n${results.join("\n\n")}`;
}
