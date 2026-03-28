import { z } from 'zod';

import { requestDetailSchema } from '../schemas/request.js';
import { submitReviewSchema } from '../schemas/review.js';

export const submitReviewResponseSchema = z.object({
  request: requestDetailSchema,
});

export const retryResumeResponseSchema = z.object({
  requestId: z.string().trim().min(1),
  publicId: z.string().trim().min(1),
  resumeStatus: z.enum(['pending', 'succeeded', 'failed']),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type SubmitReviewResponse = z.infer<typeof submitReviewResponseSchema>;
export type RetryResumeResponse = z.infer<typeof retryResumeResponseSchema>;
