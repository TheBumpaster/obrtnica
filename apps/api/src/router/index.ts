import { router } from './base';
import { auditRouter } from './audit';
import { authRouter } from './auth';
import { emergencyAccessRouter } from './emergency-access';
import { gdprRouter } from './gdpr';
import { healthRouter } from './health';
import { metricsRouter } from './metrics';
import { notificationsRouter } from './notifications';
import { rbacRouter } from './rbac';
import { sampleRouter } from './sample';
import { tokensRouter } from './tokens';
import { workspacesRouter } from './workspaces';

export const appRouter = router({
  auth: authRouter,
  audit: auditRouter,
  emergencyAccess: emergencyAccessRouter,
  gdpr: gdprRouter,
  health: healthRouter,
  metrics: metricsRouter,
  notifications: notificationsRouter,
  rbac: rbacRouter,
  sample: sampleRouter,
  tokens: tokensRouter,
  workspaces: workspacesRouter,
});

export type AppRouter = typeof appRouter;

// Re-export base router utilities for convenience
export { publicProcedure, protectedProcedure, router } from './base';
