'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { AlertCircle, Check, Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react';
import { AuthShell } from '@/components/auth-shell';
import { AppLogo } from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { auth } from '@/lib/firebase';

type CodeStatus = 'checking' | 'ready' | 'invalid' | 'success' | 'unavailable';

const initialError = 'This password reset link is invalid or has expired. Request a new reset link to continue.';

function authErrorMessage(code: string | undefined) {
  switch (code) {
    case 'auth/expired-action-code':
    case 'auth/invalid-action-code':
      return 'This password reset link has expired or has already been used. Request a new link to continue.';
    case 'auth/weak-password':
      return 'Choose a stronger password that meets each requirement below.';
    case 'auth/network-request-failed':
      return 'We could not reach Agora securely. Check your connection and try again.';
    case 'auth/user-disabled':
      return 'This account is currently unavailable. Please contact Agora Support.';
    default:
      return 'We could not reset your password. Request a new link or try again.';
  }
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const actionCode = searchParams.get('oobCode') || '';
  const [status, setStatus] = useState<CodeStatus>('checking');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const verifiedCode = useRef('');

  useEffect(() => {
    let active = true;
    if (verifiedCode.current) return () => { active = false; };
    if (mode !== 'resetPassword' || !actionCode || actionCode.length > 4_096 || !auth) {
      setStatus(!auth ? 'unavailable' : 'invalid');
      setError(!auth ? 'Password reset is temporarily unavailable. Please try again later.' : initialError);
      if (typeof window !== 'undefined' && window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      return () => { active = false; };
    }

    setStatus('checking');
    void verifyPasswordResetCode(auth, actionCode)
      .then((accountEmail) => {
        if (!active) return;
        verifiedCode.current = actionCode;
        setEmail(accountEmail);
        setStatus('ready');
        window.history.replaceState({}, '', window.location.pathname);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const code = (cause as { code?: string })?.code;
        setError(authErrorMessage(code));
        setStatus('invalid');
        window.history.replaceState({}, '', window.location.pathname);
      });
    return () => { active = false; };
  }, [actionCode, mode]);

  const requirements = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'Uppercase and lowercase letters', valid: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'At least one number', valid: /\d/.test(password) },
    { label: 'At least one special character', valid: /[^A-Za-z0-9]/.test(password) },
  ];
  const passwordIsStrong = requirements.every((item) => item.valid);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth || status !== 'ready' || submitting) return;
    if (!passwordIsStrong) {
      setError('Choose a password that meets all the requirements.');
      return;
    }
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await confirmPasswordReset(auth, verifiedCode.current, password);
      setPassword('');
      setConfirmation('');
      setStatus('success');
    } catch (cause) {
      const code = (cause as { code?: string })?.code;
      setError(authErrorMessage(code));
      if (code === 'auth/expired-action-code' || code === 'auth/invalid-action-code') {
        verifiedCode.current = '';
        setStatus('invalid');
      }
    } finally {
      setSubmitting(false);
    }
  };

  let title = 'Reset your password';
  let description = 'Create a new password for your Agora account.';
  if (status === 'checking') {
    title = 'Checking your reset link';
    description = 'We are securely verifying your one-time password reset link.';
  } else if (status === 'success') {
    title = 'Password updated';
    description = 'Your Agora password has been changed successfully.';
  } else if (status === 'invalid' || status === 'unavailable') {
    title = 'Reset link unavailable';
    description = 'This link cannot be used to reset your password.';
  }

  return (
    <AuthShell
      eyebrow="Agora account security"
      title={title}
      description={description}
      alternateHref="/sign-in"
      alternateLabel="Sign in"
      alternatePrompt="Remember your password?"
    >
      <div className="mb-5 flex items-center gap-3">
        <AppLogo className="size-9 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Agora Ghana</span>
      </div>
      {status === 'checking' && (
        <div className="agora-card flex items-center justify-center gap-3 rounded-2xl p-8 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="size-5 animate-spin text-primary" />
          Verifying secure link…
        </div>
      )}

      {status === 'ready' && (
        <form onSubmit={submit} className="agora-card space-y-5 rounded-2xl p-4 sm:p-5" aria-busy={submitting}>
          {email && (
            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Password for</p>
              <p className="mt-1 break-all text-sm font-semibold text-foreground">{email}</p>
            </div>
          )}

          <div>
            <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-foreground">New password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
                maxLength={128}
                className="h-12 rounded-xl border-border bg-background pl-10 pr-12 text-sm text-foreground"
                aria-describedby="password-requirements"
              />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-primary" aria-label={showPassword ? 'Hide new password' : 'Show new password'}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-foreground">Confirm password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={showConfirmation ? 'text' : 'password'}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
                required
                maxLength={128}
                className="h-12 rounded-xl border-border bg-background pl-10 pr-12 text-sm text-foreground"
              />
              <button type="button" onClick={() => setShowConfirmation((visible) => !visible)} className="absolute right-2 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-primary" aria-label={showConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}>
                {showConfirmation ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {confirmation && password !== confirmation && (
            <p role="status" className="text-sm text-destructive">The passwords do not match.</p>
          )}

          <ul id="password-requirements" className="grid gap-2 text-xs sm:grid-cols-2">
            {requirements.map((item) => (
              <li key={item.label} className={item.valid ? 'text-emerald-400' : 'text-muted-foreground'}>
                <Check className="mr-1 inline size-3.5" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>

          {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</p>}

          <Button type="submit" className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:brightness-110" disabled={submitting || !passwordIsStrong || password !== confirmation}>
            {submitting ? <><LoaderCircle className="mr-2 size-4 animate-spin" />Updating password…</> : 'Reset Password'}
          </Button>
        </form>
      )}

      {status === 'invalid' && (
        <div className="agora-card space-y-5 rounded-2xl border-primary/30 p-5">
          <p role="alert" className="text-sm leading-6 text-muted-foreground">{error || initialError}</p>
          <Button asChild className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:brightness-110">
            <Link href="/forgot-password">Request a new reset link</Link>
          </Button>
        </div>
      )}

      {status === 'unavailable' && (
        <div className="agora-card space-y-4 rounded-2xl border-destructive/30 p-5">
          <p role="alert" className="text-sm leading-6 text-destructive">{error}</p>
          <Button asChild variant="outline" className="h-12 w-full rounded-xl"><Link href="/sign-in">Back to sign in</Link></Button>
        </div>
      )}

      {status === 'success' && (
        <div className="agora-panel space-y-5 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary"><Check className="size-5" /></div>
            <p className="pt-1 text-sm leading-6 text-foreground">Your password has been changed. You can now sign in with your new password.</p>
          </div>
          <Button asChild className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:brightness-110"><Link href="/sign-in">Continue to sign in</Link></Button>
        </div>
      )}
    </AuthShell>
  );
}
