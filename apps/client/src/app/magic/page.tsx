"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { consumeMagicLink } from "@/lib/auth";

import { createTrpcClient } from "../../lib/trpc";

function MagicConsume() {
  const search = useSearchParams();
  const router = useRouter();
  const client = createTrpcClient();
  const token = useMemo(() => search?.get("token") || "", [search]);
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");

  useEffect(() => {
    if (!token) return;
    async function consume() {
      try {
        await consumeMagicLink(client, { token });
        setStatus("success");
        router.replace("/app");
      } catch {
        setStatus("error");
      }
    }
    consume();
  }, [token, client, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="rounded-lg border border-border bg-card px-6 py-4 text-sm text-foreground">
        {status === "pending" && "Consuming magic link..."}
        {status === "success" && "Magic link consumed. Redirecting..."}
        {status === "error" && "Magic link invalid or expired."}
      </div>
    </main>
  );
}

export default function MagicPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <MagicConsume />
    </Suspense>
  );
}
