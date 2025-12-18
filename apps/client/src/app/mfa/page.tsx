"use client";

import { Suspense, useState } from "react";

import {
  disableMfa,
  enrollMfa,
  generateRecoveryCodes,
  verifyMfa,
  verifyMfaEnrollment,
} from "@/lib/auth";

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
      setMessage("MFA enrollment started. Enter TOTP to verify.");
    } catch (err) {
      setError("Could not start MFA enrollment.");
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
      setMessage("MFA enrolled. Save recovery codes.");
    } catch (err) {
      setError("Could not verify MFA enrollment.");
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
      setMessage("MFA verified.");
    } catch (err) {
      setError("Invalid MFA code.");
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
      setMessage("MFA disabled.");
      setEnrollSecret(null);
      setRecoveryCodes(null);
    } catch (err) {
      setError("Could not disable MFA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-start justify-center bg-background">
      <div className="w-full max-w-3xl space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row">
          <section className="flex-1 space-y-3">
            <div>
              <h1 className="text-lg font-semibold">Enroll MFA</h1>
              <p className="text-sm text-muted-foreground">Start and verify MFA enrollment.</p>
            </div>
            {enrollSecret ? (
              <div className="rounded-md border border-dashed border-border p-3 text-sm">
                Secret: <code>{enrollSecret}</code>
              </div>
            ) : null}
            <button
              className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
              onClick={startEnroll}
              disabled={loading}
            >
              Start enrollment
            </button>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              placeholder="TOTP code"
              value={enrollCode}
              onChange={(e) => setEnrollCode(e.target.value)}
            />
            <button
              className="rounded-md border border-input px-3 py-2 text-sm disabled:opacity-50"
              onClick={completeEnroll}
              disabled={loading || !enrollCode}
            >
              Verify enrollment
            </button>
            {recoveryCodes ? (
              <div className="rounded-md border border-border bg-muted p-3 text-sm">
                <div className="font-medium">Recovery codes (save securely):</div>
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

          <section className="flex-1 space-y-3">
            <div>
              <h1 className="text-lg font-semibold">Verify MFA (login/step-up)</h1>
              <p className="text-sm text-muted-foreground">Use TOTP or recovery code.</p>
            </div>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              placeholder="Code or recovery"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
            />
            <button
              className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
              onClick={verifyLoginMfa}
              disabled={loading || !verifyCode}
            >
              Verify MFA
            </button>

            <div className="pt-4 space-y-2">
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Current MFA code to disable"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
              />
              <button
                className="rounded-md border border-input px-3 py-2 text-sm text-destructive disabled:opacity-50"
                onClick={handleDisable}
                disabled={loading || !disableCode}
              >
                Disable MFA
              </button>
            </div>
          </section>
        </div>
        {message ? <div className="text-sm text-foreground">{message}</div> : null}
        {error ? <div className="text-sm text-destructive">{error}</div> : null}
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
