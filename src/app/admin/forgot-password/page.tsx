'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        cache: 'no-store',
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'We could not process that request.');
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#f4f6f3] px-4 py-10 text-[#17251d]">
      <section className="w-full max-w-md rounded-2xl border border-[#e0e7e0] bg-white p-6 shadow-[0_24px_70px_-42px_rgba(23,59,43,0.45)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a06d16]">Agora Admin</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Reset admin password</h1>
        <p className="mt-2 text-sm leading-6 text-[#627067]">Enter your administrator email. If it belongs to an eligible Super Admin account, we will send a one-time reset link.</p>
        {submitted ? (
          <div role="status" className="mt-7 rounded-xl border border-[#cfe1d2] bg-[#f2f8f3] p-4 text-sm leading-6 text-[#365943]">
            If an eligible Agora Admin account uses that address, password-reset instructions will arrive shortly. The reset link will not sign you in; you must return here and complete MFA.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-5">
            <label className="block space-y-2 text-sm font-medium">
              Administrator email
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-lg border border-[#cfd8d0] px-3 outline-none focus:border-[#173b2b] focus:ring-2 focus:ring-[#173b2b]/15"
              />
            </label>
            {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
            <button type="submit" disabled={busy} className="h-12 w-full rounded-lg bg-[#173b2b] font-semibold text-white disabled:opacity-60">
              {busy ? 'Sending request...' : 'Send reset link'}
            </button>
          </form>
        )}
        <Link href="/admin/sign-in" className="mt-6 block text-center text-sm font-medium text-[#173b2b] underline underline-offset-4">Back to Admin sign in</Link>
      </section>
    </main>
  );
}
