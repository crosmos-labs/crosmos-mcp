import { z } from "zod";

export const SearchRequestSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  space_id: z.number().int().positive("Space ID must be a positive integer"),
});

export const MemoryCandidateSchema = z.object({
  memory_id: z.number().int(),
  content: z.string(),
  memory_type: z.string(),
  importance_score: z.number().nullable(),
  fused_score: z.number(),
  persistence_score: z.number(),
  final_score: z.number(),
  event_time: z.string().nullable(),
});

export const SearchResponseSchema = z.object({
  query: z.string(),
  candidates: z.array(MemoryCandidateSchema),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type MemoryCandidate = z.infer<typeof MemoryCandidateSchema>;
