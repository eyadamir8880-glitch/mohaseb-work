'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/language-provider';
import { useAppStore } from '@/stores/use-app-store';
import { formatDate, formatCurrency, downloadAsCsv } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';

export default function AuditLogPage() {
  const { language, t } = useLanguage();
  const { auditLogs } = useAppStore();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...auditLogs];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l => l.user.toLowerCase().includes(s) || l.module.toLowerCase().includes(s) || l.recordId.toLowerCase().includes(s));
    }
    if (actionFilter) result = result.filter(l => l.action === actionFilter);
    if (moduleFilter) result = result.filter(l => l.module === moduleFilter);
    return result;
  }, [auditLogs, search, actionFilter, moduleFilter]);

  const handleExport = () => {
    downloadAsCsv(filtered.map(l => ({
      timestamp: l.timestamp, user: l.user, action: l.action,
      module: l.module, recordId: l.recordId, ip: l.ip,
    })), `audit-log-${Date.now()}.csv`);
  };

  const columns = [
    { key: 'timestamp', header: t('auditLog.timestamp'), render: (item: any) => formatDate(item.timestamp) },
    { key: 'user', header: t('auditLog.user') },
    { key: 'action', header: t('auditLog.action'), render: (item: any) => (
      <span className={`badge ${
        item.action === 'created' ? 'badge-green' :
        item.action === 'updated' ? 'badge-blue' :
        item.action === 'deleted' ? 'badge-red' : 'badge-gray'
      }`}>
        {item.action}
      </span>
    )},
    { key: 'module', header: t('auditLog.module'), render: (item: any) => <span className="capitalize">{item.module}</span> },
    { key: 'recordId', header: t('auditLog.recordId'), render: (item: any) => (
      <span className="font-mono text-xs">{item.recordId.slice(0, 8)}...</span>
    )},
    { key: 'ip', header: t('auditLog.ip') },
    { key: 'actions', header: '', render: (item: any) => (
      <button className="btn-ghost btn-sm p-1" onClick={() => setSelectedLog(selectedLog === item.id ? null : item.id)}>
        <svg className={`h-4 w-4 transition-transform ${selectedLog === item.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    )},
  ];

  const selectedLogData = selectedLog ? auditLogs.find(l => l.id === selectedLog) : null;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('auditLog.title')}</h1>
        <Button variant="outline" onClick={handleExport}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t('auditLog.exportLog')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder={t('app.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          options={[
            { value: '', label: t('app.filter') + '...' },
            { value: 'created', label: 'Created' },
            { value: 'updated', label: 'Updated' },
            { value: 'deleted', label: 'Deleted' },
            { value: 'viewed', label: 'Viewed' },
            { value: 'exported', label: 'Exported' },
            { value: 'paid', label: 'Paid' },
          ]} className="max-w-[150px]" />
        <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}
          options={[
            { value: '', label: 'Module...' },
            { value: 'customers', label: 'Customers' },
            { value: 'products', label: 'Products' },
            { value: 'invoices', label: 'Invoices' },
            { value: 'treasury', label: 'Treasury' },
            { value: 'journalEntries', label: 'Journal Entries' },
          ]} className="max-w-[180px]" />
      </div>

      <DataTable columns={columns} data={filtered.slice(0, 200)} emptyMessage={t('app.noData')} />

      {/* Detail panel */}
      {selectedLogData && (
        <div className="animate-slide-up rounded-xl border p-4 dark:border-slate-700">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">{t('auditLog.details')}</h3>
            <button className="btn-ghost p-1" onClick={() => setSelectedLog(null)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">{t('auditLog.timestamp')}</p>
              <p>{selectedLogData.timestamp}</p>
            </div>
            <div>
              <p className="text-slate-500">{t('auditLog.user')}</p>
              <p>{selectedLogData.user}</p>
            </div>
            <div>
              <p className="text-slate-500">{t('auditLog.action')}</p>
              <p className="capitalize">{selectedLogData.action}</p>
            </div>
            <div>
              <p className="text-slate-500">{t('auditLog.module')}</p>
              <p className="capitalize">{selectedLogData.module}</p>
            </div>
          </div>
          
          {/* Diff view */}
          {(selectedLogData.oldValues || selectedLogData.newValues) && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {selectedLogData.oldValues && (
                <div>
                  <p className="mb-2 text-sm font-medium text-red-600">{t('auditLog.oldValues')}</p>
                  <pre className="max-h-48 overflow-auto rounded-lg bg-red-50 p-3 text-xs dark:bg-red-950">
                    {JSON.stringify(selectedLogData.oldValues, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLogData.newValues && (
                <div>
                  <p className="mb-2 text-sm font-medium text-emerald-600">{t('auditLog.newValues')}</p>
                  <pre className="max-h-48 overflow-auto rounded-lg bg-emerald-50 p-3 text-xs dark:bg-emerald-950">
                    {JSON.stringify(selectedLogData.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
