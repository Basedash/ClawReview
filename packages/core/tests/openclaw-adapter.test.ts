import { describe, expect, it, vi } from 'vitest';

import type { RequestDetail, ReviewRecord } from '@clawreview/shared';

import { OpenClawHarnessAdapter } from '../src/adapters/openclaw-adapter.js';

function createRequest(): RequestDetail {
  const now = new Date().toISOString();

  return {
    id: 'req_1',
    publicId: 'CR-0001',
    title: 'Review draft',
    summary: 'Review summary',
    status: 'open',
    reviewState: 'pending',
    resumeStatus: 'not_requested',
    isEdited: false,
    sourceHarness: 'openclaw',
    sourceAgentId: 'agent-1',
    sourceAgentLabel: 'Planner',
    sourceWorkflowLabel: 'release',
    updatedAt: now,
    createdAt: now,
    closedAt: null,
    originalContentMarkdown: '# Original',
    editedContentMarkdown: '# Edited',
    sourceSessionKey: 'main',
    sourcePreviousResponseId: null,
    sourceGatewayBaseUrl: null,
    sourceUser: null,
    sourceMetadata: null,
    context: null,
    resumeError: null,
    lastResumeAttemptAt: null,
    lastResumeResponseId: null,
    reviews: [],
    events: [],
  };
}

function createReview(): ReviewRecord {
  return {
    id: 'rev_1',
    requestId: 'req_1',
    action: 'comment',
    commentText: 'Please revise',
    resumePayloadJson: null,
    submittedAt: new Date().toISOString(),
  };
}

describe('OpenClawHarnessAdapter', () => {
  it('builds a deterministic continuation message', () => {
    const adapter = new OpenClawHarnessAdapter({
      baseUrl: 'http://127.0.0.1:3456',
      gatewayToken: 'token',
    });

    const message = adapter.buildResumeMessage({
      request: createRequest(),
      review: {
        action: 'approve',
        commentText: 'Looks good',
      } as ReviewRecord,
    });

    expect(message).toContain('Human review result for request CR-0001');
    expect(message).toContain('Decision: approve');
    expect(message).toContain('# Edited');
    expect(message).toContain('# Original');
  });

  it('dispatches resume requests with routing headers', async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'resp_123', init }),
      } as unknown as Response;
    });

    const adapter = new OpenClawHarnessAdapter(
      {
        baseUrl: 'http://127.0.0.1:3456',
        gatewayToken: 'token',
      },
      fetcher as unknown as typeof fetch,
    );

    const result = await adapter.resumeReview(createRequest(), createReview());

    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://127.0.0.1:3456/v1/responses');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer token',
      'x-openclaw-agent-id': 'agent-1',
      'x-openclaw-session-key': 'main',
    });
    expect(result.responseId).toBe('resp_123');
  });
});
