'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

export function FinancialsSettingsTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Wallet className="size-5" />
          </div>
          <div>
            <CardTitle>Financials & Payments</CardTitle>
            <CardDescription>Manage your payout preferences and transaction visibility.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Financial controls are available in the dashboard’s payouts and orders experience.
        </p>
        <Button variant="outline">Open payout settings</Button>
      </CardContent>
    </Card>
  );
}
