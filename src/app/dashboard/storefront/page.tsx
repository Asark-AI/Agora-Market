'use client';

import { useAuth } from '@/hooks/use-auth';
import { AccountSettingsTab } from '@/components/settings/account-settings-tab';
import { CommsSettingsTab } from '@/components/settings/comms-settings-tab';
import { FinancialsSettingsTab } from '@/components/settings/financials-settings-tab';
import { DashboardSkeleton } from '@/components/loading-skeletons';
    import { MessageSquare, Store, Wallet } from 'lucide-react';

export default function BusinessSettingsPage() {
  const { loading } = useAuth();

  if (loading) {
    return <DashboardSkeleton />;
  }

      return (
        <div className="mx-auto max-w-[1440px] space-y-6 pb-8">
          <header className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Business</p>
            <h1 className="text-2xl font-semibold sm:text-[26px]">Business settings</h1>
            <p className="text-sm text-muted-foreground">Store profile, buyer contact preferences, and payout methods.</p>
          </header>

          <nav aria-label="Business settings sections" className="flex gap-2 overflow-x-auto border-b border-border pb-3">
            <a href="#business-profile" className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-border bg-[#171b1f] px-3 text-sm text-muted-foreground transition-colors hover:border-primary/25 hover:text-primary"><Store className="size-4" />Store information</a>
            <a href="#buyer-contact" className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-border bg-[#171b1f] px-3 text-sm text-muted-foreground transition-colors hover:border-primary/25 hover:text-primary"><MessageSquare className="size-4" />Buyer contact</a>
            <a href="#business-payouts" className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-border bg-[#171b1f] px-3 text-sm text-muted-foreground transition-colors hover:border-primary/25 hover:text-primary"><Wallet className="size-4" />Payout methods</a>
          </nav>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="space-y-6">
              <section id="business-profile" className="scroll-mt-24"><AccountSettingsTab /></section>
              <section id="buyer-contact" className="scroll-mt-24"><CommsSettingsTab /></section>
        </div>
            <div id="business-payouts" className="scroll-mt-24 space-y-6">
          <FinancialsSettingsTab />
        </div>
      </div>
    </div>
  );
}
