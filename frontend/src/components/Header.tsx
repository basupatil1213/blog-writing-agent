import { BookOpen, Github, Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + name */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Blog Writing Agent
              </h1>
              <p className="text-xs text-slate-500 leading-tight hidden sm:block">
                Powered by LangGraph &amp; GPT-4o
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-sm text-slate-600 hover:text-brand-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-50"
            >
              <BookOpen className="w-4 h-4" />
              API Docs
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors p-2 rounded-lg hover:bg-slate-100"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
