import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex, } from 'drizzle-orm/sqlite-core';
import { harnessTypeValues, requestEventActorValues, requestEventTypeValues, requestReviewStateValues, requestStatusValues, resumeStatusValues, reviewActionValues, } from '@clawreview/shared';
export const reviewRequests = sqliteTable('review_requests', {
    id: text('id').primaryKey(),
    publicId: text('public_id').notNull(),
    sequenceNumber: integer('sequence_number').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull().default(''),
    status: text('status', { enum: requestStatusValues }).notNull(),
    reviewState: text('review_state', { enum: requestReviewStateValues })
        .notNull()
        .default('pending'),
    originalContentMarkdown: text('original_content_markdown').notNull(),
    editedContentMarkdown: text('edited_content_markdown').notNull(),
    isEdited: integer('is_edited', { mode: 'boolean' }).notNull().default(false),
    sourceHarness: text('source_harness', { enum: harnessTypeValues })
        .notNull()
        .default('openclaw'),
    sourceAgentId: text('source_agent_id').notNull(),
    sourceAgentLabel: text('source_agent_label').notNull().default(''),
    sourceWorkflowLabel: text('source_workflow_label').notNull().default(''),
    sourceSessionKey: text('source_session_key').notNull(),
    sourcePreviousResponseId: text('source_previous_response_id'),
    sourceGatewayBaseUrl: text('source_gateway_base_url'),
    sourceUser: text('source_user'),
    sourceMetadataJson: text('source_metadata_json'),
    continuationMetadataJson: text('continuation_metadata_json'),
    contextJson: text('context_json'),
    resumeStatus: text('resume_status', { enum: resumeStatusValues })
        .notNull()
        .default('not_requested'),
    resumeError: text('resume_error'),
    lastResumeAttemptAt: text('last_resume_attempt_at'),
    lastResumeResponseId: text('last_resume_response_id'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    closedAt: text('closed_at'),
}, (table) => [
    uniqueIndex('review_requests_public_id_idx').on(table.publicId),
    uniqueIndex('review_requests_sequence_number_idx').on(table.sequenceNumber),
    index('review_requests_status_updated_at_idx').on(table.status, table.updatedAt),
    index('review_requests_review_state_idx').on(table.reviewState),
    check('review_requests_status_check', sql `${table.status} in ('open', 'closed')`),
]);
export const reviews = sqliteTable('reviews', {
    id: text('id').primaryKey(),
    requestId: text('request_id')
        .notNull()
        .references(() => reviewRequests.id, { onDelete: 'cascade' }),
    action: text('action', { enum: reviewActionValues }).notNull(),
    commentText: text('comment_text'),
    resumePayloadJson: text('resume_payload_json'),
    submittedAt: text('submitted_at').notNull(),
}, (table) => [index('reviews_request_id_idx').on(table.requestId)]);
export const requestEvents = sqliteTable('request_events', {
    id: text('id').primaryKey(),
    requestId: text('request_id')
        .notNull()
        .references(() => reviewRequests.id, { onDelete: 'cascade' }),
    eventType: text('event_type', { enum: requestEventTypeValues }).notNull(),
    actorType: text('actor_type', { enum: requestEventActorValues }).notNull(),
    payloadJson: text('payload_json'),
    createdAt: text('created_at').notNull(),
}, (table) => [
    index('request_events_request_id_created_at_idx').on(table.requestId, table.createdAt),
]);
