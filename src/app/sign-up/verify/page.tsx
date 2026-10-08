'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { Mail } from 'lucide-react';
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
  const sendStatus = searchParams.get('send');
  const [verificationMethod, setVerificationMethod] = useState<'code' | 'link'>(searchParams.get('method') === 'link' ? 'link' : 'code');
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
    const tokenResult = await currentUser.getIdTokenResult();
    if (tokenResult.claims.role === 'super_admin' || tokenResult.claims.superAdmin === true) {
      if (auth) await signOut(auth);
      await fetch('/api/auth/session', { method: 'DELETE' });
      router.replace('/admin/sign-in');
      return;
    }
    const idToken = await currentUser.getIdToken();
    const sessionResponse = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!sessionResponse.ok) throw new Error('Your secure Agora session could not be started. Please try again.');

    await refreshAuthProfile(currentUser);
    const currentSeller = useAuthStore.getState().seller;
    toast({ title: 'Email confirmed', description: 'Your Agora account is ready.' });
    router.replace(currentSeller && ['approved', 'active'].includes(currentSeller.status) ? '/dashboard' : '/');
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
          setCheckError(verificationMethod === 'link'
            ? 'Your email is not verified yet. Open the Firebase verification link, then check again.'
            : 'Your email is not verified yet. Enter the six-digit code from Agora or use a previously sent Firebase verification link.');
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
  }, [establishVerifiedSession, firebaseUser, verificationMethod]);

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
      let response: Response | null = null;
      try {
        response = await fetch('/api/auth/email-otp/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${idToken}` },
        });
      } catch {
        response = null;
      }

      if (!response || response.status === 502 || response.status === 503) {
        await sendEmailVerification(user);
        setVerificationMethod('link');
        setCooldown(60);
        toast({ title: 'Verification link sent', description: `Check ${user.email || 'your inbox'} for a Firebase verification link.` });
      } else {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'We could not send a verification email. Please try again.');
        setVerificationMethod('code');
        setCooldown(60);
        toast({ title: 'Verification code sent', description: `Check ${user.email || 'your inbox'} for a new six-digit code.` });
      }
    } catch (error) {
      const code = (error as { code?: string })?.code;
      const description = code === 'auth/unauthorized-continue-uri'
        ? 'Firebase rejected this app domain. Add it to Firebase Authentication authorized domains.'
        : code === 'auth/operation-not-allowed'
          ? 'Email verification is disabled for this Firebase project. Enable Email/Password in Firebase Authentication.'
          : code === 'auth/too-many-requests'
            ? 'Too many verification requests. Wait a while before trying again.'
            : code === 'auth/network-request-failed'
              ? 'We could not reach Firebase. Check your connection and try again.'
              : 'Check Firebase Authentication email settings and authorized domains, then try again.';
      toast({
        variant: 'destructive',
        title: 'Could not send verification email',
        description,
      });
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
      description={verificationMethod === 'link'
        ? `Open the Firebase verification link sent to ${email || 'your email'}. Return here afterward to finish signing in.`
        : sendStatus === 'failed'
          ? `Your account exists, but no verification email was sent${email ? ` to ${email}` : ''}. Try again below; Firebase link delivery will be used if code delivery is unavailable.`
          : sendStatus === 'needed'
            ? 'Your email address is not verified yet. Request a six-digit code below to finish signing in.'
            : `Enter the six-digit code sent to your email${email ? ` (${email})` : ''}.`}
      alternateHref="/sign-in"
      alternateLabel="Sign in"
      alternatePrompt="Already verified?"
    >
      <div className="space-y-5">
        <div className="agora-panel rounded-2xl p-5">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary"><Mail className="size-6" /></div>
          <p className="text-sm text-muted-foreground">
            {verificationMethod === 'link'
              ? <>A Firebase verification link was requested for <span className="font-semibold text-foreground">{email || 'your email address'}</span>.</>
              : sendStatus === 'needed' || sendStatus === 'failed'
                ? <>Request a six-digit verification code for <span className="font-semibold text-foreground">{email || 'your email address'}</span> below.</>
                : <>We’ve sent a verification code to <span className="font-semibold text-foreground">{email || 'your email address'}</span>.</>}
          </p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {verificationMethod === 'link' ? 'After opening the link, return here and check your verification status.' : 'The six-digit code expires after 10 minutes. Requesting a new code invalidates the previous one.'}
          </p>
        </div>

        {verificationMethod === 'code' && <div className="space-y-3">
          <label htmlFor="email-otp-code" className="block text-sm font-medium text-foreground">Email verification code</label>
          <input id="email-otp-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="h-14 w-full rounded-xl border border-border bg-card px-4 text-center text-2xl tracking-[0.5em] text-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20" aria-label="Six-digit email verification code" />
          <Button type="button" className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:brightness-110" onClick={() => void verifyCode()} disabled={isChecking || code.length !== 6}>
            {isChecking ? <><LiquidLoader className="mr-2" />Verifying...</> : 'Verify email'}
          </Button>
        </div>}

        {checkError && <p role="alert" className="text-sm text-destructive">{checkError}</p>}

        <Button type="button" variant="outline" className="h-12 w-full" onClick={() => void checkVerification()} disabled={isChecking}>
          {isChecking ? <><LiquidLoader className="mr-2" />Checking email status...</> : verificationMethod === 'link' ? 'I verified my email — check status' : 'Check for an older verification link'}
        </Button>

        <Button type="button" variant="outline" className="h-12 w-full rounded-xl text-sm font-semibold" onClick={resend} disabled={isLoading || cooldown > 0}>
          {isLoading ? <><LiquidLoader className="mr-2" />Sending...</> : cooldown ? `Send another email in ${cooldown}s` : verificationMethod === 'link' ? 'Send another verification link' : 'Send a new verification code'}
        </Button>
      </div>
    </AuthShell>
  );
}
