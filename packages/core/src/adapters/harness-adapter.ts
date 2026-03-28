import type { RequestDetail, ReviewRecord } from '@clawreview/shared';

export interface ReviewResumePayload {
  requestId: string;
  publicId: string;
  title: string;
  summary: string;
  action: ReviewRecord['action'];
  commentText: string;
  originalContentMarkdown: string;
  editedContentMarkdown: string;
  sourceHarness: RequestDetail['sourceHarness'];
  agentId: string;
  sessionKey: string;
  previousResponseId?: string;
  gatewayBaseUrl?: string;
  user?: string;
  message: string;
}

export interface ResumeReviewResult {
  requestBody: Record<string, unknown>;
  responseId?: string;
  rawResponse: unknown;
}

export interface HarnessAdapter {
  readonly harnessType: 'openclaw';
  buildResumePayload(
    request: RequestDetail,
    review: ReviewRecord,
  ): ReviewResumePayload;
  resumeReview(
    request: RequestDetail,
    review: ReviewRecord,
  ): Promise<ResumeReviewResult>;
}
