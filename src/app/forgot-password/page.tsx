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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LiquidLoader } from '@/components/liquid-loader';
import { AppLogo } from '@/components/app-logo';

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
    <main className="flex min-h-screen items-start justify-center bg-background px-4 py-10 sm:items-center sm:py-16">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex items-center gap-3"><AppLogo className="size-9 text-primary" /><span className="text-sm font-semibold tracking-[0.18em]">AGORA</span></div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Super Admin access</p>
        <Card className="mt-2 rounded-md border-border shadow-none">
        <CardHeader className="px-5 py-5">
          <CardTitle className="font-headline text-2xl">Reset your password</CardTitle>
          <CardDescription>{sent ? "If an account exists with that email, we've sent password-reset instructions." : "Enter your Super Admin email address and we'll send instructions to create a new password."}</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {sent ? (
            <Button asChild className="w-full"><Link href="/sign-in">Return to sign in</Link></Button>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" autoComplete="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <><LiquidLoader className="mr-2" />Sending...</> : 'Send reset link'}</Button>
                <Link href="/sign-in" className="block text-center text-sm text-muted-foreground underline underline-offset-4">Back to sign in</Link>
              </form>
            </Form>
          )}
        </CardContent>
        </Card>
      </div>
    </main>
  );
}
