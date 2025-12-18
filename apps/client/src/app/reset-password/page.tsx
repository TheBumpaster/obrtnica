"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

import { resetPassword } from "@/lib/auth";

import { createTrpcClient } from "../../lib/trpc";

function ResetForm() {
  const search = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => search?.get("token") || "", [search]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const client = createTrpcClient();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await resetPassword(client, { token, newPassword: password });
      setMessage("Password updated. You can now sign in.");
      router.replace("/login");
    } catch (err) {
      setError("Reset failed or token invalid.");
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
          <h1 className="text-xl font-semibold">Reset password</h1>
          <p className="text-sm text-muted-foreground">Enter your new password.</p>
        </div>
        <input
          type="password"
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {message ? <p className="text-sm text-foreground">{message}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <ResetForm />
    </Suspense>
  );
}
