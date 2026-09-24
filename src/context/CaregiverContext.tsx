/**
 * SureStep — src/context/CaregiverContext.tsx
 *
 * Exposes active/confirmed caregiver information to patient screens.
 * Uses relationshipService for Express API interaction.
 */
import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CaregiverListing } from '../screens/patient/CaregiverSearchView';
import { fetchConfirmedCaregiver, fetchMyCaregivers, confirmCaregiver, removeCaregiver } from '../services/relationshipService';

// ─── Types ────────────────────────────────────────────────────────────────────

type CaregiverContextValue = {
  caregivers:            CaregiverListing[];
  confirmedCaregiver:    CaregiverListing | null;
  loading:               boolean;
  setConfirmedCaregiver: (c: CaregiverListing | null, patientPhone: string, patientName?: string) => Promise<void>;
  reloadCaregiver:       (patientPhone?: string, force?: boolean) => Promise<void>;
  reloadCaregivers:      (force?: boolean) => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const CaregiverContext = createContext<CaregiverContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const CaregiverProvider = ({ children }: { children: ReactNode }) => {
  const [caregivers, setCaregivers] = useState<CaregiverListing[]>([]);
  const [confirmedCaregiver, setConfirmedCaregiverState] = useState<CaregiverListing | null>(null);
  const [loading, setLoading] = useState(false);

  const hasLoadedRef = React.useRef(false);

  /**
   * Sync context state with latest DB records (supports multiple caregivers).
   */
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
   * Backward-compatible sync with patientPhone argument.
   */
  const reloadCaregiver = useCallback(
    async (patientPhone?: string, force = false) => {
      setLoading(true);
      try {
        const team = await fetchMyCaregivers();
        if (team.length > 0) {
          setCaregivers(team);
          setConfirmedCaregiverState(team[0]);
          hasLoadedRef.current = true;
        } else if (patientPhone) {
          const single = await fetchConfirmedCaregiver(patientPhone);
          setConfirmedCaregiverState(single);
          setCaregivers(single ? [single] : []);
        } else {
          setCaregivers([]);
          setConfirmedCaregiverState(null);
        }
      } catch (error) {
        console.warn('[CaregiverContext] reloadCaregiver failed:', error);
        setConfirmedCaregiverState(null);
        setCaregivers([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Confirm or remove a caregiver link.
   */
  const setConfirmedCaregiver = useCallback(
    async (c: CaregiverListing | null, patientPhone: string, patientName?: string) => {
      if (!patientPhone) return;

      // Optimistic update
      const pendingItem = c ? { ...c, status: 'PENDING' } : null;
      setConfirmedCaregiverState(pendingItem);
      if (pendingItem) {
        setCaregivers((prev) => [pendingItem, ...prev.filter((item) => item.id !== pendingItem.id)]);
      }

      try {
        if (c) {
          await confirmCaregiver(patientPhone, c, patientName);
        } else {
          await removeCaregiver(patientPhone);
          setCaregivers([]);
        }
      } catch (error) {
        console.warn('[CaregiverContext] setConfirmedCaregiver failed, reverting state:', error);
        // Revert optimistic update
        setConfirmedCaregiverState(null);
        setCaregivers((prev) => (c ? prev.filter((item) => item.id !== c.id) : prev));
      }
    },
    [],
  );

  const value = useMemo<CaregiverContextValue>(
    () => ({
      caregivers,
      confirmedCaregiver,
      loading,
      setConfirmedCaregiver,
      reloadCaregiver,
      reloadCaregivers,
    }),
    [caregivers, confirmedCaregiver, loading, setConfirmedCaregiver, reloadCaregiver, reloadCaregivers],
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
