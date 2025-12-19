"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent } from "react";

import HERO_IMG from "../../assets/images/login_hero_image.svg";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

export default function RegisterStepOne() {
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
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
            <div className="text-xl font-semibold text-foreground">Dobrodošli!</div>
            <p className="text-sm text-muted-foreground">
              Popuni potrebne informacije kako bi kreirao račun.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Ime</label>
                <Input placeholder="Unesite ime" className="h-11 rounded-[6px]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Prezime</label>
                <Input placeholder="Unesite prezime" className="h-11 rounded-[6px]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Broj telefona</label>
              <Input placeholder="Broj telefona" className="h-11 rounded-[6px]" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input type="email" placeholder="Email" className="h-11 rounded-[6px]" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Lozinka</label>
              <div className="relative">
                <Input type="password" placeholder="Lozinka" className="h-11 rounded-[6px]" />
                <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">👁️</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Lozinka mora sadržavati najmanje 8 karaktera, veliko slovo i broj
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Potvrdite lozinku</label>
              <div className="relative">
                <Input type="password" placeholder="Potvrdite lozinku" className="h-11 rounded-[6px]" />
                <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">👁️</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Kreiranjem profila potvrđujete da se slažete sa našim{" "}
              <Link href="/terms" className="text-[#5fb7ff] underline">
                Uslovima korišćenja
              </Link>{" "}
              i{" "}
              <Link href="/privacy" className="text-[#5fb7ff] underline">
                Politikom privatnosti
              </Link>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                ← Nazad
              </Link>
              <Link href="/register/company">
                <Button type="button" className="h-11 rounded-[5px] bg-primary text-primary-foreground hover:bg-primary/90">
                  Dalje →
                </Button>
              </Link>
            </div>
          </form>

          <div className="text-center text-xs text-muted-foreground">© 2025 Obrtnica. Sva prava zadržana.</div>
        </div>
      </div>
    </main>
  );
}
