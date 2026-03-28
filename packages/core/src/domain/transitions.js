import { DomainConflictError } from '../errors.js';
export function assertRequestIsOpen(status) {
    if (status !== 'open') {
        throw new DomainConflictError('REQUEST_CLOSED', 'This request is already closed.');
    }
}
export function assertRequestCanBeReviewed(input) {
    if (input.status !== 'open' || input.reviewState !== 'pending') {
        throw new DomainConflictError('ALREADY_REVIEWED', 'This request has already been reviewed.');
    }
}
export function determineEditedState(originalContentMarkdown, editedContentMarkdown) {
    return originalContentMarkdown !== editedContentMarkdown;
}
export function toReviewState(action) {
    switch (action) {
        case 'approve':
            return 'approved';
        case 'comment':
            return 'commented';
        case 'reject':
            return 'rejected';
    }
}
export function assertResumeRetryAllowed(status) {
    if (status !== 'failed') {
        throw new DomainConflictError('RESUME_RETRY_NOT_ALLOWED', 'Only failed resume attempts can be retried.');
    }
}
