'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { confirmPasswordReset, signOut, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/;

function friendlyResetError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/expired-action-code') return 'This reset link has expired. Request a new one to continue.';
  if (code === 'auth/invalid-action-code') return 'This reset link is invalid or has already been used. Request a new link.';
  if (code === 'auth/weak-password') return 'Choose a stronger password that meets all listed requirements.';
  if (code === 'auth/network-request-failed') return 'The reset request could not reach Agora. Check your connection and try again.';
  return 'We could not validate this reset link. Request a new link and try again.';
}

export default function AdminResetPasswordPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const actionCode = searchParams.get('oobCode') || '';
  const verifiedCode = useRef('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid' | 'success'>('checking');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode !== 'resetPassword' || !actionCode || !auth) {
      setStatus('invalid');
      setMessage(mode === 'resetPassword' && !auth
        ? 'Admin password reset is unavailable. Contact Agora support.'
        : 'This reset link is incomplete or invalid. Request a new link.');
      return;
    }
    let active = true;
    void verifyPasswordResetCode(auth, actionCode).then((accountEmail) => {
      return fetch('/api/admin/auth/password-reset/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oobCode: actionCode }),
        cache: 'no-store',
      }).then(async (response) => {
        const result = await response.json() as { email?: string };
        if (!response.ok || !result.email || result.email.toLowerCase() !== accountEmail.toLowerCase()) {
          throw new Error('This reset link is not valid for an active Agora Admin account.');
        }
        if (!active) return;
        verifiedCode.current = actionCode;
        setEmail(result.email);
        setStatus('ready');
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('oobCode');
        cleanUrl.searchParams.delete('apiKey');
        cleanUrl.searchParams.delete('continueUrl');
        cleanUrl.searchParams.delete('lang');
        window.history.replaceState({}, '', cleanUrl.toString());
      });
    }).catch((error: unknown) => {
      if (!active) return;
      setStatus('invalid');
      setMessage(friendlyResetError(error));
    });
    return () => { active = false; };
  }, [actionCode, mode]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth || !verifiedCode.current) {
      setMessage('This reset link is no longer available. Request a new link.');
      setStatus('invalid');
      return;
    }
    if (!strongPassword.test(password)) {
      setMessage('Your new password does not meet the security requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('The passwords do not match.');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      await confirmPasswordReset(auth, verifiedCode.current, password);
      verifiedCode.current = '';
      await Promise.allSettled([
        fetch('/api/admin/auth/session', { method: 'DELETE', cache: 'no-store' }),
        auth.currentUser?.email?.toLowerCase() === email.toLowerCase() ? signOut(auth) : Promise.resolve(),
      ]);
      try {
        await fetch('/api/admin/auth/security-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'password-reset-completed' }),
          cache: 'no-store',
        });
      } catch {
        // Password reset succeeded; audit reporting failure must not misstate the result.
      }
      setPassword('');
      setConfirmPassword('');
      setStatus('success');
      setMessage('Your password has been changed. Sign in again and complete TOTP verification to access Agora Admin.');
    } catch (error) {
      const code = (error as { code?: string })?.code;
      setMessage(friendlyResetError(error));
      if (code === 'auth/expired-action-code' || code === 'auth/invalid-action-code') {
        verifiedCode.current = '';
        setStatus('invalid');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#f4f6f3] px-4 py-10 text-[#17251d]">
      <section className="w-full max-w-md rounded-2xl border border-[#e0e7e0] bg-white p-6 shadow-[0_24px_70px_-42px_rgba(23,59,43,0.45)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a06d16]">Agora Admin</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="mt-2 text-sm leading-6 text-[#627067]">Create a new password for your Super Admin account. You will need to sign in again and verify your authenticator.</p>

        {status === 'checking' && <p role="status" className="mt-7 text-sm text-[#627067]">Validating your secure reset link...</p>}
        {status === 'ready' && (
          <form onSubmit={submit} className="mt-7 space-y-5">
            <p className="break-all rounded-lg bg-[#f7f8f6] p-3 text-sm text-[#536057]">Account: <strong>{email}</strong></p>
            <label className="block space-y-2 text-sm font-medium">
              New password
              <input type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-lg border border-[#cfd8d0] px-3 outline-none focus:border-[#173b2b] focus:ring-2 focus:ring-[#173b2b]/15" />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Confirm new password
              <input type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-12 w-full rounded-lg border border-[#cfd8d0] px-3 outline-none focus:border-[#173b2b] focus:ring-2 focus:ring-[#173b2b]/15" />
            </label>
            <ul className="grid gap-1 text-xs text-[#627067] sm:grid-cols-2">
              <li>At least 12 characters</li><li>Uppercase and lowercase</li><li>At least one number</li><li>At least one symbol</li>
            </ul>
            {message && <p role="alert" className="text-sm text-rose-700">{message}</p>}
            <button type="submit" disabled={busy} className="h-12 w-full rounded-lg bg-[#173b2b] font-semibold text-white disabled:opacity-60">
              {busy ? 'Updating password...' : 'Reset password'}
            </button>
          </form>
        )}
        {status === 'success' && <p role="status" className="mt-7 rounded-xl border border-[#cfe1d2] bg-[#f2f8f3] p-4 text-sm leading-6 text-[#365943]">{message}</p>}
        {status === 'invalid' && <p role="alert" className="mt-7 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{message}</p>}
        {(status === 'success' || status === 'invalid') && (
          <Link href="/admin/sign-in" className="mt-6 block rounded-lg bg-[#173b2b] px-4 py-3 text-center text-sm font-semibold text-white">
            {status === 'success' ? 'Return to Admin sign in' : 'Go to Admin sign in'}
          </Link>
        )}
        <Link href="/admin/forgot-password" className="mt-4 block text-center text-sm font-medium text-[#173b2b] underline underline-offset-4">Request another reset link</Link>
      </section>
    </main>
  );
}
