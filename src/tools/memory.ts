import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { memoryClient } from "../client/index.js";
import { config } from "../config/index.js";
import {
  type AddMemoryRequest,
  AddMemoryRequestSchema,
  type AddMemoryResponse,
  type SourcePayload,
} from "../schemas/memory.js";

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
        default: config.defaults.spaceId,
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

export interface AddMemoryToolInput {
  space_id?: number;
  sources: Array<{
    content: string;
    content_type?: string;
    role?: string | null;
    sequence?: number;
    meta?: Record<string, unknown> | null;
  }>;
}

export async function handleAddMemory(input: unknown, authToken?: string): Promise<AddMemoryResponse> {
  const rawInput = input as AddMemoryToolInput;

  const parsed = AddMemoryRequestSchema.safeParse({
    space_id: rawInput.space_id ?? config.defaults.spaceId,
    sources: rawInput.sources.map((s) => ({
      content: s.content,
      content_type: s.content_type ?? "text",
      role: s.role ?? null,
      sequence: s.sequence ?? 0,
      meta: s.meta ?? null,
    })),
  });

  if (!parsed.success) {
    throw new Error(`Invalid input: ${parsed.error.message}`);
  }

  return memoryClient.addMemory(parsed.data, authToken);
}

export function formatAddMemoryResult(response: AddMemoryResponse): string {
  return [
    "Memory accepted for processing:",
    `  - Job ID: ${response.job_id}`,
    `  - Status: ${response.status}`,
    `  - Source IDs: ${response.source_ids.join(", ")}`,
  ].join("\n");
}
