'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LiquidLoader } from '@/components/liquid-loader';
import { AuthShell } from '@/components/auth-shell';

const formSchema = z.object({ email: z.string().email('Enter a valid email address.') });
type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { email: '' } });

  const onSubmit = async ({ email }: FormValues) => {
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setSubmittedEmail(email.trim().toLowerCase());
      setSent(true);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Could not send reset email', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      description={sent ? 'Check your inbox for the secure link to choose a new password.' : 'Enter the email connected to your Agora account and we will send a secure reset link.'}
      alternateHref="/sign-in"
      alternateLabel="Sign in"
      alternatePrompt="Remember your password?"
    >
          {sent ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-xl border border-[#cfe1d2] bg-[#f2f8f3] p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#dcecdf] text-[#24553d]"><CheckCircle2 className="size-5" /></div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#24553d]">Reset link sent</p>
                  <p className="mt-1 break-words text-sm leading-5 text-[#52705a]">We sent instructions to <span className="font-medium text-[#24553d]">{submittedEmail}</span>.</p>
                </div>
              </div>
              <p className="text-sm leading-6 text-[#6b786e]">The link expires for security. If you do not see it shortly, check your spam folder before requesting another one.</p>
              <Button asChild className="w-full"><Link href="/sign-in">Return to sign in</Link></Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a978c]" />
                        <Input type="email" autoComplete="email" placeholder="you@example.com" className="h-11 border-[#d9e2d9] pl-10 focus-visible:ring-[#24553d]" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="h-11 w-full" disabled={isLoading}>{isLoading ? <><LiquidLoader className="mr-2" />Sending reset link...</> : 'Send reset link'}</Button>
                <Link href="/sign-in" className="flex items-center justify-center gap-2 text-sm font-medium text-[#52705a] underline-offset-4 hover:text-[#173b2b] hover:underline"><ArrowLeft className="size-3.5" />Back to sign in</Link>
              </form>
            </Form>
          )}
    </AuthShell>
  );
}
