/**
 * GeneratorPage — the main blog-generation UI, now living at /app.
 * This is the existing App.tsx content extracted into a named page component.
 */
import { AlertCircle, RefreshCw } from 'lucide-react';
import { BlogDisplay } from '@/components/BlogDisplay';
import { BlogForm } from '@/components/BlogForm';
import { BlogSkeleton } from '@/components/BlogSkeleton';
import { Header } from '@/components/Header';
import { useBlogGeneration } from '@/hooks/useBlogGeneration';

export function GeneratorPage() {
  const { status, steps, result, error, elapsedMs, topic, generate, reset } = useBlogGeneration();

  const isIdle = status === 'idle';
  const isGenerating = status === 'generating';
  const hasResult = status === 'complete' && result !== null;
  const hasError = status === 'error';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* Hero — only shown when idle */}
      {isIdle && (
        <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-slate-900 text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-800/60 border border-brand-700/50 rounded-full text-xs font-medium text-brand-200 mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Powered by LangGraph · GPT-4o · Tavily
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-white">
              AI-Powered Blog
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-cyan-300">
                {' '}Writer
              </span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Enter any technical topic and receive a fully researched, well-structured blog post in
              minutes — complete with code examples and diagrams.
            </p>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {isIdle ? (
          <div className="max-w-2xl mx-auto">
            <BlogForm onSubmit={generate} onReset={reset} isGenerating={false} />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[400px_1fr] items-start">
            {/* Left column — compact form */}
            <div className="space-y-4 lg:sticky lg:top-24">
              <BlogForm
                onSubmit={generate}
                onReset={reset}
                isGenerating={isGenerating}
                compact
              />
              {hasError && error && (
                <div className="animate-fade-in rounded-2xl bg-red-50 border border-red-200 p-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-red-800 mb-1">Generation Failed</h3>
                      <p className="text-sm text-red-600 break-words">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={reset}
                    className="mt-4 flex items-center gap-2 text-sm font-medium text-red-700 hover:text-red-800 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try again
                  </button>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="min-w-0">
              {isGenerating && (
                <BlogSkeleton steps={steps} status={status} elapsedMs={elapsedMs} />
              )}
              {hasResult && result && (
                <BlogDisplay result={result} elapsedMs={elapsedMs} topic={topic} />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-slate-400">
          <span>Blog Writing Agent · LangGraph + GPT-4o</span>
          <span>FastAPI backend · Vite + React frontend</span>
        </div>
      </footer>
    </div>
  );
}
