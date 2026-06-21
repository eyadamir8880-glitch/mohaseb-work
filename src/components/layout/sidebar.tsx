'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/use-app-store';
import { useLanguage } from '@/providers/language-provider';

const navItems = [
  { id: 'dashboard', labelEn: 'Dashboard', labelAr: 'لوحة التحكم', href: '/dashboard', icon: 'LayoutDashboard' },
  { id: 'pos', labelEn: 'POS', labelAr: 'نقطة البيع', href: '/pos', icon: 'ShoppingCart' },
  { id: 'invoices', labelEn: 'Invoices', labelAr: 'الفواتير', href: '/invoices', icon: 'FileText' },
  { id: 'quotations', labelEn: 'Quotations', labelAr: 'العروض', href: '/quotations', icon: 'FileCheck' },
  { id: 'customers', labelEn: 'Customers', labelAr: 'العملاء', href: '/customers', icon: 'Users' },
  { id: 'suppliers', labelEn: 'Suppliers', labelAr: 'الموردين', href: '/suppliers', icon: 'Truck' },
  { id: 'products', labelEn: 'Products', labelAr: 'المنتجات', href: '/products', icon: 'Package' },
  { id: 'variants', labelEn: 'Variants', labelAr: 'المتغيرات', href: '/variants', icon: 'Layers' },
  { id: 'warehouse', labelEn: 'Warehouse', labelAr: 'المستودع', href: '/warehouse', icon: 'Warehouse' },
  { id: 'purchase-orders', labelEn: 'POs', labelAr: 'أوامر الشراء', href: '/purchase-orders', icon: 'ClipboardList' },
  { id: 'returns', labelEn: 'Returns', labelAr: 'المرتجعات', href: '/returns', icon: 'RotateCcw' },
  { id: 'treasury', labelEn: 'Treasury', labelAr: 'الخزينة', href: '/treasury', icon: 'Landmark' },
  { id: 'employees', labelEn: 'Employees', labelAr: 'الموظفين', href: '/employees', icon: 'Briefcase' },
  { id: 'journal-entries', labelEn: 'Journal', labelAr: 'القيود', href: '/journal-entries', icon: 'BookOpen' },
  { id: 'assets', labelEn: 'Assets', labelAr: 'الأصول', href: '/assets', icon: 'Building2' },
  { id: 'categories', labelEn: 'Categories', labelAr: 'التصنيفات', href: '/categories', icon: 'Tags' },
  { id: 'reports', labelEn: 'Reports', labelAr: 'التقارير', href: '/reports', icon: 'BarChart3' },
  { id: 'settings', labelEn: 'Settings', labelAr: 'الإعدادات', href: '/settings', icon: 'Settings' },
];

// Map icon names to SVG components (inline to avoid extra dependency)
function NavIcon({ icon }: { icon: string }) {
  const svgProps = { className: 'h-5 w-5 shrink-0', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 };
  
  switch (icon) {
    case 'LayoutDashboard': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case 'ShoppingCart': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>;
    case 'FileText': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    case 'FileCheck': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'Users': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>;
    case 'Truck': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H3a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1m3 10h2a1 1 0 001-1v-4a1 1 0 00-.293-.707l-3-3A1 1 0 0014.586 6H13m-3 10a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z" /></svg>;
    case 'Package': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
    case 'Layers': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
    case 'Warehouse': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10zm3 3h3v3H7v-3zm7 0h3v3h-3v-3z" /></svg>;
    case 'ClipboardList': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
    case 'RotateCcw': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
    case 'Landmark': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
    case 'Briefcase': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.893 23.893 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    case 'BookOpen': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
    case 'Building2': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
    case 'Tags': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
    case 'BarChart3': return <svg {...svgProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
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
