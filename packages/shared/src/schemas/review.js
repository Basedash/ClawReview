import { z } from 'zod';
import { reviewActionSchema } from '../enums.js';
import { requestDetailSchema } from './request.js';
export const submitReviewSchema = z.object({
    action: reviewActionSchema,
    comment: z.string().trim().max(5_000).optional().default(''),
    editedContentMarkdown: z.string().min(1).optional(),
});
export const reviewDetailSchema = z.object({
    request: requestDetailSchema,
});
