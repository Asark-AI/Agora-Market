'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardMissingPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
      <h2 className="text-xl font-semibold">This dashboard page is not available yet</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        The route you opened does not have a page yet, but you can still return to your dashboard overview.
      </p>
      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
