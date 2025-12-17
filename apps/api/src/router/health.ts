import { z } from 'zod';

import { publicProcedure, router } from './index';

export const healthRouter = router({
  check: publicProcedure
    .output(z.object({ status: z.string(), timestamp: z.string() }))
    .query(() => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    }),
});
