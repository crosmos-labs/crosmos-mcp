import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const searchInputSchema = z.object({
  query: z.string().min(1).describe("The search query text"),
  space_id: z.number().int().positive().optional().describe("The memory space to search within"),
});

export const addMemoryInputSchema = z.object({
  space_id: z.number().int().positive().optional().describe("The memory space to add memories to"),
  sources: z
    .array(
      z.object({
        content: z.string().min(1).describe("Raw content text"),
        content_type: z
          .string()
          .optional()
          .default("text")
          .describe("Content type: text, markdown, etc."),
        role: z.string().optional().nullable().describe("Speaker role (for conversation content)"),
        sequence: z.number().int().min(0).optional().default(0).describe("Order within batch"),
        meta: z.record(z.unknown()).optional().nullable().describe("Arbitrary metadata"),
      })
    )
    .min(1)
    .describe("Content sources to ingest"),
});

export const healthInputSchema = z.object({});

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
      },
    },
    required: ["query"],
  },
};

export const addMemoryToolDefinition: Tool = {
  name: "add_memory",
  description:
    "Add new memories to Crosmos Memory Engine. " +
    "Content is processed through an extraction pipeline that identifies entities, " +
    "relationships, and creates structured knowledge graph entries.",
  inputSchema: {
    type: "object",
    properties: {
      space_id: {
        type: "integer",
        description: "The memory space to add memories to",
      },
      sources: {
        type: "array",
        description: "Content sources to ingest",
        items: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "Raw content text",
              minLength: 1,
            },
            content_type: {
              type: "string",
              description: "Content type: text, markdown, etc.",
              default: "text",
            },
            role: {
              type: "string",
              description: "Speaker role (for conversation content)",
            },
            sequence: {
              type: "integer",
              description: "Order within batch",
              default: 0,
            },
            meta: {
              type: "object",
              description: "Arbitrary metadata",
            },
          },
          required: ["content"],
        },
        minItems: 1,
      },
    },
    required: ["sources"],
  },
};

export const healthToolDefinition: Tool = {
  name: "health_check",
  description: "Check the health status of the Crosmos Memory Engine API",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export type SearchInput = z.infer<typeof searchInputSchema>;
export type AddMemoryInput = z.infer<typeof addMemoryInputSchema>;
export type HealthInput = z.infer<typeof healthInputSchema>;
