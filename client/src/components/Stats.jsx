'use client';

/**
 * Shared stat display pieces.
 * Numbers are set in the mono font for a precise, data-forward feel;
 * labels are small, uppercase, secondary — no dashboard-widget clichés.
 */

export function StatCard({ value, label }) {
  return (
    <div className="bg-surface rounded-lg p-5 border border-line">
      <div className="text-[11px] font-medium uppercase tracking-widest text-ink-2">{label}</div>
      <div className="text-2xl sm:text-3xl font-medium text-ink mt-2 font-mono tabular-nums leading-none">
        {value}
      </div>
    </div>
  );
}

export function InsightCard({ title, value, sub, children }) {
  return (
    <div className="bg-surface rounded-lg p-5 border border-line flex flex-col">
      <div className="text-[11px] font-medium uppercase tracking-widest text-ink-2">
        {title}
      </div>
      <div className="text-xl text-ink mt-2 leading-tight font-mono tabular-nums">{value}</div>
      {children ? (
        <>
          <div className="mt-3">{children}</div>
          <div className="text-xs text-ink-2 mt-2">{sub}</div>
        </>
      ) : (
        <div className="text-xs text-ink-2 mt-1.5">{sub}</div>
      )}
    </div>
  );
}

/** Tiny bar sparkline — accent bars on a quiet grid, zero-state safe. */
export function Sparkline({ data, thin = false }) {
  if (!data?.length) {
    return <div className="h-8 rounded-sm bg-surface-2" />;
  }
  const max = Math.max(...data.map((d) => d.caffeine), 1);
  return (
    <div className="flex items-end gap-[2px] h-8" aria-hidden>
      {data.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.caffeine}`}
          className={`flex-1 rounded-sm transition-colors ${thin ? 'min-w-[1px]' : ''} ${
            d.caffeine > 0 ? 'bg-accent/70' : 'bg-surface-3'
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
