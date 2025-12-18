export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
};

const STORAGE_KEY = 'serp.auth.tokens';

export function loadTokens(): StoredTokens | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: StoredTokens) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
