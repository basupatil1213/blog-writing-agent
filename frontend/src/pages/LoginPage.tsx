import { AlertCircle, Loader2, LogIn, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({ email, password });
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">BlogAgent</span>
          </Link>
          <p className="text-slate-400 mt-3 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6">
            <h1 className="text-xl font-bold text-slate-900 mb-6">Welcome back</h1>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 focus:bg-white transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 focus:bg-white transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                ) : (
                  <><LogIn className="w-4 h-4" /> Sign in</>
                )}
              </button>
            </form>
          </div>

          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Create one free
            </Link>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-slate-500">
          <Link to="/" className="hover:text-slate-300 transition-colors text-slate-400">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
