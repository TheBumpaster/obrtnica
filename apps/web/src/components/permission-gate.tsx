"use client";

import type { PermissionId } from '@serp/core';

import { usePermissions } from '../context/permission-context';

type PermissionGateProps = {
  permission?: PermissionId;
  permissions?: PermissionId[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function PermissionGate({ permission, permissions, children, fallback }: PermissionGateProps) {
  const { permissions: granted } = usePermissions();
  const required: PermissionId[] | undefined = permissions ?? (permission ? [permission] : undefined);
  const allowed = !required || required.some((perm) => granted.has(perm));

  if (!allowed) {
    return (
      fallback || (
        <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
          You do not have permission to view this section ({required?.join(', ')}).
        </div>
      )
    );
  }
  return <>{children}</>;
}
