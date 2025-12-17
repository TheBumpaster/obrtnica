import type { PermissionId } from './permissions';
import { getPermission } from './permissions';

export interface AuthorizationContext {
  actorType: 'user' | 'service';
  actorId: string;
  orgId: string;
  workspaceId?: string;
  hasMfa?: boolean;
  hasStepUp?: boolean;
  emergencyAccess?: boolean;
}

export interface UserPermissions {
  orgPermissions: Set<PermissionId>;
  workspacePermissions: Map<string, Set<PermissionId>>; // workspaceId -> permissions
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'MFA_REQUIRED' | 'STEP_UP_REQUIRED'
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Evaluate if an actor has a specific permission
 */
export function checkPermission(
  context: AuthorizationContext,
  requiredPermission: PermissionId,
  userPermissions: UserPermissions
): { granted: boolean; reason?: string } {
  const permission = getPermission(requiredPermission);
  if (!permission) {
    return { granted: false, reason: 'Unknown permission' };
  }

  // Check human-only constraint
  if (permission.humanOnly && context.actorType !== 'user') {
    return { granted: false, reason: 'Permission requires human actor' };
  }

  // Check MFA requirement
  if (permission.requiresMfa && !context.hasMfa && !context.emergencyAccess) {
    throw new AuthorizationError('MFA verification required', 'MFA_REQUIRED');
  }

  // Check step-up requirement
  if (permission.requiresStepUp && !context.hasStepUp && !context.emergencyAccess) {
    throw new AuthorizationError('Step-up authentication required', 'STEP_UP_REQUIRED');
  }

  // Check permission based on scope
  switch (permission.scope) {
    case 'org':
      return {
        granted: userPermissions.orgPermissions.has(requiredPermission),
        reason: userPermissions.orgPermissions.has(requiredPermission) ? undefined : 'Missing permission',
      };

    case 'workspace': {
      if (!context.workspaceId) {
        return { granted: false, reason: 'Workspace context required' };
      }
      const workspacePerms = userPermissions.workspacePermissions.get(context.workspaceId);
      return {
        granted: workspacePerms?.has(requiredPermission) ?? false,
        reason: workspacePerms?.has(requiredPermission) ? undefined : 'Missing workspace permission',
      };
    }

    case 'self':
      // Self permissions are implicitly granted to authenticated users
      return {
        granted: context.actorType === 'user',
        reason: context.actorType === 'user' ? undefined : 'Self permission requires user',
      };

    case 'platform':
      // Platform permissions are reserved for system operations
      return { granted: false, reason: 'Platform permissions not grantable' };

    default:
      return { granted: false, reason: 'Invalid permission scope' };
  }
}

/**
 * Require a permission or throw
 */
export function requirePermission(
  context: AuthorizationContext,
  requiredPermission: PermissionId,
  userPermissions: UserPermissions
): void {
  const result = checkPermission(context, requiredPermission, userPermissions);
  if (!result.granted) {
    throw new AuthorizationError(
      result.reason || 'Permission denied',
      context.hasMfa !== undefined ? 'FORBIDDEN' : 'UNAUTHORIZED'
    );
  }
}

/**
 * Check multiple permissions (AND logic)
 */
export function checkAllPermissions(
  context: AuthorizationContext,
  requiredPermissions: PermissionId[],
  userPermissions: UserPermissions
): { granted: boolean; reason?: string } {
  for (const perm of requiredPermissions) {
    const result = checkPermission(context, perm, userPermissions);
    if (!result.granted) {
      return result;
    }
  }
  return { granted: true };
}

/**
 * Check if user has any of the specified permissions (OR logic)
 */
export function checkAnyPermission(
  context: AuthorizationContext,
  requiredPermissions: PermissionId[],
  userPermissions: UserPermissions
): { granted: boolean; reason?: string } {
  for (const perm of requiredPermissions) {
    const result = checkPermission(context, perm, userPermissions);
    if (result.granted) {
      return { granted: true };
    }
  }
  return { granted: false, reason: 'None of the required permissions granted' };
}
