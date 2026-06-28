'use client';

import { useEffect, useState, useCallback } from 'react';

const SUPABASE_REF = 'kggmwviapfqtddxjmrwd';
const SUPABASE_SQL_EDITOR = `https://supabase.com/dashboard/project/${SUPABASE_REF}/sql/new`;

const INCREMENTAL_SQL = `-- Add created_at columns for tables missing them
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.import_sessions ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();`;

export default function MigratePage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }, []);

  useEffect(() => {
    handleCopy(INCREMENTAL_SQL);
  }, [handleCopy]);

  const handleCopyAndOpen = useCallback(async () => {
    await handleCopy(INCREMENTAL_SQL);
    window.open(SUPABASE_SQL_EDITOR, '_blank');
  }, [handleCopy]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-bold">Database Migration</h1>
        <p className="mb-6 text-gray-600">
          Adds <code className="rounded bg-gray-200 px-1">created_at</code> to 3 tables. SQL auto-copied to clipboard.
        </p>

        <div className="mb-6 overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="border-b bg-gray-50 px-4 py-3">
            <h2 className="font-semibold">Quick Run</h2>
            <p className="text-xs text-gray-500">One click &rarr; paste in SQL Editor &rarr; click Run</p>
          </div>
          <div className="p-4">
            <button
              onClick={handleCopyAndOpen}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {copied ? 'Copied! Opening SQL Editor...' : 'Copy SQL & Open Supabase Editor'}
            </button>
            <p className="mt-2 text-center text-xs text-gray-400">
              In SQL Editor: Ctrl+V to paste, then click <strong>Run</strong>
            </p>
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="border-b bg-gray-50 px-4 py-3">
            <h2 className="font-semibold">SQL to Run</h2>
            <p className="text-xs text-gray-500">5 ALTER statements (auto-copied on page load)</p>
          </div>
          <pre className="overflow-auto bg-gray-900 p-4 text-xs text-green-400 max-h-48">
            <code>{INCREMENTAL_SQL}</code>
          </pre>
        </div>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <strong>Already ran migration before?</strong> This is all you need &mdash; only the 5 lines above
          are new. If you never ran migration before, go to the <a href="/migrate" className="underline">older deploy's /migrate</a> for the full SQL.
        </div>
      </div>
    </div>
  );
}
