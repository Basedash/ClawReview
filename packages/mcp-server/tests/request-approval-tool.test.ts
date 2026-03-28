import { describe, expect, it } from 'vitest';

import { createApprovalServer } from '../src/server.js';

describe('request approval MCP tool', () => {
  it('creates a review request and returns a pending_review result', async () => {
    const { services, callRequestApproval } = createApprovalServer({
      databaseUrl: ':memory:',
      openclawBaseUrl: 'http://127.0.0.1:3456',
      openclawGatewayToken: 'token',
    });

    const result = await callRequestApproval({
      title: 'Review summary',
      summary: 'Need eyes on this draft',
      contentMarkdown: '# Draft',
      continuation: {
        agentId: 'agent-1',
        sessionKey: 'main',
      },
      source: {
        harness: 'openclaw',
        agentLabel: 'Planner',
      },
    });

    expect(result.status).toBe('pending_review');
    expect(result.publicId).toBe('CR-0001');

    const detail = services.requestService.getRequestById(result.requestId);
    expect(detail.title).toBe('Review summary');
    expect(detail.events[0]?.eventType).toBe('request.created');
  });
});
