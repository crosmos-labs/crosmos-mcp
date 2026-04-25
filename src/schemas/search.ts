import { z } from "zod";

export const SearchRequestSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  space_id: z.string().uuid("Space ID must be a UUID"),
});

export const MemoryCandidateSchema = z.object({
  memory_id: z.union([z.string().uuid(), z.number()]).transform((v) => String(v)),
  content: z.string(),
  memory_type: z.string(),
  score: z.number(),
  created_at: z.string().optional().default(""),
  recorded_at: z.string().optional().default(""),
  event_time: z.string().nullable().optional().default(null),
});

export const SearchResponseSchema = z.object({
  query: z.string(),
  candidates: z.array(MemoryCandidateSchema),
  total: z.number().optional().default(0),
  took_ms: z.number().optional().default(0),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type MemoryCandidate = z.infer<typeof MemoryCandidateSchema>;
