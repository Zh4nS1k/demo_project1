'use client';

import { useState, useEffect, useCallback } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

const messages = { en, ru };
const LOCALE_KEY = 'coffee:locale';

/**
 * Client-side locale provider (next-intl without i18n routing — this app is
 * fully client-rendered). Detects browser language on first visit, persists
 * explicit choices to localStorage, and updates <html lang>.
 */
export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState('en');

  useEffect(() => {
    let next = 'en';
    try {
      const saved = localStorage.getItem(LOCALE_KEY);
      if (saved === 'ru' || saved === 'en') {
        next = saved;
      } else if ((navigator.language || '').toLowerCase().startsWith('ru')) {
        next = 'ru';
      }
    } catch { /* private mode */ }
    setLocaleState(next);
    document.documentElement.lang = next;
  }, []);

  const setLocale = useCallback((next) => {
    setLocaleState(next);
    try { localStorage.setItem(LOCALE_KEY, next); } catch { /* ignore */ }
    document.documentElement.lang = next;
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      {children}
    </NextIntlClientProvider>
  );
}

/** Compact EN/RU segmented switcher for the header. */
export function LanguageToggle() {
  const [locale, setLocaleState] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALE_KEY);
      setLocaleState(saved === 'ru' || saved === 'en'
        ? saved
        : (navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en');
    } catch { setLocaleState('en'); }
  }, []);

  if (!locale) return <span className="w-14 h-7" aria-hidden />;

  const pick = (l) => {
    setLocaleState(l);
    try { localStorage.setItem(LOCALE_KEY, l); } catch { /* ignore */ }
    window.location.reload(); // re-render whole tree under the new provider locale
  };

  return (
    <div className="flex items-center rounded-md border border-line text-xs font-semibold overflow-hidden" role="group" aria-label="Language">
      {['en', 'ru'].map((l) => (
        <button
          key={l}
          onClick={() => pick(l)}
          className={`px-2 py-1 uppercase transition-colors ${
            locale === l ? 'bg-ink text-surface' : 'text-ink-3 hover:text-ink hover:bg-surface-2'
          }`}
          aria-pressed={locale === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
