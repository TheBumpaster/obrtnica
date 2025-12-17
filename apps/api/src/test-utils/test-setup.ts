/**
 * Test utilities for integration tests
 */

import type { Context } from '@serp/trpc';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';

import type { Database } from '../db';
import { db, orgMemberships, orgs } from '../db';
import { appRouter } from '../router';

export interface TestContext extends Partial<Context> {
  requestId: string;
  correlationId: string;
  ip?: string;
  userAgent?: string;
}

export function createTestContext(overrides: Partial<TestContext> = {}): TestContext {
  return {
    requestId: ulid(),
    correlationId: ulid(),
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    ...overrides,
  };
}

export function createTestCaller(context: Partial<Context> = {}) {
  const ctx = createTestContext(context);
  return appRouter.createCaller(ctx as Context);
}

export function getTestDb(): Database {
  return db;
}

export async function cleanupTestData(db: Database, orgId: string) {
  // Helper to clean up test data
  // In a real setup, you might use transactions or a test database
  await db.delete(orgMemberships).where(eq(orgMemberships.orgId, orgId));
  await db.delete(orgs).where(eq(orgs.id, orgId));
}
