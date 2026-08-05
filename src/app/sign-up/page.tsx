
'use client';

import NextImage from 'next/image';
import Link from 'next/link';
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
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must include upper and lower case letters and a number.'
    ),
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
  const { signUp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const isMounted = useRef(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
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
      toast({
        title: 'Account Created!',
        description: 'You have been logged in.',
      });
      router.replace('/seller-signup');
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

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
        <div className="hidden bg-muted lg:block">
        <NextImage
          src="https://picsum.photos/seed/4/1200/1800"
          alt="A collection of handmade Ghanaian crafts"
          width={1200}
          height={1800}
          className="h-full w-full object-cover"
          data-ai-hint="ghanaian crafts"
          priority={false}
        />
      </div>

      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold font-headline">Create an Account</h1>
            <p className="text-balance text-muted-foreground">
              Enter your information to get started on your seller journey.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-4"
              aria-busy={isLoading || isSubmitting}
            >
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ama Serwaa"
                        autoComplete="name"
                        aria-label="Full name"
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
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="m@example.com"
                        autoComplete="email"
                        aria-label="Email address"
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          autoComplete="new-password"
                          aria-label="Password"
                          aria-describedby="password-strength-label password-suggestions"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                          aria-pressed={showPassword}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </FormControl>

                    {/* Strength bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span id="password-strength-label" className="text-muted-foreground">
                          Strength: <span className="font-medium">{passwordAnalysis.label}</span>
                        </span>
                        <span className="text-muted-foreground">{passwordAnalysis.percent}%</span>
                      </div>

                      <div
                        className="w-full h-2 bg-muted rounded overflow-hidden"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={passwordAnalysis.percent}
                        aria-label="Password strength"
                      >
                        <div
                          className={`${passwordAnalysis.colorClass} h-full`}
                          style={{ width: `${passwordAnalysis.percent}%`, transition: 'width 200ms ease' }}
                        />
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div
                      id="password-suggestions"
                      className="mt-2 text-xs"
                      aria-live="polite"
                    >
                      {passwordValue ? (
                        passwordAnalysis.suggestions.length ? (
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {passwordAnalysis.suggestions.map((sugg, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="inline-block w-2 h-2 mt-1 rounded-full bg-muted-foreground/40" />
                                <span>{sugg}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm text-emerald-600">Looks good — strong password!</div>
                        )
                      ) : (
                        <div className="text-sm text-muted-foreground">Use a mix of letters, numbers and symbols.</div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={!isValid || isLoading}
                aria-disabled={!isValid || isLoading}
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
            </form>
          </Form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/sign-in" className="underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
