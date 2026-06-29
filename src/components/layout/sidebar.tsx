'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/use-app-store';
import { useLanguage } from '@/providers/language-provider';

const navItems = [
  { id: 'dashboard', labelEn: 'Dashboard', labelAr: 'لوحة التحكم', href: '/dashboard', icon: 'LayoutDashboard' },
  { id: 'invoices', labelEn: 'Invoices', labelAr: 'الفواتير', href: '/invoices', icon: 'FileText' },
  { id: 'customers', labelEn: 'Customers', labelAr: 'العملاء', href: '/customers', icon: 'Users' },
  { id: 'products', labelEn: 'Products', labelAr: 'المنتجات', href: '/products', icon: 'Package' },
  { id: 'warehouse', labelEn: 'Warehouse', labelAr: 'المستودع', href: '/warehouse', icon: 'Warehouse' },
  { id: 'customer-account', labelEn: 'Account Statement', labelAr: 'كشف حساب', href: '/customer-account', icon: 'FileText' },
  { id: 'returns', labelEn: 'Returns', labelAr: 'المرتجعات', href: '/returns', icon: 'RotateCcw' },
  { id: 'treasury', labelEn: 'Treasury', labelAr: 'الخزينة', href: '/treasury', icon: 'Landmark' },
  { id: 'categories', labelEn: 'Categories', labelAr: 'التصنيفات', href: '/categories', icon: 'Tags' },
  { id: 'fiscal-years', labelEn: 'Fiscal Years', labelAr: 'السنوات المالية', href: '/fiscal-years', icon: 'Calendar' },
  { id: 'reports', labelEn: 'Reports', labelAr: 'التقارير', href: '/reports', icon: 'BarChart3' },
  { id: 'settings', labelEn: 'Settings', labelAr: 'الإعدادات', href: '/settings', icon: 'Settings' },
];

// Map icon names to SVG components (inline to avoid extra dependency)
function NavIcon({ icon }: { icon: string }) {
  const svgProps = { className: 'h-5 w-5 shrink-0', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 };
  
  switch (icon) {
    case 'LayoutDashboard': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case 'FileText': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    case 'Users': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>;
    case 'Package': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
    case 'Warehouse': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10zm3 3h3v3H7v-3zm7 0h3v3h-3v-3z" /></svg>;
    case 'RotateCcw': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
    case 'Landmark': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
    case 'Tags': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
    case 'BarChart3': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
    case 'Calendar': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    case 'Settings': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    default: return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const { language, t } = useLanguage();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const notifications = useAppStore((state) => state.notifications);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-white transition-all duration-200 dark:bg-slate-900 dark:border-slate-700',
        language === 'ar' ? 'left-auto right-0 border-l' : 'border-r',
        sidebarCollapsed ? 'w-[70px]' : 'w-[260px]'
      )}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Logo */}
      <div className={cn('flex h-16 items-center border-b px-4 dark:border-slate-700', sidebarCollapsed ? 'justify-center' : 'justify-between')}>
        {!sidebarCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              M
            </div>
            <span className="text-lg font-bold">{t('app.name')}</span>
          </Link>
        )}
        {sidebarCollapsed && (
          <Link href="/dashboard" className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            M
          </Link>
        )}
        <button onClick={toggleSidebar} className="btn-ghost p-1.5 text-slate-400 hover:text-slate-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={sidebarCollapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'} />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    'sidebar-link',
                    { 'active': isActive },
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                  title={language === 'ar' ? item.labelAr : item.labelEn}
                >
                  <NavIcon icon={item.icon} />
                  {!sidebarCollapsed && (
                    <span>{language === 'ar' ? item.labelAr : item.labelEn}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className={cn('border-t p-3 dark:border-slate-700', sidebarCollapsed && 'text-center')}>
        {!sidebarCollapsed && (
          <p className="text-xs text-slate-400">{t('app.tagline')}</p>
        )}
      </div>
    </aside>
  );
}
