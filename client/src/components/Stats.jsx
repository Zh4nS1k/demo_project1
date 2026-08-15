'use client';

/**
 * Shared stat display pieces (black/white/gray/brown palette).
 */

export function StatCard({ icon, value, label }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-stone-200 text-center">
      <div className="text-2xl sm:text-3xl">{icon}</div>
      <div className="text-xl font-bold text-neutral-900 mt-1">{value}</div>
      <div className="text-xs sm:text-sm text-stone-500">{label}</div>
    </div>
  );
}

export function InsightCard({ icon, title, value, sub, children }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-stone-200 flex flex-col">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-400 font-semibold">
        <span className="text-base">{icon}</span> {title}
      </div>
      <div className="text-xl font-bold text-neutral-900 mt-2 leading-tight">{value}</div>
      {children ? (
        <>
          <div className="mt-2">{children}</div>
          <div className="text-xs text-stone-500 mt-1.5">{sub}</div>
        </>
      ) : (
        <div className="text-xs text-stone-500 mt-1">{sub}</div>
      )}
    </div>
  );
}

/** Tiny bar sparkline — black/gray/brown only, zero-state safe. */
export function Sparkline({ data, thin = false }) {
  if (!data?.length) {
    return <div className="h-8 rounded bg-stone-100" />;
  }
  const max = Math.max(...data.map((d) => d.caffeine), 1);
  return (
    <div className="flex items-end gap-[2px] h-8" aria-hidden>
      {data.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.caffeine}`}
          className={`flex-1 rounded-sm ${thin ? 'min-w-[1px]' : ''} ${
            d.caffeine > 0 ? 'bg-coffee-600' : 'bg-stone-200'
          }`}
          style={{ height: `${Math.max((d.caffeine / max) * 100, 6)}%` }}
        />
      ))}
    </div>
  );
}

/** Derive insight data from a summary payload with safe fallbacks. */
export function deriveInsights(summary) {
  if (!summary) {
    return {
      streaks: { current: 0, longest: 0 },
      mostActiveWeekday: null,
      trend7: { total: 0, daily: [] },
      trend30: { total: 0, daily: [] },
    };
  }
  return {
    streaks: summary.streaks || { current: 0, longest: 0 },
    mostActiveWeekday: summary.most_active_weekday || null,
    trend7: summary.caffeine_trend?.last7 || { total: 0, daily: [] },
    trend30: summary.caffeine_trend?.last30 || { total: 0, daily: [] },
  };
}
