import { monotonicFactory } from 'ulidx';

import { formatPublicId } from '@clawreview/shared';

const nextUlid = monotonicFactory();

export function createId(): string {
  return nextUlid();
}

export function createRequestId(): string {
  return createId();
}

export function createReviewId(): string {
  return createId();
}

export function createEventId(): string {
  return createId();
}

export function createPublicId(sequence: number): string {
  return formatPublicId(sequence);
}
