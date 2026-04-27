import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CaregiverListing } from '../screens/CaregiverSearchView';

type CaregiverContextValue = {
  confirmedCaregiver: CaregiverListing | null;
  setConfirmedCaregiver: (c: CaregiverListing | null) => void;
  reloadCaregiver: () => Promise<void>;
};

const CaregiverContext = React.createContext<CaregiverContextValue | undefined>(undefined);

function storageKey(phone: string) {
  return `surestep_confirmed_caregiver_${phone}`;
}

export function CaregiverProvider({ children }: { children: React.ReactNode }) {
  const [confirmedCaregiver, _setConfirmedCaregiver] = React.useState<CaregiverListing | null>(null);

  const reloadCaregiver = React.useCallback(async () => {
    const phone = await AsyncStorage.getItem('current_phone');
    if (!phone) {
      _setConfirmedCaregiver(null);
      return;
    }
    const raw = await AsyncStorage.getItem(storageKey(phone));
    if (raw) {
      try { _setConfirmedCaregiver(JSON.parse(raw)); }
      catch { _setConfirmedCaregiver(null); }
    } else {
      _setConfirmedCaregiver(null);
    }
  }, []);

  // Load on app mount
  React.useEffect(() => { void reloadCaregiver(); }, [reloadCaregiver]);

  const setConfirmedCaregiver = React.useCallback(async (c: CaregiverListing | null) => {
    _setConfirmedCaregiver(c);
    const phone = await AsyncStorage.getItem('current_phone');
    if (!phone) return;
    if (c) {
      await AsyncStorage.setItem(storageKey(phone), JSON.stringify(c));
    } else {
      await AsyncStorage.removeItem(storageKey(phone));
    }
  }, []);

  const value = React.useMemo(
    () => ({ confirmedCaregiver, setConfirmedCaregiver, reloadCaregiver }),
    [confirmedCaregiver, setConfirmedCaregiver, reloadCaregiver],
  );

  return React.createElement(CaregiverContext.Provider, { value }, children);
}

export function useCaregiver(): CaregiverContextValue {
  const ctx = React.useContext(CaregiverContext);
  if (!ctx) throw new Error('useCaregiver must be used within CaregiverProvider');
  return ctx;
}
