'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

/** Minimal footer: identity, a few links, copyright. */
export default function Footer() {
  const t = useTranslations('nav');
  // Year resolved after mount — keeps prerendered HTML deterministic
  const [year, setYear] = useState(null);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return (
    <footer className="border-t border-line mt-12">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-ink-3">
        <div className="flex items-center gap-2">
          <span>☕</span>
          <span className="font-medium text-ink-2">Coffee Drinker</span>
        </div>
        <nav className="flex items-center gap-5">
          <Link href="/" className="hover:text-ink-2 transition-colors">{t('home')}</Link>
          <Link href="/coffees" className="hover:text-ink-2 transition-colors">{t('coffees')}</Link>
          <Link href="/leaderboard" className="hover:text-ink-2 transition-colors">{t('leaderboard')}</Link>
        </nav>
        <p>© {year ?? ''} Coffee Drinker</p>
      </div>
    </footer>
  );
}
