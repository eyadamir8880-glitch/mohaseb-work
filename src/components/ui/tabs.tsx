'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType>({ value: '', onValueChange: () => {} });

export function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className }: {
  defaultValue?: string; value?: string; onValueChange?: (value: string) => void; children: ReactNode; className?: string;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue! : internalValue;

  const handleChange = (v: string) => {
    if (!isControlled) setInternalValue(v);
    onValueChange?.(v);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('inline-flex rounded-lg border p-1 dark:border-slate-700', className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const ctx = useContext(TabsContext);
  const isActive = ctx.value === value;
  return (
    <button
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
        className
      )}
      onClick={() => ctx.onValueChange(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const ctx = useContext(TabsContext);
  if (ctx.value !== value) return null;
  return <div className={cn('animate-fade-in', className)}>{children}</div>;
}
