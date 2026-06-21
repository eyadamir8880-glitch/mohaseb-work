'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-slate-950">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-blue-600">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">Page Not Found</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          الصفحة التي تبحث عنها غير موجودة
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => router.back()}
            className="btn-outline"
          >
            Go Back
          </button>
          <Link
            href="/dashboard"
            className="btn-primary"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
