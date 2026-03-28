import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import { formatPublicId } from '@clawreview/shared';
import { requestEvents, reviewRequests, reviews, } from '../db/schema.js';
export class RequestRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    nextSequenceNumber() {
        const row = this.db.select({ value: count() }).from(reviewRequests).get();
        return (row?.value ?? 0) + 1;
    }
    create(input) {
        const sequenceNumber = this.nextSequenceNumber();
        const row = {
            id: input.id,
            publicId: formatPublicId(sequenceNumber),
            sequenceNumber,
            title: input.input.title,
            summary: input.input.summary ?? '',
            status: 'open',
            reviewState: 'pending',
            originalContentMarkdown: input.input.contentMarkdown,
            editedContentMarkdown: input.input.contentMarkdown,
            isEdited: false,
            sourceHarness: input.input.source?.harness ?? 'openclaw',
            sourceAgentId: input.input.continuation.agentId,
            sourceAgentLabel: input.input.source?.agentLabel ?? '',
            sourceWorkflowLabel: input.input.source?.workflowLabel ?? '',
            sourceSessionKey: input.input.continuation.sessionKey,
            sourcePreviousResponseId: input.input.continuation.previousResponseId ?? null,
            sourceGatewayBaseUrl: input.input.continuation.gatewayBaseUrl ?? null,
            sourceUser: input.input.continuation.user ?? null,
            sourceMetadataJson: JSON.stringify(input.input.metadata ?? input.input.continuation.metadata ?? null),
            continuationMetadataJson: JSON.stringify(input.input.continuation.metadata ?? null),
            contextJson: JSON.stringify(input.input.context ?? null),
            resumeStatus: 'not_requested',
            resumeError: null,
            lastResumeAttemptAt: null,
            lastResumeResponseId: null,
            createdAt: input.createdAt,
            updatedAt: input.updatedAt,
            closedAt: null,
        };
        this.db.insert(reviewRequests).values(row).run();
        const created = this.getById(input.id);
        if (!created) {
            throw new Error(`Failed to create request ${input.id}.`);
        }
        return created;
    }
    list(query) {
        const conditions = [];
        if (query.status !== 'all') {
            conditions.push(eq(reviewRequests.status, query.status));
        }
        if (query.reviewState) {
            conditions.push(eq(reviewRequests.reviewState, query.reviewState));
        }
        if (query.search) {
            const pattern = `%${query.search}%`;
            conditions.push(or(like(reviewRequests.title, pattern), like(reviewRequests.summary, pattern), like(reviewRequests.publicId, pattern), like(reviewRequests.sourceAgentLabel, pattern), like(reviewRequests.sourceWorkflowLabel, pattern)));
        }
        return this.db
            .select()
            .from(reviewRequests)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(reviewRequests.updatedAt), desc(reviewRequests.createdAt))
            .limit(query.limit)
            .all();
    }
    getById(id) {
        return (this.db
            .select()
            .from(reviewRequests)
            .where(or(eq(reviewRequests.id, id), eq(reviewRequests.publicId, id)))
            .get() ?? null);
    }
    findById(id) {
        return this.getById(id);
    }
    getDetailById(id) {
        const row = this.getById(id);
        if (!row) {
            return null;
        }
        const requestReviews = this.db
            .select()
            .from(reviews)
            .where(eq(reviews.requestId, row.id))
            .orderBy(desc(reviews.submittedAt))
            .all();
        const events = this.db
            .select()
            .from(requestEvents)
            .where(eq(requestEvents.requestId, row.id))
            .orderBy(asc(requestEvents.createdAt))
            .all();
        return {
            ...row,
            reviews: requestReviews,
            events,
        };
    }
    updateEditedContent(args) {
        this.db
            .update(reviewRequests)
            .set({
            editedContentMarkdown: args.editedContentMarkdown,
            isEdited: args.isEdited,
            updatedAt: args.updatedAt,
        })
            .where(eq(reviewRequests.id, args.id))
            .run();
    }
    markReviewed(args) {
        const existing = this.getById(args.id);
        if (!existing) {
            throw new Error(`Request ${args.id} was not found.`);
        }
        const reviewState = args.action === 'approve'
            ? 'approved'
            : args.action === 'comment'
                ? 'commented'
                : 'rejected';
        this.db
            .update(reviewRequests)
            .set({
            editedContentMarkdown: args.editedContentMarkdown,
            reviewState,
            status: 'closed',
            isEdited: args.editedContentMarkdown !== existing.originalContentMarkdown,
            resumeStatus: 'pending',
            resumeError: null,
            closedAt: args.closedAt,
            updatedAt: args.updatedAt,
            lastResumeAttemptAt: args.updatedAt,
        })
            .where(eq(reviewRequests.id, args.id))
            .run();
        const updated = this.getById(args.id);
        if (!updated) {
            throw new Error(`Request ${args.id} disappeared after review.`);
        }
        return updated;
    }
    updateForReview(args) {
        this.db
            .update(reviewRequests)
            .set({
            editedContentMarkdown: args.editedContentMarkdown,
            isEdited: args.isEdited,
            reviewState: args.reviewState,
            status: args.status,
            resumeStatus: args.resumeStatus,
            resumeError: args.resumeError,
            closedAt: args.closedAt,
            updatedAt: args.updatedAt,
            lastResumeAttemptAt: args.lastResumeAttemptAt,
        })
            .where(eq(reviewRequests.id, args.id))
            .run();
        const updated = this.getById(args.id);
        if (!updated) {
            throw new Error(`Request ${args.id} disappeared after review update.`);
        }
        return updated;
    }
    updateResumeStatus(args) {
        this.db
            .update(reviewRequests)
            .set({
            resumeStatus: args.resumeStatus,
            resumeError: args.resumeError,
            lastResumeAttemptAt: args.lastResumeAttemptAt,
            lastResumeResponseId: args.lastResumeResponseId ?? null,
            updatedAt: args.updatedAt,
        })
            .where(eq(reviewRequests.id, args.id))
            .run();
    }
}
