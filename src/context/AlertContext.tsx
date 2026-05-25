/**
 * SureStep — src/context/AlertContext.tsx
 * Unread alert count and feed for caregiver and family.
 * STATUS: STUB — implement when alert WebSocket events are wired.
 */
import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type AlertContextValue = {
  unreadCount: number;
  feed:        unknown[];
  acknowledge: (alertId: string) => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [feed] = useState<unknown[]>([]);
  const value = useMemo<AlertContextValue>(() => ({
    unreadCount: 0,
    feed,
    acknowledge: (id) => console.warn('[AlertContext] acknowledge stub:', id),
  }), [feed]);
  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
};

export const useAlerts = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider');
  return ctx;
};
