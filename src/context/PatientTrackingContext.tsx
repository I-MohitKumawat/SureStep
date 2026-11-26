/**
 * SureStep — src/context/PatientTrackingContext.tsx
 *
 * Single source of truth for patient tracking and awareness state.
 * Shares coords, zones, patientState, and refresh actions between the Caregiver Detail screen
 * and the Live Location Map screen.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Coords, GeofenceZone } from '../utils/geofenceUtils';
import type { ApiPatientState } from '../services/geofenceService';
import { fetchPatientState, requestLocationRefresh } from '../services/geofenceService';
import { fetchLatestPatientLocation, fetchPatientGeofences } from '../utils/geofenceUtils';
import { getSocket } from '../services/socketClient';
import { useAuth } from './AuthContext';

type PatientTrackingContextValue = {
  activePatientId: string | null;
  setActivePatientId: (id: string | null) => void;
  coords: Coords | null;
  coordsTs: number;
  zones: GeofenceZone[];
  patientState: ApiPatientState | null;
  accuracyM?: number;
  speedKmh?: number;
  refreshing: boolean;
  refreshLocation: () => Promise<void>;
  setPatientState: React.Dispatch<React.SetStateAction<ApiPatientState | null>>;
  setCoords: (c: Coords | null) => void;
  setCoordsTs: (ts: number) => void;
  setZones: React.Dispatch<React.SetStateAction<GeofenceZone[]>>;
};

export const PatientTrackingContext = createContext<PatientTrackingContextValue | undefined>(undefined);

export const PatientTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, user } = useAuth();
  const authUserId = status === 'authenticated' ? user?.id : undefined;
  const [activePatientId, setActivePatientId] = useState<string | null>(null);

  const [coords, setCoords] = useState<Coords | null>(null);
  const [coordsTs, setCoordsTs] = useState<number>(0);
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [patientState, setPatientState] = useState<ApiPatientState | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | undefined>(undefined);
  const [speedKmh, setSpeedKmh] = useState<number | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const trackingEpochRef = useRef(0);

  const clearTrackingState = useCallback(() => {
    setCoords(null);
    setCoordsTs(0);
    setZones([]);
    setPatientState(null);
    setAccuracyM(undefined);
    setSpeedKmh(undefined);
    setRefreshing(false);
  }, []);

  // Clear active patient and cached telemetry immediately on signout or account switch
  useEffect(() => {
    trackingEpochRef.current++;
    if (!authUserId) {
      setActivePatientId(null);
      clearTrackingState();
    }
  }, [authUserId, clearTrackingState]);

  // 1. Load initial data on patient or auth change
  useEffect(() => {
    trackingEpochRef.current++;
    if (!authUserId || !activePatientId) {
      clearTrackingState();
      return;
    }

    const expectedEpoch = trackingEpochRef.current;

    const loadInitialData = async () => {
      try {
        const [latestLoc, fetchedZones, fetchedState] = await Promise.all([
          fetchLatestPatientLocation(activePatientId),
          fetchPatientGeofences(activePatientId),
          fetchPatientState(activePatientId),
        ]);

        if (expectedEpoch !== trackingEpochRef.current) return;

        if (latestLoc) {
          setCoords({ latitude: latestLoc.latitude, longitude: latestLoc.longitude });
          const tsStr = latestLoc.recordedAt ? null : (fetchedState?.last_ping_at || fetchedState?.computed_at);
          setCoordsTs(latestLoc.recordedAt || (tsStr ? new Date(tsStr).getTime() : 0));
          if (latestLoc.accuracyM !== undefined) setAccuracyM(latestLoc.accuracyM);
          if (latestLoc.speedKmh !== undefined) setSpeedKmh(latestLoc.speedKmh);
        } else if (fetchedState && fetchedState.last_known_lat != null && fetchedState.last_known_lng != null) {
          setCoords({ latitude: Number(fetchedState.last_known_lat), longitude: Number(fetchedState.last_known_lng) });
          const tsStr = fetchedState.last_ping_at || fetchedState.computed_at;
          setCoordsTs(tsStr ? new Date(tsStr).getTime() : 0);
        }
        if (fetchedZones) {
          setZones(fetchedZones);
        }
        if (fetchedState) {
          setPatientState(fetchedState);
        }
      } catch (err: any) {
        if (expectedEpoch !== trackingEpochRef.current) return;
        const httpStatus = err?.response?.status;
        if (httpStatus === 401 || httpStatus === 403) {
          clearTrackingState();
        }
        console.warn('[PatientTrackingContext] Failed to load initial data:', err);
      }
    };

    void loadInitialData();

    return () => {
      trackingEpochRef.current++;
    };
  }, [authUserId, activePatientId, clearTrackingState]);

  // 2. Real-time WebSocket subscriptions scoped to activePatientId
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activePatientId) return;

    socket.emit('join:patient', activePatientId);

    const handleStateChange = (data: any) => {
      if (data.patient_id !== activePatientId) return;

      const tsStr = data.last_ping_at ?? data.computed_at;
      const ts = tsStr ? new Date(tsStr).getTime() : 0;

      if (data.coords) {
        setCoords({ latitude: data.coords.latitude, longitude: data.coords.longitude });
        if (ts > 0) setCoordsTs(ts);
      } else if (data.last_known_lat != null && data.last_known_lng != null) {
        setCoords({ latitude: data.last_known_lat, longitude: data.last_known_lng });
        if (ts > 0) setCoordsTs(ts);
      }

      setPatientState((prev) => ({
        patient_id:       activePatientId,
        location_state:   data.location_state   ?? prev?.location_state   ?? 'NO_SIGNAL',
        safety_state:     data.safety_state     ?? prev?.safety_state     ?? '',
        routine_state:    data.routine_state    ?? prev?.routine_state    ?? '',
        engagement_state: data.engagement_state ?? prev?.engagement_state ?? 'NO_INTERACTION',
        last_known_lat:   data.last_known_lat   ?? prev?.last_known_lat   ?? null,
        last_known_lng:   data.last_known_lng   ?? prev?.last_known_lng   ?? null,
        last_known_zone_id: data.last_known_zone_id ?? prev?.last_known_zone_id ?? null,
        current_zone_name: data.current_zone_name !== undefined ? data.current_zone_name : (prev?.current_zone_name ?? null),
        last_ping_at:     data.last_ping_at     ?? data.computed_at ?? prev?.last_ping_at ?? null,
        stationary_since: prev?.stationary_since ?? null,
        sos_active:       data.sos_active       ?? prev?.sos_active       ?? false,
        computed_at:      data.computed_at      ?? prev?.computed_at      ?? '',
        battery_pct:      data.battery_pct      ?? prev?.battery_pct      ?? null,
        network_status:   data.network_status   ?? prev?.network_status   ?? null,
      }));

      const accuracyVal = data.accuracy !== undefined ? data.accuracy : data.accuracy_m;
      if (accuracyVal !== undefined && accuracyVal !== null) {
        setAccuracyM(accuracyVal);
      }

      const speedVal = data.speed !== undefined ? data.speed : data.speed_kmh;
      if (speedVal !== undefined && speedVal !== null) {
        setSpeedKmh(speedVal);
      }
    };

    const handleGeofencesChange = (data: any) => {
      if (data.patientId !== activePatientId) return;
      const expectedEpoch = trackingEpochRef.current;
      fetchPatientGeofences(activePatientId)
        .then((fetchedZones) => {
          if (expectedEpoch !== trackingEpochRef.current) return;
          if (fetchedZones) setZones(fetchedZones);
        })
        .catch((err) => {
          if (expectedEpoch !== trackingEpochRef.current) return;
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            clearTrackingState();
          }
          console.warn('[PatientTrackingContext] Failed to refetch zones on socket event:', err);
        });
    };

    const handleAccessRevoked = (data: any) => {
      const targetPatient = data?.patientId ?? data?.patient_id;
      if (!targetPatient || targetPatient === activePatientId) {
        trackingEpochRef.current++;
        clearTrackingState();
      }
    };

    socket.on('state:change', handleStateChange);
    socket.on('geofences:change', handleGeofencesChange);
    socket.on('relationship:change', handleAccessRevoked);
    socket.on('circle:member_removed', handleAccessRevoked);
    socket.on('circle:member_left', handleAccessRevoked);
    socket.on('circle:terminated', handleAccessRevoked);

    return () => {
      socket.off('state:change', handleStateChange);
      socket.off('geofences:change', handleGeofencesChange);
      socket.off('relationship:change', handleAccessRevoked);
      socket.off('circle:member_removed', handleAccessRevoked);
      socket.off('circle:member_left', handleAccessRevoked);
      socket.off('circle:terminated', handleAccessRevoked);
    };
  }, [activePatientId, clearTrackingState]);

  // 3. Centralized location and state refresh loop
  const refreshLocation = useCallback(async () => {
    if (!authUserId || !activePatientId) return;
    const expectedEpoch = trackingEpochRef.current;
    setRefreshing(true);
    try {
      // Refresh geofences directly
      fetchPatientGeofences(activePatientId)
        .then((fetchedZones) => {
          if (expectedEpoch !== trackingEpochRef.current) return;
          if (fetchedZones) setZones(fetchedZones);
        })
        .catch(() => {});

      await requestLocationRefresh(activePatientId);
      if (expectedEpoch !== trackingEpochRef.current) return;
      const currentCoordsTs = coordsTs;

      // Poll up to 6 times, waiting 1.5s between polls (9s max timeout)
      for (let poll = 0; poll < 6; poll++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (expectedEpoch !== trackingEpochRef.current) return;
        const latestLoc = await fetchLatestPatientLocation(activePatientId);
        if (expectedEpoch !== trackingEpochRef.current) return;

        if (latestLoc && latestLoc.recordedAt > currentCoordsTs) {
          setCoords({ latitude: latestLoc.latitude, longitude: latestLoc.longitude });
          setCoordsTs(latestLoc.recordedAt);
          if (latestLoc.accuracyM !== undefined) setAccuracyM(latestLoc.accuracyM);
          if (latestLoc.speedKmh !== undefined) setSpeedKmh(latestLoc.speedKmh);

          if (latestLoc.batteryPct !== undefined) {
            setPatientState((prev) => prev ? { ...prev, battery_pct: latestLoc.batteryPct } : null);
          }

          const state = await fetchPatientState(activePatientId);
          if (expectedEpoch === trackingEpochRef.current && state) setPatientState(state);

          break;
        }
      }
    } catch (err: any) {
      if (expectedEpoch === trackingEpochRef.current && (err?.response?.status === 401 || err?.response?.status === 403)) {
        clearTrackingState();
      }
      console.warn('[PatientTrackingContext] refreshLocation failed:', err);
    } finally {
      if (expectedEpoch === trackingEpochRef.current) {
        setRefreshing(false);
      }
    }
  }, [authUserId, activePatientId, coordsTs, clearTrackingState]);

  const value = useMemo(() => ({
    activePatientId,
    setActivePatientId,
    coords,
    coordsTs,
    zones,
    patientState,
    accuracyM,
    speedKmh,
    refreshing,
    refreshLocation,
    setPatientState,
    setCoords,
    setCoordsTs,
    setZones,
  }), [
    activePatientId,
    coords,
    coordsTs,
    zones,
    patientState,
    accuracyM,
    speedKmh,
    refreshing,
    refreshLocation,
  ]);

  return (
    <PatientTrackingContext.Provider value={value}>
      {children}
    </PatientTrackingContext.Provider>
  );
};

export const usePatientTracking = () => {
  const ctx = useContext(PatientTrackingContext);
  if (!ctx) {
    throw new Error('usePatientTracking must be used within a PatientTrackingProvider');
  }
  return ctx;
};
