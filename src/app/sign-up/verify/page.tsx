'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LiquidLoader } from '@/components/liquid-loader';
import { AuthShell } from '@/components/auth-shell';
import { auth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '@/hooks/use-auth';

export default function VerifySignupEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { firebaseUser, refreshAuthProfile } = useAuth();
  const email = searchParams.get('email') || firebaseUser?.email || auth?.currentUser?.email || '';
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

  useEffect(() => {
    if (!auth?.currentUser && !firebaseUser) return;

    const timer = window.setInterval(async () => {
      const user = auth?.currentUser ?? firebaseUser;
      if (!user) return;

      try {
        await user.reload();
        await refreshAuthProfile(user);
        if (user.emailVerified) {
          window.clearInterval(timer);
          toast({ title: 'Email confirmed', description: 'Your Agora account is ready.' });
          router.replace('/');
        }
      } catch {
        // Ignore reload errors while the email verification link is still pending.
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [firebaseUser, refreshAuthProfile, router, toast]);

  const resend = async () => {
    if (cooldown) return;
    const user = auth?.currentUser ?? firebaseUser;
    if (!user) {
      toast({ variant: 'destructive', title: 'Verification unavailable', description: 'Please sign up again and try once more.' });
      return;
    }

    setIsLoading(true);
    try {
      await sendEmailVerification(user);
      setCooldown(60);
      toast({ title: 'Verification email sent', description: 'Check your inbox for the latest confirmation link.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Could not resend email', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Almost there"
      title="Confirm your email"
      description={`Check your inbox for a verification email${email ? ` sent to ${email}` : ''}. Click the link to confirm your account.`}
      alternateHref="/sign-in"
      alternateLabel="Sign in"
      alternatePrompt="Already verified?"
    >
      <div className="space-y-5">
        <div className="rounded-[1.75rem] border border-[#edf0ea] bg-[#f8faf8] p-5 shadow-[0_24px_40px_-28px_rgba(23,59,43,0.28)]">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf6ef] text-2xl shadow-inner shadow-[#d9e7dc]">✉️</div>
          <p className="text-sm text-[#5b675f]">
            We’ve sent a confirmation link to <span className="font-semibold text-[#173b2b]">{email || 'your email address'}</span>.
          </p>
          <p className="mt-3 text-xs leading-5 text-[#738079]">
            Open the email and click the confirm button. We’ll automatically take you to your account once it’s verified.
          </p>
        </div>

        <Button type="button" className="h-12 w-full rounded-xl bg-[#173b2b] text-sm font-semibold text-[#f7f3ee] shadow-[0_18px_32px_-16px_rgba(23,59,43,0.8)] transition hover:bg-[#112b23]" onClick={resend} disabled={isLoading || cooldown > 0}>
          {isLoading ? <><LiquidLoader className="mr-2" />Sending...</> : cooldown ? `Resend in ${cooldown}s` : 'Resend verification email'}
        </Button>
      </div>
    </AuthShell>
  );
}
