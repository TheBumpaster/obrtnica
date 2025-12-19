"use client";

import Image from "next/image";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { stepUpAuth } from "@/lib/auth";
import HERO_IMG from "../../assets/images/login_hero_image.svg";
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
      setMessage("Step-up uspešan.");
    } catch (err) {
      setError("Step-up nije uspeo.");
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
            <div className="text-xl font-semibold text-foreground">Step-up autentikacija</div>
            <p className="text-sm text-muted-foreground">Ponovo se autentifikuj za osetljivu akciju.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Lozinka / kod</label>
              <Input
                placeholder="Lozinka ili kod"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                required
                className="h-11 rounded-[6px]"
              />
            </div>
            {message ? <div className="text-sm text-foreground">{message}</div> : null}
            {error ? <div className="text-sm text-destructive">{error}</div> : null}
            <Button type="submit" disabled={loading} className="h-11 w-full rounded-[5px] bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? "Provera..." : "Verifikuj"}
            </Button>
          </form>
        </div>
      </div>
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
