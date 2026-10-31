/**
 * SureStep — src/utils/geofenceUtils.ts
 *
 * Read-only Safe Zone projection, breach evaluation, location ping, and
 * patient telemetry helpers.
 *
 * Canonical Safe Zones are Circle-owned and served by
 * /api/v1/care-circles/:circleId/safe-zones through careCircleService.
 * There is no separate geofence CRUD API in V1.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  listSafeZonesForPatient,
  resolveCircleIdForPatient,
  type SafeZoneItem,
} from '../services/careCircleService';
import { listCircleSafetyAlerts } from '../services/safetyService';
import locationSvc from '../services/locationService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Coords = { latitude: number; longitude: number };

export type GeofenceZone = {
  id: string;
  patientId: string;
  label: string;
  center: Coords;
  radiusM: number;
  isActive: boolean;
  boundaryType: 'soft' | 'hard';
};

export type BreachStatus =
  | { status: 'safe'; zone: GeofenceZone; distanceFromCenter: number; marginM: number }
  | { status: 'approaching'; zone: GeofenceZone; distanceFromCenter: number; marginM: number }
  | { status: 'breach'; zone: GeofenceZone | null; distanceM: number }
  | { status: 'no_signal' };

export type BreachAlert = {
  id: string;
  breachType: 'exit' | 'enter';
  latitude: number | null;
  longitude: number | null;
  distanceM: number | null;
  acknowledgedAt: string | null;
  createdAt: string;
  status: 'TRIGGERED' | 'ACTIVE' | 'VIEWED' | 'RESOLVED' | string;
  zoneLabel?: string;
};

const APPROACH_FRACTION = 0.80;

// ─── Canonical Safe Zone → display projection ────────────────────────────────

function safeZoneToLocal(zone: SafeZoneItem, patientId: string): GeofenceZone {
  return {
    id: zone.id,
    patientId,
    label: zone.name,
    center: { latitude: Number(zone.center_lat), longitude: Number(zone.center_lng) },
    radiusM: Number(zone.radius_meters),
    isActive: zone.is_active !== false,
    boundaryType: zone.boundary_type === 'hard' ? 'hard' : 'soft',
  };
}

// ─── Haversine ────────────────────────────────────────────────────────────────

/** Great-circle distance in metres between two lat/lng coordinates. */
export function haversineMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6_371_000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Breach Detection ─────────────────────────────────────────────────────────

/**
 * Given a list of active zones and the current coords, returns the breach status.
 * "Safe" = inside ANY active zone.
 * "Approaching" = inside nearest zone but within 20% of boundary.
 * "Breach" = outside ALL active zones.
 */
export function checkBreach(coords: Coords, zones: GeofenceZone[]): BreachStatus {
  const active = zones.filter((z) => z.isActive);
  if (active.length === 0) return { status: 'no_signal' };

  let closestZone: GeofenceZone | null = null;
  let closestDist = Infinity;

  for (const zone of active) {
    const dist = haversineMeters(
      zone.center.latitude, zone.center.longitude,
      coords.latitude, coords.longitude,
    );
    if (dist < closestDist) {
      closestDist = dist;
      closestZone = zone;
    }
    if (dist <= zone.radiusM) {
      const marginM = zone.radiusM - dist;
      const approachThreshold = zone.radiusM * (1 - APPROACH_FRACTION);
      if (marginM <= approachThreshold) {
        return { status: 'approaching', zone, distanceFromCenter: dist, marginM };
      }
      return { status: 'safe', zone, distanceFromCenter: dist, marginM };
    }
  }

  return {
    status: 'breach',
    zone: closestZone,
    distanceM: closestZone ? closestDist - closestZone.radiusM : 0,
  };
}

// ─── Canonical Safe Zone reads ────────────────────────────────────────────────

/** Fetch canonical Safe Zones that monitor this Patient. */
export async function fetchPatientGeofences(patientId: string): Promise<GeofenceZone[]> {
  try {
    const zones = await listSafeZonesForPatient(patientId);
    return zones.map((zone) => safeZoneToLocal(zone, patientId));
  } catch (err) {
    console.warn('[geofenceUtils] canonical Safe Zone fetch failed:', err);
    return [];
  }
}

