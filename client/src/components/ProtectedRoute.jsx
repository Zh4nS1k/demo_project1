'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * Route guard with two modes:
 *
 * - mode="strict" (default): unauthenticated visitors are redirected to
 *   /login. Used by pages that make no sense for guests (e.g. /profile).
 *
 * - mode="guest": everyone can view the page. Account-only actions on the
 *   page must gate themselves via requireAuth() from AuthContext, which
 *   queues the action and shows the sign-up prompt instead of redirecting.
 */
export default function ProtectedRoute({ children, mode = 'strict' }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (mode === 'strict' && !loading && !user) {
      router.push('/login');
    }
  }, [mode, loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-stone-600 text-lg animate-pulse">Loading…</div>
      </div>
    );
  }

  if (mode === 'strict' && !user) return null;

  // guest mode: render for everyone — actions gate themselves
  return children;
}
