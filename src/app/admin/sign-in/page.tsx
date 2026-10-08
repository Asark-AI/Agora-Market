'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getMultiFactorResolver,
  multiFactor,
  signInWithEmailAndPassword,
  signOut,
  TotpMultiFactorGenerator,
  type MultiFactorError,
  type MultiFactorResolver,
  type TotpSecret,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

type Stage = 'credentials' | 'totp' | 'enrollment';

function authFailureMessage(error: unknown, fallback: string) {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/network-request-failed') return 'Could not reach Firebase Authentication. Check your connection and try again.';
  if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
    return 'TOTP MFA is not enabled for this Firebase project. Upgrade the project to Firebase Authentication with Identity Platform and enable TOTP MFA.';
  }
  if (code === 'auth/too-many-requests') return 'Too many sign-in attempts. Wait a while before trying again.';
  if (code === 'auth/user-disabled') return 'This Admin account is disabled. Contact Agora support.';
  if (code === 'auth/invalid-api-key' || code === 'auth/configuration-not-found') {
    return 'Admin authentication is misconfigured. Contact Agora support.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'The sign-in details could not be verified. Check your credentials and try again.';
  }
  if (error instanceof Error && !('code' in error)) return error.message;
  return fallback;
}

async function reportFailedLogin() {
  try {
    await fetch('/api/admin/auth/security-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'login-failed' }),
      cache: 'no-store',
    });
  } catch {
    // Failed-login audit reporting must not expose auth details or block the sign-in response.
  }
}

