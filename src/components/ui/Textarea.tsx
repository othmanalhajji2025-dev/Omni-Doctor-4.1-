import React from 'react';
import { cn } from '../../lib/utils.js';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  maxCharacters?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, maxCharacters, value, id, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full space-y-1.5 text-start">
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={textareaId} className="block text-xs font-medium text-slate-300">
              {label}
            </label>
          )}
          {maxCharacters && (
            <span className="text-[11px] text-slate-500">
              {currentLength} / {maxCharacters}
            </span>
          )}
        </div>
        <textarea
          id={textareaId}
          ref={ref}
          value={value}
          maxLength={maxCharacters}
          className={cn(
            'w-full bg-slate-900/90 border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 min-h-[100px] resize-y',
            error ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800 hover:border-slate-700 focus:border-emerald-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
