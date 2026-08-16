'use client';

/**
 * Friendly empty state: a small line-art coffee cup, a direct headline,
 * and a plain-language hint. Replaces generic "no data" boxes.
 */
export function EmptyState({ title, hint, action = null }) {
  return (
    <div className="text-center py-14 px-6">
      <svg
        width="56"
        height="56"
        viewBox="0 0 48 48"
        fill="none"
        className="mx-auto text-ink-3"
        aria-hidden
      >
        {/* line-art cup with a curl of steam */}
        <path
          d="M10 20h24v10a8 8 0 01-8 8h-8a8 8 0 01-8-8V20z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M34 22h3a4 4 0 010 8h-3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M19 6c-2 2.5 2 4.5 0 7M25 6c-2 2.5 2 4.5 0 7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path d="M8 42h28" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <p className="mt-4 text-ink font-medium">{title}</p>
      {hint && <p className="text-ink-2 text-sm mt-1 max-w-xs mx-auto">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
