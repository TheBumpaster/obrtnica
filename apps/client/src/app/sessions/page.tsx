"use client";

import { listSessions, revokeSession } from "@serp/auth-flow";
import { Suspense, useCallback, useEffect, useState } from "react";

import { useAuth } from "../../context/auth-context";

type Session = { id: string; userAgent?: string; createdAt?: string; lastActiveAt?: string; current?: boolean };

function SessionsView() {
  const { withAuth } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await withAuth((client) => listSessions(client));
      setSessions((result as { sessions?: Session[] } | null)?.sessions || []);
    } catch (err) {
      setError("Could not load sessions.");
    } finally {
      setLoading(false);
    }
  }, [withAuth]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const handleRevoke = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await withAuth((client) => revokeSession(client, { sessionId: id }));
      await load();
    } catch (err) {
      setError("Could not revoke session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-start justify-center bg-background">
      <div className="w-full max-w-3xl space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold">Sessions</h1>
          <p className="text-sm text-muted-foreground">Revoke other sessions if needed.</p>
        </div>
        {error ? <div className="text-sm text-destructive">{error}</div> : null}
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
              <div>
                <div className="font-medium">{s.userAgent || "Session"}</div>
                <div className="text-muted-foreground">
                  Created {s.createdAt || "-"} · Last active {s.lastActiveAt || "-"}
                </div>
                {s.current ? <div className="text-xs text-foreground">Current session</div> : null}
              </div>
              <button
                className="rounded-md border border-input px-3 py-2 text-xs disabled:opacity-50"
                onClick={() => handleRevoke(s.id)}
                disabled={loading || s.current}
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function SessionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <SessionsView />
    </Suspense>
  );
}
