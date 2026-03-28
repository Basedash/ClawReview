import { z } from 'zod';
const rawRecordValueSchema = z.lazy(() => z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(rawRecordValueSchema),
    z.record(z.string(), rawRecordValueSchema),
]));
export const recordValueSchema = z.any().pipe(rawRecordValueSchema);
export const metadataRecordSchema = z.record(z.string(), recordValueSchema);
export const timestampSchema = z.string().datetime();
export const optionalStringSchema = z.string().trim().optional();
export const continuationContextSchema = z.object({
    agentId: z.string().trim().min(1),
    sessionKey: z.string().trim().min(1),
    previousResponseId: optionalStringSchema,
    gatewayBaseUrl: optionalStringSchema,
    user: optionalStringSchema,
    metadata: metadataRecordSchema.optional(),
});
