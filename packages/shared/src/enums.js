import { z } from 'zod';
export const requestStatusValues = ['open', 'closed'];
export const requestStatusSchema = z.enum(requestStatusValues);
export const requestReviewStateValues = [
    'pending',
    'approved',
    'commented',
    'rejected',
];
export const requestReviewStateSchema = z.enum(requestReviewStateValues);
export const reviewActionValues = ['approve', 'comment', 'reject'];
export const reviewActionSchema = z.enum(reviewActionValues);
export const resumeStatusValues = [
    'not_requested',
    'pending',
    'succeeded',
    'failed',
];
export const resumeStatusSchema = z.enum(resumeStatusValues);
export const harnessTypeValues = ['openclaw'];
export const harnessTypeSchema = z.enum(harnessTypeValues);
export const requestEventActorValues = ['agent', 'human', 'system'];
export const requestEventActorSchema = z.enum(requestEventActorValues);
export const requestEventTypeValues = [
    'request.created',
    'request.content_edited',
    'review.submitted',
    'resume.dispatched',
    'resume.succeeded',
    'resume.failed',
];
export const requestEventTypeSchema = z.enum(requestEventTypeValues);
export const requestFilterStatusValues = ['open', 'closed', 'all'];
export const requestFilterStatusSchema = z.enum(requestFilterStatusValues);
