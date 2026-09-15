'use client';

import { useEffect, useState } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification } from 'firebase/auth';
import { CheckCircle2, KeyRound, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { SuperAdminShell } from '@/components/super-admin-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/;

type AccountDetails = { email: string | null; emailVerified: boolean };
type Mode = 'email' | 'password' | 'replace' | null;

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('auth/wrong-password') || message.includes('auth/invalid-credential')) return 'Your current password is incorrect.';
  if (message.includes('auth/requires-recent-login')) return 'For your security, please sign in again before changing this information.';
  if (message.includes('auth/invalid-email')) return 'Enter a valid email address.';
  if (message.includes('auth/email-already-in-use')) return 'That email address is already associated with an account.';
  if (message.includes('auth/network-request-failed')) return "We couldn't complete the request. Check your connection and try again.";
  return message || 'Something went wrong. Please try again.';
}

export function SuperAdminAccountSettings() {
  const { firebaseUser, user, logOut } = useAuth();
  const { toast } = useToast();
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [replacement, setReplacement] = useState<{ email: string; existingAccount: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const loadAccount = async () => {
      const token = await firebaseUser?.getIdToken();
      if (!token) return;
      const response = await fetch('/api/super-admin/account', { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) setAccount(await response.json() as AccountDetails);
    };
    void loadAccount();
  }, [firebaseUser]);

  const callAccountApi = async (body: Record<string, unknown>) => {
    const token = await firebaseUser?.getIdToken(true);
    if (!token) throw new Error('Your session has expired. Please sign in again.');
    const response = await fetch('/api/super-admin/account', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({})) as { error?: string; code?: string; targetEmail?: string; existingAccount?: boolean };
    if (!response.ok) {
      const error = new Error(payload.error || 'Something went wrong. Please try again.');
      (error as Error & { code?: string }).code = payload.code;
      throw error;
    }
    return payload;
  };

  const reauthenticate = async () => {
    if (!firebaseUser?.email || !currentPassword) throw new Error('Enter your current password to confirm your identity.');
    const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, credential);
  };

  const submit = async () => {
    setBusy(true);
    try {
      await reauthenticate();
      if (mode === 'email') {
        const normalizedEmail = newEmail.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('Enter a valid email address.');
        await callAccountApi({ action: 'change-email', email: normalizedEmail });
        await firebaseUser?.reload();
        if (firebaseUser && !firebaseUser.emailVerified) await sendEmailVerification(firebaseUser);
        setAccount({ email: normalizedEmail, emailVerified: false });
        toast({ title: 'Email address updated', description: 'Your Super Admin email address has been successfully updated.' });
        setMode(null);
      } else if (mode === 'password') {
        if (!passwordPattern.test(newPassword)) throw new Error('Your new password does not meet the security requirements.');
        if (newPassword !== confirmPassword) throw new Error('Your new passwords do not match.');
        await callAccountApi({ action: 'change-password', password: newPassword });
        toast({ title: 'Password updated', description: 'Your Super Admin password has been successfully changed.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMode(null);
      } else if (mode === 'replace') {
        const normalizedEmail = newEmail.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('Enter a valid email address.');
        const result = await callAccountApi({ action: 'prepare-replacement', email: normalizedEmail, promoteExisting: replaceExisting });
        setReplacement({ email: String(result.targetEmail), existingAccount: Boolean(result.existingAccount) });
        setCurrentPassword('');
      }
    } catch (error) {
      const typedError = error as Error & { code?: string };
      if (typedError.code === 'ACCOUNT_EXISTS') setReplaceExisting(true);
      toast({ variant: 'destructive', title: 'Account update not completed', description: friendlyError(error) });
    } finally {
      setBusy(false);
    }
  };

  const confirmReplacement = async () => {
    setBusy(true);
    try {
      await callAccountApi({ action: 'confirm-replacement' });
      toast({ title: 'Super Admin account updated', description: 'The new Super Admin account is now active.' });
      await logOut();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Replacement not completed', description: friendlyError(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SuperAdminShell userName={user?.name || account?.email || 'Super Admin'} onLogOut={logOut}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Settings</p>
          <h2 className="mt-2 font-headline text-3xl font-semibold tracking-tight">Security</h2>
          <p className="mt-2 text-sm text-slate-500">Manage the credential that controls Agora&apos;s Super Admin access.</p>
        </div>

        <Card className="border-slate-200/80 bg-white shadow-[0_16px_35px_-28px_rgba(15,23,42,0.5)]">
          <CardHeader><CardTitle>Account</CardTitle><CardDescription>Firebase Authentication is the source of truth for this account.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3"><Mail className="mt-0.5 h-5 w-5 text-emerald-700" /><div><p className="text-sm font-medium">Super Admin email</p><a className="break-all text-sm text-emerald-700 hover:underline" href={`mailto:${account?.email || ''}`}>{account?.email || 'Loading account...'}</a><p className="mt-1 text-xs text-slate-500">{account?.emailVerified ? 'Verified email address' : 'Verification required after an email change'}</p></div></div>
              <Button variant="outline" onClick={() => { setMode('email'); setNewEmail(''); }}>Change email</Button>
            </div>
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3"><KeyRound className="mt-0.5 h-5 w-5 text-emerald-700" /><div><p className="text-sm font-medium">Password</p><p className="text-sm text-slate-500">Use a strong password and never reuse it elsewhere.</p></div></div>
              <Button variant="outline" onClick={() => setMode('password')}>Change password</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40 shadow-none">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ShieldAlert className="h-5 w-5 text-amber-700" />Replace Super Admin account</CardTitle><CardDescription>Use this only when ownership of the administrative account must move to another person.</CardDescription></CardHeader>
          <CardContent><Button variant="outline" onClick={() => { setMode('replace'); setNewEmail(''); setReplacement(null); }}>Start replacement</Button></CardContent>
        </Card>

        {mode && !replacement && (
          <Card className="border-slate-200/80 bg-white">
            <CardHeader><CardTitle>{mode === 'email' ? 'Change email' : mode === 'password' ? 'Change password' : 'Replace account'}</CardTitle><CardDescription>Confirm your identity with your current password before continuing.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {(mode === 'email' || mode === 'replace') && <div className="space-y-2"><Label htmlFor="new-email">{mode === 'replace' ? 'New Super Admin email' : 'New email address'}</Label><Input id="new-email" type="email" autoComplete="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="newadmin@gmail.com" /></div>}
              {mode === 'replace' && replaceExisting && <p className="text-sm text-amber-800">This email already belongs to an account. Submit again to promote that existing account after explicit confirmation.</p>}
              {mode === 'email' && <p className="text-xs text-slate-500">A verification email will be sent to the new address.</p>}
              {mode === 'password' && <><div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div><ul className="grid gap-1 text-xs text-slate-500 sm:grid-cols-2"><li>At least 12 characters</li><li>Uppercase and lowercase letter</li><li>Number</li><li>Special character</li></ul></>}
              <div className="space-y-2"><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setMode(null)}>Cancel</Button><Button onClick={() => void submit()} disabled={busy}>{busy ? 'Working...' : 'Continue'}</Button></div>
            </CardContent>
          </Card>
        )}

        {replacement && (
          <Card className="border-rose-200 bg-rose-50/50">
            <CardHeader><CardTitle>Confirm account replacement</CardTitle><CardDescription>The current account remains active until you confirm this final step.</CardDescription></CardHeader>
            <CardContent className="space-y-4"><div className="rounded-lg border border-rose-200 bg-white p-4 text-sm"><p>Current account: <strong>{account?.email}</strong></p><p className="mt-2">New Super Admin: <strong>{replacement.email}</strong></p>{replacement.existingAccount && <p className="mt-3 text-amber-800">This existing account has been promoted with the Super Admin claim.</p>}</div><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => setReplacement(null)}>Cancel</Button><Button variant="destructive" onClick={() => void confirmReplacement()} disabled={busy}>{busy ? 'Finishing...' : 'Confirm replacement'}</Button></div></CardContent>
          </Card>
        )}

        <div className="flex items-start gap-2 text-xs text-slate-500"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><p>Administrative changes are verified server-side using the Firebase Super Admin custom claim and recorded without storing passwords or tokens.</p></div>
      </div>
    </SuperAdminShell>
  );
}
