import type { ReactNode } from 'react';
import { MarketingIntegrationsPanel } from '@/components/marketing-integrations-panel';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  void children;
  return <MarketingIntegrationsPanel isSuperAdmin />;
}
