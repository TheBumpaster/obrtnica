import 'dotenv/config';

import { AuditEventTypes, buildAuditEvent, buildUserActor, DataCategories, DataClassifications } from '@serp/core';
import { setPermissionLoader, setAuthContextBuilder, setAuditFailureCallback } from '@serp/trpc';
import cors from 'cors';
import express, { json } from 'express';

import { createExpressAdapter } from './adapters/express';
import { enqueueAuditEvent } from './audit/audit.service';
import { config } from './config';
import { db } from './db';
import { appRouter } from './router';
import { PermissionLoader } from './services/permission-loader';

// Initialize permission system
const permissionLoader = new PermissionLoader(db);
setPermissionLoader(async (actorType, actorId, orgId, workspaceId) => {
  if (actorType === 'user') {
    if (workspaceId) {
      return await permissionLoader.buildUserPermissionsWithWorkspace(actorId, orgId, workspaceId);
    }
    return await permissionLoader.buildUserPermissions(actorId, orgId);
  }

  return await permissionLoader.buildServiceAccountPermissions(actorId, orgId);
});
setAuthContextBuilder((actorType, actorId, orgId, sessionId, workspaceId) =>
  permissionLoader.buildAuthorizationContext(actorType, actorId, orgId, sessionId, workspaceId)
);

// Initialize audit failure callback
setAuditFailureCallback(async (ctx, auth, permission, reason) => {
  const actor =
    auth.type === 'user'
      ? buildUserActor(auth.userId)
      : { type: 'SERVICE' as const, display: auth.serviceAccountId };

  const auditEvent = buildAuditEvent({
    eventType: AuditEventTypes.SECURITY_PERMISSION_DENIED,
    tenantId: auth.orgId,
    actor,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    requestId: ctx.requestId,
    correlationId: ctx.correlationId,
    action: 'PERMISSION_CHECK',
    status: 'FAILURE',
    reason,
    dataTag: {
      classification: DataClassifications.RESTRICTED,
      categories: [DataCategories.AUTH],
    },
    metadata: {
      requiredPermission: permission,
    },
  });

  await enqueueAuditEvent(db, auditEvent);
});

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
