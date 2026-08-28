import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Button } from './Button.js';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-4',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <div className="space-y-1.5 max-w-md">
        <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
        {description && <p className="text-xs text-slate-400 leading-relaxed">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button size="sm" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
