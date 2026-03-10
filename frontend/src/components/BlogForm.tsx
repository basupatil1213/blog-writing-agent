import { Loader2, Sparkles, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

const EXAMPLE_TOPICS = [
  'Self-Attention in Transformer Architectures',
  'Retrieval-Augmented Generation (RAG) pipelines',
  'Building production-ready REST APIs with FastAPI',
  'Zero-knowledge proofs for frontend developers',
  'LangGraph: building stateful AI agents',
];

interface BlogFormProps {
  onSubmit: (topic: string) => void;
  onReset: () => void;
  isGenerating: boolean;
  /** Compact sidebar mode — hides examples and reduces padding */
  compact?: boolean;
}

export function BlogForm({ onSubmit, onReset, isGenerating, compact = false }: BlogFormProps) {
  const [topic, setTopic] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = topic.trim();
      if (!trimmed || isGenerating) return;
      onSubmit(trimmed);
    },
    [topic, isGenerating, onSubmit],
  );

  const handleExample = useCallback((example: string) => {
    setTopic(example);
    textareaRef.current?.focus();
  }, []);

  const handleClear = useCallback(() => {
    setTopic('');
    onReset();
    textareaRef.current?.focus();
  }, [onReset]);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <div
        className={`bg-gradient-to-r from-brand-50 via-white to-white border-b border-slate-100 ${
          compact ? 'px-5 pt-5 pb-4' : 'px-6 pt-6 pb-4'
        }`}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl shadow-md flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className={`font-bold text-slate-900 ${compact ? 'text-base' : 'text-xl'}`}>
              Blog Generator
            </h2>
            {!compact && (
              <p className="text-sm text-slate-500">
                Enter a topic and let AI write a complete technical blog post.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Form body */}
      <form onSubmit={handleSubmit} className={`space-y-4 ${compact ? 'px-5 py-4' : 'px-6 py-5 space-y-5'}`}>
        {/* Textarea */}
        <div className="space-y-1.5">
          <label htmlFor="topic" className="block text-sm font-semibold text-slate-700">
            Blog Topic
          </label>
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
              placeholder="e.g. Self-Attention in Transformer Architectures"
              rows={compact ? 2 : 3}
              className="w-full px-4 py-3 text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl resize-none transition-all focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed text-sm leading-relaxed"
            />
            {topic && !isGenerating && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
                aria-label="Clear topic"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {!compact && (
            <p className="text-xs text-slate-400">
              Be specific — a precise topic generates a better, more focused blog post.
            </p>
          )}
        </div>

        {/* Example topics — hidden in compact/sidebar mode */}
        {!compact && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Try an example
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_TOPICS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => handleExample(example)}
                  disabled={isGenerating}
                  className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 rounded-full border border-slate-200 hover:border-brand-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!topic.trim() || isGenerating}
          className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 text-sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Blog Post
            </>
          )}
        </button>
      </form>
    </div>
  );
}
