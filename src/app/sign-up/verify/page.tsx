'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LiquidLoader } from '@/components/liquid-loader';
import { AuthShell } from '@/components/auth-shell';
import { auth } from '@/lib/firebase';
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
  const [code, setCode] = useState('');
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

  const establishVerifiedSession = useCallback(async (currentUser: NonNullable<typeof firebaseUser>) => {
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
      ? '/super/app/dashboard'
      : currentSeller && ['approved', 'active'].includes(currentSeller.status) ? '/dashboard' : '/');
  }, [refreshAuthProfile, router, toast]);

  const checkVerification = useCallback(async (showPendingMessage = true) => {
    const currentUser = auth?.currentUser ?? firebaseUser;
    if (!currentUser || checkingRef.current) return;

    checkingRef.current = true;
    setIsChecking(true);
    setCheckError('');
    try {
      await currentUser.reload();
      if (!currentUser.emailVerified) {
        if (showPendingMessage) {
          setCheckError('Your email is not verified yet. Enter the six-digit code from Agora or use a previously sent Firebase verification link.');
        }
        return;
      }

      await establishVerifiedSession(currentUser);
    } catch (error) {
      console.error('Email verification check failed:', error);
      setCheckError(error instanceof Error ? error.message : 'We could not check verification yet. Please retry.');
    } finally {
      checkingRef.current = false;
      setIsChecking(false);
    }
  }, [establishVerifiedSession, firebaseUser]);

  useEffect(() => {
    if (!firebaseUser && !auth?.currentUser) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkVerification(false);
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
      const idToken = await user.getIdToken();
      const response = await fetch('/api/auth/email-otp/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'We could not send a verification email. Please try again.');
      setCooldown(60);
      toast({ title: 'Verification code sent', description: `Check ${user.email || 'your inbox'} for a new six-digit code.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Could not send verification code', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    const currentUser = auth?.currentUser ?? firebaseUser;
    if (!currentUser) {
      setCheckError('Your sign-up session has expired. Sign in and request a new verification code.');
      return;
    }
    setIsChecking(true);
    setCheckError('');
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch('/api/auth/email-otp/verify', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'We could not verify this code. Please try again.');
      await currentUser.reload();
      await establishVerifiedSession(currentUser);
    } catch (error) {
      setCheckError(error instanceof Error ? error.message : 'We could not verify this code. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Almost there"
      title="Verify your email"
      description={searchParams.get('send') === 'failed'
        ? `Your account exists, but Agora could not send a verification code${email ? ` to ${email}` : ''}. Check the email configuration or try again below.`
        : `Enter the six-digit code sent to your email${email ? ` (${email})` : ''}.`}
      alternateHref="/sign-in"
      alternateLabel="Sign in"
      alternatePrompt="Already verified?"
    >
      <div className="space-y-5">
        <div className="rounded-[1.75rem] border border-[#edf0ea] bg-[#f8faf8] p-5 shadow-[0_24px_40px_-28px_rgba(23,59,43,0.28)]">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf6ef] text-2xl shadow-inner shadow-[#d9e7dc]">✉️</div>
          <p className="text-sm text-[#5b675f]">
            We’ve sent a verification code to <span className="font-semibold text-[#173b2b]">{email || 'your email address'}</span>.
          </p>
          <p className="mt-3 text-xs leading-5 text-[#738079]">
            The six-digit code expires after 10 minutes. Requesting a new code invalidates the previous one.
          </p>
        </div>

        <div className="space-y-3">
          <label htmlFor="email-otp-code" className="block text-sm font-medium text-[#24332c]">Email verification code</label>
          <input
            id="email-otp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="h-14 w-full rounded-md border border-[#cfd8d0] bg-white px-4 text-center text-2xl tracking-[0.5em] shadow-none focus-visible:border-[#173b2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173b2b]/15"
            aria-label="Six-digit email verification code"
          />
          <Button type="button" className="h-12 w-full rounded-xl bg-[#173b2b] text-sm font-semibold text-[#f7f3ee] hover:bg-[#112b23]" onClick={() => void verifyCode()} disabled={isChecking || code.length !== 6}>
            {isChecking ? <><LiquidLoader className="mr-2" />Verifying...</> : 'Verify email'}
          </Button>
        </div>

        {checkError && <p role="alert" className="text-sm text-destructive">{checkError}</p>}

        <Button type="button" variant="outline" className="h-12 w-full" onClick={() => void checkVerification()} disabled={isChecking}>
          {isChecking ? <><LiquidLoader className="mr-2" />Checking email status...</> : 'Check for an older verification link'}
        </Button>

        <Button type="button" variant="outline" className="h-12 w-full rounded-xl text-sm font-semibold" onClick={resend} disabled={isLoading || cooldown > 0}>
          {isLoading ? <><LiquidLoader className="mr-2" />Sending...</> : cooldown ? `Send another code in ${cooldown}s` : 'Send a new verification code'}
        </Button>
      </div>
    </AuthShell>
  );
}
