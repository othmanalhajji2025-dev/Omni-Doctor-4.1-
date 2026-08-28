import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'emergency'
  | 'danger';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none select-none rounded-xl active:scale-[0.98] cursor-pointer';

    const normalizedVariant = variant === 'danger' ? 'destructive' : variant;

    const variants = {
      primary:
        'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 focus:ring-emerald-500 border border-emerald-500/30',
      secondary:
        'bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white focus:ring-slate-400 border border-slate-700',
      outline:
        'border border-slate-700 hover:border-slate-600 bg-transparent hover:bg-slate-800/60 text-slate-200 focus:ring-slate-500',
      ghost:
        'bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-white focus:ring-slate-500',
      destructive:
        'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/40 focus:ring-red-500 border border-red-500/30',
      emergency:
        'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold shadow-lg shadow-red-950/60 focus:ring-red-400 animate-pulse border border-red-400/40',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-10',
      lg: 'text-base px-6 py-3 gap-2.5 h-12',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[normalizedVariant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
