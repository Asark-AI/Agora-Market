'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LiquidLoader } from '@/components/liquid-loader';
import { AuthShell } from '@/components/auth-shell';
import { auth } from '@/lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/hooks/use-auth';

export default function VerifySignupEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { firebaseUser, refreshAuthProfile } = useAuth();
  const email = searchParams.get('email') || firebaseUser?.email || auth?.currentUser?.email || '';
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const checkingRef = useRef(false);

  useEffect(() => {
    if (!email) router.replace('/sign-up');
  }, [email, router]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const checkVerification = useCallback(async () => {
    const currentUser = auth?.currentUser ?? firebaseUser;
    if (!currentUser || checkingRef.current) return;

    checkingRef.current = true;
    setIsChecking(true);
    setCheckError('');
    try {
      await currentUser.reload();
      if (!currentUser.emailVerified) {
        setCheckError('Firebase has not confirmed this email yet. Open the latest verification link and try again.');
        return;
      }

      await currentUser.getIdToken(true);
      const idToken = await currentUser.getIdToken();
      const sessionResponse = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!sessionResponse.ok) throw new Error('Your secure Agora session could not be started. Please try again.');

      await refreshAuthProfile(currentUser);
      const tokenResult = await currentUser.getIdTokenResult();
      const currentSeller = useAuthStore.getState().seller;
      toast({ title: 'Email confirmed', description: 'Your Agora account is ready.' });
      router.replace(tokenResult.claims.superAdmin === true
        ? '/admin'
        : currentSeller && ['approved', 'active'].includes(currentSeller.status) ? '/dashboard' : '/');
    } catch (error) {
      console.error('Email verification check failed:', error);
      setCheckError(error instanceof Error ? error.message : 'We could not check verification yet. Please retry.');
    } finally {
      checkingRef.current = false;
      setIsChecking(false);
    }
  }, [firebaseUser, refreshAuthProfile, router, toast]);

  useEffect(() => {
    if (!firebaseUser && !auth?.currentUser) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkVerification();
    };
    const interval = window.setInterval(onVisible, 15_000);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [checkVerification, firebaseUser]);

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
      const code = (error as { code?: string }).code;
      const description = code === 'auth/too-many-requests'
        ? 'Too many requests. Wait a little before asking for another email.'
        : code === 'auth/network-request-failed'
          ? 'Check your connection and try again.'
          : 'We could not send the verification email. Please try again.';
      toast({ variant: 'destructive', title: 'Could not resend email', description });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Almost there"
      title="Confirm your email"
      description={searchParams.get('send') === 'failed'
        ? `Your account exists, but Firebase could not send the verification email${email ? ` to ${email}` : ''}. Resend it below.`
        : `Check your inbox for a verification email${email ? ` sent to ${email}` : ''}. Click the link to confirm your account.`}
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
            Open the latest email and click its verification link. We check again when you return to Agora.
          </p>
        </div>

        {checkError && <p role="alert" className="text-sm text-destructive">{checkError}</p>}

        <Button type="button" variant="outline" className="h-12 w-full" onClick={() => void checkVerification()} disabled={isChecking}>
          {isChecking ? <><LiquidLoader className="mr-2" />Checking email status...</> : 'I verified my email'}
        </Button>

        <Button type="button" className="h-12 w-full rounded-xl bg-[#173b2b] text-sm font-semibold text-[#f7f3ee] shadow-[0_18px_32px_-16px_rgba(23,59,43,0.8)] transition hover:bg-[#112b23]" onClick={resend} disabled={isLoading || cooldown > 0}>
          {isLoading ? <><LiquidLoader className="mr-2" />Sending...</> : cooldown ? `Resend in ${cooldown}s` : 'Resend verification email'}
        </Button>
      </div>
    </AuthShell>
  );
}
