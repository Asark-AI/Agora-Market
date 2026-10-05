import type { ReactNode } from 'react';
import { LiveDataUnavailable } from '@/app/super/components/live-data-unavailable';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  void children;
  return (
    <LiveDataUnavailable
      title="Marketing integrations are not connected"
      description="Campaigns, advertising spend, promotions, automations, and performance metrics need verified live marketing integrations before they can be managed or reported here."
    />
  );
}
