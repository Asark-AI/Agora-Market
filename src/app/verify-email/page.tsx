'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LiquidLoader } from '@/components/liquid-loader';

export default function VerifyEmailPage() {
  const { firebaseUser, refreshEmailVerification, resendVerificationEmail, logOut, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!loading && !firebaseUser) router.replace('/sign-in');
  }, [firebaseUser, loading, router]);

  const handleResend = async () => {
    setIsSending(true);
    try {
      await resendVerificationEmail();
      toast({ title: 'Verification email sent', description: 'Check your inbox and spam folder.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Could not send email', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      const verified = await refreshEmailVerification();
      if (verified) {
        toast({ title: 'Email verified', description: 'Your Agora account is ready.' });
        router.replace('/');
      } else {
        toast({ title: 'Not verified yet', description: 'Open the verification link in your email, then try again.' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Could not check status', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setIsChecking(false);
    }
  };

  if (loading || !firebaseUser) return <LiquidLoader />;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Verify your email</CardTitle>
          <CardDescription>We sent a verification link to {firebaseUser.email || 'your email address'}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={handleCheck} disabled={isChecking || isSending}>
            {isChecking ? <><LiquidLoader className="mr-2" />Checking...</> : 'I verified my email'}
          </Button>
          <Button className="w-full" variant="outline" onClick={handleResend} disabled={isSending || isChecking}>
            {isSending ? <><LiquidLoader className="mr-2" />Sending...</> : 'Resend verification email'}
          </Button>
          <div className="flex items-center justify-between pt-2 text-sm">
            <Link href="/sign-in" className="text-muted-foreground underline">Return to sign in</Link>
            <button type="button" onClick={logOut} className="text-muted-foreground underline">Use another account</button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
