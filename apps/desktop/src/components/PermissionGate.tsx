"use client";

import type { PermissionId } from '@serp/core';

import { usePermissions } from '../context/permission-context';

type Props = {
  permission?: PermissionId;
  permissions?: PermissionId[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function PermissionGate({ permission, permissions, fallback, children }: Props) {
  const { permissions: granted } = usePermissions();
  const required: PermissionId[] | undefined = permissions ?? (permission ? [permission] : undefined);
  const allowed = !required || required.some((perm) => granted.has(perm));

  if (!allowed) {
    return (
      fallback || (
        <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
          Not authorized ({required?.join(', ')}).
        </div>
      )
    );
  }
  return <>{children}</>;
}
