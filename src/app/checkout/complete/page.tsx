'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LiquidLoader } from '@/components/liquid-loader';
import { SiteHeader } from '@/components/site-header';

export default function CheckoutCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const reference = searchParams.get('reference');
    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference was provided.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch('/api/payments/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reference }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.verified) {
          throw new Error(data?.error || 'Payment verification failed.');
        }

        setStatus('success');
        setMessage('Your payment was confirmed successfully.');
        toast({ title: 'Payment confirmed', description: 'Your order is now being processed.' });
        router.push('/profile?tab=orders');
      } catch (error) {
        setStatus('failed');
        setMessage(error instanceof Error ? error.message : 'Payment verification failed.');
        toast({
          variant: 'destructive',
          title: 'Payment verification failed',
          description: 'Please contact support with your payment reference.',
        });
      }
    };

    verifyPayment();
  }, [router, searchParams, toast]);

  return (
    <>
      <SiteHeader />
      <div className="container mx-auto max-w-lg py-16 px-4">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-center">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            {status === 'loading' && <LiquidLoader />}
            <p className="text-lg font-medium">{message}</p>
            {status !== 'loading' && (
              <Button onClick={() => router.push('/profile?tab=orders')} className="mt-2">
                Go to Orders
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
