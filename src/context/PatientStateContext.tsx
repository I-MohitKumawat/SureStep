/**
 * SureStep — src/context/PatientStateContext.tsx
 * Multi-patient state map for caregiver and family navigators.
 * Renamed + restructured from: app/context/caregiverContext.ts
 * Key change: holds Map<patient_id, PatientState> instead of a single caregiver state.
 * Mounted inside CaregiverNavigator and FamilyNavigator (NOT globally).
 */
import React, {
  createContext, useCallback, useContext, useMemo, useState, type ReactNode,
} from 'react';
import type { PatientState } from '../types/api.types';
import apiClient from '../services/apiClient';

type PatientStateMap = Map<string, PatientState>;

type PatientStateContextValue = {
  stateMap:           PatientStateMap;
  loading:            boolean;
  loadMyPatients:     () => Promise<void>;
  getPatientState:    (patientId: string) => PatientState | undefined;
};

const PatientStateContext = createContext<PatientStateContextValue | null>(null);

export const PatientStateProvider = ({ children }: { children: ReactNode }) => {
  const [stateMap, setStateMap] = useState<PatientStateMap>(new Map());
  const [loading,  setLoading]  = useState(false);

  const loadMyPatients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/awareness/my-patients');
      const entries: PatientState[] = data.data ?? [];
      setStateMap(new Map(entries.map((s) => [s.patient_id, s])));
    } catch (e) {
      console.warn('[PatientStateContext] loadMyPatients failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPatientState = useCallback(
    (patientId: string) => stateMap.get(patientId),
    [stateMap],
  );

  const value = useMemo<PatientStateContextValue>(
    () => ({ stateMap, loading, loadMyPatients, getPatientState }),
    [stateMap, loading, loadMyPatients, getPatientState],
  );

  return <PatientStateContext.Provider value={value}>{children}</PatientStateContext.Provider>;
};

export const usePatientState = (): PatientStateContextValue => {
  const ctx = useContext(PatientStateContext);
  if (!ctx) throw new Error('usePatientState must be used within PatientStateProvider');
  return ctx;
};
