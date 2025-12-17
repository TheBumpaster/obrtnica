import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string(),
  RABBITMQ_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.string().default('info'),
});

export const config = configSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || process.env.API_PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  RABBITMQ_URL: process.env.RABBITMQ_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  LOG_LEVEL: process.env.LOG_LEVEL,
});
