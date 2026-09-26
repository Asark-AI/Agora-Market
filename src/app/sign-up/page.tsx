
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
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
}).refine((values) => values.password === values.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.',
});

type FormValues = z.infer<typeof formSchema>;

type PasswordAnalysis = {
  percent: number; // 0 - 100
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  colorClass: string; // tailwind class for the bar
  suggestions: string[];
};

function analyzePassword(password: string): PasswordAnalysis {
  if (!password) {
    return { percent: 0, label: 'Weak', colorClass: 'bg-red-500', suggestions: [] };
  }

  const checks = {
    length8: password.length >= 8,
    length12: password.length >= 12,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  // weight each check equally (6 checks)
  const matched = Object.values(checks).reduce((s, v) => s + (v ? 1 : 0), 0);
  const percent = Math.round((matched / 6) * 100);

  let label: PasswordAnalysis['label'] = 'Weak';
  let colorClass = 'bg-red-500';
  if (percent >= 85) {
    label = 'Strong';
    colorClass = 'bg-emerald-500';
  } else if (percent >= 65) {
    label = 'Good';
    colorClass = 'bg-amber-400';
  } else if (percent >= 40) {
    label = 'Fair';
    colorClass = 'bg-orange-400';
  } else {
    label = 'Weak';
    colorClass = 'bg-red-500';
  }

  const suggestions: string[] = [];
  if (!checks.length8) suggestions.push('Use at least 8 characters.');
  else if (!checks.length12) suggestions.push('Use 12+ characters for better security.');

  if (!checks.upper) suggestions.push('Add at least one uppercase letter (A–Z).');
  if (!checks.lower) suggestions.push('Add at least one lowercase letter (a–z).');
  if (!checks.digit) suggestions.push('Include at least one number (0–9).');
  if (!checks.special) suggestions.push('Include a symbol (e.g., ! ? $ %).');

  return { percent, label, colorClass, suggestions };
}

export default function SignUpPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const isMounted = useRef(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
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

  const passwordAnalysis = useMemo(() => analyzePassword(passwordValue ?? ''), [passwordValue]);

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
      await signUp(data.email, data.password, data.fullName);
      toast({ title: 'Account created', description: 'We sent a verification email to your inbox.' });
      router.replace(`/sign-up/verify?email=${encodeURIComponent(data.email)}`);
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
      await signInWithGoogle();
      toast({ title: 'Account created', description: 'Your Google account is ready to use.' });
      router.replace('/');
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
      description="Join Agora to discover local businesses or build your own storefront."
      alternateHref="/sign-in"
      alternateLabel="Sign in"
      alternatePrompt="Already have an account?"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 border-b border-[#e5ebe5] pb-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e8f0e8] text-[#173b2b]">
            <span className="text-sm font-semibold">01</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#24332c]">Your details</p>
            <p className="mt-0.5 text-xs text-[#748078]">Create one account for buying and selling.</p>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-5 rounded-[1.5rem] border border-[#e1e9e1] bg-[#f8faf8]/90 p-5 shadow-[0_28px_45px_-30px_rgba(23,59,43,0.3)] sm:p-6"
            aria-busy={isLoading || isSubmitting || isGoogleLoading}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-sm font-medium text-[#24332c]">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ama Serwaa"
                        autoComplete="name"
                        aria-label="Full name"
                        className="h-12 rounded-xl border-[#dfe7e2] bg-white text-sm shadow-none focus-visible:ring-[#d7a84a]"
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
                    <FormLabel className="text-sm font-medium text-[#24332c]">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="m@example.com"
                        autoComplete="email"
                        aria-label="Email address"
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
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-sm font-medium text-[#24332c]">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          autoComplete="new-password"
                          aria-label="Password"
                          aria-describedby="password-strength-label password-suggestions"
                          className="h-12 rounded-xl border-[#dfe7e2] bg-white pr-12 text-sm shadow-none focus-visible:ring-[#d7a84a]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#4b5a53] transition hover:text-[#173b2b]"
                          aria-pressed={showPassword}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </FormControl>

                    <div className="mt-2">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-[#67756d]">
                        <span id="password-strength-label">
                          Strength: <span className="font-semibold text-[#173b2b]">{passwordAnalysis.label}</span>
                        </span>
                        <span>{passwordAnalysis.percent}%</span>
                      </div>

                      <div
                        className="h-2.5 w-full overflow-hidden rounded-full bg-[#edf1ed]"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={passwordAnalysis.percent}
                        aria-label="Password strength"
                      >
                        <div
                          className={`${passwordAnalysis.colorClass} h-full rounded-full`}
                          style={{ width: `${passwordAnalysis.percent}%`, transition: 'width 200ms ease' }}
                        />
                      </div>
                    </div>

                    <div id="password-suggestions" className="mt-2 text-xs" aria-live="polite">
                      {passwordValue ? (
                        passwordAnalysis.suggestions.length ? (
                          <ul className="space-y-1.5 text-[#5d6a63]">
                            {passwordAnalysis.suggestions.map((sugg, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#c3b38f]" />
                                <span>{sugg}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm font-medium text-[#1d7d57]">Looks good — strong password!</div>
                        )
                      ) : (
                        <div className="text-sm text-[#67756d]">Use a mix of letters, numbers and symbols.</div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-sm font-medium text-[#24332c]">Confirm password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        aria-label="Confirm password"
                        className="h-12 rounded-xl border-[#dfe7e2] bg-white text-sm shadow-none focus-visible:ring-[#d7a84a]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-xl border border-[#e6e1d5] bg-[#fffaf0] px-3 py-2 text-xs text-[#5d584b]">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-[#173b2b] text-sm font-semibold text-[#f7f3ee] shadow-[0_18px_32px_-16px_rgba(23,59,43,0.8)] transition hover:bg-[#112b23]"
              disabled={!isValid || isLoading || isGoogleLoading}
              aria-disabled={!isValid || isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <>
                  <LiquidLoader className="mr-2" role="status" aria-live="polite" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="relative flex items-center">
              <div className="h-px flex-1 bg-[#e5ece5]" />
              <span className="px-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#7a8b7d]">or</span>
              <div className="h-px flex-1 bg-[#e5ece5]" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-xl border-[#dfe7e2] bg-white text-sm font-medium text-[#18382d] hover:bg-[#f5f7f4]"
              onClick={handleGoogleSignUp}
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? <><LiquidLoader className="mr-2" />Please wait...</> : 'Continue with Google'}
            </Button>
          </form>
        </Form>
      </div>
    </AuthShell>
  );
}
