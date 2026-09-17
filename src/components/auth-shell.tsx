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
    <main className="min-h-screen bg-[#f4f6f2] px-4 py-6 text-[#17251d] sm:px-6 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-[#dce5dc] bg-white shadow-[0_24px_80px_-40px_rgba(23,37,29,0.35)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-[#173b2b] p-10 text-[#f4f6f2] lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[36px] border-[#d7a84a]/25" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full border-[52px] border-[#8fb59a]/15" />
          <div className="relative flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#f4f6f2] p-2">
              <AppLogo className="size-full text-[#173b2b]" />
            </div>
            <span className="text-sm font-semibold tracking-[0.22em]">AGORA</span>
          </div>
          <div className="relative max-w-sm">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d7a84a]"><Store className="size-4" /> Ghana&apos;s marketplace</p>
            <h2 className="font-headline text-4xl font-semibold leading-[1.08] xl:text-5xl">Trade with confidence.</h2>
            <p className="mt-6 text-sm leading-7 text-[#dce9df]">A considered place to discover local businesses, manage your store, and keep every transaction moving.</p>
          </div>
          <div className="relative flex items-center gap-2 text-xs text-[#dce9df]/75"><ShieldCheck className="size-4 text-[#d7a84a]" /> Secure account access</div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-[430px]">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#173b2b] p-2"><AppLogo className="size-full text-[#f4f6f2]" /></div>
              <span className="text-sm font-semibold tracking-[0.22em]">AGORA</span>
            </div>
            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#7a8b7d]">{eyebrow}</p>
              <h1 className="font-headline text-3xl font-semibold tracking-tight text-[#17251d] sm:text-4xl">{title}</h1>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#6b786e]">{description}</p>
            </div>
            {children}
            <p className="mt-8 border-t border-[#e5ebe5] pt-5 text-center text-sm text-[#7a8b7d]">
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
