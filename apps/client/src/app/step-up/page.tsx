"use client";

import { Suspense, useState } from "react";

import { stepUpAuth } from "@/lib/auth";

import { useAuth } from "../../context/auth-context";

function StepUpForm() {
  const { withAuth } = useAuth();
  const [credential, setCredential] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await withAuth((client) => stepUpAuth(client, { credential, method: "password" }));
      setMessage("Step-up successful.");
    } catch (err) {
      setError("Step-up failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold">Step-up authentication</h1>
          <p className="text-sm text-muted-foreground">Re-authenticate to proceed with a sensitive action.</p>
        </div>
        <input
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          placeholder="Password / code"
          value={credential}
          onChange={(e) => setCredential(e.target.value)}
          required
        />
        {message ? <div className="text-sm text-foreground">{message}</div> : null}
        {error ? <div className="text-sm text-destructive">{error}</div> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </main>
  );
}

export default function StepUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <StepUpForm />
    </Suspense>
  );
}
