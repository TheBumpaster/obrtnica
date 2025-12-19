"use client";

import Image from "next/image";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  disableMfa,
  enrollMfa,
  generateRecoveryCodes,
  verifyMfa,
  verifyMfaEnrollment,
} from "@/lib/auth";
import HERO_IMG from "../../assets/images/login_hero_image.svg";
import { createTrpcClient } from "../../lib/trpc";

function MfaForm() {
  const client = createTrpcClient();
  const [enrollSecret, setEnrollSecret] = useState<string | null>(null);
  const [enrollCode, setEnrollCode] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startEnroll = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await enrollMfa(client);
      setEnrollSecret((res as { secret?: string } | null)?.secret || null);
      setMessage("MFA pokrenut. Unesi TOTP kod za verifikaciju.");
    } catch (err) {
      setError("Nije moguće pokrenuti MFA.");
    } finally {
      setLoading(false);
    }
  };

  const completeEnroll = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await verifyMfaEnrollment(client, { code: enrollCode });
      const rec = await generateRecoveryCodes(client);
      setRecoveryCodes((rec as { codes?: string[] } | null)?.codes || []);
      setMessage("MFA verifikovan. Sačuvaj recovery kodove.");
    } catch (err) {
      setError("Verifikacija MFA nije uspela.");
    } finally {
      setLoading(false);
    }
  };

  const verifyLoginMfa = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await verifyMfa(client, { code: verifyCode });
      setMessage("MFA kod prihvaćen.");
    } catch (err) {
      setError("Neispravan MFA kod.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await disableMfa(client, { code: disableCode });
      setMessage("MFA isključen.");
      setEnrollSecret(null);
      setRecoveryCodes(null);
    } catch (err) {
      setError("Nije moguće isključiti MFA.");
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
        <div className="w-full max-w-[640px] space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="text-sm font-semibold tracking-[0.08em] text-foreground">OBRTNICA</div>
            <div className="text-xl font-semibold text-foreground">MFA</div>
            <p className="text-sm text-muted-foreground">Upravljaj MFA prijavom i kodovima.</p>
          </div>

          <div className="space-y-6">
            <section className="space-y-3 rounded-lg border border-border bg-card/50 p-4">
              <div>
                <h1 className="text-lg font-semibold">Pokreni / verifikuj MFA</h1>
                <p className="text-sm text-muted-foreground">Pokreni, unesi TOTP kod i preuzmi recovery kodove.</p>
              </div>
              {enrollSecret ? (
                <div className="rounded-md border border-dashed border-border p-3 text-sm">
                  Secret: <code>{enrollSecret}</code>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button onClick={startEnroll} disabled={loading} className="h-10">
                  Pokreni MFA
                </Button>
              </div>
              <Input
                placeholder="TOTP kod"
                value={enrollCode}
                onChange={(e) => setEnrollCode(e.target.value)}
                className="h-11 rounded-[6px]"
              />
              <Button
                variant="outline"
                onClick={completeEnroll}
                disabled={loading || !enrollCode}
                className="h-10"
              >
                Verifikuj MFA
              </Button>
              {recoveryCodes ? (
                <div className="rounded-md border border-border bg-muted p-3 text-sm">
                  <div className="font-medium">Recovery kodovi (sačuvaj):</div>
                  <ul className="mt-2 space-y-1">
                    {recoveryCodes.map((c) => (
                      <li key={c} className="font-mono">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className="space-y-3 rounded-lg border border-border bg-card/50 p-4">
              <div>
                <h1 className="text-lg font-semibold">Verifikuj MFA (login/step-up)</h1>
                <p className="text-sm text-muted-foreground">Unesi TOTP ili recovery kod.</p>
              </div>
              <Input
                placeholder="Kod ili recovery"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="h-11 rounded-[6px]"
              />
              <Button onClick={verifyLoginMfa} disabled={loading || !verifyCode} className="h-10">
                Verifikuj kod
              </Button>
            </section>

            <section className="space-y-3 rounded-lg border border-border bg-card/50 p-4">
              <div>
                <h1 className="text-lg font-semibold">Isključi MFA</h1>
                <p className="text-sm text-muted-foreground">Unesi trenutni MFA kod za isključivanje.</p>
              </div>
              <Input
                placeholder="MFA kod"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                className="h-11 rounded-[6px]"
              />
              <Button
                variant="outline"
                onClick={handleDisable}
                disabled={loading || !disableCode}
                className="h-10 text-destructive"
              >
                Isključi MFA
              </Button>
            </section>
          </div>

          {message ? <div className="text-sm text-foreground">{message}</div> : null}
          {error ? <div className="text-sm text-destructive">{error}</div> : null}
        </div>
      </div>
    </main>
  );
}

export default function MfaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <MfaForm />
    </Suspense>
  );
}
