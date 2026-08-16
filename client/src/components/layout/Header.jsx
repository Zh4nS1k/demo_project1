'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { LanguageToggle } from '@/context/I18nContext';
import SyncStatus from '@/components/layout/SyncStatus';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Button from '@/components/Button';

/**
 * Persistent site header: wordmark, primary nav, auth state.
 * Sticky, hairline bottom border, no shadow — calm and confident.
 */
export default function Header() {
  const t = useTranslations('nav');
  const { user, logout } = useAuth();
  const { toggleMobilePanel } = useUI();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const navLink = (href, label) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        className={`px-3 py-1.5 rounded-md text-sm transition-colors duration-150 ${
          active
            ? 'text-accent font-medium bg-accent-soft'
            : 'text-ink-2 hover:text-ink hover:bg-surface-2'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">
        <button
          onClick={toggleMobilePanel}
          className="lg:hidden p-2 -ml-2 rounded-md text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
          aria-label={t('openMenu')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        <Link href="/" className="flex items-center gap-2 text-ink group">
          <span className="text-lg transition-transform duration-200 group-hover:-rotate-12">☕</span>
          <span className="hidden sm:inline font-display font-semibold text-[17px] tracking-tight">
            Coffee Drinker
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-6">
          {navLink('/', t('home'))}
          {navLink('/coffees', t('coffees'))}
          {navLink('/leaderboard', t('leaderboard'))}
          {user && navLink('/profile', t('profile'))}
          {user?.role === 'admin' && navLink('/admin', t('admin'))}
        </nav>

        <div className="flex-1" />

        <ThemeToggle />
        <LanguageToggle />
        <SyncStatus />

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-2 transition-colors"
              aria-label={t('accountMenu')}
              aria-expanded={menuOpen}
            >
              <span className="w-7 h-7 rounded-full bg-accent-soft text-accent text-xs font-semibold flex items-center justify-center">
                {(user.name || user.username || '?')[0].toUpperCase()}
              </span>
              <span className="hidden sm:inline text-sm text-ink-2">{user.username}</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface border border-line rounded-md py-1 shadow-lift">
                <div className="px-3 py-2 border-b border-line">
                  <div className="text-sm font-medium text-ink truncate">{user.name}</div>
                  <div className="text-xs text-ink-3">@{user.username}</div>
                </div>
                <Link href="/profile" className="block px-3 py-2 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors">
                  {t('profile')}
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="block px-3 py-2 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors">
                    {t('adminPanel')}
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors"
                >
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Button href="/login" variant="ghost" size="sm">
              {t('login')}
            </Button>
            <Button href="/register" variant="primary" size="sm">
              {t('signup')}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
