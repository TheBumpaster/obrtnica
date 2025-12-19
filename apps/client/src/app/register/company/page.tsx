"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";

import HERO_IMG from "../../../assets/images/login_hero_image.svg";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

function CompanyForm() {
  const [formReady, setFormReady] = useState(true);
  useEffect(() => {
    setFormReady(true);
  }, []);

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
            <div className="text-xl font-semibold text-foreground">Informacije o firmi</div>
            <p className="text-sm text-muted-foreground">
              Molimo Vas da popunite sve potrebne informacije o Vašoj firmi.
            </p>
          </div>

          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Ime glavnog odgovornog lica</label>
                <Input placeholder="Unesite ime" className="h-11 rounded-[6px]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Prezime glavnog odgovornog lica</label>
                <Input placeholder="Unesite prezime" className="h-11 rounded-[6px]" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Naziv</label>
                <Input placeholder="Naziv" className="h-11 rounded-[6px]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tip</label>
                <Input placeholder="Npr. d.o.o., d.d., sp, o.d" className="h-11 rounded-[6px]" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Adresa / Ulica</label>
                <Input placeholder="Trg Zlatin Ljiljana br.1" className="h-11 rounded-[6px]" />
              </div>
              <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-medium text-foreground">Grad</label>
                <Input placeholder="Sarajevo" className="h-11 rounded-[6px]" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-medium text-foreground">Poštanski br.</label>
                <Input placeholder="71000" className="h-11 rounded-[6px]" />
              </div>
              <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-medium text-foreground">Matični broj</label>
                <Input placeholder="Matični broj" className="h-11 rounded-[6px]" />
              </div>
              <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-medium text-foreground">ID broj</label>
                <Input placeholder="ID broj" className="h-11 rounded-[6px]" />
              </div>
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              <div>ID Broj mora sadržavati 13 cifara</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                PDV broj <span className="text-xs text-muted-foreground">(Nije obavezno polje)</span>
              </label>
              <Input placeholder="PDV broj" className="h-11 rounded-[6px]" />
              <div className="text-xs text-muted-foreground">PDV broj mora sadržati 12 cifara</div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">
                ← Nazad
              </Link>
              <Button
                type="button"
                disabled={!formReady}
                className="h-11 rounded-[5px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Dalje →
              </Button>
            </div>
          </form>

          <div className="text-center text-xs text-muted-foreground">© 2025 Obrtnica. Sva prava zadržana.</div>
        </div>
      </div>
    </main>
  );
}

export default function CompanyRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <CompanyForm />
    </Suspense>
  );
}
