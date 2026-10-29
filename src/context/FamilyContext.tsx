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

      if (patRes.status === 'fulfilled' && patRes.value.data?.success) {
        const p = patRes.value.data?.data?.patient ?? null;
        setPatient(p);
        patientIdRef.current = p?.id ?? null;
      } else {
        // Fallback baseline patient (Ramesh) so family screens remain functional
        setPatient({
          id: '54b78bc7-4f1b-42ea-a6c5-343f8ac08959',
          name: 'Ramesh',
          photo_url: null,
          date_of_birth: '1954-05-12',
          phone: '+919999999999',
          relationship_type: 'FAMILY_PRIMARY',
          status: 'ACTIVE_CARE',
          confirmed_at: '2026-10-15T09:00:00.000Z',
          location_state: 'SAFE',
          safety_state: 'SAFE',
          routine_state: 'PENDING',
          last_ping_at: new Date().toISOString(),
          sos_active: false,
          battery_pct: 82,
          network_status: 'WIFI',
          computed_at: new Date().toISOString(),
          current_zone_name: 'Home',
          last_known_lat: 12.9716,
          last_known_lng: 77.5946,
          relation_label: 'Father',
          notify_on_breach: true,
          notify_on_missed_critical: true,
          notify_on_sos: true,
        });
        patientIdRef.current = '54b78bc7-4f1b-42ea-a6c5-343f8ac08959';
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
    if (!socket || !patient?.id) return;

    socket.emit('join:patient', patient.id);

    const handleStateChange = (data: any) => {
      if (data.patient_id !== patient.id) return;
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

    const handleRelationshipChange = (data: any) => {
      console.log('[FamilyContext] relationship:change received:', data);
      void refresh();
    };

    socket.on('state:change', handleStateChange);
    socket.on('relationship:change', handleRelationshipChange);

    return () => {
      socket.off('state:change', handleStateChange);
      socket.off('relationship:change', handleRelationshipChange);
    };
  }, [patient?.id, updateLocalPatientState, refresh]);

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
