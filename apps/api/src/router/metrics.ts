import { metrics } from '@serp/core';
import { z } from 'zod';

import { publicProcedure, router } from './base';

export const metricsRouter = router({
  /**
   * Get metrics in Prometheus-compatible format
   */
  getMetrics: publicProcedure
    .output(z.string())
    .query(() => {
      return metrics.getMetrics();
    }),

  /**
   * Get metrics as JSON
   */
  getMetricsJson: publicProcedure
    .output(z.record(z.unknown()))
    .query(() => {
      return metrics.getMetricsJson();
    }),
});
