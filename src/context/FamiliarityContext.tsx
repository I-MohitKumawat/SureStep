/**
 * SureStep — src/context/FamiliarityContext.tsx
 * Patient familiarity assets: photos, favourite songs, today's story.
 * STATUS: STUB — implement when familiarity endpoints are live.
 */
import React, { createContext, useContext, useMemo, type ReactNode } from 'react';

type FamiliarityContextValue = {
  assets:          unknown[];
  favourite_songs: unknown[];
  todayStory:      unknown | null;
};

const FamiliarityContext = createContext<FamiliarityContextValue | null>(null);

export const FamiliarityProvider = ({ children }: { children: ReactNode }) => {
  const value = useMemo<FamiliarityContextValue>(
    () => ({ assets: [], favourite_songs: [], todayStory: null }),
    [],
  );
  return <FamiliarityContext.Provider value={value}>{children}</FamiliarityContext.Provider>;
};

export const useFamiliarity = () => {
  const ctx = useContext(FamiliarityContext);
  if (!ctx) throw new Error('useFamiliarity must be used within FamiliarityProvider');
  return ctx;
};
