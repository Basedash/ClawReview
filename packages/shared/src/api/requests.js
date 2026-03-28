import { z } from 'zod';
import { listRequestsQuerySchema, requestDetailSchema, requestListItemSchema, updateRequestContentInputSchema, } from '../schemas/request.js';
export const listRequestsResponseSchema = z.object({
    requests: z.array(requestListItemSchema),
});
export const getRequestResponseSchema = z.object({
    request: requestDetailSchema,
});
export const updateRequestContentResponseSchema = z.object({
    request: requestDetailSchema,
});
