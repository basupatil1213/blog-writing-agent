import { Loader2 } from 'lucide-react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Wraps protected routes. Shows a full-page spinner while the session is
 * being restored, then redirects to /login if unauthenticated.
 */
export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
