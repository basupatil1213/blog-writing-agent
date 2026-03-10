import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { GeneratorPage } from '@/pages/GeneratorPage';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { SavedBlogDetailPage } from '@/pages/SavedBlogDetailPage';
import { SavedBlogsPage } from '@/pages/SavedBlogsPage';

export const router = createBrowserRouter([
  // ── Public ────────────────────────────────────────────────────────────────
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // ── Protected ─────────────────────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/app', element: <GeneratorPage /> },
      { path: '/app/saved', element: <SavedBlogsPage /> },
      { path: '/app/saved/:blogId', element: <SavedBlogDetailPage /> },
    ],
  },
]);
