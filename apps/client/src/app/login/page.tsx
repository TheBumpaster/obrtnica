"use client";

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';

import HERO_IMG from '../../assets/images/login_hero_image.svg';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../context/auth-context';

function LoginForm() {
  const { login, loading, error, tokens, sessionStatus } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const returnTo = useMemo(() => {
    const rt = search?.get('returnTo');
    return rt && rt.startsWith('/') ? decodeURIComponent(rt) : '/app';
  }, [search]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && tokens?.accessToken) {
      router.replace(returnTo);
    }
  }, [sessionStatus, tokens?.accessToken, router, returnTo]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login(email, password);
    router.replace(returnTo);
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
            <div className="text-xl font-semibold text-foreground">Dobrodošli nazad!</div>
            <p className="text-sm text-muted-foreground">Uloguj se s nekom od opcija ispod.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="Email adresa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-[6px] border-input bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Lozinka</label>
              <Input
                type="password"
                placeholder="Lozinka"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-[6px] border-input bg-background text-foreground"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-[5px] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? 'Prijavljivanje…' : 'Prijavi se'}
            </Button>
          </form>

          <div className="flex items-center gap-4 text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>ili nastavite sa</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-center gap-2 rounded-[5px] border-muted bg-transparent text-foreground hover:bg-muted/40"
            >
              <span className="text-base">G</span> Nastavi s Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-center gap-2 rounded-[5px] border-muted bg-transparent text-foreground hover:bg-muted/40"
              onClick={() => router.push('/login/magic')}
            >
              ✉️ Magic login (email)
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-center gap-2 rounded-[5px] border-muted bg-transparent text-foreground hover:bg-muted/40"
              onClick={() => router.push('/login/phone')}
            >
              📱 Nastavi s Brojem telefona
            </Button>
          </div>

          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <div>
              Nemaš profil?{' '}
              <a className="font-medium text-[#5fb7ff] underline" href="/register">
                Kreiraj profil
              </a>
            </div>
            <div className="text-xs">
              <a className="text-[#5fb7ff] underline" href="/terms">
                Uslovima korišćenja
              </a>{' '}
              i{' '}
              <a className="text-[#5fb7ff] underline" href="/privacy">
                Politikom privatnosti
              </a>
            </div>
            <div className="text-xs">© 2025 Obrtnica. Sva prava zadržana.</div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
