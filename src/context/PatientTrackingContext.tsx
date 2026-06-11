/**
 * SureStep — src/context/PatientTrackingContext.tsx
 *
 * Single source of truth for patient tracking and awareness state.
 * Shares coords, zones, patientState, and refresh actions between the Caregiver Detail screen
 * and the Live Location Map screen.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Coords, GeofenceZone } from '../utils/geofenceUtils';
import type { ApiPatientState } from '../services/geofenceService';
import { fetchPatientState, requestLocationRefresh } from '../services/geofenceService';
import { fetchLatestPatientLocation, fetchPatientGeofences } from '../utils/geofenceUtils';
import { connectSocket } from '../services/socketClient';
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

const PatientTrackingContext = createContext<PatientTrackingContextValue | undefined>(undefined);

export const PatientTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser } = useAuth();
  const [activePatientId, setActivePatientId] = useState<string | null>(null);

  const [coords, setCoords] = useState<Coords | null>(null);
  const [coordsTs, setCoordsTs] = useState<number>(0);
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [patientState, setPatientState] = useState<ApiPatientState | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | undefined>(undefined);
  const [speedKmh, setSpeedKmh] = useState<number | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Load initial data on patient change
  useEffect(() => {
    if (!activePatientId) {
      setCoords(null);
      setCoordsTs(0);
      setZones([]);
      setPatientState(null);
      setAccuracyM(undefined);
      setSpeedKmh(undefined);
      return;
    }

    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const [latestLoc, fetchedZones, fetchedState] = await Promise.all([
          fetchLatestPatientLocation(activePatientId),
          fetchPatientGeofences(activePatientId),
          fetchPatientState(activePatientId),
        ]);

        if (!isMounted) return;

        if (latestLoc) {
          setCoords({ latitude: latestLoc.latitude, longitude: latestLoc.longitude });
          setCoordsTs(fetchedState?.computed_at ? new Date(fetchedState.computed_at).getTime() : latestLoc.recordedAt);
          if (latestLoc.accuracyM !== undefined) setAccuracyM(latestLoc.accuracyM);
          if (latestLoc.speedKmh !== undefined) setSpeedKmh(latestLoc.speedKmh);
        } else if (fetchedState && fetchedState.last_known_lat != null && fetchedState.last_known_lng != null) {
          setCoords({ latitude: Number(fetchedState.last_known_lat), longitude: Number(fetchedState.last_known_lng) });
          setCoordsTs(fetchedState.computed_at ? new Date(fetchedState.computed_at).getTime() : Date.now());
        }
        if (fetchedZones) {
          setZones(fetchedZones);
        }
        if (fetchedState) {
          setPatientState(fetchedState);
        }
      } catch (err) {
        console.warn('[PatientTrackingContext] Failed to load initial data:', err);
      }
    };

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [activePatientId]);

  // 2. Real-time WebSocket subscriptions scoped to activePatientId
  useEffect(() => {
    if (!firebaseUser || !activePatientId) return;
    let socketRef: any;

    const setupSocket = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        socketRef = connectSocket(token);
        socketRef.emit('join:patient', activePatientId);

        const handleStateChange = (data: any) => {
          if (data.patient_id !== activePatientId) return;

          const ts = data.computed_at ? new Date(data.computed_at).getTime() : Date.now();

          if (data.coords) {
            setCoords({ latitude: data.coords.latitude, longitude: data.coords.longitude });
            setCoordsTs(ts);
          } else if (data.last_known_lat != null && data.last_known_lng != null) {
            setCoords({ latitude: data.last_known_lat, longitude: data.last_known_lng });
            setCoordsTs(ts);
          }

          setPatientState((prev) => ({
            patient_id:       activePatientId,
            location_state:   data.location_state   ?? prev?.location_state   ?? 'NO_SIGNAL',
            safety_state:     data.safety_state     ?? prev?.safety_state     ?? 'SAFE',
            routine_state:    data.routine_state    ?? prev?.routine_state    ?? 'ON_TRACK',
            engagement_state: data.engagement_state ?? prev?.engagement_state ?? 'NO_INTERACTION',
            last_known_lat:   data.last_known_lat   ?? prev?.last_known_lat   ?? null,
            last_known_lng:   data.last_known_lng   ?? prev?.last_known_lng   ?? null,
            last_known_zone_id: data.last_known_zone_id ?? prev?.last_known_zone_id ?? null,
            current_zone_name: data.current_zone_name ?? prev?.current_zone_name ?? null,
            last_ping_at:     data.computed_at      ?? prev?.last_ping_at     ?? null,
            stationary_since: prev?.stationary_since ?? null,
            sos_active:       data.sos_active       ?? prev?.sos_active       ?? false,
            computed_at:      data.computed_at      ?? prev?.computed_at      ?? new Date().toISOString(),
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
          fetchPatientGeofences(activePatientId)
            .then((fetchedZones) => {
              if (fetchedZones) setZones(fetchedZones);
            })
            .catch((err) => {
              console.warn('[PatientTrackingContext] Failed to refetch zones on socket event:', err);
            });
        };

        socketRef.on('state:change', handleStateChange);
        socketRef.on('geofences:change', handleGeofencesChange);

        // Keep local cleanup function bound to the listener instance to avoid removing unrelated listeners
        return () => {
          if (socketRef) {
            socketRef.off('state:change', handleStateChange);
            socketRef.off('geofences:change', handleGeofencesChange);
          }
        };
      } catch (err) {
        console.warn('[PatientTrackingContext] WebSocket setup failed:', err);
      }
    };

    let cleanupFn: (() => void) | undefined;
    void setupSocket().then((cleanup) => {
      cleanupFn = cleanup;
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [firebaseUser, activePatientId]);

  // 3. Centralized location and state refresh loop
  const refreshLocation = useCallback(async () => {
    if (!activePatientId) return;
    setRefreshing(true);
    try {
      // Refresh geofences directly
      fetchPatientGeofences(activePatientId)
        .then((fetchedZones) => {
          if (fetchedZones) setZones(fetchedZones);
        })
        .catch(() => {});

      await requestLocationRefresh(activePatientId);
      const currentCoordsTs = coordsTs;

      // Poll up to 6 times, waiting 1.5s between polls (9s max timeout)
      for (let poll = 0; poll < 6; poll++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const latestLoc = await fetchLatestPatientLocation(activePatientId);

        if (latestLoc && latestLoc.recordedAt > currentCoordsTs) {
          setCoords({ latitude: latestLoc.latitude, longitude: latestLoc.longitude });
          setCoordsTs(latestLoc.recordedAt);
          if (latestLoc.accuracyM !== undefined) setAccuracyM(latestLoc.accuracyM);
          if (latestLoc.speedKmh !== undefined) setSpeedKmh(latestLoc.speedKmh);

          if (latestLoc.batteryPct !== undefined) {
            setPatientState((prev) => prev ? { ...prev, battery_pct: latestLoc.batteryPct } : null);
          }

          const state = await fetchPatientState(activePatientId);
          if (state) setPatientState(state);

          break;
        }
      }
    } catch (err) {
      console.warn('[PatientTrackingContext] refreshLocation failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [activePatientId, coordsTs]);

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
