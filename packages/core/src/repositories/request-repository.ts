import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';

import type {
  CreateReviewRequestInput,
  ListRequestsQuery,
  RequestReviewState,
  RequestStatus,
  ResumeStatus,
  ReviewAction,
} from '@clawreview/shared';
import { formatPublicId } from '@clawreview/shared';

import type { ReviewDatabase } from '../db/client.js';
import {
  requestEvents,
  reviewRequests,
  reviews,
  type NewReviewRequestRow,
  type ReviewRequestRow,
} from '../db/schema.js';

export interface RequestRecord extends ReviewRequestRow {}

export interface RequestDetailRecord extends ReviewRequestRow {
  reviews: (typeof reviews.$inferSelect)[];
  events: (typeof requestEvents.$inferSelect)[];
}

export interface CreateRequestRowInput {
  id: string;
  input: CreateReviewRequestInput;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateResumeStatusInput {
  id: string;
  resumeStatus: ResumeStatus;
  resumeError: string | null;
  lastResumeAttemptAt: string;
  lastResumeResponseId?: string | null;
  updatedAt: string;
}

export interface MarkReviewedInput {
  id: string;
  action: ReviewAction;
  editedContentMarkdown: string;
  updatedAt: string;
  closedAt: string;
}

export interface UpdateForReviewInput {
  id: string;
  editedContentMarkdown: string;
  isEdited: boolean;
  reviewState: RequestReviewState;
  status: RequestStatus;
  resumeStatus: ResumeStatus;
  closedAt: string;
  updatedAt: string;
  lastResumeAttemptAt: string;
  resumeError: string | null;
}

export class RequestRepository {
  public constructor(private readonly db: ReviewDatabase) {}

  public nextSequenceNumber(): number {
    const row = this.db.select({ value: count() }).from(reviewRequests).get();
    return (row?.value ?? 0) + 1;
  }

  public create(input: CreateRequestRowInput): RequestRecord {
    const sequenceNumber = this.nextSequenceNumber();
    const row: NewReviewRequestRow = {
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
      sourcePreviousResponseId:
        input.input.continuation.previousResponseId ?? null,
      sourceGatewayBaseUrl: input.input.continuation.gatewayBaseUrl ?? null,
      sourceUser: input.input.continuation.user ?? null,
      sourceMetadataJson: JSON.stringify(
        input.input.metadata ?? input.input.continuation.metadata ?? null,
      ),
      continuationMetadataJson: JSON.stringify(
        input.input.continuation.metadata ?? null,
      ),
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

  public list(query: ListRequestsQuery): RequestRecord[] {
    const conditions = [];

    if (query.status !== 'all') {
      conditions.push(eq(reviewRequests.status, query.status));
    }

    if (query.reviewState) {
      conditions.push(eq(reviewRequests.reviewState, query.reviewState));
    }

    if (query.search) {
      const pattern = `%${query.search}%`;
      conditions.push(
        or(
          like(reviewRequests.title, pattern),
          like(reviewRequests.summary, pattern),
          like(reviewRequests.publicId, pattern),
          like(reviewRequests.sourceAgentLabel, pattern),
          like(reviewRequests.sourceWorkflowLabel, pattern),
        ),
      );
    }

    return this.db
      .select()
      .from(reviewRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reviewRequests.updatedAt), desc(reviewRequests.createdAt))
      .limit(query.limit)
      .all();
  }

  public getById(id: string): RequestRecord | null {
    return (
      this.db
        .select()
        .from(reviewRequests)
        .where(or(eq(reviewRequests.id, id), eq(reviewRequests.publicId, id)))
        .get() ?? null
    );
  }

  public findById(id: string): RequestRecord | null {
    return this.getById(id);
  }

  public getDetailById(id: string): RequestDetailRecord | null {
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

  public updateEditedContent(args: {
    id: string;
    editedContentMarkdown: string;
    isEdited: boolean;
    updatedAt: string;
  }): void {
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

  public markReviewed(args: MarkReviewedInput): RequestRecord {
    const existing = this.getById(args.id);
    if (!existing) {
      throw new Error(`Request ${args.id} was not found.`);
    }

    const reviewState: RequestReviewState =
      args.action === 'approve'
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
        isEdited:
          args.editedContentMarkdown !== existing.originalContentMarkdown,
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

  public updateForReview(args: UpdateForReviewInput): RequestRecord {
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

  public updateResumeStatus(args: UpdateResumeStatusInput): void {
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
