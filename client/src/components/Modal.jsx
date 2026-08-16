'use client';

import { useEffect, useRef } from 'react';

/**
 * Centered dialog: blurred backdrop, rounded-lg surface, Escape / click-outside
 * to dismiss, focus moved inside on open. Used by AuthPrompt + admin modals.
 */
export default function Modal({ title, onClose, children, wide = false }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Move focus into the dialog so keyboard users aren't left behind
    panelRef.current?.querySelector('input, select, button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={`relative w-full ${wide ? 'max-w-lg' : 'max-w-md'} max-h-[90vh] overflow-y-auto
          bg-surface rounded-lg border border-line shadow-lift`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-line">
            <h3 className="font-display text-lg text-ink">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 -mr-2 rounded-md text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mx-auto">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
