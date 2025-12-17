import { z } from 'zod';

export const sampleCreateInputSchema = z.object({
  data: z.string().min(1, 'data is required'),
});

export const sampleCreateOutputSchema = z.object({
  id: z.string(),
  data: z.string(),
});

export const sampleListOutputSchema = z.array(
  z.object({
    id: z.string(),
    data: z.string(),
  })
);
