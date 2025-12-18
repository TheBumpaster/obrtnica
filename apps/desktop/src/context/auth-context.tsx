"use client";

import { isUnauthorizedError, mapTrpcErrorToAuthError } from '@serp/auth-flow';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { createTrpcClient, type ApiClient } from '../lib/trpc';

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
};

type AuthState = {
  tokens: StoredTokens | null;
  client: ApiClient;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setTokens: (tokens: StoredTokens | null) => void;
  refreshTokens: () => Promise<StoredTokens | null>;
  loading: boolean;
  error?: string;
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';
  withAuth: <T>(op: (client: ApiClient) => Promise<T>) => Promise<T>;
};

const TOKEN_KEY = 'serp-desktop-tokens';
const AuthContext = createContext<AuthState | undefined>(undefined);

function loadTokens(): StoredTokens | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(TOKEN_KEY);
  return raw ? (JSON.parse(raw) as StoredTokens) : null;
}

function saveTokens(tokens: StoredTokens | null) {
  if (typeof window === 'undefined') return;
  if (tokens) {
    window.localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokensState] = useState<StoredTokens | null>(() => loadTokens());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>(
    tokens ? 'authenticated' : 'unauthenticated'
  );
  const refreshingRef = useRef(false);

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
      setTokensState(next);
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
    saveTokens(null);
    setTokensState(null);
    setSessionStatus('unauthenticated');
  }, []);

  const setTokens = useCallback((next: StoredTokens | null) => {
    saveTokens(next);
    setTokensState(next);
    setSessionStatus(next ? 'authenticated' : 'unauthenticated');
  }, []);

  const refreshTokens = useCallback(async () => {
    if (!tokens?.refreshToken || refreshingRef.current) return null;
    refreshingRef.current = true;
    try {
      const anonClient = createTrpcClient();
      const result = await anonClient.auth.refresh.mutate({ refreshToken: tokens.refreshToken });
      const next: StoredTokens = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresIn ? Date.now() + result.expiresIn * 1000 : undefined,
      };
      saveTokens(next);
      setTokensState(next);
      setSessionStatus('authenticated');
      return next;
    } catch (err) {
      logout();
      throw err;
    } finally {
      refreshingRef.current = false;
    }
  }, [logout, tokens?.refreshToken]);

  const withAuth = useCallback(
    async <T,>(op: (api: ApiClient) => Promise<T>): Promise<T> => {
      try {
        return await op(client);
      } catch (err) {
        const unauthorized = isUnauthorizedError(err);
        if (unauthorized && tokens?.refreshToken) {
          try {
            const refreshed = await refreshTokens();
            const nextClient = createTrpcClient(refreshed?.accessToken ?? loadTokens()?.accessToken);
            return await op(nextClient);
          } catch (refreshErr) {
            logout();
            throw refreshErr;
          }
        }
        throw err;
      }
    },
    [client, tokens?.refreshToken, refreshTokens, logout]
  );

  useEffect(() => {
    if (!tokens?.expiresAt) return;
    const refreshIn = Math.max(5_000, tokens.expiresAt - Date.now() - 60_000);
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
    setTokens,
    refreshTokens,
    loading,
    error,
    sessionStatus,
    withAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
