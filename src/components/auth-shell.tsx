'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AppLogo } from '@/components/app-logo';

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
  alternateHref,
  alternateLabel,
  alternatePrompt,
  browseHref,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  alternateHref: string;
  alternateLabel: string;
  alternatePrompt: string;
  browseHref?: string;
}) {
  return (
    <main className="min-h-[100svh] bg-[#fbfcfa] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 text-[#17251d] sm:px-6 sm:pt-8">
      <section className="mx-auto w-full max-w-[480px]">
        <header className="flex h-12 items-center justify-between border-b border-[#e7ebe6]">
          <Link href={alternateHref} className="inline-flex size-10 items-center justify-center text-[#526057] transition hover:text-[#173b2b]" aria-label="Go back">
            <ArrowLeft className="size-5" />
          </Link>
          <Link href="/" className="flex items-center gap-2" aria-label="Agora home">
            <span className="flex size-8 items-center justify-center rounded-md bg-[#173b2b] p-1.5"><AppLogo className="size-full text-[#e0b75d]" /></span>
            <span className="text-sm font-bold tracking-[0.2em] text-[#173b2b]">AGORA</span>
          </Link>
          <span className="size-10" aria-hidden="true" />
        </header>

        <div className="pt-10 sm:pt-14">
          <div className="mb-8">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#69776e]">{eyebrow}</p>
            <h1 className="font-headline text-[2rem] font-semibold leading-tight tracking-[-0.015em] text-[#17251d]">{title}</h1>
            <p className="mt-3 max-w-[400px] text-sm leading-6 text-[#657269]">{description}</p>
          </div>
          {children}
          <p className="mt-8 text-center text-sm text-[#69776e]">
            {alternatePrompt}{' '}
            <Link href={alternateHref} className="inline-flex items-center gap-1 font-semibold text-[#173b2b] underline-offset-4 hover:underline">
              {alternateLabel}<ArrowRight className="size-3.5" />
            </Link>
          </p>
          {browseHref && <Link href={browseHref} className="mt-5 block text-center text-sm text-[#69776e] underline-offset-4 hover:text-[#173b2b] hover:underline">Continue browsing</Link>}
        </div>
      </section>
    </main>
  );
}
