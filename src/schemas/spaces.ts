import { z } from "zod";

export const SpaceResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  meta: z.record(z.unknown()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SpaceListResponseSchema = z.object({
  spaces: z.array(SpaceResponseSchema),
  total: z.number().int(),
});

export type SpaceResponse = z.infer<typeof SpaceResponseSchema>;
export type SpaceListResponse = z.infer<typeof SpaceListResponseSchema>;
