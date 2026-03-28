import { z } from 'zod';
import { createReviewRequestSchema } from './request.js';
export const requestApprovalToolSchema = createReviewRequestSchema;
export const requestApprovalResultSchema = z.object({
    status: z.literal('pending_review'),
    requestId: z.string().trim().min(1),
    publicId: z.string().trim().min(1),
    message: z.string().trim().min(1),
});
