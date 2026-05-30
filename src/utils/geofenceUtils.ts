/**
 * SureStep – Geofence utilities (v2)
 *
 * Replaces the old hardcoded PATIENT_GEOFENCES map with:
 *   - Dynamic zone fetch/save via Supabase
 *   - Multi-zone breach detection
 *   - Approaching-zone warning threshold
 *   - Haversine math (unchanged)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type Coords = { latitude: number; longitude: number };

export type GeofenceZone = {
  id: string;
  patientId: string;
  label: string;
  center: Coords;
  radiusM: number;
  isActive: boolean;
  boundaryType: 'soft' | 'hard';  // soft = notify only | hard = emergency escalation
  createdBy?: string;
};

export type BreachStatus =
  | { status: 'safe';       zone: GeofenceZone; distanceFromCenter: number; marginM: number }
  | { status: 'approaching'; zone: GeofenceZone; distanceFromCenter: number; marginM: number }
  | { status: 'breach';     zone: GeofenceZone | null; distanceM: number }
  | { status: 'no_signal' };

// Distance at which we show the "approaching boundary" warning (fraction of radius)
const APPROACH_FRACTION = 0.80;   // 80% of radius reached → amber warning

// ─── Haversine ───────────────────────────────────────────────────────────────

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
      coords.latitude,      coords.longitude,
    );
    if (dist < closestDist) {
      closestDist = dist;
      closestZone = zone;
    }
    if (dist <= zone.radiusM) {
      // Inside this zone
      const marginM = zone.radiusM - dist;
      const approachThreshold = zone.radiusM * (1 - APPROACH_FRACTION);
      if (marginM <= approachThreshold) {
        return { status: 'approaching', zone, distanceFromCenter: dist, marginM };
      }
      return { status: 'safe', zone, distanceFromCenter: dist, marginM };
    }
  }

  // Outside all zones
  return {
    status: 'breach',
    zone: closestZone,
    distanceM: closestZone
      ? closestDist - closestZone.radiusM
      : 0,
  };
}

// ─── Supabase CRUD ────────────────────────────────────────────────────────────
// REMOVED: Supabase migration to Express/PostgreSQL
// These functions will be replaced with Express API calls

/** Fetch all geofence zones for a given patient from Supabase. */
export async function fetchPatientGeofences(patientId: string): Promise<GeofenceZone[]> {
  console.warn('[geofence] fetchPatientGeofences: Supabase removed, returning empty array');
  return [];
}

/** Persist a zone to Supabase. Pass `id` to update, omit to insert. Throws on error. */
export async function saveGeofenceZone(
  zone: Omit<GeofenceZone, 'id'> & { id?: string },
): Promise<GeofenceZone> {
  console.warn('[geofence] saveGeofenceZone: Supabase removed, throwing error');
  throw new Error('Supabase removed - migrate to Express API');
}

/** Delete a zone by ID. Returns true on success. */
export async function deleteGeofenceZone(id: string): Promise<boolean> {
  console.warn('[geofence] deleteGeofenceZone: Supabase removed, returning false');
  return false;
}

/** Log a breach event to geofence_alerts. */
export async function logBreachAlert(params: {
  patientId: string;
  geofenceId: string | null;
  breachType: 'exit' | 'enter';
  coords: Coords;
  distanceM: number;
}): Promise<string | null> {
  console.warn('[geofence] logBreachAlert: Supabase removed, returning null');
  return null;
}

/** Acknowledge an alert. */
export async function acknowledgeAlert(alertId: string, byPhone: string): Promise<void> {
  console.warn('[geofence] acknowledgeAlert: Supabase removed, no-op');
}

/** Write a location ping to patient_locations. */
export async function writeLocationPing(params: {
  patientId: string;
  coords: Coords;
  accuracyM?: number;
  source: 'foreground' | 'background';
}): Promise<void> {
  console.warn('[geofence] writeLocationPing: Supabase removed, no-op');
}

/** Fetch the last N location pings for trail display. */
export async function fetchLocationTrail(
  patientId: string,
  limit = 20,
): Promise<Coords[]> {
  console.warn('[geofence] fetchLocationTrail: Supabase removed, returning empty array');
  return [];
}

/** Fetch the single most-recent location ping for a patient. */
export async function fetchLatestPatientLocation(
  patientId: string,
): Promise<(Coords & { recordedAt: number }) | null> {
  console.warn('[geofence] fetchLatestPatientLocation: Supabase removed, returning null');
  return null;
}

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

/** Fetch the last N breach alerts for a patient (most recent first). */
export async function fetchBreachHistory(
  patientId: string,
  limit = 10,
): Promise<BreachAlert[]> {
  console.warn('[geofence] fetchBreachHistory: Supabase removed, returning empty array');
  return [];
}

/**
 * Subscribe to live patient location pings via Supabase Realtime.
 * Returns an unsubscribe function.
 */
export function subscribeToPatientLocation(
  patientId: string,
  onUpdate: (coords: Coords & { recordedAt: number }) => void,
): () => void {
  console.warn('[geofence] subscribeToPatientLocation: Supabase removed, returning no-op');
  return () => {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToZone(row: any): GeofenceZone {
  return {
    id:           row.id,
    patientId:    row.patient_id,
    label:        row.label ?? 'Home',
    center: {
      latitude:   Number(row.latitude),
      longitude:  Number(row.longitude),
    },
    radiusM:      Number(row.radius_m),
    isActive:     Boolean(row.is_active),
    boundaryType: (row.boundary_type === 'hard' ? 'hard' : 'soft'),
    createdBy:    row.created_by,
  };
}

// Legacy export kept for existing callers
export const DEFAULT_GEOFENCE = {
  center: { latitude: 12.9716, longitude: 77.5946 },
  radiusM: 300,
};
