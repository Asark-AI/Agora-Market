'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getAdminActivity, type AdminDataRecord } from '@/app/super/data-actions';
import { Button } from '@/app/super/components/ui/button';

type AuditRecord = AdminDataRecord & {
  action?: string;
  adminEmail?: string | null;
  adminUid?: string;
  reason?: string;
  success?: boolean;
  targetId?: string;
  targetType?: string;
  timestamp?: string;
};

function displayDate(value: unknown) {
  if (typeof value !== 'string') return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en-GH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default function ActivityPage() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRecords(await getAdminActivity() as AuditRecord[]);
    } catch {
      setError('Admin audit activity could not be loaded. Retry the request.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Admin audit activity</h1>
          <p className="mt-2 text-sm text-slate-600">Recorded Super Admin actions from Agora&apos;s audit log.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      {error ? (
        <div role="alert" className="flex items-center justify-between gap-4 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span>{error}</span>
          <Button type="button" variant="outline" onClick={() => void refresh()} disabled={loading}>Retry</Button>
        </div>
      ) : loading ? (
        <p role="status" className="text-sm text-slate-500">Loading audit records…</p>
      ) : records.length === 0 ? (
        <p className="border border-slate-200 bg-white p-6 text-sm text-slate-600">No admin audit actions have been recorded.</p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 bg-white">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Administrator</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Result</th>
                <th className="px-4 py-3 font-medium">Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-3">{record.adminEmail || record.adminUid || 'Administrator unavailable'}</td>
                  <td className="px-4 py-3 font-medium">{record.action || 'Action unavailable'}</td>
                  <td className="px-4 py-3">{[record.targetType, record.targetId].filter(Boolean).join(' · ') || 'Target unavailable'}</td>
                  <td className="px-4 py-3">{record.success === true ? 'Succeeded' : record.success === false ? 'Failed' : 'Unknown'}</td>
                  <td className="px-4 py-3">{displayDate(record.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">Showing up to the 100 most recent recorded admin actions.</p>
        </div>
      )}
    </div>
  );
}
