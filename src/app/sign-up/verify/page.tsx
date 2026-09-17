'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LiquidLoader } from '@/components/liquid-loader';
import { AuthShell } from '@/components/auth-shell';

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
    <AuthShell
      eyebrow="Almost there"
      title="Confirm your email"
      description={`Enter the six-digit code sent to ${email}.`}
      alternateHref="/sign-in"
      alternateLabel="Sign in"
      alternatePrompt="Already verified?"
    >
        <form onSubmit={verify} className="mt-7 space-y-4">
          <Input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" aria-label="Email verification code" className="h-12 text-center text-xl tracking-[0.45em]" maxLength={6} />
          <Button type="submit" className="h-11 w-full" disabled={isLoading || code.length !== 6}>{isLoading ? <><LiquidLoader className="mr-2" />Checking...</> : 'Confirm email'}</Button>
        </form>
        <div className="mt-5 text-center text-sm"><button type="button" onClick={resend} disabled={cooldown > 0} className="font-medium text-[#173b2b] underline-offset-4 hover:underline disabled:text-[#7a8b7d]">{cooldown ? `Resend in ${cooldown}s` : 'Resend code'}</button></div>
    </AuthShell>
  );
}
