'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal';
import Button from '@/components/Button';

/**
 * Global "sign up to continue" prompt.
 * Shown when a guest triggers an account-required action (requireAuth).
 * The queued action runs automatically right after login/register.
 */
export default function AuthPromptModal() {
  const t = useTranslations('authPrompt');
  const { authPrompt, dismissAuthPrompt } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!authPrompt || pathname === '/login' || pathname === '/register') return null;

  return (
    <Modal onClose={dismissAuthPrompt}>
      <div className="text-center">
        <div className="text-4xl mb-3" aria-hidden>☕</div>
        <h2 className="font-display text-xl text-ink">{t('title')}</h2>
        {authPrompt.message && (
          <p className="text-sm text-ink-2 mt-2">
            {t('lead')}{' '}
            <span className="font-medium text-accent">{authPrompt.message}</span>
          </p>
        )}

        <div className="flex flex-col gap-2.5 mt-6">
          <Button onClick={() => router.push('/register')} className="w-full">
            {t('createAccount')}
          </Button>
          <Button onClick={() => router.push('/login')} variant="secondary" className="w-full">
            {t('login')}
          </Button>
          <button
            onClick={dismissAuthPrompt}
            className="w-full py-1 rounded-md text-sm text-ink-3 hover:text-ink-2 transition-colors"
          >
            {t('later')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
