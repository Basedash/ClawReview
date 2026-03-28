import { z } from 'zod';

import {
  harnessTypeSchema,
  requestEventActorSchema,
  requestEventTypeSchema,
  requestFilterStatusSchema,
  requestReviewStateSchema,
  requestStatusSchema,
  resumeStatusSchema,
  reviewActionSchema,
} from '../enums.js';
import { publicIdSchema, requestIdSchema } from '../ids.js';
import {
  continuationContextSchema,
  metadataRecordSchema,
  optionalStringSchema,
  timestampSchema,
} from './common.js';

export const requestSourceSchema = z
  .object({
    harness: harnessTypeSchema.default('openclaw'),
    agentLabel: optionalStringSchema,
    workflowLabel: optionalStringSchema,
  })
  .default({
    harness: 'openclaw',
  });

export const createReviewRequestSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: optionalStringSchema.default(''),
  contentMarkdown: z.string().min(1),
  source: requestSourceSchema.optional(),
  continuation: continuationContextSchema,
  metadata: metadataRecordSchema.optional(),
  context: metadataRecordSchema.optional(),
});

export const listRequestsQuerySchema = z.object({
  status: requestFilterStatusSchema.default('open'),
  reviewState: requestReviewStateSchema.optional(),
  search: optionalStringSchema,
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const updateRequestContentInputSchema = z.object({
  editedContentMarkdown: z.string(),
});

export const requestEventSchema = z.object({
  id: z.string().trim().min(1),
  requestId: requestIdSchema,
  eventType: requestEventTypeSchema,
  actorType: requestEventActorSchema,
  payload: metadataRecordSchema.nullable(),
  createdAt: timestampSchema,
});

export const reviewRecordSchema = z.object({
  id: z.string().trim().min(1),
  requestId: requestIdSchema,
  action: reviewActionSchema,
  commentText: z.string().nullable(),
  resumePayloadJson: metadataRecordSchema.nullable(),
  submittedAt: timestampSchema,
});

export const requestListItemSchema = z.object({
  id: requestIdSchema,
  publicId: publicIdSchema,
  title: z.string(),
  summary: z.string(),
  status: requestStatusSchema,
  reviewState: requestReviewStateSchema,
  resumeStatus: resumeStatusSchema,
  isEdited: z.boolean(),
  sourceHarness: harnessTypeSchema,
  sourceAgentId: z.string(),
  sourceAgentLabel: z.string(),
  sourceWorkflowLabel: z.string(),
  updatedAt: timestampSchema,
  createdAt: timestampSchema,
  closedAt: timestampSchema.nullable(),
});

export const requestDetailSchema = requestListItemSchema.extend({
  originalContentMarkdown: z.string(),
  editedContentMarkdown: z.string(),
  sourceSessionKey: z.string(),
  sourcePreviousResponseId: z.string().nullable(),
  sourceGatewayBaseUrl: z.string().nullable(),
  sourceUser: z.string().nullable(),
  sourceMetadata: metadataRecordSchema.nullable(),
  context: metadataRecordSchema.nullable(),
  resumeError: z.string().nullable(),
  lastResumeAttemptAt: timestampSchema.nullable(),
  lastResumeResponseId: z.string().nullable(),
  reviews: z.array(reviewRecordSchema),
  events: z.array(requestEventSchema),
});

export const listRequestsResponseSchema = z.object({
  requests: z.array(requestListItemSchema),
});

export const getRequestResponseSchema = z.object({
  request: requestDetailSchema,
});

export const healthStatusSchema = z.object({
  ok: z.boolean(),
  now: timestampSchema,
});

export const configStatusSchema = z.object({
  databaseUrl: z.string(),
  openclawBaseUrl: z.string(),
  hasGatewayToken: z.boolean(),
  warnings: z.array(z.string()),
});

export type RequestSourceInput = z.infer<typeof requestSourceSchema>;
export type CreateReviewRequestInput = z.infer<typeof createReviewRequestSchema>;
export type ListRequestsQuery = z.infer<typeof listRequestsQuerySchema>;
export type UpdateRequestContentInput = z.infer<
  typeof updateRequestContentInputSchema
>;
export type RequestEvent = z.infer<typeof requestEventSchema>;
export type ReviewRecord = z.infer<typeof reviewRecordSchema>;
export type RequestListItem = z.infer<typeof requestListItemSchema>;
export type RequestDetail = z.infer<typeof requestDetailSchema>;
export type HealthStatus = z.infer<typeof healthStatusSchema>;
export type ConfigStatus = z.infer<typeof configStatusSchema>;
