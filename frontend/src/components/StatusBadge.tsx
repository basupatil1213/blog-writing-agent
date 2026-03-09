import type { BlogKind, ResearchMode } from '@/types';

const BLOG_KIND_CONFIG: Record<BlogKind, { label: string; color: string }> = {
  explainer:     { label: 'Explainer',      color: 'bg-blue-100 text-blue-700 ring-blue-200' },
  tutorial:      { label: 'Tutorial',       color: 'bg-green-100 text-green-700 ring-green-200' },
  news_roundup:  { label: 'News Roundup',   color: 'bg-amber-100 text-amber-700 ring-amber-200' },
  comparison:    { label: 'Comparison',     color: 'bg-purple-100 text-purple-700 ring-purple-200' },
  system_design: { label: 'System Design',  color: 'bg-rose-100 text-rose-700 ring-rose-200' },
};

const MODE_CONFIG: Record<ResearchMode, { label: string; color: string }> = {
  closed_book: { label: 'No Research',  color: 'bg-slate-100 text-slate-600 ring-slate-200' },
  hybrid:      { label: 'Hybrid',       color: 'bg-cyan-100 text-cyan-700 ring-cyan-200' },
  open_book:   { label: 'Live Research', color: 'bg-indigo-100 text-indigo-700 ring-indigo-200' },
};

interface StatusBadgeProps {
  type: 'blog_kind' | 'mode';
  value: BlogKind | ResearchMode;
}

export function StatusBadge({ type, value }: StatusBadgeProps) {
  const config =
    type === 'blog_kind'
      ? BLOG_KIND_CONFIG[value as BlogKind]
      : MODE_CONFIG[value as ResearchMode];

  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${config.color}`}
    >
      {config.label}
    </span>
  );
}
