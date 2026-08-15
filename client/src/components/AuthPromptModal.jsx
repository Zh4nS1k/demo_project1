'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * Global "sign up to continue" prompt.
 * Shown when a guest triggers an account-required action (requireAuth).
 * The queued action runs automatically right after login/register.
 */
export default function AuthPromptModal() {
  const { authPrompt, dismissAuthPrompt } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Don't stack the modal on top of the auth pages themselves
  if (!authPrompt || pathname === '/login' || pathname === '/register') return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={dismissAuthPrompt} />
      <div className="relative w-full max-w-sm bg-surface rounded-2xl border border-line shadow-xl p-6 text-center">
        <div className="text-4xl mb-2">☕</div>
        <h2 className="text-lg font-bold text-ink">
          Create an account to save your coffee journey
        </h2>
        {authPrompt.message && (
          <p className="text-sm text-ink-2 mt-1.5">
            We&apos;ll finish this for you right after you sign in:{' '}
            <span className="font-medium text-coffee-700">{authPrompt.message}</span>
          </p>
        )}

        <div className="flex flex-col gap-2 mt-5">
          <button
            onClick={() => router.push('/register')}
            className="w-full py-2.5 rounded-lg bg-ink text-surface font-medium hover:bg-coffee-800 transition-colors"
          >
            Create account
          </button>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-2.5 rounded-lg border border-line text-ink-2 font-medium hover:bg-surface-3 transition-colors"
          >
            Log in
          </button>
          <button
            onClick={dismissAuthPrompt}
            className="w-full py-2 rounded-lg text-sm text-ink-3 hover:text-ink-2 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
