import { describe, expect, it } from 'vitest';

import {
  assertRequestIsOpen,
  assertResumeRetryAllowed,
  determineEditedState,
  toReviewState,
} from '../src/domain/transitions.js';
import { DomainError } from '../src/errors.js';

describe('transition helpers', () => {
  it('allows open requests to be edited', () => {
    expect(() => assertRequestIsOpen('open')).not.toThrow();
  });

  it('rejects edits for closed requests', () => {
    expect(() => assertRequestIsOpen('closed')).toThrow(DomainError);
  });

  it('maps review actions to request review state', () => {
    expect(toReviewState('approve')).toBe('approved');
    expect(toReviewState('comment')).toBe('commented');
    expect(toReviewState('reject')).toBe('rejected');
  });

  it('detects whether content changed', () => {
    expect(determineEditedState('# A', '# A')).toBe(false);
    expect(determineEditedState('# A', '# B')).toBe(true);
  });

  it('only allows retry for failed resumes', () => {
    expect(() => assertResumeRetryAllowed('failed')).not.toThrow();
    expect(() => assertResumeRetryAllowed('pending')).toThrow(DomainError);
  });
});
