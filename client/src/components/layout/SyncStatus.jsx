'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SYNC_EVENT, getPendingCount } from '@/lib/api';

/**
 * Connection status dot for the header.
 * Online (solid, coffee) · Syncing (pulsing) · Offline (hollow, with pending count).
 */
export default function SyncStatus() {
  const t = useTranslations('sync');
  const [state, setState] = useState({ online: true, pending: 0, syncing: false });

  useEffect(() => {
    const read = () => ({ online: navigator.onLine, pending: getPendingCount(), syncing: false });
    const onSync = (e) => setState(e?.detail || read());
    const onOnline = () => setState(read());
    const onOffline = () => setState((s) => ({ ...s, online: false }));

    setState(read());
    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const { online, pending, syncing } = state;

  let dotClass = 'bg-success';
  let label = t('online');
  if (syncing) {
    dotClass = 'bg-accent animate-pulse';
    label = t('syncing');
  } else if (!online || pending > 0) {
    dotClass = 'bg-transparent border-2 border-ink-3';
    label = pending > 0 ? t('pending', { count: pending }) : t('offline');
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-ink-3"
      title={syncing ? t('hint') : label}
    >
      <span className={`w-2 h-2 rounded-full ${dotClass}`} aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}
