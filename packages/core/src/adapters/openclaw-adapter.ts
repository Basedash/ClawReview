import type { ConfigStatus, RequestDetail, ReviewRecord } from '@clawreview/shared';

import type {
  HarnessAdapter,
  ResumeReviewResult,
  ReviewResumePayload,
} from './harness-adapter.js';
import { OpenClawClient, type OpenClawResumeRequest } from '../integrations/openclaw-client.js';

export interface OpenClawAdapterConfig {
  baseUrl: string;
  gatewayToken: string;
}

export class OpenClawHarnessAdapter implements HarnessAdapter {
  public readonly harnessType = 'openclaw' as const;

  private readonly client: OpenClawClient;

  public constructor(
    private readonly config: OpenClawAdapterConfig,
    fetchFn?: typeof fetch,
  ) {
    this.client = new OpenClawClient(
      {
        baseUrl: config.baseUrl,
        gatewayToken: config.gatewayToken,
      },
      fetchFn,
    );
  }

  public getConfigStatus(): ConfigStatus {
    const warnings =
      this.config.gatewayToken.trim().length > 0
        ? []
        : ['OPENCLAW_GATEWAY_TOKEN is not configured.'];

    return {
      databaseUrl: '',
      openclawBaseUrl: this.config.baseUrl,
      hasGatewayToken: this.config.gatewayToken.trim().length > 0,
      warnings,
    };
  }

  public buildResumeMessage({
    request,
    review,
  }: {
    request: Pick<
      RequestDetail,
      'publicId' | 'summary' | 'originalContentMarkdown' | 'editedContentMarkdown'
    >;
    review: Pick<ReviewRecord, 'action' | 'commentText'>;
  }): string {
    return [
      `Human review result for request ${request.publicId}`,
      `Decision: ${review.action}`,
      'Reviewer comment:',
      review.commentText ?? '(none)',
      '',
      'Edited content:',
      request.editedContentMarkdown,
      '',
      'Original content:',
      request.originalContentMarkdown,
      '',
      'Summary:',
      request.summary || '(none)',
      '',
      'Please continue the workflow using this review result as authoritative human feedback.',
    ].join('\n');
  }

  public buildResumePayload(
    request: RequestDetail,
    review: Pick<ReviewRecord, 'action' | 'commentText'>,
  ): ReviewResumePayload {
    const message = this.buildResumeMessage({ request, review });

    return {
      requestId: request.id,
      publicId: request.publicId,
      title: request.title,
      summary: request.summary,
      sourceHarness: request.sourceHarness,
      action: review.action,
      commentText: review.commentText ?? '',
      editedContentMarkdown: request.editedContentMarkdown,
      originalContentMarkdown: request.originalContentMarkdown,
      agentId: request.sourceAgentId,
      sessionKey: request.sourceSessionKey,
      previousResponseId: request.sourcePreviousResponseId || undefined,
      gatewayBaseUrl: request.sourceGatewayBaseUrl || undefined,
      user: request.sourceUser || undefined,
      message,
    };
  }

  public async resumeReview(
    request: RequestDetail,
    review: ReviewRecord,
  ): Promise<ResumeReviewResult> {
    const payload = this.buildResumePayload(request, review);
    const requestBody: OpenClawResumeRequest = {
      agentId: payload.agentId,
      sessionKey: payload.sessionKey,
      previousResponseId: payload.previousResponseId,
      user: payload.user,
      gatewayBaseUrl: payload.gatewayBaseUrl,
      message: payload.message,
    };

    const response = await this.client.resumeSession(requestBody);

    return {
      requestBody: {
        ...requestBody,
      },
      responseId: response.responseId,
      rawResponse: response.rawResponse,
    };
  }
}
