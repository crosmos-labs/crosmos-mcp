import { z } from "zod";

export const SourcePayloadSchema = z.object({
  content: z.string().min(1, "Content cannot be empty"),
  content_type: z.string().default("text"),
  role: z.string().optional().nullable(),
  sequence: z.number().int().min(0).default(0),
  meta: z.record(z.unknown()).optional().nullable(),
});

export const AddMemoryRequestSchema = z.object({
  space_id: z.number().int().positive("Space ID must be a positive integer"),
  sources: z.array(SourcePayloadSchema).min(1, "At least one source is required"),
});

export const AddMemoryResponseSchema = z.object({
  source_ids: z.array(z.number().int()),
  memory_count: z.number().int(),
  entity_count: z.number().int(),
  edge_count: z.number().int(),
});

export type SourcePayload = z.infer<typeof SourcePayloadSchema>;
export type AddMemoryRequest = z.infer<typeof AddMemoryRequestSchema>;
export type AddMemoryResponse = z.infer<typeof AddMemoryResponseSchema>;
