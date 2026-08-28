import React from 'react';
import { Loader2, Activity } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface LoadingStateProps {
  message?: string;
  text?: string;
  subMessage?: string;
  variant?: 'spinner' | 'skeleton' | 'pulse';
  size?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  text,
  subMessage,
  variant = 'spinner',
  size,
  className,
}) => {
  const displayMessage = text || message || 'جاري التحميل والمعالجة السريرية...';

  if (variant === 'skeleton') {
    return (
      <div className={cn('w-full space-y-3 animate-pulse p-4', className)}>
        <div className="h-6 bg-slate-800 rounded-lg w-1/3" />
        <div className="h-4 bg-slate-800/60 rounded-lg w-3/4" />
        <div className="h-4 bg-slate-800/40 rounded-lg w-1/2" />
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="h-20 bg-slate-800/50 rounded-xl" />
          <div className="h-20 bg-slate-800/50 rounded-xl" />
          <div className="h-20 bg-slate-800/50 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-4',
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <Loader2 className="w-16 h-16 text-emerald-500/30 animate-spin absolute" />
      </div>
      <div className="space-y-1 max-w-sm">
        <p className="text-sm font-semibold text-slate-200">{displayMessage}</p>
        {subMessage && <p className="text-xs text-slate-400">{subMessage}</p>}
      </div>
    </div>
  );
};
