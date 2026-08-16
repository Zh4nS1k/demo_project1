'use client';

import Link from 'next/link';

/**
 * The app-wide button. Variants:
 *   primary   — filled accent, white text (one clear action per view)
 *   secondary — 1px accent outline, accent text
 *   ghost     — quiet text button (toolbars, cancel)
 *   danger    — error outline (destructive actions)
 *
 * Pass `href` to render a next/link with the same skin.
 * `loading` disables and dims without layout shift.
 */
const VARIANTS = {
  primary:
    'bg-accent text-white hover:bg-accent-hover active:bg-accent-hover shadow-xs',
  secondary:
    'border border-accent/60 text-accent hover:bg-accent-soft active:bg-accent-soft',
  ghost:
    'text-ink-2 hover:text-ink hover:bg-surface-2 active:bg-surface-2',
  danger:
    'border border-error/50 text-error hover:bg-error-soft active:bg-error-soft',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-md',
  lg: 'h-11 px-5 text-sm gap-2 rounded-md',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  const cls = `inline-flex items-center justify-center font-medium select-none
    transition-colors duration-150 whitespace-nowrap
    disabled:opacity-50 disabled:pointer-events-none
    ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && (
        <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden />
      )}
      {children}
    </button>
  );
}
