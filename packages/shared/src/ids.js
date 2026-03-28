import { z } from 'zod';
const PUBLIC_ID_PREFIX = 'CR';
const PUBLIC_ID_PAD = 4;
export const requestIdSchema = z.string().trim().min(1);
export const reviewIdSchema = z.string().trim().min(1);
export const eventIdSchema = z.string().trim().min(1);
export const publicIdSchema = z
    .string()
    .trim()
    .regex(/^CR-\d{4,}$/);
export function formatPublicId(sequence) {
    return `${PUBLIC_ID_PREFIX}-${sequence.toString().padStart(PUBLIC_ID_PAD, '0')}`;
}
