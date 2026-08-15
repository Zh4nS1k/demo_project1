'use client';

import Link from 'next/link';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&q=80',
  'https://images.unsplash.com/photo-1521302080334-4bebac2763a6?w=1200&q=80',
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&q=80',
  'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200&q=80',
];

export function pickHeroImage() {
  return HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)];
}

/**
 * Shared hero: coffee image, headline, optional CTA buttons.
 * CTAs are { label, href } or { label, onClick }.
 */
export default function Hero({ image, title, subtitle, primary, secondary, compact = false }) {
  const img = image || pickHeroImage();

  return (
    <section className="relative rounded-2xl overflow-hidden bg-neutral-950">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img}
        alt="Coffee"
        className="absolute inset-0 w-full h-full object-cover opacity-80 grayscale-[30%]"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      <div className={`relative px-6 text-center ${compact ? 'py-12 sm:py-16' : 'py-16 sm:py-24'}`}>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-stone-200 mt-3 max-w-xl mx-auto">{subtitle}</p>}

        {(primary || secondary) && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {primary?.href && (
              <Link
                href={primary.href}
                className="px-6 py-2.5 rounded-lg bg-surface text-ink font-semibold hover:bg-surface-3 transition-colors"
              >
                {primary.label}
              </Link>
            )}
            {primary?.onClick && (
              <button
                onClick={primary.onClick}
                className="px-6 py-2.5 rounded-lg bg-surface text-ink font-semibold hover:bg-surface-3 transition-colors"
              >
                {primary.label}
              </button>
            )}
            {secondary?.href && (
              <Link
                href={secondary.href}
                className="px-6 py-2.5 rounded-lg border border-white/30 text-stone-100 font-medium hover:bg-surface/10 transition-colors"
              >
                {secondary.label}
              </Link>
            )}
            {secondary?.onClick && (
              <button
                onClick={secondary.onClick}
                className="px-6 py-2.5 rounded-lg border border-white/30 text-stone-100 font-medium hover:bg-surface/10 transition-colors"
              >
                {secondary.label}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
