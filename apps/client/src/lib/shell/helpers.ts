import type { PermissionId } from '@serp/core';

import type { NavigationNode, PermissionSet } from './types';

const DEFAULT_WRITE_PERMISSION = 'workspace.data.write' as PermissionId;

export function hasAny(required: PermissionId[] | undefined, granted: PermissionSet): boolean {
  if (!required || required.length === 0) {
    return true;
  }
  return required.some((perm) => granted.has(perm));
}

export function hasAll(required: PermissionId[] | undefined, granted: PermissionSet): boolean {
  if (!required || required.length === 0) {
    return true;
  }
  return required.every((perm) => granted.has(perm));
}

export function guardRoute(granted: PermissionSet, required?: PermissionId[]) {
  return { allowed: hasAny(required, granted) };
}

export function canWrite(
  granted: PermissionSet,
  node?: Pick<NavigationNode, 'disabledWhenMissing'>,
  defaultWritePermission: PermissionId = DEFAULT_WRITE_PERMISSION
) {
  const required = node?.disabledWhenMissing?.length
    ? node.disabledWhenMissing
    : [defaultWritePermission];
  return hasAny(required, granted);
}
