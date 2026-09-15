
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
import { AppLogo } from '@/components/app-logo';

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
  const hasRouted = useRef(false);

  useEffect(() => {
    if (searchParams.has('email') || searchParams.has('password')) {
      router.replace('/sign-in');
    }
  }, [router, searchParams]);
  
  useEffect(() => {
    if (loading) return;

    if (user && !hasRouted.current) {
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
          const targetPath = isSuperAdmin && secureSessionReady ? (requestedPath || '/admin') : '/';
          router.replace(targetPath);
        }
      };

      void routeUser();
      return () => { active = false; };
    }
  }, [user, firebaseUser, seller, loading, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsFormLoading(true);
    try {
      await logIn(data.email, data.password);
      toast({ title: 'Logged In Successfully!' });
      // navigation handled by effect when auth state settles
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
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
    <main className="flex min-h-screen items-start justify-center bg-background px-4 py-10 sm:items-center sm:py-16">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex items-center gap-3">
          <AppLogo className="size-9 text-primary" />
          <span className="text-sm font-semibold tracking-[0.18em]">AGORA</span>
        </div>
        <div className="mb-7">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to shop or manage your account.</p>
        </div>
          <Form {...form}>
            <form method="post" noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="m@example.com"
                        {...field}
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
                      <FormLabel>Password</FormLabel>
                      <Link
                        href={"/forgot-password" as Route}
                        className="ml-auto inline-block text-sm underline"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isFormLoading || isGoogleLoading}>
                {isFormLoading ? <><LiquidLoader className="mr-2" />Logging In...</> : 'Log In'}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isFormLoading || isGoogleLoading}>
                {isGoogleLoading ? <><LiquidLoader className="mr-2" />Please wait...</> : 'Login with Google'}
              </Button>
            </form>
          </Form>
          <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="font-medium text-foreground underline underline-offset-4">
              Sign up
            </Link>
          </div>
        </div>
    </main>
  );
}
