'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';
import StarRating from '@/components/StarRating';

/**
 * Coffee display card with community stats + inline quick-log.
 * Works for guests too: submitting the log queues the action via
 * requireAuth and completes it automatically after sign-in.
 */
export default function CoffeeCard({ coffee, user, requireAuth, onLogged }) {
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
        `Log ${cups} ${cups === 1 ? 'cup' : 'cups'} of ${coffee.name}`
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
          ? 'Saved locally — will sync when you\u2019re back online ☕'
          : `Logged ${cups} ${cups === 1 ? 'cup' : 'cups'}! ☕`
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
    <div className="bg-surface rounded-xl border border-line p-5 flex flex-col gap-4 hover:border-ink-3 transition-colors">
      {/* Top: name + badges */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-ink text-lg leading-tight">{coffee.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-3 text-ink-2">
              {coffee.taste}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-2 text-ink-2">
              ⚡ {coffee.energy_boost}/10
            </span>
            {coffee.milk === 1 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-coffee-100 text-coffee-700">
                milk 🥛
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats: community average */}
      <div className="flex items-center justify-between border-t border-line pt-3">
        <div>
          <div className="text-xs text-ink-3 uppercase tracking-wide">Community</div>
          <div className="flex items-center gap-2 mt-0.5">
            {coffee.avg_rating != null ? (
              <>
                <StarRating value={Math.round(coffee.avg_rating)} readOnly size="sm" />
                <span className="text-sm font-bold text-ink">{coffee.avg_rating.toFixed(1)}</span>
              </>
            ) : (
              <span className="text-sm text-ink-3">No ratings yet</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-ink-3 uppercase tracking-wide">Logged</div>
          <div className="text-sm text-ink-2 mt-0.5">
            {coffee.total_cups} {coffee.total_cups === 1 ? 'cup' : 'cups'}
            <span className="text-ink-3"> · {coffee.total_entries} {coffee.total_entries === 1 ? 'entry' : 'entries'}</span>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {loggedMsg && (
        <div className="bg-surface-2 border border-line text-ink px-3 py-2 rounded-lg text-sm">
          {loggedMsg}
        </div>
      )}
      {cardError && (
        <div className="bg-rust-100 border border-rust-300 text-rust-700 px-3 py-2 rounded-lg text-sm">
          {cardError}
        </div>
      )}

      {/* Quick log */}
      {open ? (
        <form onSubmit={handleLog} className="space-y-3 border-t border-line pt-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-ink">
              Cups
              <input
                type="number"
                min="1"
                max="50"
                value={cups}
                onChange={(e) => setCups(e.target.value)}
                className="w-16 px-2 py-1.5 rounded-lg border border-line text-center focus:outline-none focus:ring-2 focus:ring-coffee-500"
              />
            </label>
            <StarRating value={rating} onChange={setRating} size="sm" />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 rounded-lg bg-ink text-surface text-sm font-medium hover:bg-coffee-800 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Logging…' : 'Log it ☕'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg bg-surface-2 text-ink-2 text-sm font-medium hover:bg-surface-3 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full py-2 rounded-lg border border-line text-sm font-medium text-ink-2 hover:bg-surface-3 transition-colors"
        >
          + Log this coffee
        </button>
      )}
      {!user && !open && (
        <p className="text-xs text-ink-3 text-center">
          You&apos;ll be asked to <Link href="/register" className="underline hover:text-coffee-700">create a free account</Link> to save it
        </p>
      )}
    </div>
  );
}
