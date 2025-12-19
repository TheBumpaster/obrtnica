"use client";

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../context/auth-context';
import { AppShell } from '../../layouts/app-shell/app-shell';



function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { sessionStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted || sessionStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  if (sessionStatus !== 'authenticated') {
    return null;
  }

  return <AppShell>{children}</AppShell>;
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
      <AppShellLayout>{children}</AppShellLayout>
    </Suspense>
  );
}
