import { monotonicFactory } from 'ulidx';
import { formatPublicId } from '@clawreview/shared';
const nextUlid = monotonicFactory();
export function createId() {
    return nextUlid();
}
export function createRequestId() {
    return createId();
}
export function createReviewId() {
    return createId();
}
export function createEventId() {
    return createId();
}
export function createPublicId(sequence) {
    return formatPublicId(sequence);
}
