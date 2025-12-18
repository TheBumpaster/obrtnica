"use client";

import { mapTrpcErrorToAuthError } from '@serp/auth-flow';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { clearTokens, loadTokens, saveTokens, type StoredTokens } from '../lib/auth-storage';
import { createTrpcClient, type ApiClient } from '../lib/trpc';

type AuthState = {
  tokens: StoredTokens | null;
  client: ApiClient;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setTokens: (tokens: StoredTokens | null) => void;
  refreshTokens: () => Promise<void>;
  loading: boolean;
  error?: string;
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<StoredTokens | null>(() => loadTokens());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>(
    tokens ? 'authenticated' : 'unauthenticated'
  );

  const client = useMemo(() => createTrpcClient(tokens?.accessToken), [tokens?.accessToken]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(undefined);
    try {
      const anonClient = createTrpcClient();
      const result = await anonClient.auth.login.mutate({ email, password });
      const next: StoredTokens = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresIn ? Date.now() + result.expiresIn * 1000 : undefined,
      };
      saveTokens(next);
      setTokens(next);
      setSessionStatus('authenticated');
    } catch (err) {
      const mapped = mapTrpcErrorToAuthError(err);
      setError(mapped.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setTokens(null);
    setSessionStatus('unauthenticated');
  }, []);

  const refreshTokens = useCallback(async () => {
    if (!tokens?.refreshToken) return;
    try {
      const anonClient = createTrpcClient();
      const result = await anonClient.auth.refresh.mutate({ refreshToken: tokens.refreshToken });
      const next: StoredTokens = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresIn ? Date.now() + result.expiresIn * 1000 : undefined,
      };
      saveTokens(next);
      setTokens(next);
      setSessionStatus('authenticated');
    } catch (err) {
      logout();
      throw err;
    }
  }, [logout, tokens?.refreshToken]);

  useEffect(() => {
    const stored = loadTokens();
    if (stored && !tokens) {
      setTokens(stored);
      setSessionStatus('authenticated');
    }
    if (!stored && !tokens) {
      setSessionStatus('unauthenticated');
    }
  }, [tokens]);

  useEffect(() => {
    if (!tokens?.expiresAt) return;
    const now = Date.now();
    const refreshIn = Math.max(5_000, tokens.expiresAt - now - 60_000); // refresh 1m before expiry
    const id = setTimeout(() => {
      refreshTokens().catch(() => {});
    }, refreshIn);
    return () => clearTimeout(id);
  }, [tokens?.expiresAt, refreshTokens]);

  const value: AuthState = {
    tokens,
    client,
    login,
    logout,
    setTokens: (next) => {
      if (next) {
        saveTokens(next);
      } else {
        clearTokens();
      }
      setTokens(next);
      setSessionStatus(next ? 'authenticated' : 'unauthenticated');
    },
    refreshTokens,
    loading,
    error,
    sessionStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