export default function AdminSignInPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'notice'>('notice');
  const [busy, setBusy] = useState(false);
  const [resolver, setResolver] = useState<MultiFactorResolver | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);

  const finishAdminSignIn = async (user: User) => {
    if (!auth) throw new Error('Admin sign-in is unavailable.');
    if (!user.emailVerified) {
      await signOut(auth);
      throw new Error('This administrator account must have a verified email address.');
    }
    const token = await user.getIdTokenResult(true);
    if (token.claims.role !== 'super_admin') {
      await signOut(auth);
      throw new Error('This account is not provisioned for Super Admin access. Contact an authorized Agora administrator.');
    }

    const hasTotp = multiFactor(user).enrolledFactors
      .some((factor) => factor.factorId === TotpMultiFactorGenerator.FACTOR_ID);
    if (!hasTotp) {
      const session = await multiFactor(user).getSession();
      const secret = await TotpMultiFactorGenerator.generateSecret(session);
      setPendingUser(user);
      setTotpSecret(secret);
      setCode('');
      setStage('enrollment');
      setMessageType('notice');
      setMessage('Set up an authenticator app before opening the Admin workspace.');
      return;
    }

    const idToken = await user.getIdToken(true);
    const response = await fetch('/api/admin/auth/session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
      cache: 'no-store',
    });
    if (!response.ok) {
      await signOut(auth);
      throw new Error('Admin sign-in requires verified email and TOTP MFA. Check the Identity Platform MFA configuration.');
    }
    router.replace('/super/app/dashboard');
  };

  const submitCredentials = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) {
      setMessageType('error');
      setMessage('Admin sign-in is unavailable. Firebase configuration is missing.');
      return;
    }
    setBusy(true);
    setMessageType('notice');
    setMessage('');
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await finishAdminSignIn(credential.user);
    } catch (error) {
      const authError = error as MultiFactorError;
      if (authError.code === 'auth/multi-factor-auth-required') {
        const nextResolver = getMultiFactorResolver(auth, authError);
        const totpHint = nextResolver.hints.find(
          (hint) => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID,
        );
        if (!totpHint) {
          void reportFailedLogin();
          setMessageType('error');
          setMessage('This account has no supported TOTP factor. Contact Agora support to recover access.');
        } else {
          setResolver(nextResolver);
          setCode('');
          setStage('totp');
          setMessageType('notice');
          setMessage('Enter the six-digit code from your authenticator app.');
        }
      } else {
        void reportFailedLogin();
        setMessageType('error');
        setMessage(authFailureMessage(error, 'The sign-in details could not be verified. Check your credentials and try again.'));
      }
    } finally {
      setBusy(false);
      setPassword('');
    }
  };

  const submitTotp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resolver || !auth || !/^\d{6}$/.test(code)) {
      setMessageType('error');
      setMessage('Enter a valid six-digit authenticator code.');
      return;
    }
    const hint = resolver.hints.find(
      (factor) => factor.factorId === TotpMultiFactorGenerator.FACTOR_ID,
    );
    if (!hint) {
      setMessageType('error');
      setMessage('A TOTP factor is not available for this account. Contact Agora support.');
      return;
    }
    setBusy(true);
    setMessageType('notice');
    setMessage('');
    try {
      const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code);
      const credential = await resolver.resolveSignIn(assertion);
      setResolver(null);
      await finishAdminSignIn(credential.user);
    } catch (error) {
      void reportFailedLogin();
      setCode('');
      setMessageType('error');
      setMessage(authFailureMessage(error, 'That authenticator code was not accepted. Check the time on your device and try again.'));
    } finally {
      setBusy(false);
    }
  };

  const enrollTotp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingUser || !totpSecret || !/^\d{6}$/.test(code)) {
      setMessageType('error');
      setMessage('Enter a valid six-digit authenticator code.');
      return;
    }
    setBusy(true);
    setMessageType('notice');
    setMessage('');
    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(totpSecret, code);
      await multiFactor(pendingUser).enroll(assertion, 'Agora Admin authenticator');
      if (auth) await signOut(auth);
      setPendingUser(null);
      setTotpSecret(null);
      setCode('');
      setStage('credentials');
      setMessageType('notice');
      setMessage('Authenticator setup is complete. Sign in again and enter a fresh code to continue.');
    } catch (error) {
      void reportFailedLogin();
      setCode('');
      setMessageType('error');
      setMessage(authFailureMessage(error, 'That authenticator code was not accepted. Check the time on your device and try again.'));
    } finally {
      setBusy(false);
    }
  };

  const cancelMfa = async () => {
    if (pendingUser && auth?.currentUser?.uid === pendingUser.uid) {
      await signOut(auth);
    }
    setResolver(null);
    setPendingUser(null);
    setTotpSecret(null);
    setCode('');
    setStage('credentials');
    setMessageType('notice');
    setMessage('');
  };

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#f4f6f3] px-4 py-10 text-[#17251d]">
      <section className="w-full max-w-md rounded-2xl border border-[#e0e7e0] bg-white p-6 shadow-[0_24px_70px_-42px_rgba(23,59,43,0.45)] sm:p-8">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a06d16]">Agora Admin</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Secure sign in</h1>
          <p className="mt-2 text-sm leading-6 text-[#627067]">
            Super Admin access requires a verified email and an authenticator-app code.
          </p>
        </header>

        {stage === 'credentials' && (
          <form onSubmit={submitCredentials} className="space-y-5">
            <label className="block space-y-2 text-sm font-medium">
              Administrator email
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-lg border border-[#cfd8d0] bg-white px-3 outline-none focus:border-[#173b2b] focus:ring-2 focus:ring-[#173b2b]/15"
              />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded-lg border border-[#cfd8d0] bg-white px-3 outline-none focus:border-[#173b2b] focus:ring-2 focus:ring-[#173b2b]/15"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="h-12 w-full rounded-lg bg-[#173b2b] font-semibold text-white transition hover:bg-[#112b23] disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? 'Verifying...' : 'Continue securely'}
            </button>
          </form>
        )}

        {stage === 'totp' && (
          <form onSubmit={submitTotp} className="space-y-5">
            <label className="block space-y-2 text-sm font-medium">
              Authenticator code
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-12 w-full rounded-lg border border-[#cfd8d0] bg-white px-3 text-center font-mono text-xl tracking-[0.35em] outline-none focus:border-[#173b2b] focus:ring-2 focus:ring-[#173b2b]/15"
              />
            </label>
            <button type="submit" disabled={busy} className="h-12 w-full rounded-lg bg-[#173b2b] font-semibold text-white disabled:opacity-60">
              {busy ? 'Checking code...' : 'Verify and sign in'}
            </button>
          </form>
        )}

        {stage === 'enrollment' && pendingUser && totpSecret && (
          <form onSubmit={enrollTotp} className="space-y-5">
            <div className="rounded-lg border border-[#e1e9e1] bg-[#f7faf7] p-4 text-sm leading-6">
              <p className="font-semibold">Add Agora Admin to your authenticator</p>
              <p className="mt-2 text-[#627067]">Add this account manually using the TOTP key below. Keep the key private.</p>
              <p className="mt-3 break-all rounded-md bg-white p-3 font-mono text-xs">{totpSecret.secretKey}</p>
              <p className="mt-2 break-all text-xs text-[#627067]">
                Account: {pendingUser.email || email} · Issuer: Agora Admin
              </p>
            </div>
            <label className="block space-y-2 text-sm font-medium">
              Six-digit authenticator code
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-12 w-full rounded-lg border border-[#cfd8d0] bg-white px-3 text-center font-mono text-xl tracking-[0.35em] outline-none focus:border-[#173b2b] focus:ring-2 focus:ring-[#173b2b]/15"
              />
            </label>
            <button type="submit" disabled={busy} className="h-12 w-full rounded-lg bg-[#173b2b] font-semibold text-white disabled:opacity-60">
              {busy ? 'Enabling MFA...' : 'Enable authenticator'}
            </button>
          </form>
        )}

        {message && (
          <p
            role={messageType === 'error' ? 'alert' : 'status'}
            aria-live={messageType === 'error' ? 'assertive' : 'polite'}
            className={`mt-5 rounded-lg border p-3 text-sm font-medium leading-5 ${
              messageType === 'error'
                ? 'border-rose-300 bg-rose-50 text-rose-900'
                : 'border-amber-200 bg-amber-50 text-amber-950'
            }`}
          >
            {message}
          </p>
        )}
        {stage !== 'credentials' && (
          <button type="button" onClick={() => void cancelMfa()} className="mt-4 w-full text-sm font-medium text-[#526057] underline underline-offset-4">
            Cancel and return to sign in
          </button>
        )}
        <div className="mt-7 flex items-center justify-between border-t border-[#e8ece7] pt-5 text-sm">
          <Link href="/admin/forgot-password" className="font-medium text-[#173b2b] underline underline-offset-4">Forgot password?</Link>
          <Link href="/" className="text-[#69776e] hover:text-[#173b2b]">Return to Agora</Link>
        </div>
      </section>
    </main>
  );
}
