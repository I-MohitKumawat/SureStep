/**
 * SureStep — src/context/FamilyContext.tsx
 *
 * Provides family-specific state across all family screens.
 * Loads the linked patient, care circle, and family profile on mount.
 * Subscribes to real-time socket events for patient state changes.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getSocket } from '../services/socketClient';
import {
  getMyPatient,
  getCareCircle,
  getFamilyProfile,
  type FamilyPatient,
  type CareCircleMember,
  type FamilyProfile,
} from '../services/familyService';
import { useAuth } from './AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FamilyContextValue {
  patient:      FamilyPatient | null;
  careCircle:   CareCircleMember[];
  profile:      FamilyProfile | null;
  isLoading:    boolean;
  hasPatient:   boolean;
  refresh:      () => Promise<void>;
  updateLocalPatientState: (patch: Partial<FamilyPatient>) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const FamilyContext = createContext<FamilyContextValue>({
  patient:      null,
  careCircle:   [],
  profile:      null,
  isLoading:    true,
  hasPatient:   false,
  refresh:      async () => {},
  updateLocalPatientState: () => {},
});

export const useFamilyContext = () => useContext(FamilyContext);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [patient,    setPatient]    = useState<FamilyPatient | null>(null);
  const [careCircle, setCareCircle] = useState<CareCircleMember[]>([]);
  const [profile,    setProfile]    = useState<FamilyProfile | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const patientIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [patRes, circleRes, profRes] = await Promise.allSettled([
        getMyPatient(),
        getCareCircle(),
        getFamilyProfile(),
      ]);

      if (patRes.status === 'fulfilled') {
        const p = patRes.value.data?.data?.patient ?? null;
        setPatient(p);
        patientIdRef.current = p?.id ?? null;
      }
      if (circleRes.status === 'fulfilled') {
        setCareCircle(circleRes.value.data?.data?.members ?? []);
      }
      if (profRes.status === 'fulfilled') {
        setProfile(profRes.value.data?.data?.profile ?? null);
      }
    } catch (err) {
      console.warn('[FamilyContext] refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateLocalPatientState = useCallback((patch: Partial<FamilyPatient>) => {
    setPatient((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  // ─── Initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ─── Real-time socket subscriptions ──────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !patientIdRef.current) return;

    socket.emit('join:patient', patientIdRef.current);

    const handleStateChange = (data: any) => {
      if (data.patient_id !== patientIdRef.current) return;
      updateLocalPatientState({
        safety_state:    data.safety_state,
        location_state:  data.location_state,
        routine_state:   data.routine_state,
        sos_active:      data.sos_active,
        battery_pct:     data.battery_pct,
        network_status:  data.network_status,
        computed_at:     data.computed_at,
        current_zone_name: data.current_zone_name,
      });
    };

    socket.on('state:change', handleStateChange);
    return () => { socket.off('state:change', handleStateChange); };
  }, [patient?.id, updateLocalPatientState]);

  return (
    <FamilyContext.Provider
      value={{
        patient,
        careCircle,
        profile,
        isLoading,
        hasPatient: !!patient,
        refresh,
        updateLocalPatientState,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};
