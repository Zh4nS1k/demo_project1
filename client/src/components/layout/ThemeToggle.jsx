'use client';

import { useState, useEffect } from 'react';

const THEME_KEY = 'coffee:theme';

/**
 * Sun/moon theme toggle. Persistence: localStorage ('light' | 'dark').
 * First visit: follows prefers-color-scheme, and keeps following system
 * changes until the user makes an explicit choice.
 * The .dark class itself is applied pre-paint by a script in layout.js.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    setMounted(true);

    // Follow system changes while the user hasn't picked explicitly
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSys = (e) => {
      if (localStorage.getItem(THEME_KEY)) return; // explicit choice wins
      document.documentElement.classList.toggle('dark', e.matches);
      setDark(e.matches);
    };
    mq.addEventListener('change', onSys);
    return () => mq.removeEventListener('change', onSys);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  };

  // Avoid hydration mismatch for the icon
  if (!mounted) return <span className="w-8 h-8" aria-hidden />;

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? (
        // sun
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // moon
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}
