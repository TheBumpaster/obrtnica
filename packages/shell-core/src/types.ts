import type { PermissionId } from '@serp/core';

export type Platform = 'web' | 'desktop' | 'mobile';

export type NavigationNode = {
  id: string;
  label: string;
  route?: string;
  icon?: string;
  requiredPermissions?: PermissionId[];
  children?: NavigationNode[];
  disabledWhenMissing?: PermissionId[];
  disabled?: boolean;
  platforms?: Platform[];
};

export type PermissionSet = Set<PermissionId>;

export type ModuleId =
  | 'accounting'
  | 'projects'
  | 'documents'
  | 'inventory'
  | 'hr'
  | 'analytics'
  | 'governance';

export type RouteId =
  | 'accounting.home'
  | 'projects.home'
  | 'documents.home'
  | 'inventory.home'
  | 'hr.home'
  | 'analytics.home'
  | 'governance.org'
  | 'governance.workspaces'
  | 'governance.roles'
  | 'governance.security'
  | 'governance.api'
  | 'governance.audit'
  | 'governance.compliance'
  | 'governance.billing';
