import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, Flame } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export type AlertVariant = 'info' | 'success' | 'warning' | 'destructive' | 'emergency' | 'danger';

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: AlertVariant;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  onDismiss?: () => void;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  icon,
  onDismiss,
  onClose,
  children,
  ...props
}) => {
  const normalizedVariant: 'info' | 'success' | 'warning' | 'destructive' | 'emergency' =
    variant === 'danger' ? 'destructive' : variant;

  const variants = {
    info: 'bg-sky-950/40 border-sky-800/60 text-sky-200',
    success: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200',
    warning: 'bg-amber-950/40 border-amber-800/60 text-amber-200',
    destructive: 'bg-red-950/50 border-red-800/80 text-red-200',
    emergency: 'bg-gradient-to-r from-red-950/80 to-rose-950/80 border-red-500 text-rose-100 shadow-xl shadow-red-950/60 border-2',
  };

  const defaultIcons = {
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    destructive: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
    emergency: <Flame className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />,
  };

  const handleDismiss = onDismiss || onClose;

  return (
    <div
      role="alert"
      className={cn(
        'relative rounded-2xl border p-4 sm:p-5 flex items-start gap-3.5 text-start transition-all',
        variants[normalizedVariant],
        className
      )}
      {...props}
    >
      <div className="mt-0.5">{icon || defaultIcons[normalizedVariant]}</div>
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-semibold text-sm leading-none tracking-tight">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
      {handleDismiss && (
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 transition-opacity"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Dismiss</span>
        </button>
      )}
    </div>
  );
};
