/**
 * Permission Catalog v1
 * Platform-owned, versioned permission definitions
 */

export type PermissionScope = 'platform' | 'org' | 'workspace' | 'self';

export interface Permission {
  id: string;
  scope: PermissionScope;
  description: string;
  requiresMfa?: boolean;
  requiresStepUp?: boolean;
  requiresJustification?: boolean;
  humanOnly?: boolean; // Cannot be granted to service accounts
  sensitive?: boolean; // Triggers audit logging
}

/**
 * Organization-level permissions
 */
export const OrgPermissions = {
  VIEW: {
    id: 'org.view',
    scope: 'org' as const,
    description: 'View organization details',
  },
  UPDATE: {
    id: 'org.update',
    scope: 'org' as const,
    description: 'Update organization settings',
  },
  SECURITY_MANAGE: {
    id: 'org.security.manage',
    scope: 'org' as const,
    description: 'Manage organization security policies',
    requiresMfa: true,
    requiresStepUp: true,
    sensitive: true,
  },
  AUDIT_READ: {
    id: 'org.audit.read',
    scope: 'org' as const,
    description: 'Read audit logs',
    sensitive: true,
  },
  MEMBERS_INVITE: {
    id: 'org.members.invite',
    scope: 'org' as const,
    description: 'Invite new members to organization',
  },
  MEMBERS_REMOVE: {
    id: 'org.members.remove',
    scope: 'org' as const,
    description: 'Remove members from organization',
  },
  MEMBERS_PERMISSIONS_ASSIGN: {
    id: 'org.members.permissions.assign',
    scope: 'org' as const,
    description: 'Assign roles and permissions to members',
    requiresMfa: true,
    sensitive: true,
  },
  WORKSPACES_CREATE: {
    id: 'org.workspaces.create',
    scope: 'org' as const,
    description: 'Create new workspaces',
  },
  WORKSPACES_ARCHIVE: {
    id: 'org.workspaces.archive',
    scope: 'org' as const,
    description: 'Archive workspaces',
  },
  BILLING_READ: {
    id: 'org.billing.read',
    scope: 'org' as const,
    description: 'View billing information',
  },
  BILLING_UPDATE: {
    id: 'org.billing.update',
    scope: 'org' as const,
    description: 'Update billing information',
    requiresStepUp: true,
    sensitive: true,
  },
  API_TOKENS_MANAGE: {
    id: 'org.api_tokens.manage',
    scope: 'org' as const,
    description: 'Create and revoke API tokens',
    requiresMfa: true,
    humanOnly: true,
    sensitive: true,
  },
  EMERGENCY_ACCESS_MANAGE: {
    id: 'org.emergency_access.manage',
    scope: 'org' as const,
    description: 'Activate or revoke emergency access',
    requiresMfa: true,
    requiresStepUp: true,
    requiresJustification: true,
    humanOnly: true,
    sensitive: true,
  },
} satisfies Record<string, Permission>;

/**
 * Workspace-level permissions
 */
export const WorkspacePermissions = {
  VIEW: {
    id: 'workspace.view',
    scope: 'workspace' as const,
    description: 'View workspace details',
  },
  UPDATE: {
    id: 'workspace.update',
    scope: 'workspace' as const,
    description: 'Update workspace settings',
  },
  DELETE: {
    id: 'workspace.delete',
    scope: 'workspace' as const,
    description: 'Delete workspace',
    requiresStepUp: true,
    sensitive: true,
  },
  MEMBERS_ASSIGN: {
    id: 'workspace.members.assign',
    scope: 'workspace' as const,
    description: 'Add or remove workspace members',
  },
  DATA_READ: {
    id: 'workspace.data.read',
    scope: 'workspace' as const,
    description: 'Read workspace data',
  },
  DATA_WRITE: {
    id: 'workspace.data.write',
    scope: 'workspace' as const,
    description: 'Create or update workspace data',
  },
  DATA_EXPORT: {
    id: 'workspace.data.export',
    scope: 'workspace' as const,
    description: 'Export workspace data',
    requiresMfa: true,
    requiresStepUp: true,
    sensitive: true,
  },
  POLICIES_ENFORCE: {
    id: 'workspace.policies.enforce',
    scope: 'workspace' as const,
    description: 'Configure workspace policies',
  },
} satisfies Record<string, Permission>;

/**
 * Self permissions (user's own data)
 */
export const SelfPermissions = {
  PROFILE_UPDATE: {
    id: 'self.profile.update',
    scope: 'self' as const,
    description: 'Update own profile',
  },
  MFA_MANAGE: {
    id: 'self.mfa.manage',
    scope: 'self' as const,
    description: 'Manage own MFA settings',
    humanOnly: true,
  },
  SESSIONS_MANAGE: {
    id: 'self.sessions.manage',
    scope: 'self' as const,
    description: 'Manage own sessions',
    humanOnly: true,
  },
} satisfies Record<string, Permission>;

/**
 * All permissions catalog
 */
const AllPermissions = [
  ...Object.values(OrgPermissions),
  ...Object.values(WorkspacePermissions),
  ...Object.values(SelfPermissions),
] as const;

/**
 * Permission ID type (for type safety)
 */
export type PermissionId = (typeof AllPermissions)[number]['id'];

/**
 * Permission catalog keyed by permission id to avoid collisions between domains
 */
export const PermissionsCatalog: Record<PermissionId, Permission> = AllPermissions.reduce(
  (acc, permission) => {
    acc[permission.id as PermissionId] = permission;
    return acc;
  },
  {} as Record<PermissionId, Permission>
);

/**
 * Get permission by ID
 */
export function getPermission(id: PermissionId): Permission | undefined {
  return PermissionsCatalog[id];
}

/**
 * Check if a permission ID is valid
 */
export function isValidPermission(id: string): id is PermissionId {
  return id in PermissionsCatalog;
}

/**
 * Get all permissions for a given scope
 */
export function getPermissionsByScope(scope: PermissionScope): Permission[] {
  return AllPermissions.filter((p) => p.scope === scope);
}

/**
 * Get all sensitive permissions
 */
export function getSensitivePermissions(): Permission[] {
  return AllPermissions.filter((p) => (p as Permission).sensitive);
}
