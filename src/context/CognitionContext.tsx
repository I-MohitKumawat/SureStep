/**
 * SureStep — src/context/CognitionContext.tsx
 * Local game session state. Accumulates metrics during gameplay.
 * STATUS: STUB — implement when cognition endpoints are live.
 */
import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type CognitionContextValue = {
  activeSessionId: string | null;
  startSession:    (gameType: string) => void;
  recordMetric:    (type: string, value: number) => void;
  endSession:      () => void;
};

const CognitionContext = createContext<CognitionContextValue | null>(null);

export const CognitionProvider = ({ children }: { children: ReactNode }) => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const value = useMemo<CognitionContextValue>(() => ({
    activeSessionId,
    startSession:  (g) => { console.warn('[CognitionContext] startSession stub:', g); setActiveSessionId('stub-session'); },
    recordMetric:  (t, v) => console.warn('[CognitionContext] recordMetric stub:', t, v),
    endSession:    () => setActiveSessionId(null),
  }), [activeSessionId]);
  return <CognitionContext.Provider value={value}>{children}</CognitionContext.Provider>;
};

export const useCognition = () => {
  const ctx = useContext(CognitionContext);
  if (!ctx) throw new Error('useCognition must be used within CognitionProvider');
  return ctx;
};
