import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  addMemoryInputFields,
  formatAddMemoryResult,
  formatHealthResult,
  formatListSpacesResult,
  formatSearchResult,
  handleAddMemory,
  handleHealth,
  handleListSpaces,
  handleSearch,
  searchInputSchema,
} from "./tools/index.js";

const SERVER_INSTRUCTIONS = [
  "Memory operations use the configured default space when space_id is omitted.",
  "Only call list_spaces when the user asks to view or switch spaces, or when default-space resolution fails.",
  "Pass space_id only to override the configured default for a specific operation.",
  "If list_spaces returns no spaces, tell the user to create one via the Crosmos dashboard before proceeding.",
].join("\n");

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: "crosmos",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
      instructions: SERVER_INSTRUCTIONS,
    }
  );

  server.tool(
    "search_memories",
    "Search memories in Crosmos Memory Engine using hybrid retrieval. Combines semantic (vector), keyword (full-text), and graph-based retrieval. Uses the configured default space when space_id is omitted.",
    {
      query: searchInputSchema.shape.query,
      space_id: searchInputSchema.shape.space_id,
    },
    async (input, extra) => {
      const authToken = extra.authInfo?.token;
      try {
        const result = await handleSearch(
          {
            query: input.query,
            space_id: input.space_id,
          },
          authToken
        );
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
    "Add new memories to Crosmos Memory Engine. Content is processed through an extraction pipeline that identifies entities, relationships, and creates structured knowledge graph entries. Uses the configured default space when space_id is omitted.",
    {
      space_id: addMemoryInputFields.space_id,
      sources: addMemoryInputFields.sources,
      messages: addMemoryInputFields.messages,
    },
    async (input, extra) => {
      const authToken = extra.authInfo?.token;
      try {
        const result = await handleAddMemory(
          {
            space_id: input.space_id,
            sources: input.sources?.map((s) => ({
              content: s.content,
              content_type: s.content_type ?? "text",
              role: s.role ?? null,
              visibility: s.visibility ?? "private",
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
                  visibility: input.messages.visibility ?? "private",
                }
              : null,
          },
          authToken
        );
        return {
          content: [{ type: "text", text: formatAddMemoryResult(result) }],
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
    "List all memory spaces owned by the authenticated user. Use this when the user asks to view or switch spaces.",
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
