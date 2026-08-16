'use client';

import Link from 'next/link';

/**
 * Shared hero: warm display-serif headline, one supporting sentence,
 * a single clear CTA — over a soft accent gradient blob with grain.
 * No stock photos: the background is pure CSS/SVG, theme-aware.
 * CTAs are { label, href } or { label, onClick }.
 */
export default function Hero({ title, subtitle, primary, secondary, compact = false }) {
  const cta = (c, variant) => {
    if (!c) return null;
    const cls =
      variant === 'primary'
        ? 'inline-flex items-center h-11 px-5 rounded-md text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors duration-150'
        : 'inline-flex items-center h-11 px-5 rounded-md text-sm font-medium text-accent border border-accent/50 hover:bg-accent-soft transition-colors duration-150';
    return c.href ? (
      <Link href={c.href} className={cls}>
        {c.label}
      </Link>
    ) : (
      <button onClick={c.onClick} className={cls}>
        {c.label}
      </button>
    );
  };

  return (
    <section
      className={`relative overflow-hidden rounded-lg border border-line bg-surface
        ${compact ? 'px-6 py-12 sm:px-10 sm:py-14' : 'px-6 py-16 sm:px-10 sm:py-24'}`}
    >
      {/* Soft organic accent blob — light: warm blush; dark: ember glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(42rem 30rem at 85% -10%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%),' +
            'radial-gradient(30rem 22rem at -10% 110%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%)',
        }}
      />
      {/* Subtle grain so the surface feels like paper, not a flat fill */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.35] mix-blend-multiply dark:opacity-[0.2] dark:mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.05'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative max-w-2xl">
        <h1 className="font-display text-4xl sm:text-5xl text-ink leading-[1.1]">{title}</h1>
        {subtitle && <p className="text-ink-2 mt-4 text-base sm:text-lg leading-relaxed max-w-xl">{subtitle}</p>}

        {(primary || secondary) && (
          <div className="flex flex-wrap items-center gap-3 mt-8">
            {cta(primary, 'primary')}
            {cta(secondary, 'secondary')}
          </div>
        )}
      </div>
    </section>
  );
}
