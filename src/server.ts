import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  addMemoryInputFields,
  formatAddMemoryResult,
  formatHealthResult,
  formatSearchResult,
  formatListSpacesResult,
  handleAddMemory,
  handleHealth,
  handleSearch,
  handleListSpaces,
  searchInputSchema,
} from "./tools/index.js";

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: "crosmos-memory",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.tool(
    "search_memories",
    "Search memories in Crosmos Memory Engine using hybrid retrieval. Combines semantic (vector), keyword (full-text), and graph-based retrieval.",
    {
      query: searchInputSchema.shape.query,
      space_id: searchInputSchema.shape.space_id,
    },
    async (input, extra) => {
      const authToken = extra.authInfo?.token;
      try {
        const result = await handleSearch({
          query: input.query,
          space_id: input.space_id,
        }, authToken);
        return {
          content: [{ type: "text", text: formatSearchResult(result) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text", text: `Error searching memories: ${message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "add_memory",
    "Add new memories to Crosmos Memory Engine. Content is processed through an extraction pipeline that identifies entities, relationships, and creates structured knowledge graph entries.",
    {
      space_id: addMemoryInputFields.space_id,
      sources: addMemoryInputFields.sources,
      messages: addMemoryInputFields.messages,
    },
    async (input, extra) => {
      const authToken = extra.authInfo?.token;
      try {
        const result = await handleAddMemory({
          space_id: input.space_id,
          sources: input.sources?.map((s) => ({
            content: s.content,
            content_type: s.content_type ?? "text",
            role: s.role ?? null,
            sequence: s.sequence ?? 0,
            meta: s.meta ?? null,
          })),
          messages: input.messages
            ? {
                messages: input.messages.messages.map((message) => ({
                  role: message.role,
                  content: message.content,
                })),
                session_id: input.messages.session_id ?? null,
                session_date: input.messages.session_date ?? null,
                segment_size: input.messages.segment_size ?? 4,
                lookback: input.messages.lookback ?? 4,
              }
            : null,
        }, authToken);
        return {
          content: [{ type: "text", text: formatAddMemoryResult(result, result.resolved_space_id) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text", text: `Error adding memory: ${message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "health_check",
    "Check the health status of the Crosmos Memory Engine API",
    {},
    async (_input, extra) => {
      const authToken = extra.authInfo?.token;
      try {
        const result = await handleHealth(authToken);
        return {
          content: [{ type: "text", text: formatHealthResult(result) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text", text: `Health check failed: ${message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "list_spaces",
    "List all memory spaces owned by the authenticated user. Use this to discover available space IDs for searching and adding memories.",
    {},
    async (_input, extra) => {
      const authToken = extra.authInfo?.token;
      try {
        const result = await handleListSpaces(authToken);
        return {
          content: [{ type: "text", text: formatListSpacesResult(result) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text", text: `Error listing spaces: ${message}` }],
          isError: true,
        };
      }
    }
  );

  return server;
}
