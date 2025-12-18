"use client";

import { requestEmailVerification, requestPhoneVerification, verifyEmail, verifyPhone } from "@serp/auth-flow";
import { Suspense, useState } from "react";

import { createTrpcClient } from "../../lib/trpc";

function VerifyForm() {
  const client = createTrpcClient();
  const [emailToken, setEmailToken] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailVerify = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await verifyEmail(client, { token: emailToken });
      setMessage("Email verified.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailResend = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await requestEmailVerification(client);
      setMessage("Verification email sent.");
    } catch (err) {
      setError("Could not resend email verification.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerify = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await verifyPhone(client, { phone, code: phoneCode });
      setMessage("Phone verified.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Phone verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneResend = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await requestPhoneVerification(client, { phone });
      setMessage("Verification code sent.");
    } catch (err) {
      setError("Could not send phone code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-2xl space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <section className="space-y-3">
            <div>
              <h1 className="text-lg font-semibold">Verify email</h1>
              <p className="text-sm text-muted-foreground">Enter your email token or resend a link.</p>
            </div>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              placeholder="Email token"
              value={emailToken}
              onChange={(e) => setEmailToken(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
                onClick={handleEmailVerify}
                disabled={loading || !emailToken}
              >
                Verify email
              </button>
              <button
                className="rounded-md border border-input px-3 py-2 text-sm disabled:opacity-50"
                onClick={handleEmailResend}
                disabled={loading}
              >
                Resend
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h1 className="text-lg font-semibold">Verify phone</h1>
              <p className="text-sm text-muted-foreground">Send and verify a code via SMS.</p>
            </div>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              placeholder="Phone (E.164)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              placeholder="Code"
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
                onClick={handlePhoneVerify}
                disabled={loading || !phone || !phoneCode}
              >
                Verify phone
              </button>
              <button
                className="rounded-md border border-input px-3 py-2 text-sm disabled:opacity-50"
                onClick={handlePhoneResend}
                disabled={loading || !phone}
              >
                Send code
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

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
