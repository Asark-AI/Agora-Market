'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { email: '' } });

  const onSubmit = async ({ email }: FormValues) => {
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
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
      description={sent ? 'If an account matches that email, a reset link is on its way.' : 'Enter your email and we will send a secure reset link.'}
      alternateHref="/sign-in"
      alternateLabel="Sign in"
      alternatePrompt="Remember your password?"
    >
          {sent ? (
            <Button asChild className="w-full"><Link href="/sign-in">Return to sign in</Link></Button>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" autoComplete="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><LiquidLoader className="mr-2" />Sending...</> : 'Send reset link'}</Button>
                <Link href="/sign-in" className="block text-center text-sm text-muted-foreground underline">Back to sign in</Link>
              </form>
            </Form>
          )}
    </AuthShell>
  );
}
