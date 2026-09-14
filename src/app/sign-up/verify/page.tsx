'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LiquidLoader } from '@/components/liquid-loader';

export default function VerifySignupEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) router.replace('/sign-up');
  }, [email, router]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/email-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, action: 'verify', code }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Unable to verify code.');
      toast({ title: 'Email confirmed', description: 'Your Agora account is ready.' });
      router.replace('/');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Code not accepted', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const resend = async () => {
    if (cooldown) return;
    const response = await fetch('/api/auth/email-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, action: 'send' }) });
    const data = await response.json() as { error?: string };
    if (!response.ok) { toast({ variant: 'destructive', title: 'Could not resend code', description: data.error || 'Please try again.' }); return; }
    setCooldown(60);
    toast({ title: 'New code sent', description: 'Check your email for the latest code.' });
  };

  return (
    <main className="flex min-h-screen items-start justify-center bg-background px-4 py-10 sm:items-center sm:py-16">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex items-center gap-3"><span className="flex size-9 items-center justify-center bg-foreground text-sm font-bold text-background">A</span><span className="text-sm font-semibold tracking-[0.18em]">AGORA</span></div>
        <h1 className="text-2xl font-semibold tracking-tight">Confirm your email</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Enter the six-digit code sent to <span className="font-medium text-foreground">{email}</span>.</p>
        <form onSubmit={verify} className="mt-7 space-y-4">
          <Input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" aria-label="Email verification code" className="h-12 text-center text-xl tracking-[0.45em]" maxLength={6} />
          <Button type="submit" className="h-11 w-full" disabled={isLoading || code.length !== 6}>{isLoading ? <><LiquidLoader className="mr-2" />Checking...</> : 'Confirm email'}</Button>
        </form>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-5 text-sm"><button type="button" onClick={resend} disabled={cooldown > 0} className="font-medium text-foreground underline underline-offset-4 disabled:text-muted-foreground">{cooldown ? `Resend in ${cooldown}s` : 'Resend code'}</button><Link href="/sign-in" className="text-muted-foreground underline underline-offset-4">Sign in</Link></div>
      </div>
    </main>
  );
}
