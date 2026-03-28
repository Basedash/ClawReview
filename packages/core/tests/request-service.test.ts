import { describe, expect, it } from 'vitest';

import { createCoreServices } from '../src/index.js';

describe('request service', () => {
  it('creates and loads a request detail record', () => {
    const services = createCoreServices({
      databaseUrl: ':memory:',
      openclawBaseUrl: 'http://127.0.0.1:3456',
      openclawGatewayToken: 'token',
    });

    const created = services.requestService.createRequest({
      title: 'Review release draft',
      summary: 'Check the release note',
      contentMarkdown: '# Draft',
      continuation: {
        agentId: 'agent-1',
        sessionKey: 'main',
      },
      source: {
        harness: 'openclaw',
        agentLabel: 'Planner',
        workflowLabel: 'release',
      },
    });

    const detail = services.requestService.getRequestById(created.id);

    expect(detail.publicId).toBe('CR-0001');
    expect(detail.title).toBe('Review release draft');
    expect(detail.events).toHaveLength(1);
    expect(detail.events[0]?.eventType).toBe('request.created');
    expect(detail.sourceAgentId).toBe('agent-1');
  });

  it('updates edited content and tracks edit events', () => {
    const services = createCoreServices({
      databaseUrl: ':memory:',
      openclawBaseUrl: 'http://127.0.0.1:3456',
      openclawGatewayToken: 'token',
    });

    const created = services.requestService.createRequest({
      title: 'Review copy',
      summary: '',
      contentMarkdown: 'Original',
      continuation: {
        agentId: 'agent-1',
        sessionKey: 'main',
      },
      source: {
        harness: 'openclaw',
      },
    });

    const updated = services.requestService.updateEditedContent(created.id, {
      editedContentMarkdown: 'Edited',
    });

    expect(updated.editedContentMarkdown).toBe('Edited');
    expect(updated.isEdited).toBe(true);
    expect(
      updated.events.some(
        (event) => event.eventType === 'request.content_edited',
      ),
    ).toBe(true);
  });
});
