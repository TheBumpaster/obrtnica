import { z } from 'zod';

export const ulidSchema = z.string().length(26);
export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const timestampSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});
