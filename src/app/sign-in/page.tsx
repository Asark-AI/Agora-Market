
'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { AuthShell } from '@/components/auth-shell';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LiquidLoader } from '@/components/liquid-loader';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignInPage() {
  const { logIn, signInWithGoogle, user, firebaseUser, loading, seller } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const hasRouted = useRef(false);

  useEffect(() => {
    if (searchParams.has('email') || searchParams.has('password')) {
      router.replace('/sign-in');
    }
  }, [router, searchParams]);
  
  useEffect(() => {
    if (loading) return;

    if (user && !hasRouted.current) {
      if (firebaseUser && !firebaseUser.emailVerified) {
        setAuthError('Please verify your email address before continuing.');
        router.replace(`/sign-up/verify?email=${encodeURIComponent(firebaseUser.email || '')}`);
        hasRouted.current = false;
        return;
      }

      hasRouted.current = true;
      let active = true;
      const routeUser = async () => {
        let isSuperAdmin = false;
        let secureSessionReady = false;
        try {
          const token = await firebaseUser?.getIdTokenResult(true);
          isSuperAdmin = token?.claims.superAdmin === true;
          const idToken = await firebaseUser?.getIdToken();
          if (idToken) {
            const sessionResponse = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { Authorization: `Bearer ${idToken}` },
            });
            secureSessionReady = sessionResponse.ok;
          }
        } catch (error) {
          console.warn('Unable to check admin claims after sign in:', error);
        }

        if (active) {
          const requestedPath = searchParams.get('next');
          if (isSuperAdmin && !secureSessionReady) {
            setAuthError('Your credentials were accepted, but the secure Admin session could not be created. Restart the local server and try again.');
            hasRouted.current = false;
            return;
          }
          const targetPath = isSuperAdmin ? (requestedPath || '/admin') : '/';
          router.replace(targetPath);
        }
      };

      void routeUser();
      return () => { active = false; };
    }
  }, [user, firebaseUser, seller, loading, router, searchParams]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsFormLoading(true);
    setAuthError('');
    try {
      await logIn(data.email, data.password);
      toast({ title: 'Logged In Successfully!' });
      // navigation handled by effect when auth state settles
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unable to sign in. Please try again.';
      setAuthError(message);
      toast({ variant: 'destructive', title: 'Login Failed', description: message });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast({ title: "Logged In Successfully!" });
      // navigation handled by effect when auth state settles
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: error.code === 'auth/popup-closed-by-user' ? 'The sign-in popup was closed.' : error.message,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Agora"
      description="Access your marketplace account, orders, and store tools."
      alternateHref="/sign-up"
      alternateLabel="Create an account"
      alternatePrompt="New to Agora?"
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {['Fast checkout', 'Secure orders', 'Seller tools'].map((item) => (
            <div key={item} className="rounded-2xl border border-[#ebefe9] bg-[#f8faf8] px-3 py-2 text-center text-[11px] font-medium text-[#4f5d57] shadow-[0_10px_25px_-18px_rgba(23,59,43,0.45)]">
              {item}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 rounded-[1.75rem] border border-[#edf0ea] bg-[#f8faf8] p-4 shadow-[0_24px_40px_-28px_rgba(23,59,43,0.28)] sm:p-5" aria-busy={isFormLoading || isGoogleLoading}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-[#24332c]">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="m@example.com"
                      autoComplete="email"
                      className="h-12 rounded-xl border-[#dfe7e2] bg-white text-sm shadow-none focus-visible:ring-[#d7a84a]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel className="text-sm font-medium text-[#24332c]">Password</FormLabel>
                    <Link
                      href={"/forgot-password" as Route}
                      className="ml-auto inline-block text-xs font-medium text-[#173b2b] underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="current-password"
                      aria-invalid={Boolean(authError)}
                      className="h-12 rounded-xl border-[#dfe7e2] bg-white text-sm shadow-none focus-visible:ring-[#d7a84a]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {authError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{authError}</p>}
            <Button type="submit" className="h-12 w-full rounded-xl bg-[#173b2b] text-sm font-semibold text-[#f7f3ee] shadow-[0_18px_32px_-16px_rgba(23,59,43,0.8)] transition hover:bg-[#112b23]" disabled={isFormLoading || isGoogleLoading}>
              {isFormLoading ? <><LiquidLoader className="mr-2" />Logging In...</> : 'Log In'}
            </Button>
            <div className="relative flex items-center">
              <div className="h-px flex-1 bg-[#e5ece5]" />
              <span className="px-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#7a8b7d]">or</span>
              <div className="h-px flex-1 bg-[#e5ece5]" />
            </div>
            <Button type="button" variant="outline" className="h-12 w-full rounded-xl border-[#dfe7e2] bg-white text-sm font-medium text-[#18382d] hover:bg-[#f5f7f4]" onClick={handleGoogleSignIn} disabled={isFormLoading || isGoogleLoading}>
              {isGoogleLoading ? <><LiquidLoader className="mr-2" />Please wait...</> : 'Continue with Google'}
            </Button>
          </form>
        </Form>
      </div>
    </AuthShell>
  );
}
