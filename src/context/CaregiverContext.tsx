/**
 * SureStep — src/context/CaregiverContext.tsx
 *
 * Exposes the Patient's canonical caregiver relationships to Patient screens.
 * A caregiver appears only when a Care Circle relationship is ACTIVE or in its
 * NOTICE_PERIOD and an active Patient assignment exists.
 */
import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CaregiverListing } from '../screens/patient/CaregiverSearchView';
import { fetchMyCaregivers } from '../services/relationshipService';

// ─── Types ────────────────────────────────────────────────────────────────────

type CaregiverContextValue = {
  caregivers:       CaregiverListing[];
  confirmedCaregiver: CaregiverListing | null;
  loading:          boolean;
  reloadCaregiver:  (patientPhone?: string, force?: boolean) => Promise<void>;
  reloadCaregivers: (force?: boolean) => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

export const CaregiverContext = createContext<CaregiverContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const CaregiverProvider = ({ children }: { children: ReactNode }) => {
  const [caregivers, setCaregivers] = useState<CaregiverListing[]>([]);
  const [confirmedCaregiver, setConfirmedCaregiverState] = useState<CaregiverListing | null>(null);
  const [loading, setLoading] = useState(false);

  const hasLoadedRef = React.useRef(false);

  const reloadCaregivers = useCallback(
    async (force = false) => {
      if (hasLoadedRef.current && !force) {
        return;
      }

      setLoading(true);
      try {
        const team = await fetchMyCaregivers();
        setCaregivers(team);
        setConfirmedCaregiverState(team[0] || null);
        hasLoadedRef.current = true;
      } catch (error) {
        console.warn('[CaregiverContext] reloadCaregivers failed:', error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Backward-compatible signature for screens that still pass a Patient phone.
   * Canonical relationships are resolved from the authenticated Patient.
   */
  const reloadCaregiver = useCallback(
    async (_patientPhone?: string, force = false) => {
      setLoading(true);
      try {
        const team = await fetchMyCaregivers();
        setCaregivers(team);
        setConfirmedCaregiverState(team[0] || null);
        hasLoadedRef.current = true;
      } catch (error) {
        console.warn('[CaregiverContext] reloadCaregiver failed:', error);
        setCaregivers([]);
        setConfirmedCaregiverState(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const value = useMemo<CaregiverContextValue>(
    () => ({
      caregivers,
      confirmedCaregiver,
      loading,
      reloadCaregiver,
      reloadCaregivers,
    }),
    [caregivers, confirmedCaregiver, loading, reloadCaregiver, reloadCaregivers],
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
