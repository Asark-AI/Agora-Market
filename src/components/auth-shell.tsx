'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Store } from 'lucide-react';
import { AppLogo } from '@/components/app-logo';

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
  alternateHref,
  alternateLabel,
  alternatePrompt,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  alternateHref: string;
  alternateLabel: string;
  alternatePrompt: string;
}) {
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#edf1eb] px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-[#17251d] sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-[#d7a84a]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#8fb59a]/15 blur-3xl" />
      <div className="relative mx-auto grid min-h-[calc(100svh-2.5rem)] max-w-6xl overflow-hidden rounded-[1.75rem] border border-[#d7e1d6] bg-[#fbfcfa] shadow-[0_30px_90px_-42px_rgba(23,37,29,0.42)] lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[0.88fr_1.12fr] lg:rounded-[2.25rem]">
        <section className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#1c4634_0%,#173b2b_52%,#102d22_100%)] p-10 text-[#f4f6f2] lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border-[1px] border-[#d7a84a]/25 shadow-[0_0_0_24px_rgba(215,168,74,0.04),0_0_0_48px_rgba(215,168,74,0.03)]" />
          <div className="absolute -bottom-36 -left-28 h-96 w-96 rounded-full border-[1px] border-[#8fb59a]/20 shadow-[0_0_0_28px_rgba(143,181,154,0.04)]" />
          <div className="relative flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-[0.9rem] bg-[#f4f6f2] p-2 shadow-[0_12px_24px_-12px_rgba(0,0,0,0.4)]">
              <AppLogo className="size-full text-[#173b2b]" />
            </div>
            <span className="text-sm font-semibold tracking-[0.22em]">AGORA</span>
          </div>
          <div className="relative max-w-sm">
            <p className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e0b75d]"><Store className="size-4" /> Ghana&apos;s marketplace</p>
            <h2 className="font-headline text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.02em] xl:text-6xl">Trade with confidence.</h2>
            <p className="mt-6 max-w-xs text-sm leading-7 text-[#dce9df]">A considered place to discover local businesses, manage your store, and keep every transaction moving.</p>
          </div>
          <div className="relative flex items-center gap-2 text-xs text-[#dce9df]/75"><ShieldCheck className="size-4 text-[#e0b75d]" /> Secure account access</div>
        </section>

        <section className="flex items-center justify-center px-5 py-9 sm:px-12 sm:py-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-[430px]">
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-[0.85rem] bg-[#173b2b] p-2 shadow-[0_12px_24px_-12px_rgba(23,59,43,0.7)]"><AppLogo className="size-full text-[#f4f6f2]" /></div>
              <span className="text-sm font-semibold tracking-[0.22em]">AGORA</span>
            </div>
            <div className="mb-7">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7a8b7d]">{eyebrow}</p>
              <h1 className="font-headline text-[2rem] font-semibold leading-tight tracking-[-0.02em] text-[#17251d] sm:text-[2.65rem]">{title}</h1>
              <p className="mt-3 max-w-sm text-[0.9375rem] leading-6 text-[#6b786e]">{description}</p>
            </div>
            {children}
            <p className="mt-7 border-t border-[#e5ebe5] pt-5 text-center text-sm text-[#7a8b7d]">
              {alternatePrompt}{' '}
              <Link href={alternateHref} className="inline-flex items-center gap-1 font-semibold text-[#173b2b] underline-offset-4 hover:underline">
                {alternateLabel}<ArrowRight className="size-3.5" />
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
