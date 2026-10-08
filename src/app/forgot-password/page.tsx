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
              <div className="agora-panel rounded-2xl p-5">
                <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary"><CheckCircle2 className="size-5" /></div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Check your inbox</p>
                  <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">Request submitted for <span className="font-medium text-foreground">{submittedEmail}</span>. If an Agora account uses this address, a reset email will arrive shortly.</p>
                </div>
                </div>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">The reset link expires for security. Check your spam folder if you do not see an email, or wait a few minutes before submitting another request.</p>
              <Button asChild className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:brightness-110"><Link href="/sign-in">Return to sign in</Link></Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="agora-card space-y-5 rounded-2xl p-4 sm:p-5" aria-busy={isLoading}>
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Email address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="email" autoComplete="email" placeholder="you@example.com" className="h-12 rounded-xl border-border bg-background pl-10 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:brightness-110" disabled={isLoading}>{isLoading ? <><LiquidLoader className="mr-2" />Sending reset link...</> : 'Send reset link'}</Button>
                <Link href="/sign-in" className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"><ArrowLeft className="size-3.5" />Back to sign in</Link>
              </form>
            </Form>
          )}
    </AuthShell>
  );
}
