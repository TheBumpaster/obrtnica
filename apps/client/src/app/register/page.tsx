"use client";

import { useRouter } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { registerOrgAndUser, requestEmailVerification } from "@/lib/auth";

import { createTrpcClient } from "../../lib/trpc";

function RegisterForm() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const client = createTrpcClient();
      await registerOrgAndUser(client, { orgName, email, password, name });
      await requestEmailVerification(client);
      setMessage("Registered. Please verify your email to continue.");
      router.replace("/verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
          <h1 className="text-xl font-semibold">Create account</h1>
          <p className="text-sm text-muted-foreground">Register your org and admin user.</p>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Organization</span>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Name</span>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {message ? <p className="text-sm text-foreground">{message}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
