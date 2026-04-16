import * as React from 'react';
import type { CaregiverListing } from '../screens/CaregiverSearchView';

type CaregiverContextValue = {
  confirmedCaregiver: CaregiverListing | null;
  setConfirmedCaregiver: (c: CaregiverListing | null) => void;
};

const CaregiverContext = React.createContext<CaregiverContextValue | undefined>(undefined);

export function CaregiverProvider({ children }: { children: React.ReactNode }) {
  const [confirmedCaregiver, setConfirmedCaregiver] = React.useState<CaregiverListing | null>(null);

  const value = React.useMemo(
    () => ({ confirmedCaregiver, setConfirmedCaregiver }),
    [confirmedCaregiver],
  );

  return React.createElement(CaregiverContext.Provider, { value }, children);
}

export function useCaregiver(): CaregiverContextValue {
  const ctx = React.useContext(CaregiverContext);
  if (!ctx) throw new Error('useCaregiver must be used within CaregiverProvider');
  return ctx;
}
