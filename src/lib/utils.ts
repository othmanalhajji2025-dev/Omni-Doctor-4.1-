/**
 * Utility functions for OmniDoctor AI
 */

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatNumber(val: number | string, lang: 'ar' | 'en' = 'ar'): string {
  if (val === undefined || val === null || val === '') return '';
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US').format(Number(val));
}

export function formatDate(date: string | Date, lang: 'ar' | 'en' = 'ar'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}
