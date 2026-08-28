import React from 'react';
import { cn } from '../../lib/utils.js';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'outline'
  | 'emergency'
  | 'danger'
  | 'info'
  | 'secondary'
  | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  hasDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  hasDot = false,
  children,
  ...props
}) => {
  const normalizedVariant: keyof typeof variants =
    variant === 'danger'
      ? 'destructive'
      : variant === 'neutral' || variant === 'secondary'
      ? 'default'
      : variant === 'info'
      ? 'outline'
      : variant;

  const variants = {
    default: 'bg-slate-800 text-slate-200 border-slate-700',
    primary: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
    success: 'bg-teal-950/80 text-teal-300 border-teal-800/60',
    warning: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
    destructive: 'bg-red-950/80 text-red-300 border-red-800/60',
    emergency: 'bg-rose-600 text-white font-bold border-rose-400 animate-pulse shadow-md shadow-rose-950',
    outline: 'bg-transparent text-slate-300 border-slate-700',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-emerald-400',
    success: 'bg-teal-400',
    warning: 'bg-amber-400',
    destructive: 'bg-red-400',
    emergency: 'bg-white',
    outline: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border shrink-0 select-none whitespace-nowrap',
        variants[normalizedVariant] || variants.default,
        sizes[size],
        className
      )}
      {...props}
    >
      {hasDot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0 animate-pulse',
            dotColors[normalizedVariant] || dotColors.default
          )}
        />
      )}
      {children}
    </span>
  );
};
