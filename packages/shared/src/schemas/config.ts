import { z } from 'zod';

export const configStatusSchema = z.object({
  databaseUrl: z.string(),
  openclawBaseUrl: z.string(),
  hasGatewayToken: z.boolean(),
  warnings: z.array(z.string()),
});

export type ConfigStatus = z.infer<typeof configStatusSchema>;
