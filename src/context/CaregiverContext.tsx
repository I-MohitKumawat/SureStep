/**
 * SureStep — src/context/CaregiverContext.tsx
 *
 * Exposes the Patient's canonical caregiver relationships to Patient screens.
 * A caregiver appears only when a Care Circle relationship is ACTIVE or in its
 * NOTICE_PERIOD and an active Patient assignment exists.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CaregiverListing } from '../screens/patient/CaregiverSearchView';
import { fetchMyCaregivers } from '../services/relationshipService';
import { getSocket } from '../services/socketClient';
import { useAuth } from './AuthContext';

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
  const { status, user } = useAuth();
  const [caregivers, setCaregivers] = useState<CaregiverListing[]>([]);
  const [confirmedCaregiver, setConfirmedCaregiverState] = useState<CaregiverListing | null>(null);
  const [loading, setLoading] = useState(false);

  const hasLoadedRef = useRef(false);
  const reloadSeqRef = useRef(0);

  useEffect(() => {
    reloadSeqRef.current++;
    hasLoadedRef.current = false;
    setCaregivers([]);
    setConfirmedCaregiverState(null);
    setLoading(false);
  }, [status, user?.id]);

  const reloadCaregivers = useCallback(
    async (force = false) => {
      if (status !== 'authenticated' || !user?.id) {
        setCaregivers([]);
        setConfirmedCaregiverState(null);
        return;
      }
      if (hasLoadedRef.current && !force) {
        return;
      }

      const seq = ++reloadSeqRef.current;
      setLoading(true);
      try {
        const team = await fetchMyCaregivers();
        if (seq !== reloadSeqRef.current) return;
        setCaregivers(team);
        setConfirmedCaregiverState(team[0] || null);
        hasLoadedRef.current = true;
      } catch (error: any) {
        if (seq !== reloadSeqRef.current) return;
        console.warn('[CaregiverContext] reloadCaregivers failed:', error);
        const httpStatus = error?.response?.status;
        if (httpStatus === 401 || httpStatus === 403) {
          setCaregivers([]);
          setConfirmedCaregiverState(null);
          hasLoadedRef.current = false;
        }
      } finally {
        if (seq === reloadSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [status, user?.id],
  );

  /**
   * Backward-compatible signature for screens that still pass a Patient phone.
   * Canonical relationships are resolved from the authenticated Patient.
   */
  const reloadCaregiver = useCallback(
    async (_patientPhone?: string, _force = false) => {
      if (status !== 'authenticated' || !user?.id) {
        setCaregivers([]);
        setConfirmedCaregiverState(null);
        return;
      }
      const seq = ++reloadSeqRef.current;
      setLoading(true);
      try {
        const team = await fetchMyCaregivers();
        if (seq !== reloadSeqRef.current) return;
        setCaregivers(team);
        setConfirmedCaregiverState(team[0] || null);
        hasLoadedRef.current = true;
      } catch (error) {
        if (seq !== reloadSeqRef.current) return;
        console.warn('[CaregiverContext] reloadCaregiver failed:', error);
        setCaregivers([]);
        setConfirmedCaregiverState(null);
        hasLoadedRef.current = false;
      } finally {
        if (seq === reloadSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [status, user?.id],
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket || status !== 'authenticated' || !user?.id) return;
    const handleAccessChange = () => {
      hasLoadedRef.current = false;
      void reloadCaregivers(true);
    };
    socket.on('relationship:change', handleAccessChange);
    socket.on('circle:terminated', handleAccessChange);
    socket.on('circle:member_removed', handleAccessChange);
    return () => {
      socket.off('relationship:change', handleAccessChange);
      socket.off('circle:terminated', handleAccessChange);
      socket.off('circle:member_removed', handleAccessChange);
    };
  }, [status, user?.id, reloadCaregivers]);

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
