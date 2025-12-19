"use client";

import { useEffect, useState } from 'react';

import { useAuth } from '@/context/auth-context';

import { AppSidebar } from './app-sidebar';
import { TopNav } from './top-nav';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={logout} />
        <div className="flex min-h-screen flex-1 flex-col">
          <TopNav onMenu={() => setSidebarOpen(true)} onLogout={logout} />
          <main className="flex-1 px-4 pb-10 pt-6 md:px-8 lg:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
