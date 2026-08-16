'use client';

/**
 * Page heading: display serif title + optional muted subtitle.
 * No box, no border — whitespace does the work. Used on every page
 * except Home (which has the hero).
 */
export default function PageTitle({ title, subtitle, actions = null }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink leading-tight">{title}</h1>
        {subtitle && <p className="text-ink-2 text-sm mt-2 max-w-prose">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
