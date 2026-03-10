import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  Download,
  ExternalLink,
  Layers,
  Loader2,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { StatusBadge } from './StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { savedBlogsApi } from '@/api/savedBlogsApi';
import type { BlogResult } from '@/types';

// Import highlight.js theme via inline style injection (avoids extra build steps)
const HIGHLIGHT_THEME_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';

interface BlogDisplayProps {
  result: BlogResult;
  elapsedMs: number;
  topic: string;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function BlogDisplay({ result, elapsedMs, topic }: BlogDisplayProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedBlogId, setSavedBlogId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (saveState === 'saving' || saveState === 'saved') return;
    setSaveState('saving');
    setSaveError(null);
    try {
      const saved = await savedBlogsApi.save({
        title: result.title,
        topic,
        blog_kind: result.blog_kind,
        mode: result.mode,
        needs_research: result.needs_research,
        evidence_count: result.evidence_count,
        section_count: result.section_count,
        content: result.content,
        image_urls: [],
        generation_time_ms: elapsedMs,
      });
      setSavedBlogId(saved.id);
      setSaveState('saved');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
      setSaveState('error');
    }
  }, [result, elapsedMs, topic, saveState]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result.content]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([result.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  const elapsedSec = (elapsedMs / 1000).toFixed(1);

  return (
    <div className="animate-slide-up rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* Inject highlight.js theme */}
      <link rel="stylesheet" href={HIGHLIGHT_THEME_URL} />

      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 via-white to-white border-b border-slate-100">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 bg-emerald-100 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Blog Generated Successfully
              </h2>
              <p className="text-xs text-slate-500">Ready to publish</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {copied ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? 'Copied!' : 'Copy MD'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            {user && (
              saveState === 'saved' ? (
                <Link
                  to={`/app/saved/${savedBlogId}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors ring-1 ring-inset ring-emerald-200"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  Saved
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </Link>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saveState === 'saving'}
                  title={saveState === 'error' ? saveError ?? 'Save failed' : 'Save to My Blogs'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    saveState === 'error'
                      ? 'text-red-600 bg-red-50 hover:bg-red-100 ring-1 ring-inset ring-red-200'
                      : 'text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60'
                  }`}
                >
                  {saveState === 'saving' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Bookmark className="w-3.5 h-3.5" />
                  )}
                  {saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Retry save' : 'Save'}
                </button>
              )
            )}
          </div>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge type="blog_kind" value={result.blog_kind} />
          <StatusBadge type="mode" value={result.mode} />

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
            <Layers className="w-3 h-3" />
            {result.section_count} sections
          </span>

          {result.evidence_count > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200">
              <Database className="w-3 h-3" />
              {result.evidence_count} sources
            </span>
          )}

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
            <Clock className="w-3 h-3" />
            {elapsedSec}s
          </span>
        </div>
      </div>

      {/* Blog title banner */}
      <div className="px-6 py-4 bg-brand-950 border-b border-slate-800">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-brand-300 mt-0.5 flex-shrink-0" />
          <h3 className="text-lg font-bold text-white leading-snug">{result.title}</h3>
        </div>
      </div>

      {/* Markdown content */}
      <div className="px-6 py-8 overflow-x-hidden">
        <article className="prose prose-slate prose-sm sm:prose-base max-w-none
          prose-headings:font-bold prose-headings:tracking-tight
          prose-h1:text-2xl prose-h1:mt-0
          prose-h2:text-xl prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2
          prose-code:before:content-none prose-code:after:content-none
          prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-brand-700
          prose-pre:bg-slate-900 prose-pre:rounded-xl prose-pre:shadow-lg prose-pre:p-0
          prose-pre:overflow-hidden
          prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-brand-400 prose-blockquote:bg-brand-50 prose-blockquote:rounded-r-xl
          prose-img:rounded-xl prose-img:shadow-md
          prose-table:text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {result.content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
