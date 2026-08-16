'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import StarRating from '@/components/StarRating';
import Card from '@/components/Card';
import Button from '@/components/Button';

/**
 * Coffee display card with community stats + inline quick-log.
 * Works for guests too: submitting the log queues the action via
 * requireAuth and completes it automatically after sign-in.
 */
export default function CoffeeCard({ coffee, user, requireAuth, onLogged }) {
  const t = useTranslations('coffeeCard');
  const tt = useTranslations('tastes');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [cups, setCups] = useState(1);
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loggedMsg, setLoggedMsg] = useState('');
  const [cardError, setCardError] = useState('');

  const handleLog = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setCardError('');
    setLoggedMsg('');

    const body = {
      coffee_name: coffee.name,
      count_of_cups: parseInt(cups, 10),
      rating,
    };

    // Guest: queue the exact log and prompt for an account.
    // After sign-in the action completes with the fresh user's username.
    if (!user) {
      const queued = requireAuth(
        (loggedInUser) =>
          api.createDay({ ...body, username: loggedInUser.username }),
        `${cups} × ${coffee.name}`
      );
      if (!queued) {
        setSubmitting(false);
        return; // prompt shown; form stays as-is in case they dismiss
      }
    }

    try {
      const res = await api.createDay({ ...body, username: user.username });
      setLoggedMsg(
        res.queued
          ? t('queuedMsg')
          : t('loggedMsg', { cups })
      );
      setOpen(false);
      setCups(1);
      setRating(0);
      onLogged?.();
      setTimeout(() => setLoggedMsg(''), 4000);
    } catch (err) {
      setCardError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card hover padding="md" className="flex flex-col gap-4">
      {/* Top: name + attributes */}
      <div>
        <h2 className="font-medium text-ink text-lg leading-tight">{coffee.name}</h2>
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent-soft text-accent">
            {tt.has(coffee.taste) ? tt(coffee.taste) : coffee.taste}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-2 text-ink-2 font-mono">
            ⚡{coffee.energy_boost}/10
          </span>
          {coffee.milk === 1 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-2 text-ink-2">
              🥛 {t('milkLabel')}
            </span>
          )}
        </div>
      </div>

      {/* Stats: community average */}
      <div className="flex items-center justify-between border-t border-line pt-3.5">
        <div>
          <div className="text-[11px] text-ink-3 uppercase tracking-widest">{t('community')}</div>
          <div className="flex items-center gap-2 mt-1">
            {coffee.avg_rating != null ? (
              <>
                <StarRating value={Math.round(coffee.avg_rating)} readOnly size="sm" />
                <span className="text-sm font-medium text-ink font-mono">{coffee.avg_rating.toFixed(1)}</span>
              </>
            ) : (
              <span className="text-sm text-ink-3">{t('noRatings')}</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-ink-3 uppercase tracking-widest">{t('logged')}</div>
          <div className="text-sm text-ink-2 mt-1 font-mono tabular-nums">
            {coffee.total_cups}
            <span className="text-ink-3"> · {coffee.total_entries}</span>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {loggedMsg && (
        <div className="bg-success-soft border border-success/25 text-success px-3 py-2 rounded-md text-sm">
          {loggedMsg}
        </div>
      )}
      {cardError && (
        <div className="bg-error-soft border border-error/25 text-error px-3 py-2 rounded-md text-sm">
          {cardError}
        </div>
      )}

      {/* Quick log */}
      {open ? (
        <form onSubmit={handleLog} className="space-y-3 border-t border-line pt-3.5">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-ink">
              {t('cups')}
              <input
                type="number"
                min="1"
                max="50"
                value={cups}
                onChange={(e) => setCups(e.target.value)}
                className="w-16 h-9 px-2 rounded-md border border-line text-center font-mono
                  focus:border-accent focus:outline-none transition-colors duration-150"
              />
            </label>
            <StarRating value={rating} onChange={setRating} size="sm" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={submitting} className="flex-1">
              {t('logIt')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {tc('cancel')}
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" size="sm" className="w-full" onClick={() => setOpen(true)}>
          {t('logThis')}
        </Button>
      )}
      {!user && !open && (
        <p className="text-xs text-ink-3 text-center">
          {t.rich('guestHint', {
            link: (chunks) => <Link href="/register" className="underline hover:text-accent">{chunks}</Link>,
          })}
        </p>
      )}
    </Card>
  );
}
