import { z } from "zod";

// Read scope for ingested content. 'private' is gated by the visibility graph;
// 'org' is readable by everyone in the org.
export const VisibilitySchema = z.enum(["private", "org"]);

export const SourcePayloadSchema = z.object({
  content: z.string().min(1, "Content cannot be empty"),
  content_type: z.string().default("text"),
  role: z.string().optional().nullable(),
  visibility: VisibilitySchema.default("private"),
  meta: z.record(z.unknown()).optional().nullable(),
});

export const ConversationMessagePayloadSchema = z.object({
  role: z.string().min(1, "Role cannot be empty").max(50, "Role is too long"),
  content: z.string().min(1, "Content cannot be empty"),
});

export const MessagesPayloadSchema = z.object({
  messages: z
    .array(ConversationMessagePayloadSchema)
    .min(1, "At least one message is required")
    .max(500, "Too many messages"),
  session_id: z.string().optional().nullable(),
  session_date: z.string().optional().nullable(),
  visibility: VisibilitySchema.default("private"),
  meta: z.record(z.unknown()).optional().nullable(),
});

export const IngestSourcesRequestSchema = z.object({
  space_id: z.string().uuid("Space ID must be a UUID"),
  sources: z.array(SourcePayloadSchema).min(1, "At least one source is required"),
});

export const IngestConversationRequestSchema = MessagesPayloadSchema.extend({
  space_id: z.string().uuid("Space ID must be a UUID"),
});

export const AddMemoryRequestSchema = z
  .object({
    space_id: z.string().uuid("Space ID must be a UUID"),
    sources: z
      .array(SourcePayloadSchema)
      .min(1, "At least one source is required")
      .optional()
      .nullable(),
    messages: MessagesPayloadSchema.optional().nullable(),
  })
  .superRefine((value, ctx) => {
    const hasSources = Array.isArray(value.sources) && value.sources.length > 0;
    const hasMessages = value.messages != null;

    if (hasSources === hasMessages) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide exactly one of 'sources' or 'messages'",
        path: ["sources"],
      });
    }
  });

// The sources endpoint returns `source_ids` (a batch); the conversations
// endpoint returns a single `source_id`. Accept either so one response type
// covers both ingest paths.
export const AddMemoryResponseSchema = z.object({
  job_id: z.string().uuid(),
  status: z.string(),
  source_ids: z.array(z.string().uuid()).optional(),
  source_id: z.string().uuid().optional(),
});

export type SourcePayload = z.infer<typeof SourcePayloadSchema>;
export type ConversationMessagePayload = z.infer<typeof ConversationMessagePayloadSchema>;
export type MessagesPayload = z.infer<typeof MessagesPayloadSchema>;
export type IngestSourcesRequest = z.infer<typeof IngestSourcesRequestSchema>;
export type IngestConversationRequest = z.infer<typeof IngestConversationRequestSchema>;
export type AddMemoryRequest = z.infer<typeof AddMemoryRequestSchema>;
export type AddMemoryResponse = z.infer<typeof AddMemoryResponseSchema>;
