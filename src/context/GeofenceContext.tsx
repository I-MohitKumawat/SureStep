/**
 * SureStep — src/context/GeofenceContext.tsx
 * Moved from: app/context/geofenceContext.tsx
 * Mounted inside CaregiverNavigator only.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as Location from 'expo-location';
import {
  checkBreach,
  fetchPatientGeofences,
  saveGeofenceZone,
  deleteGeofenceZone,
  acknowledgeAlert,
  writeLocationPing,
  fetchLocationTrail,
  type Coords,
  type GeofenceZone,
  type BreachStatus,
} from '../../app/utils/geofence';
import { startBackgroundTracking, primeZonesCache } from '../../app/utils/locationTask';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GeofenceAlert = {
  id: string;
  patientId: string;
  geofenceId: string | null;
  breachType: 'exit' | 'enter';
  distanceM: number;
  createdAt: string;
  acknowledgedAt: string | null;
};

type GeofenceContextValue = {
  /** Live patient coordinates (null until first fix). */
  coords:          Coords | null;
  /** How old the last fix is, in seconds. */
  coordsAgeS:      number;
  /** Active geofence zones for the current patient. */
  zones:           GeofenceZone[];
  /** Computed breach status derived from coords + zones. */
  breachStatus:    BreachStatus;
  /** Unacknowledged alerts for this patient. */
  alerts:          GeofenceAlert[];
  /** Location history trail (last 20 pings). */
  trail:           Coords[];
  /** Whether zones are loading from Supabase. */
  zonesLoading:    boolean;
  /** Load / refresh zones from Supabase. */
  loadZones:       (patientId: string) => Promise<void>;
  /** Persist a zone (upsert). */
  saveZone:        (zone: Omit<GeofenceZone, 'id'> & { id?: string }) => Promise<GeofenceZone | null>;
  /** Delete a zone. */
  deleteZone:      (id: string) => Promise<void>;
  /** Mark an alert as acknowledged. */
  acknowledgeAlertById: (alertId: string, byPhone: string) => Promise<void>;
  /** Manually request a fresh location fix. */
  refreshLocation: () => Promise<void>;
  /** Start background tracking for a patient. */
  startTracking:   (patientId: string) => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const GeofenceCtx = createContext<GeofenceContextValue | undefined>(undefined);

export function useGeofence(): GeofenceContextValue {
  const ctx = useContext(GeofenceCtx);
  if (!ctx) throw new Error('useGeofence must be used within GeofenceProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GeofenceProvider({
  children,
  patientId,
}: {
  children: React.ReactNode;
  patientId: string;
}) {
  const [coords,       setCoords]       = useState<Coords | null>(null);
  const [coordsTs,     setCoordsTs]     = useState<number>(0);
  const [coordsAgeS,   setCoordsAgeS]   = useState<number>(0);
  const [zones,        setZones]        = useState<GeofenceZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [alerts,       setAlerts]       = useState<GeofenceAlert[]>([]);
  const [trail,        setTrail]        = useState<Coords[]>([]);

  const fgSubRef  = useRef<Location.LocationSubscription | null>(null);
  const ageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Derived: breach status ──────────────────────────────────────────────────
  const breachStatus: BreachStatus = coords && zones.length > 0
    ? checkBreach(coords, zones)
    : { status: 'no_signal' };

  // ── Age counter (ticks every second) ───────────────────────────────────────
  useEffect(() => {
    ageTimerRef.current = setInterval(() => {
      if (coordsTs > 0) setCoordsAgeS(Math.floor((Date.now() - coordsTs) / 1000));
    }, 1000);
    return () => { if (ageTimerRef.current) clearInterval(ageTimerRef.current); };
  }, [coordsTs]);

  // ── Load zones ──────────────────────────────────────────────────────────────
  const loadZones = useCallback(async (pid: string) => {
    setZonesLoading(true);
    try {
      const z = await fetchPatientGeofences(pid);
      setZones(z);
    } finally {
      setZonesLoading(false);
    }
  }, []);

  // ── Load alerts (unacknowledged) ────────────────────────────────────────────
  const loadAlerts = useCallback(async (pid: string) => {
    console.warn('[geofenceContext] loadAlerts: Supabase removed, setting empty array');
    setAlerts([]);
  }, []);

  // ── Foreground location subscription ───────────────────────────────────────
  const startForegroundTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const demo: Coords = { latitude: 12.9716 + 0.0012, longitude: 77.5946 - 0.0008 };
        setCoords(demo);
        setCoordsTs(Date.now());
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const c: Coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setCoords(c);
      setCoordsTs(Date.now());
      void writeLocationPing({ patientId, coords: c, accuracyM: loc.coords.accuracy ?? undefined, source: 'foreground' });

      fgSubRef.current = await Location.watchPositionAsync(
        {
          accuracy:         Location.Accuracy.Balanced,
          timeInterval:     20_000,
          distanceInterval: 10,
        },
        (l) => {
          const c2: Coords = { latitude: l.coords.latitude, longitude: l.coords.longitude };
          setCoords(c2);
          setCoordsTs(Date.now());
          void writeLocationPing({ patientId, coords: c2, accuracyM: l.coords.accuracy ?? undefined, source: 'foreground' });
        },
      );
    } catch {
      const demo: Coords = { latitude: 12.9716 + 0.0012, longitude: 77.5946 - 0.0008 };
      setCoords(demo);
      setCoordsTs(Date.now());
    }
  }, [patientId]);

  // ── Bootstrap on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    void loadZones(patientId);
    void loadAlerts(patientId);
    void startForegroundTracking();
    void fetchLocationTrail(patientId).then(setTrail);

    return () => {
      fgSubRef.current?.remove();
      if (ageTimerRef.current) clearInterval(ageTimerRef.current);
    };
  }, [patientId, loadZones, loadAlerts, startForegroundTracking]);

  // ── Public methods ─────────────────────────────────────────────────────────

  const saveZone = useCallback(
    async (zone: Omit<GeofenceZone, 'id'> & { id?: string }) => {
      const saved = await saveGeofenceZone(zone);
      if (saved) {
        setZones((prev) =>
          prev.some((z) => z.id === saved.id)
            ? prev.map((z) => (z.id === saved.id ? saved : z))
            : [...prev, saved],
        );
      }
      return saved;
    },
    [],
  );

  const deleteZone = useCallback(async (id: string) => {
    await deleteGeofenceZone(id);
    setZones((prev) => prev.filter((z) => z.id !== id));
  }, []);

  const acknowledgeAlertById = useCallback(async (alertId: string, byPhone: string) => {
    await acknowledgeAlert(alertId, byPhone);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  const refreshLocation = useCallback(async () => {
    fgSubRef.current?.remove();
    await startForegroundTracking();
    void fetchLocationTrail(patientId).then(setTrail);
  }, [startForegroundTracking, patientId]);

  const startTracking = useCallback(async (pid: string) => {
    await primeZonesCache(pid);
    await startBackgroundTracking(pid);
  }, []);

  const value: GeofenceContextValue = {
    coords,
    coordsAgeS,
    zones,
    breachStatus,
    alerts,
    trail,
    zonesLoading,
    loadZones,
    saveZone,
    deleteZone,
    acknowledgeAlertById,
    refreshLocation,
    startTracking,
  };

  return <GeofenceCtx.Provider value={value}>{children}</GeofenceCtx.Provider>;
}
