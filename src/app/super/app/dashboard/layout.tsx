
import type { ReactNode } from 'react';
import { requireSuperAdmin } from '@/lib/server/admin-auth';
import { SuperDashboardShell } from './dashboard-shell';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireSuperAdmin();
  return <SuperDashboardShell>{children}</SuperDashboardShell>;
}
