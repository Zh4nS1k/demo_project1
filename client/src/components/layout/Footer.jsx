'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

/** Minimal footer: one row — identity, links, copyright. Nothing else. */
export default function Footer() {
  const t = useTranslations('nav');
  // Year resolved after mount — keeps prerendered HTML deterministic
  const [year, setYear] = useState(null);
  useEffect(() => setYear(new Date().getFullYear()), []);

  return (
    <footer className="border-t border-line mt-16">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4 text-sm text-ink-3">
        <p>© {year ?? ''} Coffee Drinker</p>
        <nav className="flex items-center gap-5">
          <Link href="/coffees" className="hover:text-ink-2 transition-colors">{t('coffees')}</Link>
          <Link href="/leaderboard" className="hover:text-ink-2 transition-colors">{t('leaderboard')}</Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink-2 transition-colors inline-flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.69-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.15 1.18a10.9 10.9 0 015.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.74.11 3.03.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.66.41.36.77 1.05.77 2.13v3.16c0 .31.21.67.8.55A11.5 11.5 0 0023.5 12C23.5 5.65 18.35.5 12 .5z" />
            </svg>
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
