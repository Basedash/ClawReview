import type { RequestDetail, SubmitReviewInput } from '@clawreview/shared';

import type { HarnessAdapter } from '../adapters/harness-adapter.js';
import {
  assertRequestCanBeReviewed,
  assertResumeRetryAllowed,
  determineEditedState,
  toReviewState,
} from '../domain/transitions.js';
import { DomainError } from '../errors.js';
import type { EventRepository } from '../repositories/event-repository.js';
import type { RequestRepository } from '../repositories/request-repository.js';
import type { ReviewRepository } from '../repositories/review-repository.js';
import { createEventId, createReviewId } from '../utils/ids.js';
import { nowIso } from '../utils/time.js';

function toNullableComment(comment: string): string | null {
  return comment.trim().length > 0 ? comment : null;
}

function toRequestDetail(input: ReturnType<RequestRepository['getDetailById']>): RequestDetail {
  if (!input) {
    throw new DomainError('NOT_FOUND', 'Request could not be loaded.', 404);
  }

  return {
    id: input.id,
    publicId: input.publicId,
    title: input.title,
    summary: input.summary,
    status: input.status,
    reviewState: input.reviewState,
    resumeStatus: input.resumeStatus,
    isEdited: Boolean(input.isEdited),
    sourceHarness: input.sourceHarness,
    sourceAgentId: input.sourceAgentId,
    sourceAgentLabel: input.sourceAgentLabel,
    sourceWorkflowLabel: input.sourceWorkflowLabel,
    updatedAt: input.updatedAt,
    createdAt: input.createdAt,
    closedAt: input.closedAt,
    originalContentMarkdown: input.originalContentMarkdown,
    editedContentMarkdown: input.editedContentMarkdown,
    sourceSessionKey: input.sourceSessionKey,
    sourcePreviousResponseId: input.sourcePreviousResponseId,
    sourceGatewayBaseUrl: input.sourceGatewayBaseUrl,
    sourceUser: input.sourceUser,
    sourceMetadata:
      input.sourceMetadataJson === null
        ? null
        : (JSON.parse(input.sourceMetadataJson) as Record<string, unknown>),
    context:
      input.contextJson === null
        ? null
        : (JSON.parse(input.contextJson) as Record<string, unknown>),
    resumeError: input.resumeError,
    lastResumeAttemptAt: input.lastResumeAttemptAt,
    lastResumeResponseId: input.lastResumeResponseId,
    reviews: input.reviews.map((review) => ({
      id: review.id,
      requestId: review.requestId,
      action: review.action,
      commentText: review.commentText,
      resumePayloadJson:
        review.resumePayloadJson === null
          ? null
          : (JSON.parse(review.resumePayloadJson) as Record<string, unknown>),
      submittedAt: review.submittedAt,
    })),
    events: input.events.map((event) => ({
      id: event.id,
      requestId: event.requestId,
      eventType: event.eventType,
      actorType: event.actorType,
      payload:
        event.payloadJson === null
          ? null
          : (JSON.parse(event.payloadJson) as Record<string, unknown>),
      createdAt: event.createdAt,
    })),
  };
}

export class ReviewService {
  public constructor(
    private readonly requestRepository: RequestRepository,
    private readonly reviewRepository: ReviewRepository,
    private readonly eventRepository: EventRepository,
    private readonly harnessAdapter: HarnessAdapter,
  ) {}

