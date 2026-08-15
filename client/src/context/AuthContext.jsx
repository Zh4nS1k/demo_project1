'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  // Guest intent: { perform: (loggedInUser) => Promise, message?: string }
  // Kept in a ref so login/register callbacks always see the latest value
  // without re-creating themselves (no stale-closure misses).
  const authPromptRef = useRef(null);
  const [authPrompt, setAuthPrompt] = useState(null);
  const router = useRouter();

  // Load from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  /** Run + clear any pending guest action after successful auth. */
  const runPending = async (loggedInUser) => {
    const pending = authPromptRef.current;
    authPromptRef.current = null;
    setAuthPrompt(null);
    if (pending?.perform) {
      try {
        await pending.perform(loggedInUser);
      } catch (err) {
        console.error('Deferred guest action failed:', err);
      }
    }
  };

  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password });
    setUser(res.data);
    setToken(res.token);
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.data));
    await runPending(res.data);
    return res;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const register = useCallback(async (body) => {
    const res = await api.register(body);
    setUser(res.data);
    setToken(res.token);
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.data));
    await runPending(res.data);
    return res;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(() => {
    // Drop any queued guest action — it belongs to a session that's ending
    authPromptRef.current = null;
    setAuthPrompt(null);
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }, [router]);

  const updateUserInContext = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  /**
   * Action gate for guest-allowed pages:
   *   requireAuth(perform, message)
   * Logged in → runs perform(user) immediately.
   * Guest    → queues perform and opens the sign-up prompt modal.
   * perform receives the freshly-logged-in user (never a stale one).
   */
  const requireAuth = useCallback((perform, message) => {
    if (user) {
      perform(user);
      return true;
    }
    const pending = { perform, message };
    authPromptRef.current = pending;
    setAuthPrompt(pending);
    return false;
  }, [user]);

  const dismissAuthPrompt = useCallback(() => {
    authPromptRef.current = null;
    setAuthPrompt(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user, token, loading,
        login, register, logout, updateUserInContext,
        authPrompt, requireAuth, dismissAuthPrompt,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
