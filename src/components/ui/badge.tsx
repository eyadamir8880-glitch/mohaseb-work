import { cn, getStatusColor } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'green' | 'red' | 'yellow' | 'blue' | 'gray';
  className?: string;
}

const variantClasses = {
  default: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  yellow: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  gray: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('badge', variantClasses[variant], className)}>
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={cn('badge', getStatusColor(status))}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
