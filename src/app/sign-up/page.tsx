
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { LiquidLoader } from '@/components/liquid-loader';
import { AuthShell } from '@/components/auth-shell';
import { GoogleMark } from '@/components/google-mark';

const formSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: 'Please enter your full name.' })
    .max(100, { message: 'Full name is too long.' }),
  email: z
    .string()
    .trim()
    .email({ message: 'Please enter a valid email.' })
    .transform((s) => s.toLowerCase()),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters.' })
    .regex(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/,
      'Password must include upper and lower case letters, a number, and a symbol.'
    ),
  confirmPassword: z.string().min(1, { message: 'Please confirm your password.' }),
  termsAccepted: z.boolean().refine((value) => value, { message: 'Please accept the terms to continue.' }),
}).refine((values) => values.password === values.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.',
});

type FormValues = z.infer<typeof formSchema>;

export default function SignUpPage() {
  const { signUp, signInWithGoogle, logOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const isMounted = useRef(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
  });

  const { isValid, isSubmitting } = form.formState;
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const passwordValue = form.watch('password');

  const getErrorMessage = (error: unknown): string => {
    if (!error) return 'An unknown error occurred.';
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return (error as any)?.message ?? 'An unknown error occurred.';
  };

  const onSubmit = async (rawData: FormValues) => {
    const data = {
      fullName: rawData.fullName.trim(),
      email: rawData.email.trim().toLowerCase(),
      password: rawData.password,
    };

    setIsLoading(true);
    try {
      const result = await signUp(data.email, data.password, data.fullName);
      toast(result.verificationEmailSent
        ? { title: 'Account created', description: result.verificationMethod === 'link' ? 'Check your inbox for a Firebase verification link.' : 'Check your inbox for a six-digit verification code.' }
        : { variant: 'destructive', title: 'Account created, email not sent', description: 'Use the resend option on the verification screen to request another email.' });
      const methodParam = result.verificationMethod === 'link' ? '&method=link' : '';
      router.replace(`/sign-up/verify?email=${encodeURIComponent(data.email)}${result.verificationEmailSent ? methodParam : '&send=failed'}`);
    } catch (error: unknown) {
      const errMsg = getErrorMessage(error);
      const code = (error as any)?.code;
      let description = errMsg;
      if (code === 'auth/email-already-in-use' || /email.*already/i.test(String(errMsg))) {
        description = 'This email is already in use. Please try logging in instead.';
      }
      toast({ variant: 'destructive', title: 'Sign Up Failed', description });
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const signedInUser = await signInWithGoogle();
      const token = await signedInUser.getIdTokenResult();
      if (token.claims.role === 'super_admin' || token.claims.superAdmin === true) {
        await logOut();
        toast({ title: 'Use Admin sign in', description: 'Super Admin accounts must sign in through the separate Admin portal.' });
        router.replace('/admin/sign-in');
      } else {
        toast({ title: 'Account created', description: 'Your Google account is ready to use.' });
        router.replace('/');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-Up Failed',
        description: error?.code === 'auth/popup-closed-by-user' ? 'The sign-in popup was closed.' : error?.message || 'Please try again.',
      });
    } finally {
      if (isMounted.current) setIsGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      description="One account for shopping, orders and selling on Agora."
      alternateHref="/sign-in"
      alternateLabel="Sign in"
      alternatePrompt="Already have an account?"
    >
      <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-5"
            aria-busy={isLoading || isSubmitting || isGoogleLoading}
          >
            <div className="grid gap-5">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-sm font-medium text-foreground">Full name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ama Serwaa"
                        autoComplete="name"
                        aria-label="Full name"
                        className="h-14 rounded-xl border-border bg-card px-4 text-base text-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-sm font-medium text-foreground">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        aria-label="Email address"
                        className="h-14 rounded-xl border-border bg-card px-4 text-base text-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
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
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-sm font-medium text-foreground">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          autoComplete="new-password"
                          aria-label="Password"
                          aria-describedby="password-strength-label password-suggestions"
                          className="h-14 rounded-xl border-border bg-card px-4 pr-12 text-base text-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-2 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-primary"
                          aria-pressed={showPassword}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </div>
                    </FormControl>

                    {passwordValue && <div id="password-suggestions" className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-live="polite">
                      {[
                        ['8+ characters', passwordValue.length >= 8],
                        ['One number', /\d/.test(passwordValue)],
                        ['One special character', /[^A-Za-z0-9]/.test(passwordValue)],
                      ].map(([label, passed]) => <span key={String(label)} className={passed ? 'text-emerald-400' : 'text-muted-foreground'}><Check className="mr-1 inline size-3.5" />{label}</span>)}
                    </div>}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-sm font-medium text-foreground">Confirm password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Re-enter your password"
                          autoComplete="new-password"
                          aria-label="Confirm password"
                          className="h-14 rounded-xl border-border bg-card px-4 pr-12 text-base text-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                        <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-2 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-primary" aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}>
                          {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField control={form.control} name="termsAccepted" render={({ field }) => (
              <FormItem className="pt-2">
                <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-muted-foreground">
                  <input type="checkbox" checked={field.value} onChange={field.onChange} className="mt-0.5 size-4 accent-primary" />
                  <span>I agree to the <a href="/terms" className="font-medium text-primary underline-offset-4 hover:underline">Terms of Service</a> and <a href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">Privacy Policy</a>.</span>
                </label>
                <FormMessage />
              </FormItem>
            )} />

            <Button
              type="submit"
              className="h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-primary"
              disabled={!isValid || isLoading || isGoogleLoading}
              aria-disabled={!isValid || isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <>
                  <LiquidLoader className="mr-2" role="status" aria-live="polite" />
                  Creating Account...
                </>
              ) : (
                <>Create account <ArrowRight className="ml-2 size-4" /></>
              )}
            </Button>

            <div className="relative flex items-center">
              <div className="h-px flex-1 bg-border" />
              <span className="px-3 text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-14 w-full rounded-xl border-border bg-card text-base font-medium text-foreground hover:border-primary/50 hover:bg-accent hover:text-primary"
              onClick={handleGoogleSignUp}
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? <><LiquidLoader className="mr-2" />Connecting...</> : <><GoogleMark className="mr-3 size-5" />Continue with Google</>}
            </Button>
          </form>
      </Form>
    </AuthShell>
  );
}
