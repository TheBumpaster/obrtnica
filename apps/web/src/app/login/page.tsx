"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../context/auth-context';

function LoginForm() {
  const { login, loading, error, tokens, sessionStatus, withAuth } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [magicEmail, setMagicEmail] = useState('');
  const [tab, setTab] = useState<'password' | 'otp' | 'magic'>('password');
  const [info, setInfo] = useState<string | null>(null);
  const [otpRequested, setOtpRequested] = useState(false);

  const returnTo = useMemo(() => {
    const rt = search?.get('returnTo');
    return rt && rt.startsWith('/') ? decodeURIComponent(rt) : '/app';
  }, [search]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && tokens?.accessToken) {
      router.replace(returnTo);
    }
  }, [sessionStatus, tokens?.accessToken, router, returnTo]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (tab === 'password') {
      await login(email, password);
      router.replace(returnTo);
      return;
    }
    if (tab === 'otp') {
      if (!otpRequested) {
        setInfo(null);
        await withAuth((client) => client.auth.requestOtp.mutate({ identifier: otpIdentifier }));
        setOtpRequested(true);
        setInfo('OTP sent. Enter the code.');
      } else {
        await withAuth((client) => client.auth.verifyOtp.mutate({ identifier: otpIdentifier, code: otpCode }));
        router.replace(returnTo);
      }
      return;
    }
    if (tab === 'magic') {
      setInfo(null);
      await withAuth((client) => client.auth.requestMagicLink.mutate({ email: magicEmail }));
      setInfo('Magic link sent. Check your email.');
      return;
    }
  };

  if (sessionStatus === 'authenticated' && tokens?.accessToken) {
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
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setTab('password')}
              className={`px-2 py-1 rounded-md border ${tab === 'password' ? 'bg-accent text-accent-foreground' : 'border-input'}`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setTab('otp')}
              className={`px-2 py-1 rounded-md border ${tab === 'otp' ? 'bg-accent text-accent-foreground' : 'border-input'}`}
            >
              OTP
            </button>
            <button
              type="button"
              onClick={() => setTab('magic')}
              className={`px-2 py-1 rounded-md border ${tab === 'magic' ? 'bg-accent text-accent-foreground' : 'border-input'}`}
            >
              Magic link
            </button>
          </div>
        </div>
        {tab === 'password' && (
          <>
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
          </>
        )}
        {tab === 'otp' && (
          <>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Identifier (email or phone)</span>
              <input
                value={otpIdentifier}
                onChange={(e) => setOtpIdentifier(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                required
              />
            </label>
            {otpRequested ? (
              <label className="block space-y-1">
                <span className="text-sm font-medium">Code</span>
                <input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                />
              </label>
            ) : null}
          </>
        )}
        {tab === 'magic' && (
          <label className="block space-y-1">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              value={magicEmail}
              onChange={(e) => setMagicEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              required
            />
          </label>
        )}
        {error ? <p className="text-sm text-destructive">Error: {error}</p> : null}
        {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
