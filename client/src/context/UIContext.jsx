'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const UIContext = createContext(null);
const PANEL_KEY = 'coffee:panel-open';

/**
 * Cross-page UI state: the collapsible coffee side panel.
 * - panelOpen: desktop preference (expanded list ↔ icon-only rail), persisted
 *   to localStorage so it survives navigation and reloads.
 * - mobilePanelOpen: mobile drawer visibility (always starts closed).
 */
export function UIProvider({ children }) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(PANEL_KEY);
    if (saved !== null) setPanelOpen(saved === 'true');
  }, []);

  const togglePanel = useCallback(() => {
    setPanelOpen((v) => {
      localStorage.setItem(PANEL_KEY, String(!v));
      return !v;
    });
  }, []);

  const toggleMobilePanel = useCallback(() => setMobilePanelOpen((v) => !v), []);
  const closeMobilePanel = useCallback(() => setMobilePanelOpen(false), []);

  return (
    <UIContext.Provider value={{ panelOpen, togglePanel, mobilePanelOpen, toggleMobilePanel, closeMobilePanel }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