  public async submitReview(
    requestId: string,
    input: SubmitReviewInput,
  ): Promise<RequestDetail> {
    const existing = this.requestRepository.getDetailById(requestId);
    if (!existing) {
      throw new DomainError('NOT_FOUND', `Request ${requestId} was not found.`, 404);
    }

    assertRequestCanBeReviewed({
      status: existing.status,
      reviewState: existing.reviewState,
    });

    const editedContentMarkdown =
      input.editedContentMarkdown ?? existing.editedContentMarkdown;
    const submittedAt = nowIso();

    this.requestRepository.updateForReview({
      id: requestId,
      editedContentMarkdown,
      isEdited: determineEditedState(
        existing.originalContentMarkdown,
        editedContentMarkdown,
      ),
      reviewState: toReviewState(input.action),
      status: 'closed',
      resumeStatus: 'pending',
      closedAt: submittedAt,
      updatedAt: submittedAt,
      lastResumeAttemptAt: submittedAt,
      resumeError: null,
    });

    const review = this.reviewRepository.create({
      id: createReviewId(),
      requestId,
      action: input.action,
      commentText: toNullableComment(input.comment),
      resumePayloadJson: null,
      submittedAt,
    });

    this.eventRepository.create({
      id: createEventId(),
      requestId,
      eventType: 'review.submitted',
      actorType: 'human',
      payloadJson: JSON.stringify({
        action: input.action,
        comment: input.comment,
      }),
      createdAt: submittedAt,
    });

    return this.dispatchResume(requestId, review.id);
  }

  public async retryResume(requestId: string): Promise<RequestDetail> {
    const existing = this.requestRepository.getDetailById(requestId);
    if (!existing) {
      throw new DomainError('NOT_FOUND', `Request ${requestId} was not found.`, 404);
    }

    assertResumeRetryAllowed(existing.resumeStatus);

    const latestReview = this.reviewRepository.latestForRequest(requestId);
    if (!latestReview) {
      throw new DomainError(
        'MISSING_REVIEW',
        `Request ${requestId} cannot be resumed without a review.`,
        400,
      );
    }

    return this.dispatchResume(requestId, latestReview.id);
  }

  private async dispatchResume(
    requestId: string,
    reviewId: string,
  ): Promise<RequestDetail> {
    const request = this.requestRepository.getDetailById(requestId);
    const review = this.reviewRepository.findById(reviewId);

    if (!request || !review) {
      throw new DomainError('NOT_FOUND', 'Request or review could not be loaded.', 404);
    }

    const attemptedAt = nowIso();

    this.requestRepository.updateResumeStatus({
      id: requestId,
      resumeStatus: 'pending',
      resumeError: null,
      lastResumeAttemptAt: attemptedAt,
      lastResumeResponseId: null,
      updatedAt: attemptedAt,
    });

    this.eventRepository.create({
      id: createEventId(),
      requestId,
      eventType: 'resume.dispatched',
      actorType: 'system',
      payloadJson: null,
      createdAt: attemptedAt,
    });

    try {
      const result = await this.harnessAdapter.resumeReview(
        toRequestDetail(request),
        {
          id: review.id,
          requestId: review.requestId,
          action: review.action,
          commentText: review.commentText,
          resumePayloadJson: null,
          submittedAt: review.submittedAt,
        },
      );
      const succeededAt = nowIso();

      this.requestRepository.updateResumeStatus({
        id: requestId,
        resumeStatus: 'succeeded',
        resumeError: null,
        lastResumeAttemptAt: attemptedAt,
        lastResumeResponseId: result.responseId ?? null,
        updatedAt: succeededAt,
      });

      this.reviewRepository.attachResumePayload(
        reviewId,
        JSON.stringify(result.requestBody),
      );

      this.eventRepository.create({
        id: createEventId(),
        requestId,
        eventType: 'resume.succeeded',
        actorType: 'system',
        payloadJson: JSON.stringify({
          responseId: result.responseId ?? null,
        }),
        createdAt: succeededAt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Resume failed.';
      const failedAt = nowIso();

      this.requestRepository.updateResumeStatus({
        id: requestId,
        resumeStatus: 'failed',
        resumeError: message,
        lastResumeAttemptAt: attemptedAt,
        lastResumeResponseId: null,
        updatedAt: failedAt,
      });

      this.eventRepository.create({
        id: createEventId(),
        requestId,
        eventType: 'resume.failed',
        actorType: 'system',
        payloadJson: JSON.stringify({
          error: message,
        }),
        createdAt: failedAt,
      });
    }

    return toRequestDetail(this.requestRepository.getDetailById(requestId));
  }
}
