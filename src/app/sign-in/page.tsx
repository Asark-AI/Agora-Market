
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
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
      description="Shop, track your orders and manage your account."
      alternateHref="/sign-up"
      alternateLabel="Create an account"
      alternatePrompt="New to Agora?"
      browseHref="/"
    >
      <Form {...form}>
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5" aria-busy={isFormLoading || isGoogleLoading}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-[#24332c]">Email address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="m@example.com"
                      autoComplete="email"
                      className="h-14 rounded-md border-[#cfd8d0] bg-white px-4 text-base shadow-none focus-visible:border-[#173b2b] focus-visible:ring-2 focus-visible:ring-[#173b2b]/15"
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
                        className="ml-auto inline-block text-sm font-medium text-[#173b2b] underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          aria-invalid={Boolean(authError)}
                          className="h-14 rounded-md border-[#cfd8d0] bg-white px-4 pr-12 text-base shadow-none focus-visible:border-[#173b2b] focus-visible:ring-2 focus-visible:ring-[#173b2b]/15"
                        />
                        <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center text-[#66736a] hover:text-[#173b2b]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {authError && <p role="alert" className="border-l-2 border-[#b42318] bg-[#fff6f5] px-3 py-2 text-sm font-medium text-[#b42318]">{authError}</p>}
            <Button type="submit" className="h-14 w-full rounded-md bg-[#173b2b] text-base font-semibold text-white transition hover:bg-[#102d22] focus-visible:ring-2 focus-visible:ring-[#d7a84a]" disabled={isFormLoading || isGoogleLoading}>
              {isFormLoading ? <><LiquidLoader className="mr-2" />Signing in...</> : <>Sign in <ArrowRight className="ml-2 size-4" /></>}
            </Button>
            <div className="relative flex items-center">
              <div className="h-px flex-1 bg-[#dfe6df]" />
              <span className="px-3 text-xs text-[#78847b]">or</span>
              <div className="h-px flex-1 bg-[#dfe6df]" />
            </div>
            <Button type="button" variant="outline" className="h-14 w-full rounded-md border-[#cfd8d0] bg-white text-base font-medium text-[#18382d] hover:bg-[#f7f9f7]" onClick={handleGoogleSignIn} disabled={isFormLoading || isGoogleLoading}>
              {isGoogleLoading ? <><LiquidLoader className="mr-2" />Connecting...</> : <><span className="mr-3 text-lg font-bold text-[#4285f4]">G</span>Continue with Google</>}
            </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
