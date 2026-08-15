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

/**
 * Persistent site header: logo, primary nav, auth state.
 * Minimalist: single hairline, no shadows, whitespace over boxes.
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
        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
          active ? 'text-ink font-medium' : 'text-ink-2 hover:text-ink'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">
        <button
          onClick={toggleMobilePanel}
          className="lg:hidden p-2 -ml-2 rounded-md text-ink-2 hover:text-ink hover:bg-surface-2"
          aria-label={t('openMenu')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        <Link href="/" className="flex items-center gap-2 font-semibold text-ink tracking-tight">
          <span className="text-lg">☕</span>
          <span className="hidden sm:inline">Coffee Drinker</span>
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
            >
              <span className="w-7 h-7 rounded-full bg-ink text-surface text-xs font-semibold flex items-center justify-center">
                {(user.name || user.username || '?')[0].toUpperCase()}
              </span>
              <span className="hidden sm:inline text-sm text-ink-2">{user.username}</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface border border-line rounded-lg py-1 shadow-xl">
                <div className="px-3 py-2 border-b border-line">
                  <div className="text-sm font-medium text-ink truncate">{user.name}</div>
                  <div className="text-xs text-ink-3">@{user.username}</div>
                </div>
                <Link href="/profile" className="block px-3 py-2 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink">
                  {t('profile')}
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="block px-3 py-2 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink">
                    {t('adminPanel')}
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink"
                >
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Link href="/login" className="px-3 py-1.5 rounded-md text-sm text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors">
              {t('login')}
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-1.5 rounded-md text-sm font-medium bg-ink text-surface hover:bg-coffee-800 transition-colors"
            >
              {t('signup')}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
