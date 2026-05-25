/**
 * SureStep — src/context/NotificationContext.tsx
 * FCM token registration and foreground message routing.
 * STATUS: STUB — implement when Firebase is configured.
 */
import React, { createContext, useContext, useMemo, type ReactNode } from 'react';

type NotificationContextValue = {
  fcmToken: string | null;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const value = useMemo<NotificationContextValue>(() => ({ fcmToken: null }), []);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
