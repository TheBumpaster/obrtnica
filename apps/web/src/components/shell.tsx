"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '../context/auth-context';
import { useIdentity } from '../context/identity-context';

export function ShellLayout({ children }: { children: React.ReactNode }) {
  const { tokens, logout } = useAuth();
  const { navigation, workspaces, activeWorkspace, setWorkspace, activeOrgId, setActiveOrgId } = useIdentity();
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (!tokens?.accessToken) {
      router.replace('/login');
    }
  }, [tokens?.accessToken, router]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-sidebar p-4">
        <div className="mb-6">
          <div className="text-sm text-muted-foreground">Organization</div>
          <select
            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1"
            value={activeOrgId || ''}
            onChange={(e) => setActiveOrgId(e.target.value)}
          >
            <option value={activeOrgId || ''}>{activeOrgId || 'Org (placeholder)'}</option>
          </select>
        </div>
        <div className="mb-6">
          <div className="text-sm text-muted-foreground">Workspace</div>
          <select
            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1"
            value={activeWorkspace?.id || ''}
            onChange={(e) => setWorkspace(e.target.value)}
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>
        <nav className="space-y-2">
          {navigation.map((node) => (
            <div key={node.id}>
              {node.children ? (
                <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{node.label}</div>
              ) : null}
              <ul className="space-y-1">
                {(node.children || [node]).map((child) => {
                  const active = pathname?.startsWith(child.route || '');
                  return (
                    <li key={child.id}>
                      <Link
                        className={`block rounded-md px-3 py-2 text-sm ${
                          active ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                        } ${child.disabled ? 'pointer-events-none opacity-50' : ''}`}
                        href={child.route || '#'}
                      >
                        {child.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mt-6 w-full rounded-md border border-input px-3 py-2 text-sm hover:bg-muted"
        >
          Sign out
        </button>
      </aside>
      <main className="flex-1">
        <header className="border-b border-border px-6 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Serp Admin Shell</div>
              <div className="text-lg font-semibold">Permission-driven workspace</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Global search (scaffold)"
                className="w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <button className="rounded-md border border-input px-3 py-2 text-sm hover:bg-muted" disabled>
                Notifications
              </button>
              <button
                className="rounded-md border border-input px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                {theme === 'light' ? 'Dark' : 'Light'} mode
              </button>
              <button
                onClick={logout}
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
