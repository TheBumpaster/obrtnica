"use client";

import type { PermissionId } from '@serp/core';
import { createContext, useContext, useEffect, useState } from 'react';

import { useAuth } from './auth-context';

type PermissionState = {
  permissions: Set<PermissionId>;
  refresh: () => Promise<void>;
  loading: boolean;
};

const PermissionContext = createContext<PermissionState | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { tokens, withAuth } = useAuth();
  const [permissions, setPermissions] = useState<Set<PermissionId>>(new Set());
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    try {
      const result = await withAuth((client) => client.rbac.getMyPermissions.query());
      setPermissions(new Set(result.permissions as PermissionId[]));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.accessToken]);

  return (
    <PermissionContext.Provider value={{ permissions, refresh: load, loading }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return ctx;
}
