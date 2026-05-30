/**
 * SureStep — src/context/CaregiverContext.tsx
 *
 * Exposes active/confirmed caregiver information to patient screens.
 * Uses relationshipService for Express API interaction.
 */
import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CaregiverListing } from '../screens/patient/CaregiverSearchView';
import { fetchConfirmedCaregiver, confirmCaregiver, removeCaregiver } from '../services/relationshipService';

// ─── Types ────────────────────────────────────────────────────────────────────

type CaregiverContextValue = {
  confirmedCaregiver:    CaregiverListing | null;
  loading:               boolean;
  setConfirmedCaregiver: (c: CaregiverListing | null, patientPhone: string, patientName?: string) => Promise<void>;
  reloadCaregiver:       (patientPhone: string, force?: boolean) => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const CaregiverContext = createContext<CaregiverContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const CaregiverProvider = ({ children }: { children: ReactNode }) => {
  const [confirmedCaregiver, setConfirmedCaregiverState] = useState<CaregiverListing | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Sync context state with latest DB record.
   */
  const reloadCaregiver = useCallback(
    async (patientPhone: string, force = false) => {
      if (!patientPhone) {
        setConfirmedCaregiverState(null);
        return;
      }

      // If we already have the caregiver, skip API fetch unless forced
      if (confirmedCaregiver && !force) {
        return;
      }

      setLoading(true);
      try {
        const caregiver = await fetchConfirmedCaregiver(patientPhone);
        setConfirmedCaregiverState(caregiver);
      } catch (error) {
        console.warn('[CaregiverContext] reloadCaregiver failed:', error);
        setConfirmedCaregiverState(null);
      } finally {
        setLoading(false);
      }
    },
    [confirmedCaregiver],
  );

  /**
   * Confirm or remove a caregiver link.
   */
  const setConfirmedCaregiver = useCallback(
    async (c: CaregiverListing | null, patientPhone: string, patientName?: string) => {
      if (!patientPhone) return;

      // Optimistic update
      setConfirmedCaregiverState(c);

      try {
        if (c) {
          await confirmCaregiver(patientPhone, c, patientName);
        } else {
          await removeCaregiver(patientPhone);
        }
      } catch (error) {
        console.warn('[CaregiverContext] setConfirmedCaregiver failed, reverting state:', error);
        // Revert optimistic update
        setConfirmedCaregiverState(null);
      }
    },
    [],
  );

  const value = useMemo<CaregiverContextValue>(
    () => ({
      confirmedCaregiver,
      loading,
      setConfirmedCaregiver,
      reloadCaregiver,
    }),
    [confirmedCaregiver, loading, setConfirmedCaregiver, reloadCaregiver],
  );

  return <CaregiverContext.Provider value={value}>{children}</CaregiverContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCaregiver = (): CaregiverContextValue => {
  const ctx = useContext(CaregiverContext);
  if (!ctx) {
    throw new Error('useCaregiver must be used within a CaregiverProvider');
  }
  return ctx;
};
