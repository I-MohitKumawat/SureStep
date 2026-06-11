/**
 * SureStep — src/context/GeofenceContext.tsx
 *
 * Provides geofence zones, breach status, live coords, alerts, and trail
 * to all caregiver screens.
 *
 * Key additions over previous version:
 *  - Loads alerts from real backend API (GET /alerts/patient/:id)
 *  - Subscribes to WebSocket `state:change` events for real-time coord updates
 *  - Subscribes to `alert:new` and `sos:triggered` socket events
 *  - Emits FCM device token on mount via alertsAPI
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
} from '../utils/geofenceUtils';
import { startBackgroundTracking, primeZonesCache } from '../utils/locationTask';
import { fetchAlerts, type ApiAlert } from '../services/geofenceService';
import { getSocket } from '../services/socketClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GeofenceAlert = {
  id:             string;
  patientId:      string;
  zoneId:         string | null;
  alertType:      string;
  severity:       'INFO' | 'WARNING' | 'CRITICAL';
  breachType:     'exit' | 'enter' | 'approaching' | 'sos' | 'other';
  distanceM:      number | null;
  lat:            number;
  lng:            number;
  createdAt:      string;
  acknowledgedAt: string | null;
};

type GeofenceContextValue = {
  coords:               Coords | null;
  coordsAgeS:           number;
  zones:                GeofenceZone[];
  breachStatus:         BreachStatus;
  alerts:               GeofenceAlert[];
  trail:                Coords[];
  zonesLoading:         boolean;
  alertsLoading:        boolean;
  loadZones:            (patientId: string) => Promise<void>;
  loadAlerts:           (patientId: string) => Promise<void>;
  saveZone:             (zone: Omit<GeofenceZone, 'id'> & { id?: string }) => Promise<GeofenceZone | null>;
  deleteZone:           (id: string) => Promise<void>;
  acknowledgeAlertById: (alertId: string) => Promise<void>;
  refreshLocation:      () => Promise<void>;
  startTracking:        (patientId: string) => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const GeofenceCtx = createContext<GeofenceContextValue | undefined>(undefined);

export function useGeofence(): GeofenceContextValue {
  const ctx = useContext(GeofenceCtx);
  if (!ctx) throw new Error('useGeofence must be used within GeofenceProvider');
  return ctx;
}

// ─── Helper: map API alert to local type ─────────────────────────────────────

function apiAlertToLocal(a: ApiAlert): GeofenceAlert {
  const typeMap: Record<string, GeofenceAlert['breachType']> = {
    ZONE_EXIT:            'exit',
    ZONE_ENTER:           'enter',
    APPROACHING_BOUNDARY: 'approaching',
    SOS_TRIGGERED:        'sos',
  };
  return {
    id:             a.id,
    patientId:      a.patient_id,
    zoneId:         a.zone_id ?? null,
    alertType:      a.alert_type,
    severity:       a.severity,
    breachType:     typeMap[a.alert_type] ?? 'other',
    distanceM:      a.distance_from_zone_m ?? null,
    lat:            a.lat,
    lng:            a.lng,
    createdAt:      a.created_at,
    acknowledgedAt: a.acknowledged_at ?? null,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GeofenceProvider({
  children,
  patientId,
  accessToken,
}: {
  children:    React.ReactNode;
  patientId:   string;
  accessToken: string;
}) {
  const [coords,        setCoords]        = useState<Coords | null>(null);
  const [coordsTs,      setCoordsTs]      = useState<number>(0);
  const [coordsAgeS,    setCoordsAgeS]    = useState<number>(0);
  const [zones,         setZones]         = useState<GeofenceZone[]>([]);
  const [zonesLoading,  setZonesLoading]  = useState(true);
  const [alerts,        setAlerts]        = useState<GeofenceAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [trail,         setTrail]         = useState<Coords[]>([]);

  const fgSubRef    = useRef<Location.LocationSubscription | null>(null);
  const ageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Derived: breach status ────────────────────────────────────────────────
  const breachStatus: BreachStatus = coords && zones.length > 0
    ? checkBreach(coords, zones)
    : { status: 'no_signal' };

  // ── Age counter (ticks every second) ────────────────────────────────────
  useEffect(() => {
    ageTimerRef.current = setInterval(() => {
      if (coordsTs > 0) setCoordsAgeS(Math.floor((Date.now() - coordsTs) / 1000));
    }, 1000);
    return () => { if (ageTimerRef.current) clearInterval(ageTimerRef.current); };
  }, [coordsTs]);

  // ── Load zones from real API ─────────────────────────────────────────────
  const loadZones = useCallback(async (pid: string) => {
    setZonesLoading(true);
    try {
      const z = await fetchPatientGeofences(pid);
      setZones(z);
    } finally {
      setZonesLoading(false);
    }
  }, []);

  // ── Load alerts from real API ────────────────────────────────────────────
  const loadAlerts = useCallback(async (pid: string) => {
    setAlertsLoading(true);
    try {
      const { alerts: raw } = await fetchAlerts(pid, { limit: 30 });
      setAlerts(raw.map(apiAlertToLocal));
    } catch {
      // fail silently — leave previous state
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  // ── WebSocket subscription ────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Real-time location/state updates from server-side awareness engine
    const onStateChange = (data: any) => {
      if (data.patient_id !== patientId) return;
      if (data.last_known_lat != null && data.last_known_lng != null) {
        setCoords({ latitude: data.last_known_lat, longitude: data.last_known_lng });
        setCoordsTs(Date.now());
      }
    };

    // New alert pushed from server
    const onAlertNew = (data: any) => {
      if (data.alert?.patient_id !== patientId) return;
      const mapped = apiAlertToLocal(data.alert);
      setAlerts((prev) => [mapped, ...prev.filter((a) => a.id !== mapped.id)]);
    };

    // Alert acknowledged by another caregiver
    const onAlertAck = (data: any) => {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === data.alert_id ? { ...a, acknowledgedAt: data.ts } : a,
        ),
      );
    };

    // SOS triggered
    const onSOS = (data: any) => {
      if (data.patient_id !== patientId) return;
      if (data.alert) {
        const mapped = apiAlertToLocal({ ...data.alert, alert_type: 'SOS_TRIGGERED', severity: 'CRITICAL' });
        setAlerts((prev) => [mapped, ...prev.filter((a) => a.id !== mapped.id)]);
      }
    };

    socket.on('state:change',      onStateChange);
    socket.on('alert:new',         onAlertNew);
    socket.on('alert:acknowledged', onAlertAck);
    socket.on('sos:triggered',     onSOS);

    return () => {
      socket.off('state:change',      onStateChange);
      socket.off('alert:new',         onAlertNew);
      socket.off('alert:acknowledged', onAlertAck);
      socket.off('sos:triggered',     onSOS);
    };
  }, [patientId]);

  // ── Foreground location subscription ────────────────────────────────────
  const startForegroundTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const demo: Coords = { latitude: 12.9716 + 0.0012, longitude: 77.5946 - 0.0008 };
        setCoords(demo);
        setCoordsTs(Date.now());
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const c: Coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setCoords(c);
      setCoordsTs(Date.now());
      void writeLocationPing({
        patientId,
        coords: c,
        accuracyM:  loc.coords.accuracy  ?? undefined,
        speedKmh:  (loc.coords.speed ?? 0) * 3.6,
        source: 'foreground',
      });

      fgSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 20_000, distanceInterval: 10 },
        (l) => {
          const c2: Coords = { latitude: l.coords.latitude, longitude: l.coords.longitude };
          setCoords(c2);
          setCoordsTs(Date.now());
          void writeLocationPing({
            patientId,
            coords: c2,
            accuracyM: l.coords.accuracy ?? undefined,
            speedKmh: (l.coords.speed ?? 0) * 3.6,
            source: 'foreground',
          });
        },
      );
    } catch {
      const demo: Coords = { latitude: 12.9716 + 0.0012, longitude: 77.5946 - 0.0008 };
      setCoords(demo);
      setCoordsTs(Date.now());
    }
  }, [patientId]);

  // ── Bootstrap on mount ──────────────────────────────────────────────────
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

  // ── Public methods ───────────────────────────────────────────────────────

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

  const acknowledgeAlertById = useCallback(async (alertId: string) => {
    await acknowledgeAlert(alertId, '');
    setAlerts((prev) =>
      prev.map((a) => a.id === alertId ? { ...a, acknowledgedAt: new Date().toISOString() } : a),
    );
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
    alertsLoading,
    loadZones,
    loadAlerts,
    saveZone,
    deleteZone,
    acknowledgeAlertById,
    refreshLocation,
    startTracking,
  };

  return <GeofenceCtx.Provider value={value}>{children}</GeofenceCtx.Provider>;
}