// ─── Location ping ─────────────────────────────────────────────────────────────

const OFFLINE_QUEUE_KEY = '@surestep:offline_pings';

/** Write a location ping to the backend. Queues offline if unavailable. */
export async function writeLocationPing(params: {
  patientId: string;
  coords: Coords;
  accuracyM?: number;
  speedKmh?: number;
  heading?: number;
  batteryPct?: number;
  networkStatus?: string;
  source: 'foreground' | 'background';
}): Promise<void> {
  const ping = {
    lat: params.coords.latitude,
    lng: params.coords.longitude,
    accuracy_m: params.accuracyM,
    speed_kmh: params.speedKmh,
    heading: params.heading,
    battery_pct: params.batteryPct,
    network_status: params.networkStatus,
    source: 'PHONE',
    recorded_at: new Date().toISOString(),
  };

  try {
    await locationSvc.postPing(ping);

    const queued = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (queued) {
      const pings = JSON.parse(queued);
      if (pings.length > 0) {
        try {
          const { default: apiClient } = await import('./apiClientImport');
          await apiClient.post('/location/pings/sync', pings);
          await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
        } catch (_) { /* sync failed — will retry next time */ }
      }
    }
  } catch (_) {
    const queued = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const existing: any[] = queued ? JSON.parse(queued) : [];
    const updated = [...existing, ping].slice(-100);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
  }
}

/** Fetch latest patient location from backend API, including GPS metrics. */
export async function fetchLatestPatientLocation(
  patientId: string,
): Promise<(Coords & { recordedAt: number; accuracyM?: number; speedKmh?: number; batteryPct?: number }) | null> {
  try {
    const res = await locationSvc.getCurrentLocation(patientId);
    const loc = res?.data?.data?.location;
    if (!loc) return null;
    return {
      latitude:   loc.lat,
      longitude:  loc.lng,
      recordedAt: new Date(loc.recorded_at).getTime(),
      accuracyM:  loc.accuracy_m  != null ? Number(loc.accuracy_m)  : undefined,
      speedKmh:   loc.speed_kmh   != null ? Number(loc.speed_kmh)   : undefined,
      batteryPct: loc.battery_pct != null ? Number(loc.battery_pct) : undefined,
    };
  } catch {
    return null;
  }
}

/** Fetch the last N location pings for trail display. */
export async function fetchLocationTrail(
  patientId: string,
  limit = 20,
): Promise<Coords[]> {
  try {
    const res = await locationSvc.getTrail(patientId);
    const pings = res?.data?.data?.pings ?? [];
    return pings.slice(0, limit).map((p: any) => ({
      latitude: p.lat,
      longitude: p.lng,
    }));
  } catch {
    return [];
  }
}

/** Log a breach alert (called from background task). Handled server-side. */
export async function logBreachAlert(_params: {
  patientId: string;
  geofenceId: string | null;
  breachType: 'exit' | 'enter';
  coords: Coords;
  distanceM: number;
}): Promise<string | null> {
  return null;
}

/**
 * Fetch canonical safety alert history for a Patient's Circle.
 * Responding does not resolve an alert; status remains ACTIVE/VIEWED until the
 * Circle Owner explicitly resolves it.
 */
export async function fetchBreachHistory(
  patientId: string,
  limit = 10,
): Promise<BreachAlert[]> {
  try {
    const circleId = await resolveCircleIdForPatient(patientId);
    if (!circleId) return [];
    const alerts = await listCircleSafetyAlerts(circleId);
    return alerts
      .filter((a) => a.patient_id === patientId)
      .slice(0, limit)
      .map((a) => ({
        id: a.id,
        breachType: 'exit' as const,
        latitude: a.lat ?? null,
        longitude: a.lng ?? null,
        distanceM: a.distance_from_zone_m ?? null,
        acknowledgedAt: a.status === 'TRIGGERED' ? null : a.created_at,
        createdAt: a.created_at,
        status: a.status,
        zoneLabel: a.zone_name ?? undefined,
      }));
  } catch {
    return [];
  }
}
