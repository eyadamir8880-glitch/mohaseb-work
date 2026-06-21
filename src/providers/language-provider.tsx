'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useAppStore } from '@/stores/use-app-store';

// Import translations
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';

interface LanguageContextType {
  language: 'en' | 'ar';
  locale: 'en' | 'ar';
  dir: 'ltr' | 'rtl';
  setLanguage: (lang: 'en' | 'ar') => void;
  t: any;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  locale: 'en',
  dir: 'ltr',
  setLanguage: () => {},
  t: () => '',
});

export function useLanguage() {
  return useContext(LanguageContext);
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

function resolveTranslation(messages: Record<string, any>, enMessages: Record<string, any>, key: string, params?: Record<string, string>): string {
  const value = getNestedValue(messages, key);
  if (value === undefined) {
    const enValue = getNestedValue(enMessages, key);
    return enValue !== undefined ? String(enValue) : key;
  }
  let result = String(value);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      result = result.replace(`{${k}}`, v);
    });
  }
  return result;
}

function createTranslator(messages: Record<string, any>, enMessages: Record<string, any>) {
  const tFn = (key: string, params?: Record<string, string>) =>
    resolveTranslation(messages, enMessages, key, params);

  const proxyCache = new Map<string, any>();

  function makeProxy(path = ''): any {
    if (proxyCache.has(path)) return proxyCache.get(path);
    const proxy = new Proxy(() => {}, {
      apply(_, __, args: [string, Record<string, string>?]) {
        return tFn(args[0], args[1]);
      },
      get(_, prop: string | symbol) {
        if (typeof prop === 'symbol') return;
        if (prop === 'toJSON' || prop === 'toString' || prop === 'valueOf') return;
        const newPath = path ? `${path}.${prop}` : prop;
        const value = getNestedValue(messages, newPath);
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return makeProxy(newPath);
        }
        return tFn(newPath);
      },
    });
    proxyCache.set(path, proxy);
    return proxy;
  }

  return makeProxy('');
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { language, setLanguage } = useAppStore();
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const messages = language === 'ar' ? arMessages : enMessages;

  useEffect(() => {
    const root = document.documentElement;
    root.dir = dir;
    root.lang = language;
  }, [dir, language]);

  const t = createTranslator(messages, enMessages);

  return (
    <LanguageContext.Provider value={{ language, locale: language, dir, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
