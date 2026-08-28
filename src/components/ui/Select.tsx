import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, helperText, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    return (
      <div className="w-full space-y-1.5 text-start">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'w-full appearance-none bg-slate-900/90 border rounded-xl px-3.5 py-2.5 pe-10 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 cursor-pointer',
              error ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800 hover:border-slate-700 focus:border-emerald-500',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-slate-900 text-slate-500">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-slate-900 text-slate-100"
              >
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute end-3 flex items-center pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
