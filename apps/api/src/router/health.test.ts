import { describe, it, expect } from 'vitest';

import { appRouter } from './index';

describe('health router', () => {
  it('should return ok status', async () => {
    const caller = appRouter.createCaller({
      requestId: 'test-request',
    });
    const result = await caller.health.check();

    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeTruthy();
  });
});
