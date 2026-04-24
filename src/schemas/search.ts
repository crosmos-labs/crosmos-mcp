import { z } from "zod";

export const SearchRequestSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  space_id: z.string().uuid("Space ID must be a UUID"),
});

export const MemoryCandidateSchema = z.object({
  memory_id: z.string().uuid(),
  content: z.string(),
  memory_type: z.string(),
  score: z.number(),
  created_at: z.string(),
  recorded_at: z.string(),
  event_time: z.string().nullable(),
});

export const SearchResponseSchema = z.object({
  query: z.string(),
  candidates: z.array(MemoryCandidateSchema),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type MemoryCandidate = z.infer<typeof MemoryCandidateSchema>;
