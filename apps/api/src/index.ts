import 'dotenv/config';

import cors from 'cors';
import express, { json } from 'express';

import { createExpressAdapter } from './adapters/express';
import { config } from './config';
import { appRouter } from './router';

const app = express();

app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(json());

// Health check endpoint (outside tRPC)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// tRPC endpoint
app.use('/trpc', createExpressAdapter(appRouter));

const port = parseInt(config.PORT, 10);
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
  console.log(`tRPC endpoint: http://localhost:${port}/trpc`);
});
