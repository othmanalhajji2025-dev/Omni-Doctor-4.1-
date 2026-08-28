import React from 'react';
import { cn } from '../../lib/utils.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'outline' | 'danger';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-slate-900/80 border-slate-800 text-slate-100',
      elevated: 'bg-slate-900 border-slate-700 shadow-xl shadow-slate-950/50 text-slate-100',
      interactive:
        'bg-slate-900/80 border-slate-800 text-slate-100 hover:border-emerald-500/50 hover:bg-slate-850 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-emerald-950/20',
      outline: 'bg-transparent border-slate-800 text-slate-200',
      danger: 'bg-red-950/30 border-red-900/60 text-red-100 shadow-lg shadow-red-950/30',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-2xl border p-5 sm:p-6 transition-colors', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3 className={cn('text-lg font-semibold tracking-tight text-slate-100', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn('text-xs text-slate-400 leading-relaxed', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('pt-0', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('flex items-center pt-4 border-t border-slate-800/60', className)} {...props}>
    {children}
  </div>
);
