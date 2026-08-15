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
      await api.createDay({ ...body, username: user.username });
      setLoggedMsg(`Logged ${cups} ${cups === 1 ? 'cup' : 'cups'}! ☕`);
      setOpen(false);
      setCups(1);
      setRating(0);
      onLogged?.();
      setTimeout(() => setLoggedMsg(''), 3000);
    } catch (err) {
      setCardError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 flex flex-col gap-4 hover:border-stone-300 transition-colors">
      {/* Top: name + badges */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-neutral-900 text-lg leading-tight">{coffee.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-200 text-stone-600">
              {coffee.taste}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-500">
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
      <div className="flex items-center justify-between border-t border-stone-100 pt-3">
        <div>
          <div className="text-xs text-stone-400 uppercase tracking-wide">Community</div>
          <div className="flex items-center gap-2 mt-0.5">
            {coffee.avg_rating != null ? (
              <>
                <StarRating value={Math.round(coffee.avg_rating)} readOnly size="sm" />
                <span className="text-sm font-bold text-neutral-900">{coffee.avg_rating.toFixed(1)}</span>
              </>
            ) : (
              <span className="text-sm text-stone-400">No ratings yet</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-stone-400 uppercase tracking-wide">Logged</div>
          <div className="text-sm text-stone-600 mt-0.5">
            {coffee.total_cups} {coffee.total_cups === 1 ? 'cup' : 'cups'}
            <span className="text-stone-400"> · {coffee.total_entries} {coffee.total_entries === 1 ? 'entry' : 'entries'}</span>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {loggedMsg && (
        <div className="bg-stone-100 border border-stone-300 text-neutral-800 px-3 py-2 rounded-lg text-sm">
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
        <form onSubmit={handleLog} className="space-y-3 border-t border-stone-100 pt-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-neutral-800">
              Cups
              <input
                type="number"
                min="1"
                max="50"
                value={cups}
                onChange={(e) => setCups(e.target.value)}
                className="w-16 px-2 py-1.5 rounded-lg border border-stone-300 text-center focus:outline-none focus:ring-2 focus:ring-coffee-500"
              />
            </label>
            <StarRating value={rating} onChange={setRating} size="sm" />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-coffee-800 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Logging…' : 'Log it ☕'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg bg-stone-100 text-stone-700 text-sm font-medium hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full py-2 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
        >
          + Log this coffee
        </button>
      )}
      {!user && !open && (
        <p className="text-xs text-stone-400 text-center">
          You&apos;ll be asked to <Link href="/register" className="underline hover:text-coffee-700">create a free account</Link> to save it
        </p>
      )}
    </div>
  );
}
