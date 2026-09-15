import { SuperAdminAccountSettings } from '@/components/super-admin-account-settings';
import { requireSuperAdmin } from '@/lib/server/admin-auth';

export const dynamic = 'force-dynamic';

export default async function SuperAdminSettingsPage() {
  await requireSuperAdmin();
  return <SuperAdminAccountSettings />;
}
