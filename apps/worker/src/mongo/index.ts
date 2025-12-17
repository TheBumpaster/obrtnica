import { createChildLogger } from '@serp/core';
import { MongoClient } from 'mongodb';

import { config } from '../config';

const logger = createChildLogger({ component: 'mongo-client' });

let client: MongoClient | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(config.MONGODB_URL);
    await client.connect();
    logger.info('Connected to MongoDB');
  }
  return client;
}

export async function closeMongoClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    logger.info('MongoDB connection closed');
  }
}

export async function ensureMongoIndexes(): Promise<void> {
  const mongoClient = await getMongoClient();
  const db = mongoClient.db();
  
  // Sample projections indexes
  const sampleCollection = db.collection('sample_projections');
  await sampleCollection.createIndex({ sampleId: 1 }, { unique: true });
  await sampleCollection.createIndex({ tenantId: 1 });
  await sampleCollection.createIndex({ createdAt: -1 });
  
  logger.info('MongoDB indexes created');
}
