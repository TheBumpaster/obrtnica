"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo } from 'react';

import { ShellLayout } from '../../components/shell';
import { useAuth } from '../../context/auth-context';

function AppShell({ children }: { children: React.ReactNode }) {
  const { sessionStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const returnTo = useMemo(() => {
    const query = search?.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, search]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      const encoded = encodeURIComponent(returnTo || '/app');
      router.replace(`/login?returnTo=${encoded}`);
    }
  }, [sessionStatus, router, returnTo]);

  if (sessionStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  if (sessionStatus !== 'authenticated') {
    return null;
  }

  return <ShellLayout>{children}</ShellLayout>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading shell…
        </div>
      }
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
