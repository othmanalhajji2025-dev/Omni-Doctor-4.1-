import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { Button } from './Button.js';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'حدث خطأ أثناء معالجة الطلب',
  message,
  onRetry,
  retryLabel = 'إعادة المحاولة',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-red-900/50 bg-red-950/20 space-y-4 text-start',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400">
        <AlertOctagon className="w-6 h-6" />
      </div>
      <div className="space-y-1.5 max-w-md text-center">
        <h4 className="text-sm font-semibold text-red-200">{title}</h4>
        <p className="text-xs text-red-300/80 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
