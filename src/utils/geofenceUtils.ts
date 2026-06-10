/**
 * SureStep — src/utils/geofenceUtils.ts
 *
 * Geofence utility functions connecting to the real Express backend API.
 * Uses AsyncStorage as a write-through cache for offline resilience.
 *
 * Architecture:
 *   fetchPatientGeofences  → GET /location/geofences/patient/:id
 *   saveGeofenceZone       → POST/PATCH /location/geofences/...
 *   deleteGeofenceZone     → DELETE /location/geofences/:id
 *   writeLocationPing      → POST /location/ping
 *   fetchLatestPatientLocation → GET /location/patient/:id/current
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as geofenceSvc from '../services/geofenceService';
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
  createdBy?: string;
  notifyOnArrival?: boolean;
  notifyOnDeparture?: boolean;
  colour?: string;
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
  zoneLabel?: string;
};

// Distance at which we show the "approaching boundary" warning (fraction of radius)
const APPROACH_FRACTION = 0.80;   // 80% of radius reached → amber warning

const CACHE_KEY_PREFIX = '@surestep:zones_cache:';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── API Zone → GeofenceZone mapper ──────────────────────────────────────────

function apiZoneToLocal(z: geofenceSvc.ApiZone): GeofenceZone {
  return {
    id: z.id,
    patientId: z.patient_id,
    label: z.label,
    center: { latitude: z.center_lat, longitude: z.center_lng },
    radiusM: z.radius_m,
    isActive: z.is_active,
    boundaryType: z.boundary_type === 'HARD' ? 'hard' : 'soft',
    createdBy: z.created_by,
    notifyOnArrival: z.notify_on_arrival,
    notifyOnDeparture: z.notify_on_departure,
    colour: z.colour,
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

// ─── API-backed CRUD with AsyncStorage cache ──────────────────────────────────

/** Fetch zones from backend API; fall back to cache on network failure. */
export async function fetchPatientGeofences(patientId: string): Promise<GeofenceZone[]> {
  const cacheKey = CACHE_KEY_PREFIX + patientId;

  try {
    const apiZones = await geofenceSvc.fetchZones(patientId);
    const zones = apiZones.map(apiZoneToLocal);

    // Write-through cache
    await AsyncStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), zones }));
    return zones;
  } catch (err) {
    console.warn('[geofenceUtils] API fetch failed, falling back to cache:', err);

    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { zones } = JSON.parse(cached) as { ts: number; zones: GeofenceZone[] };
      return zones;
    }
    return [];
  }
}

/** Save a zone via API; updates cache on success. */
export async function saveGeofenceZone(
  zone: Omit<GeofenceZone, 'id'> & { id?: string },
): Promise<GeofenceZone> {
  const payload: geofenceSvc.CreateZonePayload = {
    label: zone.label,
    center_lat: zone.center.latitude,
    center_lng: zone.center.longitude,
    radius_m: zone.radiusM,
    boundary_type: zone.boundaryType === 'hard' ? 'HARD' : 'SOFT',
    notify_on_arrival: zone.notifyOnArrival ?? true,
    notify_on_departure: zone.notifyOnDeparture ?? true,
    colour: zone.colour,
  };

  let saved: geofenceSvc.ApiZone;
  if (zone.id) {
    saved = await geofenceSvc.updateZone(zone.id, payload);
  } else {
    saved = await geofenceSvc.createZone(zone.patientId, payload);
  }

  const result = apiZoneToLocal(saved);

  // Invalidate cache so next fetch is fresh
  await AsyncStorage.removeItem(CACHE_KEY_PREFIX + zone.patientId);

  return result;
}

/** Delete a zone via API. Returns true on success. */
export async function deleteGeofenceZone(id: string): Promise<boolean> {
  try {
    await geofenceSvc.deleteZone(id);
    // Invalidate all zone caches (we don't know which patient)
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_KEY_PREFIX));
    if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys);
    return true;
  } catch (err) {
    console.error('[geofenceUtils] deleteGeofenceZone failed:', err);
    return false;
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
    source: params.source === 'background' ? 'PHONE' : 'PHONE',
    recorded_at: new Date().toISOString(),
  };

  try {
    await locationSvc.postPing(ping);

    // Flush offline queue on success
    const queued = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (queued) {
      const pings = JSON.parse(queued);
      if (pings.length > 0) {
        try {
          // Lazy import to avoid circular dep
          const { default: apiClient } = await import('./apiClientImport');
          await apiClient.post('/location/pings/sync', pings);
          await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
        } catch (_) { /* sync failed — will retry next time */ }
      }
    }
  } catch (_) {
    // Network unavailable — queue for later batch sync
    const queued = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const existing: any[] = queued ? JSON.parse(queued) : [];
    // Cap queue at 100 pings to prevent unbounded growth
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

/** Log a breach alert (called from background task). */
export async function logBreachAlert(params: {
  patientId: string;
  geofenceId: string | null;
  breachType: 'exit' | 'enter';
  coords: Coords;
  distanceM: number;
}): Promise<string | null> {
  // The backend awareness engine creates alerts automatically on ping processing.
  // This is a no-op from the client side — backend handles deduplication.
  console.log('[geofenceUtils] logBreachAlert: handled server-side via ping evaluation');
  return null;
}

/** Acknowledge an alert. */
export async function acknowledgeAlert(alertId: string, _byPhone: string): Promise<void> {
  try {
    await geofenceSvc.acknowledgeAlert(alertId);
  } catch (err) {
    console.error('[geofenceUtils] acknowledgeAlert failed:', err);
  }
}

/** Fetch breach alert history. */
export async function fetchBreachHistory(
  patientId: string,
  limit = 10,
): Promise<BreachAlert[]> {
  try {
    const { alerts } = await geofenceSvc.fetchAlerts(patientId, { limit });
    return alerts.map((a) => ({
      id: a.id,
      breachType: a.alert_type === 'ZONE_EXIT' ? 'exit' : 'enter',
      latitude: a.lat,
      longitude: a.lng,
      distanceM: a.distance_from_zone_m ?? null,
      acknowledgedAt: a.acknowledged_at ?? null,
      createdAt: a.created_at,
    }));
  } catch {
    return [];
  }
}

/** Subscribe to live patient location via WebSocket (handled by GeofenceContext). */
export function subscribeToPatientLocation(
  _patientId: string,
  _onUpdate: (coords: Coords & { recordedAt: number }) => void,
): () => void {
  // WebSocket subscription is managed by GeofenceContext — this is a no-op stub
  // to maintain backwards compatibility with callers.
  return () => { };
}

// Legacy export kept for existing callers
export const DEFAULT_GEOFENCE = {
  center: { latitude: 12.9716, longitude: 77.5946 },
  radiusM: 300,
};
