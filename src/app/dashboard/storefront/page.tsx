'use client';

import { useAuth } from '@/hooks/use-auth';
import { AccountSettingsTab } from '@/components/settings/account-settings-tab';
import { CommsSettingsTab } from '@/components/settings/comms-settings-tab';
import { FinancialsSettingsTab } from '@/components/settings/financials-settings-tab';
import { PageLoader } from '@/components/page-loader';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';

export default function BusinessSettingsPage() {
  const { loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6 pb-8">
      <Card className="rounded-3xl border bg-background p-6 shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl">Business settings</CardTitle>
          <CardDescription>
            Manage your seller profile, communication preferences, payment details, and operating policies in one place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This section replaces storefront customization with a unified business settings experience.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <AccountSettingsTab />
          <CommsSettingsTab />
        </div>
        <div className="space-y-6">
          <FinancialsSettingsTab />
        </div>
      </div>
    </div>
  );
}
