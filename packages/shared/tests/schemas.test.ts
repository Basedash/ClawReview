import { describe, expect, it } from 'vitest';

import {
  createReviewRequestSchema,
  formatPublicId,
  requestApprovalToolSchema,
  submitReviewSchema,
} from '../src/index.js';

describe('shared schemas', () => {
  it('accepts valid review request payloads', () => {
    const result = createReviewRequestSchema.safeParse({
      title: 'Review deployment plan',
      summary: 'Validate rollout steps',
      contentMarkdown: '# Plan\n\nShip it.',
      source: {
        harness: 'openclaw',
        agentLabel: 'OpenClaw Planner',
        workflowLabel: 'release-flow',
      },
      continuation: {
        agentId: 'agent-1',
        sessionKey: 'main',
      },
    });

    expect(result.success).toBe(true);
  });

  it('requires continuation metadata for MCP tool requests', () => {
    const result = requestApprovalToolSchema.safeParse({
      title: 'Need approval',
      contentMarkdown: 'Hello',
    });

    expect(result.success).toBe(false);
  });

  it('accepts comment review action with optional empty comment', () => {
    const result = submitReviewSchema.safeParse({
      action: 'comment',
      comment: '',
    });

    expect(result.success).toBe(true);
  });

  it('formats public request ids with a stable prefix', () => {
    expect(formatPublicId(12)).toBe('CR-0012');
  });
});
