"use client";

import type { PermissionId } from '@serp/core';
import { filterNavByPermissions, moduleCatalog, type NavigationNode } from '@serp/shell-core';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from './auth-context';
import { usePermissions } from './permission-context';

type Workspace = { id: string; name: string };

type IdentityState = {
  activeOrgId?: string;
  setActiveOrgId: (id: string | undefined) => void;
  workspaces: Workspace[];
  activeWorkspace?: Workspace;
  setWorkspace: (id: string | undefined) => void;
  navigation: (NavigationNode & { disabled?: boolean })[];
  hasPermission: (perm: PermissionId) => boolean;
};

const IdentityContext = createContext<IdentityState | undefined>(undefined);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const { tokens, withAuth } = useAuth();
  const { permissions } = usePermissions();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | undefined>('org-placeholder');
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!tokens?.accessToken) return;
      const result = await withAuth((client) => client.workspaces.listWorkspaces.query());
      if (!mounted) return;
      const ws = result.workspaces.map((w: { id: string; name: string }) => ({ id: w.id, name: w.name }));
      setWorkspaces(ws);
      if (!activeWorkspaceId && ws.length > 0) {
        setActiveWorkspaceId(ws[0].id);
      }
    }
    load().catch(() => {});
    return () => {
      mounted = false;
    };
  }, [withAuth, tokens?.accessToken, activeWorkspaceId]);

  const navigation = useMemo(
    () => filterNavByPermissions(moduleCatalog, permissions, { platform: 'web' }),
    [permissions]
  );

  const hasPermission = (perm: PermissionId) => permissions.has(perm);

  const value: IdentityState = {
    activeOrgId,
    setActiveOrgId,
    workspaces,
    activeWorkspace: workspaces.find((w) => w.id === activeWorkspaceId),
    setWorkspace: setActiveWorkspaceId,
    navigation,
    hasPermission,
  };

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) {
    throw new Error('useIdentity must be used within IdentityProvider');
  }
  return ctx;
}
