import { SuperAdminAnalytics } from '@/components/super-admin-analytics';
import { requireSuperAdmin } from '@/lib/server/admin-auth';

export const dynamic = 'force-dynamic';

export default async function SuperAdminAnalyticsPage() {
  await requireSuperAdmin();
  return <SuperAdminAnalytics />;
}
