/**
 * SureStep — src/context/VoiceContext.tsx
 * Voice message playback queue for patient. Mounted inside PatientNavigator.
 * STATUS: STUB — implement when voice backend endpoints are live.
 */
import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type VoiceContextValue = {
  queue:      unknown[];
  play:       (messageId: string) => void;
  markHeard:  (messageId: string) => void;
};

const VoiceContext = createContext<VoiceContextValue | null>(null);

export const VoiceProvider = ({ children }: { children: ReactNode }) => {
  const [queue] = useState<unknown[]>([]);
  const value = useMemo<VoiceContextValue>(() => ({
    queue,
    play:      (id) => console.warn('[VoiceContext] play stub:', id),
    markHeard: (id) => console.warn('[VoiceContext] markHeard stub:', id),
  }), [queue]);
  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};

export const useVoice = () => {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice must be used within VoiceProvider');
  return ctx;
};
