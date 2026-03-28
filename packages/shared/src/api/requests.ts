import { z } from 'zod';

import {
  listRequestsQuerySchema,
  requestDetailSchema,
  requestListItemSchema,
  updateRequestContentInputSchema,
} from '../schemas/request.js';

export const listRequestsResponseSchema = z.object({
  requests: z.array(requestListItemSchema),
});

export const getRequestResponseSchema = z.object({
  request: requestDetailSchema,
});

export const updateRequestContentResponseSchema = z.object({
  request: requestDetailSchema,
});

export type ListRequestsQuery = z.infer<typeof listRequestsQuerySchema>;
export type ListRequestsResponse = z.infer<typeof listRequestsResponseSchema>;
export type GetRequestResponse = z.infer<typeof getRequestResponseSchema>;
export type UpdateRequestContentInput = z.infer<
  typeof updateRequestContentInputSchema
>;
export type UpdateRequestContentResponse = z.infer<
  typeof updateRequestContentResponseSchema
>;
