import { requireSuperAdmin } from '@/lib/server/admin-auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();
  return children;
}
