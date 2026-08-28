import React from 'react';
import { cn } from '../../lib/utils.js';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'pill' | 'underline' | 'boxed';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'pill',
}) => {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1 overflow-x-auto no-scrollbar p-1 rounded-xl',
        variant === 'pill' && 'bg-slate-900 border border-slate-800',
        variant === 'boxed' && 'bg-slate-950 p-1.5 border border-slate-800/80 rounded-2xl',
        variant === 'underline' && 'border-b border-slate-800 gap-4 p-0 rounded-none',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer select-none focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed',
              variant === 'pill' &&
                (isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'),
              variant === 'boxed' &&
                (isActive
                  ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'),
              variant === 'underline' &&
                (isActive
                  ? 'text-emerald-400 border-b-2 border-emerald-500 rounded-none font-semibold'
                  : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent rounded-none')
            )}
          >
            {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 text-[10px] rounded-full font-bold',
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
