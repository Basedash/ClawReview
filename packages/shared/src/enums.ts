import { z } from 'zod';

export const requestStatusValues = ['open', 'closed'] as const;
export type RequestStatus = (typeof requestStatusValues)[number];
export const requestStatusSchema = z.enum(requestStatusValues);

export const requestReviewStateValues = [
  'pending',
  'approved',
  'commented',
  'rejected',
] as const;
export type RequestReviewState = (typeof requestReviewStateValues)[number];
export const requestReviewStateSchema = z.enum(requestReviewStateValues);

export const reviewActionValues = ['approve', 'comment', 'reject'] as const;
export type ReviewAction = (typeof reviewActionValues)[number];
export const reviewActionSchema = z.enum(reviewActionValues);

export const resumeStatusValues = [
  'not_requested',
  'pending',
  'succeeded',
  'failed',
] as const;
export type ResumeStatus = (typeof resumeStatusValues)[number];
export const resumeStatusSchema = z.enum(resumeStatusValues);

export const harnessTypeValues = ['openclaw'] as const;
export type HarnessType = (typeof harnessTypeValues)[number];
export const harnessTypeSchema = z.enum(harnessTypeValues);

export const requestEventActorValues = ['agent', 'human', 'system'] as const;
export type RequestEventActor = (typeof requestEventActorValues)[number];
export const requestEventActorSchema = z.enum(requestEventActorValues);

export const requestEventTypeValues = [
  'request.created',
  'request.content_edited',
  'review.submitted',
  'resume.dispatched',
  'resume.succeeded',
  'resume.failed',
] as const;
export type RequestEventType = (typeof requestEventTypeValues)[number];
export const requestEventTypeSchema = z.enum(requestEventTypeValues);

export const requestFilterStatusValues = ['open', 'closed', 'all'] as const;
export type RequestFilterStatus = (typeof requestFilterStatusValues)[number];
export const requestFilterStatusSchema = z.enum(requestFilterStatusValues);
