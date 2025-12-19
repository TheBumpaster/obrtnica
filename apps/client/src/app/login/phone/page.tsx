"use client";

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../../context/auth-context';
import HERO_IMG from '../../../assets/images/login_hero_image.svg';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

function PhoneLoginForm() {
  const { withAuth, tokens, sessionStatus } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);

  const returnTo = useMemo(() => {
    const rt = search?.get('returnTo');
    return rt && rt.startsWith('/') ? decodeURIComponent(rt) : '/app';
  }, [search]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && tokens?.accessToken) {
      router.replace(returnTo);
    }
  }, [sessionStatus, tokens?.accessToken, router, returnTo]);

  const requestOtp = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await withAuth((client) => client.auth.requestOtp.mutate({ email: identifier, purpose: 'LOGIN' }));
      setOtpRequested(true);
      setInfo('Kod je poslat. Unesi ga ispod.');
    } catch {
      setError('Slanje koda nije uspelo.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await withAuth((client) =>
        client.auth.verifyOtp.mutate({ email: identifier, code, purpose: 'LOGIN' })
      );
      router.replace(returnTo);
    } catch {
      setError('Verifikacija nije uspela.');
    } finally {
      setLoading(false);
    }
  };

  if (sessionStatus === 'authenticated' && tokens?.accessToken) {
    return null;
  }

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
            <div className="text-xl font-semibold text-foreground">Prijava kodom</div>
            <p className="text-sm text-muted-foreground">Unesi telefon ili email, poslaćemo kod.</p>
          </div>

          <form onSubmit={verifyOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Telefon ili email</label>
              <Input
                placeholder="Broj telefona ili email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="h-11 rounded-[6px] border-input bg-background text-foreground"
              />
            </div>
            {otpRequested ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Kod</label>
                <Input
                  placeholder="Unesi kod"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="h-11 rounded-[6px] border-input bg-background text-foreground"
                />
              </div>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}

            {!otpRequested ? (
              <Button
                type="button"
                disabled={loading}
                onClick={requestOtp}
                className="h-11 w-full rounded-[5px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? 'Slanje…' : 'Pošalji kod'}
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-[5px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? 'Verifikujem…' : 'Verifikuj kod'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-[5px] border-muted"
              onClick={() => router.push('/login')}
            >
              ← Nazad na lozinku
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function PhoneLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <PhoneLoginForm />
    </Suspense>
  );
}
