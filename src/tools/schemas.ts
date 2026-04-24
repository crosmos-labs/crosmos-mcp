import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const searchInputSchema = z.object({
  query: z.string().min(1).describe("The search query text"),
  space_id: z.string().uuid().optional().describe("The memory space to search within"),
});

export const addMemoryInputFields = {
  space_id: z.string().uuid().optional().describe("The memory space to add memories to"),
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
    .optional()
    .describe("Content sources to ingest"),
  messages: z.object({
    messages: z
      .array(
        z.object({
          role: z.string().min(1).describe("Speaker role"),
          content: z.string().min(1).describe("Message content"),
        })
      )
      .min(1)
      .describe("Ordered conversation messages"),
    session_id: z.string().optional().nullable().describe("Session identifier"),
    session_date: z
      .string()
      .optional()
      .nullable()
      .describe("ISO datetime for the conversation reference time"),
    segment_size: z.number().int().min(1).max(20).optional().default(4).describe("Messages per segment"),
    lookback: z
      .number()
      .int()
      .min(0)
      .max(20)
      .optional()
      .default(4)
      .describe("Number of prior segments included as context"),
  }).optional().describe("Conversation messages with automatic segmentation and lookback context"),
};

export const addMemoryInputSchema = z.object(addMemoryInputFields).superRefine((value, ctx) => {
  const hasSources = Array.isArray(value.sources) && value.sources.length > 0;
  const hasMessages = value.messages !== undefined;

  if (hasSources === hasMessages) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide exactly one of 'sources' or 'messages'",
      path: ["sources"],
    });
  }
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
        type: "string",
        format: "uuid",
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
        type: "string",
        format: "uuid",
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
      messages: {
        type: "object",
        description: "Conversation messages with automatic segmentation and lookback context",
        properties: {
          messages: {
            type: "array",
            description: "Ordered conversation messages",
            items: {
              type: "object",
              properties: {
                role: {
                  type: "string",
                  description: "Speaker role",
                  minLength: 1,
                },
                content: {
                  type: "string",
                  description: "Message content",
                  minLength: 1,
                },
              },
              required: ["role", "content"],
            },
            minItems: 1,
          },
          session_id: {
            type: "string",
            description: "Session identifier",
          },
          session_date: {
            type: "string",
            description: "ISO datetime for the conversation reference time",
          },
          segment_size: {
            type: "integer",
            description: "Messages per segment",
            default: 4,
            minimum: 1,
            maximum: 20,
          },
          lookback: {
            type: "integer",
            description: "Number of prior segments included as context",
            default: 4,
            minimum: 0,
            maximum: 20,
          },
        },
        required: ["messages"],
      },
    },
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
