import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildServer } from '../src/app.js';

describe('request APIs', () => {
  let app: ReturnType<typeof buildServer> | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('creates, lists, loads, and updates a request', async () => {
    app = buildServer({
      databaseUrl: ':memory:',
      openclawBaseUrl: 'http://127.0.0.1:3456',
      openclawGatewayToken: 'token',
      fetchFn: vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'resp_123' }),
      })) as unknown as typeof fetch,
    });

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/requests',
      payload: {
        title: 'Review release draft',
        summary: 'Check release notes',
        contentMarkdown: '# Draft',
        continuation: {
          agentId: 'agent-1',
          sessionKey: 'main',
        },
        source: {
          harness: 'openclaw',
          agentLabel: 'Planner',
        },
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json().request;
    expect(created.publicId).toBe('CR-0001');

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/requests?status=open',
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().requests).toHaveLength(1);

    const detailResponse = await app.inject({
      method: 'GET',
      url: `/api/requests/${created.id}`,
    });
    expect(detailResponse.statusCode).toBe(200);
    expect(detailResponse.json().request.title).toBe('Review release draft');

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/requests/${created.id}/content`,
      payload: {
        editedContentMarkdown: '# Edited',
      },
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().request.editedContentMarkdown).toBe('# Edited');
    expect(updateResponse.json().request.isEdited).toBe(true);
  });
});
