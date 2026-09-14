'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/page-loader';

const statusCopy: Record<string, { title: string; description: string }> = {
  pending: { title: 'Application submitted', description: 'Your seller application is under review. We will notify you when a decision is made.' },
  rejected: { title: 'Application not approved', description: 'Your seller application was not approved. Contact support for next steps.' },
  suspended: { title: 'Seller access suspended', description: 'Seller Center access is temporarily unavailable. Contact support for assistance.' },
};

export default function SellerApplicationStatusPage() {
  const { seller, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!seller) return <PageLoader />;
  if (['approved', 'active'].includes(seller.status)) {
    return <main className="flex min-h-screen items-center justify-center px-4"><Button asChild><Link href="/dashboard">Go to Seller Center</Link></Button></main>;
  }

  const copy = statusCopy[seller.status] || statusCopy.pending;
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild><Link href="/profile">Back to account</Link></Button>
          <Button asChild variant="outline"><Link href="/">Shop Agora</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}
