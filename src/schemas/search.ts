import { z } from "zod";

export const SearchRequestSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  space_id: z.string().uuid("Space ID must be a UUID"),
  limit: z.number().int().min(1).max(50).optional(),
  recency_bias: z.number().min(0).max(1).nullable().optional(),
  rerank: z.boolean().optional(),
  graph: z.boolean().optional(),
  diversify: z.boolean().optional(),
  include_source: z.boolean().optional(),
});

export const MemoryCandidateSchema = z.object({
  memory_id: z.union([z.string().uuid(), z.number()]).transform((v) => String(v)),
  content: z.string(),
  memory_type: z.string(),
  score: z.number(),
  // Present only when the request sets include_source=true.
  source: z.string().nullable().optional().default(null),
  created_at: z.string().optional().default(""),
  event_time: z.string().nullable().optional().default(null),
  // Per-candidate owner attribution (org/visibility rollout). Null for
  // org-level memories not attributable to a single user.
  owner_name: z.string().nullable().optional().default(null),
});

export const SearchResponseSchema = z.object({
  query: z.string(),
  candidates: z.array(MemoryCandidateSchema),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type MemoryCandidate = z.infer<typeof MemoryCandidateSchema>;
