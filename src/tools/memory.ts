import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { memoryClient } from "../client/index.js";
import { AddMemoryRequestSchema, type AddMemoryResponse } from "../schemas/memory.js";

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
        description:
          "The memory space to add memories to. If omitted, uses DEFAULT_SPACE_ID env var or auto-detects from available spaces.",
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
          meta: {
            type: "object",
            description: "Optional metadata attached to all created sources",
          },
        },
        required: ["messages"],
      },
    },
  },
};

export interface AddMemoryToolInput {
  space_id?: string;
  sources?: Array<{
    content: string;
    content_type?: string;
    role?: string | null;
    sequence?: number;
    meta?: Record<string, unknown> | null;
  }>;
  messages?: {
    messages: Array<{
      role: string;
      content: string;
    }>;
    session_id?: string | null;
    session_date?: string | null;
    meta?: Record<string, unknown> | null;
  } | null;
}

export async function handleAddMemory(
  input: unknown,
  authToken?: string
): Promise<AddMemoryResponse> {
  const rawInput = input as AddMemoryToolInput;
  const spaceId = await memoryClient.resolveSpaceId(rawInput.space_id, authToken);

  const parsed = AddMemoryRequestSchema.safeParse({
    space_id: spaceId,
    sources:
      rawInput.sources?.map((s) => ({
        content: s.content,
        content_type: s.content_type ?? "text",
        role: s.role ?? null,
        sequence: s.sequence ?? 0,
        meta: s.meta ?? null,
      })) ?? null,
    messages: rawInput.messages
      ? {
          messages: rawInput.messages.messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          session_id: rawInput.messages.session_id ?? null,
          session_date: rawInput.messages.session_date ?? null,
          meta: rawInput.messages.meta ?? null,
        }
      : null,
  });

  if (!parsed.success) {
    throw new Error(`Invalid input: ${parsed.error.message}`);
  }

  const result = await memoryClient.addMemory(parsed.data, authToken);
  return result;
}

export function formatAddMemoryResult(): string {
  return "Memory saved successfully.";
}
