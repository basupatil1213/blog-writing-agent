import { BookOpen, Github, Loader2, LogIn, LogOut, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + name */}
          <Link to={user ? '/app' : '/'} className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 leading-tight">
                Blog Writing Agent
              </p>
              <p className="text-xs text-slate-500 leading-tight hidden sm:block">
                Powered by LangGraph &amp; GPT-4o
              </p>
            </div>
          </Link>

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

            {/* Auth state */}
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
                <Link
                  to="/app/saved"
                  className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-50"
                >
                  <BookOpen className="w-4 h-4" /> My Blogs
                </Link>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-semibold text-slate-700">{user.username}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  aria-label="Log out"
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-50"
              >
                <LogIn className="w-4 h-4" /> Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
