'use client';

import { useState } from 'react';

/**
 * Interactive star rating picker.
 * @param {number} value - current rating 0-5
 * @param {function} onChange - callback(newRating)
 * @param {boolean} readOnly - display-only mode
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
export default function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const [hover, setHover] = useState(0);

  const sizes = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' };
  const active = hover || value;

  return (
    <div className={`inline-flex items-center gap-0.5 ${sizes[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => !readOnly && onChange?.(star === value ? 0 : star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`cursor-${readOnly ? 'default' : 'pointer'} transition-transform ${
            !readOnly ? 'hover:scale-110' : ''
          } ${star <= active ? 'text-coffee-500' : 'text-stone-300'}`}
        >
          ★
        </span>
      ))}
      {!readOnly && (
        <span className="ml-2 text-xs text-stone-500">
          {active > 0 ? `${active}/5` : 'No rating'}
        </span>
      )}
      {readOnly && value > 0 && (
        <span className="ml-1 text-xs text-stone-500">{value.toFixed(1)}</span>
      )}
    </div>
  );
}
