'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

/**
 * Interactive star rating picker.
 * Filled stars use the accent color, empty stars a muted outline,
 * with a smooth hover-fill preview. Same API as before:
 * @param {number} value - current rating 0-5
 * @param {function} onChange - callback(newRating)
 * @param {boolean} readOnly - display-only mode
 * @param {string} size - 'sm' | 'md' | 'lg'
 */

function Star({ fillLevel, size }) {
  // fillLevel: 0 (empty) | 0.5 (half via clip for averages) | 1 (full)
  return (
    <span className="relative inline-block leading-none" style={{ width: size, height: size }}>
      {/* outline base */}
      <svg width={size} height={size} viewBox="0 0 24 24" className="absolute inset-0 text-ink-3" aria-hidden>
        <path
          d="M12 2.7l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.5l-5.8 3-1.1-6.4L.4 9.5l6.5-.9L12 2.7z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      {/* accent fill, clipped by fill level */}
      {fillLevel > 0 && (
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${fillLevel * 100}%` }}
          aria-hidden
        >
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-accent">
            <path
              d="M12 2.7l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.5l-5.8 3-1.1-6.4L.4 9.5l6.5-.9L12 2.7z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </span>
  );
}

export default function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const t = useTranslations('home');
  const [hover, setHover] = useState(0);

  const px = { sm: 14, md: 20, lg: 30 }[size];
  const active = hover || value;

  return (
    <span className={`inline-flex items-center gap-0.5 ${readOnly ? '' : 'cursor-pointer'}`}>
      <span className="inline-flex items-center gap-0.5" role={readOnly ? 'img' : 'radiogroup'} aria-label={`${value} / 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => !readOnly && onChange?.(star === value ? 0 : star)}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(0)}
            className={`transition-transform duration-150 ${!readOnly ? 'hover:scale-110' : ''}`}
          >
            <Star fillLevel={star <= active ? 1 : 0} size={px} />
          </span>
        ))}
      </span>
      {!readOnly && (
        <span className="ml-2 text-xs text-ink-2 tabular-nums">
          {active > 0 ? t('ratingValue', { value: active }) : t('noRating')}
        </span>
      )}
      {readOnly && value > 0 && (
        <span className="ml-1 text-xs text-ink-2 font-mono">{value.toFixed(1)}</span>
      )}
    </span>
  );
}
