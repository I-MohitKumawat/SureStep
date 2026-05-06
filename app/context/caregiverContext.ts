/**
 * app/context/caregiverContext.ts
 *
 * Pure Supabase — no AsyncStorage.
 * Loads confirmed caregiver directly from patient_caregiver_links + caregivers tables.
 */
import * as React from 'react';
import {
  fetchConfirmedCaregiver,
  confirmCaregiver,
  removeCaregiver,
} from '../../backend/caregiverLinks';
import { supabase } from '../utils/supabaseClient';
import type { CaregiverListing } from '../screens/CaregiverSearchView';

// ─── Types ────────────────────────────────────────────────────────────────────

type CaregiverContextValue = {
  confirmedCaregiver: CaregiverListing | null;
  loading: boolean;
  setConfirmedCaregiver: (c: CaregiverListing | null, patientPhone: string, patientName?: string) => Promise<void>;
  reloadCaregiver: (patientPhone: string) => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const CaregiverContext = React.createContext<CaregiverContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CaregiverProvider({ children }: { children: React.ReactNode }) {
  const [confirmedCaregiver, _setConfirmedCaregiver] = React.useState<CaregiverListing | null>(null);
  const [loading, setLoading] = React.useState(false);

  /**
   * Load caregiver directly from Supabase.
   * No local cache — always reflects the true DB state.
   */
  const reloadCaregiver = React.useCallback(async (patientPhone: string) => {
    if (!patientPhone) {
      _setConfirmedCaregiver(null);
      return;
    }

    setLoading(true);
    try {
      const result = await fetchConfirmedCaregiver(patientPhone);
      _setConfirmedCaregiver(result);
    } catch (e) {
      console.warn('[CaregiverContext] reloadCaregiver failed:', e);
      _setConfirmedCaregiver(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Confirm or remove a caregiver.
   * Writes directly to Supabase, updates in-memory state on success.
   */
  const setConfirmedCaregiver = React.useCallback(
    async (c: CaregiverListing | null, patientPhone: string, patientName?: string) => {
      if (!patientPhone) return;

      // Optimistic update so UI responds immediately
      _setConfirmedCaregiver(c);

      try {
        if (c) {
          await confirmCaregiver(patientPhone, c, patientName);
        } else {
          await removeCaregiver(patientPhone);
        }
      } catch (e) {
        console.warn('[CaregiverContext] Supabase write failed:', e);
        // Revert optimistic update on failure
        _setConfirmedCaregiver(null);
      }
    },
    [],
  );

  const value = React.useMemo<CaregiverContextValue>(
    () => ({ confirmedCaregiver, loading, setConfirmedCaregiver, reloadCaregiver }),
    [confirmedCaregiver, loading, setConfirmedCaregiver, reloadCaregiver],
  );

  return React.createElement(CaregiverContext.Provider, { value }, children);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCaregiver(): CaregiverContextValue {
  const ctx = React.useContext(CaregiverContext);
  if (!ctx) throw new Error('useCaregiver must be used within CaregiverProvider');
  return ctx;
}
