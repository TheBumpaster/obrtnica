"use client";

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { useAuth } from '../../context/auth-context';

export default function LoginPage() {
  const { login, loading, error, tokens } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login(email, password);
    router.replace('/app');
  };

  if (tokens?.accessToken) {
    router.replace('/app');
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm space-y-4"
      >
        <div>
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">Use your account credentials.</p>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            required
          />
        </label>
        {error ? <p className="text-sm text-destructive">Error: {error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
