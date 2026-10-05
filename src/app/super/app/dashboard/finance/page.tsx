import { SuperAdminAnalytics } from '@/components/super-admin-analytics';

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <aside className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <h1 className="font-semibold">Verified marketplace order data</h1>
        <p className="mt-1 leading-6">
          The figures below come from Agora order records. They are order values, not recognized platform revenue or settled cash.
          Commission accounting, operating expenses, and seller-payout reporting are not connected and are intentionally not estimated.
        </p>
      </aside>
      <SuperAdminAnalytics />
    </div>
  );
}
