import type {
  PermissionId,
  UserPermissions,
  AuthorizationContext,
} from '@serp/core';
import { requirePermission as coreRequirePermission, AuthorizationError } from '@serp/core';
import { TRPCError } from '@trpc/server';

import type { Context } from './context';

export interface AuthenticatedUser {
  userId: string;
  orgId: string;
  sessionId?: string;
  type: 'user';
}

export interface AuthenticatedService {
  serviceAccountId: string;
  orgId: string;
  type: 'service';
}

export type AuthenticatedPrincipal = AuthenticatedUser | AuthenticatedService;

// These will be injected by the API layer
type PermissionLoaderFn = (
  actorType: 'user' | 'service',
  actorId: string,
  orgId: string,
  workspaceId?: string
) => Promise<UserPermissions>;
type AuthContextBuilderFn = (
  actorType: 'user' | 'service',
  actorId: string,
  orgId: string,
  sessionId?: string,
  workspaceId?: string
) => Promise<AuthorizationContext>;

let permissionLoader: PermissionLoaderFn | null = null;
let authContextBuilder: AuthContextBuilderFn | null = null;

export function setPermissionLoader(loader: PermissionLoaderFn) {
  permissionLoader = loader;
}

export function setAuthContextBuilder(builder: AuthContextBuilderFn) {
  authContextBuilder = builder;
}

/**
 * Require authentication (user or service account)
 * Throws UNAUTHORIZED if not authenticated
 */
export function requireAuth(ctx: Context): AuthenticatedPrincipal {
  // Try new principal-based auth first
  if (ctx.principal) {
    if (ctx.principal.type === 'user') {
      return {
        userId: ctx.principal.userId,
        orgId: ctx.principal.orgId,
        sessionId: ctx.principal.sessionId,
        type: 'user',
      };
    } else {
      return {
        serviceAccountId: ctx.principal.serviceAccountId,
        orgId: ctx.principal.orgId,
        type: 'service',
      };
    }
  }

  // Fallback to legacy headers (for backward compatibility during migration)
  if (ctx.userId && ctx.orgId) {
    return {
      userId: ctx.userId,
      orgId: ctx.orgId,
      type: 'user',
    };
  }

  throw new TRPCError({
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
  });
}

/**
 * Require user authentication (not service account)
 * Throws UNAUTHORIZED if not a user or not authenticated
 */
export function requireUserAuth(ctx: Context): AuthenticatedUser {
  const principal = requireAuth(ctx);
  if (principal.type !== 'user') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'This action requires user authentication',
    });
  }
  return principal;
}

/**
 * Ensure the authenticated principal has access to the specified tenant
 */
export function scopeToTenant(ctx: Context, tenantId: string): AuthenticatedPrincipal {
  const auth = requireAuth(ctx);
  if (auth.orgId !== tenantId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Access denied to this tenant',
    });
  }
  return auth;
}

// Audit failure callback - set by API layer
type AuditFailureCallbackFn = (
  ctx: Context,
  auth: AuthenticatedPrincipal,
  permission: PermissionId,
  reason: string
) => Promise<void>;

let auditFailureCallback: AuditFailureCallbackFn | null = null;

export function setAuditFailureCallback(callback: AuditFailureCallbackFn) {
  auditFailureCallback = callback;
}

/**
 * Require a specific permission
 * Throws appropriate tRPC errors if permission is denied
 */
export async function requirePermission(
  ctx: Context,
  permission: PermissionId,
  workspaceId?: string
): Promise<void> {
  const auth = requireAuth(ctx);

  if (!permissionLoader || !authContextBuilder) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Permission system not initialized',
    });
  }

  // Build authorization context
  const authContext = await authContextBuilder(
    auth.type,
    auth.type === 'user' ? auth.userId : auth.serviceAccountId,
    auth.orgId,
    auth.type === 'user' ? auth.sessionId : undefined,
    workspaceId
  );

  // Load permissions based on actor type
  const actorId = auth.type === 'user' ? auth.userId : auth.serviceAccountId;
  const userPermissions = await permissionLoader(auth.type, actorId, auth.orgId, workspaceId);

  // Check permission using core authorization engine
  try {
    coreRequirePermission(authContext, permission, userPermissions);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      // Audit authorization failure
      if (auditFailureCallback) {
        await auditFailureCallback(ctx, auth, permission, error.message).catch((auditError) => {
          console.error('Failed to audit permission failure:', auditError);
        });
      }

      // Map AuthorizationError to tRPC errors
      if (error.code === 'MFA_REQUIRED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'MFA verification required',
        });
      } else if (error.code === 'STEP_UP_REQUIRED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Step-up authentication required',
        });
      } else if (error.code === 'FORBIDDEN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: error.message,
        });
      } else {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message,
        });
      }
    }
    throw error;
  }
}
