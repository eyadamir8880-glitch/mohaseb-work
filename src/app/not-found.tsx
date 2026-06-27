'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/providers/language-provider';

export default function NotFound() {
  const router = useRouter();
  const { language } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-slate-950">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-blue-600">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {language === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          {language === 'ar' ? 'الصفحة التي تبحث عنها غير موجودة' : 'The page you are looking for does not exist'}
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button onClick={() => router.back()} className="btn-outline">
            {language === 'ar' ? 'العودة' : 'Go Back'}
          </button>
          <Link href="/dashboard" className="btn-primary">
            {language === 'ar' ? 'لوحة التحكم' : 'Go to Dashboard'}
          </Link>
        </div>
      </div>
    </div>
  );
}
