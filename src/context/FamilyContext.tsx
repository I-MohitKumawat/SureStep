/**
 * SureStep — src/context/FamilyContext.tsx
 *
 * Upgraded canonical Family state provider supporting:
 * - Multi-circle tenancy (or State A: No Circle)
 * - Multi-patient support with active patient switching
 * - Canonical Care Circle memberships & 4 delegatable permissions
 * - Real-time socket subscriptions for active patient telemetry
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getSocket } from '../services/socketClient';
import {
  listMyCareCircles,
  listCircleMembers,
  listCirclePatients,
  type CareCircle,
  type CircleMember,
  type CirclePatient,
} from '../services/careCircleService';
import { getFamilyProfile, type FamilyProfile } from '../services/familyService';
import { useAuth } from './AuthContext';

// ─── Context Value ────────────────────────────────────────────────────────────

interface FamilyContextValue {
  circles: CareCircle[];
  activeCircle: CareCircle | null;
  patients: CirclePatient[];
  activePatient: CirclePatient | null;
  patient: CirclePatient | null; // Compatibility alias for activePatient
  careCircle: CircleMember[];
  profile: FamilyProfile | null;
  isLoading: boolean;
  hasPatient: boolean;
  isOwner: boolean;
  permissions: string[];
  hasPermission: (permissionName: string) => boolean;
  setActivePatientId: (patientId: string) => void;
  setActiveCircleId: (circleId: string) => void;
  refresh: () => Promise<void>;
  reloadFamilyData: () => Promise<void>;
  updateLocalPatientState: (patch: Partial<CirclePatient>) => void;
}

const FamilyContext = createContext<FamilyContextValue>({
  circles: [],
  activeCircle: null,
  patients: [],
  activePatient: null,
  patient: null,
  careCircle: [],
  profile: null,
  isLoading: true,
  hasPatient: false,
  isOwner: false,
  permissions: [],
  hasPermission: () => false,
  setActivePatientId: () => {},
  setActiveCircleId: () => {},
  refresh: async () => {},
  reloadFamilyData: async () => {},
  updateLocalPatientState: () => {},
});

export const useFamilyContext = () => useContext(FamilyContext);

// ─── Provider Component ───────────────────────────────────────────────────────

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [circles, setCircles] = useState<CareCircle[]>([]);
  const [activeCircle, setActiveCircle] = useState<CareCircle | null>(null);
  const [patients, setPatients] = useState<CirclePatient[]>([]);
  const [activePatient, setActivePatient] = useState<CirclePatient | null>(null);
  const [careCircle, setCareCircle] = useState<CircleMember[]>([]);
  const [profile, setProfile] = useState<FamilyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activePatientIdRef = useRef<string | null>(null);
  const activeCircleIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch user profile
      const profRes = await getFamilyProfile().catch(() => null);
      if (profRes?.data?.data?.profile) {
        setProfile(profRes.data.data.profile);
      }

      // 2. Fetch Circles for the user
      const userCircles = await listMyCareCircles();
      setCircles(userCircles);

      const targetCircleId = activeCircleIdRef.current ?? activeCircle?.id;
      const currentCircle =
        userCircles.find((c) => c.id === targetCircleId) ?? userCircles[0] ?? null;
      setActiveCircle(currentCircle);
      activeCircleIdRef.current = currentCircle?.id ?? null;

      // 3. If a Circle is active, fetch its members and patients
      if (currentCircle) {
        const [fetchedMembers, fetchedPatients] = await Promise.all([
          listCircleMembers(currentCircle.id),
          listCirclePatients(currentCircle.id),
        ]);

        const resolvedMembers: CircleMember[] =
          fetchedMembers.length > 0
            ? fetchedMembers
            : ((currentCircle as any).members || []);
        const resolvedPatients: CirclePatient[] =
          fetchedPatients.length > 0
            ? fetchedPatients
            : ((currentCircle as any).patients || []);

        setCareCircle(resolvedMembers);
        setPatients(resolvedPatients);

        // Select active patient
        const targetPatientId = activePatientIdRef.current ?? activePatient?.id;
        const currentPatient =
          resolvedPatients.find((p: CirclePatient) => p.id === targetPatientId) ?? resolvedPatients[0] ?? null;
        setActivePatient(currentPatient);
        activePatientIdRef.current = currentPatient?.id ?? null;
      } else {
        setCareCircle([]);
        setPatients([]);
        setActivePatient(null);
        activePatientIdRef.current = null;
      }
    } catch (err) {
      console.warn('[FamilyContext] refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const setActivePatientId = useCallback(
    (patientId: string) => {
      const found = patients.find((p) => p.id === patientId) ?? null;
      setActivePatient(found);
      activePatientIdRef.current = found?.id ?? null;
    },
    [patients]
  );

  const setActiveCircleId = useCallback(
    (circleId: string) => {
      const found = circles.find((c) => c.id === circleId) ?? null;
      setActiveCircle(found);
      activeCircleIdRef.current = found?.id ?? null;
    },
    [circles]
  );

  const updateLocalPatientState = useCallback((patch: Partial<CirclePatient>) => {
    setActivePatient((prev) => (prev ? { ...prev, ...patch } : prev));
    setPatients((prev) =>
      prev.map((p) => (p.id === activePatientIdRef.current ? { ...p, ...patch } : p))
    );
  }, []);

  // Compute permissions & ownership
  const myMemberRecord = careCircle.find((m) => m.user_id === user?.id);
  const isOwner = Boolean(
    (activeCircle && (
      activeCircle.owner_id === user?.id ||
      activeCircle.is_owner ||
      activeCircle.role_in_circle === 'OWNER' ||
      (activeCircle as any).callerRole === 'OWNER'
    )) ||
    myMemberRecord?.is_owner ||
    myMemberRecord?.role_in_circle === 'OWNER'
  );

  const permissions = isOwner
    ? [
        'Manage Member Permissions',
        'Manage Caregiver Relationships',
        'Search/Request Caregivers',
        'Manage Patient Memories',
      ]
    : myMemberRecord?.permissions ?? [];

  const hasPermission = useCallback(
    (permissionName: string) => {
      if (isOwner) return true;
      return permissions.includes(permissionName);
    },
    [isOwner, permissions]
  );

  // ─── Initial Load ─────────────────────────────────────────────────────────
  useEffect(() => {
    void refresh();
  }, [user?.id]);

  // ─── Real-time Socket Subscriptions ───────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    const patientId = activePatient?.id;
    if (!socket || !patientId) return;

    socket.emit('join:patient', patientId);

    const handleStateChange = (data: any) => {
      if (data.patient_id !== patientId) return;
      updateLocalPatientState({
        safety_state: data.safety_state,
        current_zone_name: data.current_zone_name,
        last_known_lat: data.lat,
        last_known_lng: data.lng,
        battery_pct: data.battery_pct,
        last_ping_at: data.last_ping_at,
      });
    };

    const handleRelationshipChange = (data: any) => {
      console.log('[FamilyContext] relationship:change event received:', data);
      void refresh();
    };

    socket.on('state:change', handleStateChange);
    socket.on('relationship:change', handleRelationshipChange);

    return () => {
      socket.off('state:change', handleStateChange);
      socket.off('relationship:change', handleRelationshipChange);
    };
  }, [activePatient?.id, updateLocalPatientState, refresh]);

  return (
    <FamilyContext.Provider
      value={{
        circles,
        activeCircle,
        patients,
        activePatient,
        patient: activePatient,
        careCircle,
        profile,
        isLoading,
        hasPatient: Boolean(activePatient),
        isOwner,
        permissions,
        hasPermission,
        setActivePatientId,
        setActiveCircleId,
        refresh,
        reloadFamilyData: refresh,
        updateLocalPatientState,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};
