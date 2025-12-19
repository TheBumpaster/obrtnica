"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/auth";
import HERO_IMG from "../../assets/images/login_hero_image.svg";
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
      setError("Lozinke se ne poklapaju.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await resetPassword(client, { token, newPassword: password });
      setMessage("Lozinka ažurirana. Možete se prijaviti.");
      router.replace("/login");
    } catch (err) {
      setError("Reset nije uspeo ili je token nevažeći.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-background text-foreground">
      <div className="hidden flex-1 items-center justify-center p-6 lg:flex">
        <div className="relative h-[85vh] w-full overflow-hidden rounded-[10px]">
          <Image
            src={HERO_IMG}
            alt="Obrtnica background"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
      <div className="flex w-full flex-1 items-center justify-center px-4 py-10 lg:w-1/2 lg:px-12">
        <div className="w-full max-w-[512px] space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="text-sm font-semibold tracking-[0.08em] text-foreground">OBRTNICA</div>
            <div className="text-xl font-semibold text-foreground">Reset lozinke</div>
            <p className="text-sm text-muted-foreground">Unesite novu lozinku.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nova lozinka</label>
              <Input
                type="password"
                placeholder="Nova lozinka"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-[6px]"
              />
              <p className="text-xs text-muted-foreground">
                Lozinka mora imati najmanje 8 karaktera, jedno veliko slovo i broj.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Potvrdite lozinku</label>
              <Input
                type="password"
                placeholder="Potvrdite lozinku"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="h-11 rounded-[6px]"
              />
            </div>
            {message ? <p className="text-sm text-foreground">{message}</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-[5px] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? "Resetujem..." : "Resetuj lozinku"}
            </Button>
          </form>
        </div>
      </div>
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
