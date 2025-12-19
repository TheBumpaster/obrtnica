"use client";

"use client";

import Image from "next/image";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestEmailVerification, requestPhoneVerification, verifyEmail, verifyPhone } from "@/lib/auth";
import HERO_IMG from "../../assets/images/login_hero_image.svg";
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
      await verifyPhone(client, { code: phoneCode });
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
      await requestPhoneVerification(client, { phoneNumber: phone });
      setMessage("Verification code sent.");
    } catch (err) {
      setError("Could not send phone code.");
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
            <div className="text-xl font-semibold text-foreground">Verifikacija</div>
            <p className="text-sm text-muted-foreground">Verifikuj email ili telefon.</p>
          </div>

          <div className="space-y-6">
            <section className="space-y-3">
              <div>
                <h1 className="text-lg font-semibold">Verifikuj email</h1>
                <p className="text-sm text-muted-foreground">Unesi email token ili pošalji ponovo.</p>
              </div>
              <Input
                placeholder="Email token"
                value={emailToken}
                onChange={(e) => setEmailToken(e.target.value)}
                className="h-11 rounded-[6px]"
              />
              <div className="flex gap-2">
                <Button onClick={handleEmailVerify} disabled={loading || !emailToken} className="h-10">
                  Verifikuj email
                </Button>
                <Button variant="outline" onClick={handleEmailResend} disabled={loading} className="h-10">
                  Pošalji ponovo
                </Button>
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <h1 className="text-lg font-semibold">Verifikuj telefon</h1>
                <p className="text-sm text-muted-foreground">Pošalji i verifikuj SMS kod.</p>
              </div>
              <Input
                placeholder="Telefon (E.164)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 rounded-[6px]"
              />
              <Input
                placeholder="Kod"
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                className="h-11 rounded-[6px]"
              />
              <div className="flex gap-2">
                <Button onClick={handlePhoneVerify} disabled={loading || !phone || !phoneCode} className="h-10">
                  Verifikuj telefon
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePhoneResend}
                  disabled={loading || !phone}
                  className="h-10"
                >
                  Pošalji kod
                </Button>
              </div>
            </section>
          </div>

          {message ? <div className="text-sm text-foreground">{message}</div> : null}
          {error ? <div className="text-sm text-destructive">{error}</div> : null}
        </div>
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
