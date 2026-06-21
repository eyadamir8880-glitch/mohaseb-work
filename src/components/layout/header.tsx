'use client';

import { useLanguage } from '@/providers/language-provider';
import { useTheme } from '@/providers/theme-provider';
import { useAppStore } from '@/stores/use-app-store';
import { downloadAsJson } from '@/lib/utils';

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const store = useAppStore();
  const unreadNotifications = store.notifications.filter(n => !n.isRead).length;

  const handleSaveSession = () => {
    const snapshot = store.getStateSnapshot();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadAsJson(snapshot, `mohasebeyad-backup-${timestamp}.json`);
    store.addNotification({
      type: 'system',
      title: 'Session Saved',
      titleAr: 'تم حفظ الجلسة',
      message: 'Session backup downloaded successfully',
      messageAr: 'تم تنزيل نسخة احتياطية للجلسة بنجاح',
      module: 'system',
      recordId: '',
      isRead: false,
      readAt: null,
    });
  };

  const handleLoadSession = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const success = store.loadState(data);
        if (success) {
          store.addNotification({
            type: 'system',
            title: 'Session Loaded',
            titleAr: 'تم تحميل الجلسة',
            message: 'Session loaded successfully',
            messageAr: 'تم تحميل الجلسة بنجاح',
            module: 'system',
            recordId: '',
            isRead: false,
            readAt: null,
          });
        } else {
          alert('Invalid backup file: missing module data');
        }
      } catch (err) {
        alert('Failed to load backup file: ' + (err as Error).message);
      }
    };
    input.click();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 px-6 backdrop-blur-sm dark:bg-slate-950/80 dark:border-slate-700">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">{t('app.name')}</h1>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="btn-outline btn-sm"
          title={language === 'en' ? 'العربية' : 'English'}
        >
          {language === 'en' ? 'AR' : 'EN'}
        </button>

        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="btn-ghost p-2" title={theme === 'light' ? t('common.darkMode') : t('common.lightMode')}>
          {theme === 'light' ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>

        {/* Save Session */}
        <button onClick={handleSaveSession} className="btn-ghost p-2" title={t('common.saveSession')}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        </button>

        {/* Load Session */}
        <button onClick={handleLoadSession} className="btn-ghost p-2" title={t('common.loadSession')}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </button>

        {/* Notifications */}
        <button className="btn-ghost relative p-2" title={t('notifications.title')}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadNotifications > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
