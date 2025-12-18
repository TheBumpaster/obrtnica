"use client";

import { canWrite } from '@serp/shell-core';
import { useEffect, useMemo, useState } from 'react';

import { PermissionGate } from './components/PermissionGate';
import { ShellLayout } from './components/shell/ShellLayout';
import { useAuth } from './context/auth-context';
import { useIdentity } from './context/identity-context';
import { usePermissions } from './context/permission-context';
import { Providers } from './providers';

function ShellOrLogin() {
  const { tokens, login, loading, error } = useAuth();
  const { navigation } = useIdentity();
  const { permissions } = usePermissions();
  const [activeRoute, setActiveRoute] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [initialRoute] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const rt = params.get('returnTo');
    return rt && rt.startsWith('/app') ? rt : null;
  });

  useEffect(() => {
    if (activeRoute) return;
    if (initialRoute) {
      setActiveRoute(initialRoute);
      return;
    }
    if (navigation.length > 0) {
      const first = navigation.flatMap((n) => n.children || [n]).find((child) => child.route);
      setActiveRoute(first?.route || null);
    }
  }, [navigation, activeRoute, initialRoute]);

  const writeEnabled = useMemo(() => canWrite(permissions), [permissions]);

  if (!tokens?.accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="w-full max-w-md space-y-4 rounded-md border border-border bg-card p-6 shadow-sm">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Desktop Shell</div>
            <h1 className="text-xl font-semibold">Sign in</h1>
          </div>
          <div className="space-y-2">
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="w-full rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
              onClick={() => login(email, password)}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            {error ? <div className="text-sm text-destructive">{error}</div> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ShellLayout onNavigate={setActiveRoute} activeRoute={activeRoute}>
      <ModuleHost activeRoute={activeRoute} writeEnabled={writeEnabled} />
    </ShellLayout>
  );
}

function ModuleHost({ activeRoute, writeEnabled }: { activeRoute: string | null; writeEnabled: boolean }) {
  if (!activeRoute) {
    return <div className="text-sm text-muted-foreground">Select a module from the navigation.</div>;
  }

  if (activeRoute.startsWith('/app/projects')) {
    return (
      <PermissionGate permission="workspace.data.read">
        <div className="space-y-3">
          <div className="text-lg font-semibold">Projects</div>
          <button
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
            disabled={!writeEnabled}
          >
            New project (disabled without write)
          </button>
          <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
            Placeholder project table will render here.
          </div>
        </div>
      </PermissionGate>
    );
  }

  if (activeRoute.startsWith('/app/documents')) {
    return (
      <PermissionGate permission="workspace.data.read">
        <div className="space-y-3">
          <div className="text-lg font-semibold">Documents</div>
          <button
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
            disabled={!writeEnabled}
          >
            Upload (disabled without write)
          </button>
          <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
            Placeholder documents list will render here.
          </div>
        </div>
      </PermissionGate>
    );
  }

  if (activeRoute.startsWith('/app/governance/roles')) {
    return (
      <PermissionGate permission="org.members.permissions.assign">
        <div className="space-y-3">
          <div className="text-lg font-semibold">Roles & Permissions</div>
          <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
            Placeholder for roles management (read-only scaffold).
          </div>
        </div>
      </PermissionGate>
    );
  }

  if (activeRoute.startsWith('/app/governance/audit')) {
    return (
      <PermissionGate permission="org.audit.read">
        <div className="space-y-3">
          <div className="text-lg font-semibold">Audit Logs</div>
          <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
            Placeholder audit viewer. Classification badges will render once wired.
          </div>
        </div>
      </PermissionGate>
    );
  }

  return (
    <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
      Route not implemented yet.
    </div>
  );
}

function App() {
  return (
    <Providers>
      <ShellOrLogin />
    </Providers>
  );
}

export default App;
