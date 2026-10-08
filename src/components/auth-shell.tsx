'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

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
    <main className="min-h-[100svh] bg-background px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 text-foreground sm:px-6 sm:pt-8">
      <section className="mx-auto w-full max-w-[480px]">
        <header className="flex h-12 items-center border-b border-border">
          <Link href={alternateHref} className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-card hover:text-primary" aria-label="Go back">
            <ArrowLeft className="size-5" />
          </Link>
        </header>

        <div className="pt-8 sm:pt-10">
          <div className="mb-8">
            <p className="agora-pill mb-3">{eyebrow}</p>
            <h1 className="font-headline text-[2rem] font-semibold leading-tight tracking-[-0.015em] text-foreground">{title}</h1>
            <p className="mt-3 max-w-[400px] text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          {children}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {alternatePrompt}{' '}
            <Link href={alternateHref} className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline">
              {alternateLabel}<ArrowRight className="size-3.5" />
            </Link>
          </p>
          {browseHref && <Link href={browseHref} className="mt-5 block text-center text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline">Continue browsing</Link>}
        </div>
      </section>
    </main>
  );
}
