/**
 * SureStep – Geofence utilities (v2)
 *
 * Replaces the old hardcoded PATIENT_GEOFENCES map with:
 *   - Dynamic zone fetch/save via Supabase
 *   - Multi-zone breach detection
 *   - Approaching-zone warning threshold
 *   - Haversine math (unchanged)
 */

import { supabase } from './supabaseClient';

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

/** Fetch all geofence zones for a given patient from Supabase. */
export async function fetchPatientGeofences(patientId: string): Promise<GeofenceZone[]> {
  const { data, error } = await supabase
    .from('patient_geofences')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('[geofence] fetchPatientGeofences error:', error.message);
    return [];   // Return empty — callers distinguish "no zones" from "safe"
  }

  if (!data || data.length === 0) return [];  // No zones saved yet

  return data.map(rowToZone);
}

/** Persist a zone to Supabase. Pass `id` to update, omit to insert. Throws on error. */
export async function saveGeofenceZone(
  zone: Omit<GeofenceZone, 'id'> & { id?: string },
): Promise<GeofenceZone> {
  const row = {
    patient_id:    zone.patientId,
    label:         zone.label,
    latitude:      zone.center.latitude,
    longitude:     zone.center.longitude,
    radius_m:      zone.radiusM,
    is_active:     zone.isActive,
    boundary_type: zone.boundaryType ?? 'soft',
    created_by:    zone.createdBy,
    updated_at:    new Date().toISOString(),
  };

  if (zone.id) {
    const { data, error } = await supabase
      .from('patient_geofences')
      .update(row)
      .eq('id', zone.id)
      .select()
      .single();
    if (error) throw new Error(`Update failed: ${error.message} (code: ${error.code})`);
    return rowToZone(data);
  } else {
    const { data, error } = await supabase
      .from('patient_geofences')
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(`Insert failed: ${error.message} (code: ${error.code})`);
    return rowToZone(data);
  }
}

/** Delete a zone by ID. Returns true on success. */
export async function deleteGeofenceZone(id: string): Promise<boolean> {
  const { error } = await supabase.from('patient_geofences').delete().eq('id', id);
  if (error) { console.warn('[geofence] delete error:', error.message); return false; }
  return true;
}

/** Log a breach event to geofence_alerts. */
export async function logBreachAlert(params: {
  patientId: string;
  geofenceId: string | null;
  breachType: 'exit' | 'enter';
  coords: Coords;
  distanceM: number;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('geofence_alerts')
    .insert({
      patient_id:   params.patientId,
      geofence_id:  params.geofenceId,
      breach_type:  params.breachType,
      latitude:     params.coords.latitude,
      longitude:    params.coords.longitude,
      distance_m:   params.distanceM,
    })
    .select('id')
    .single();
  if (error) { console.warn('[geofence] logBreachAlert error:', error.message); return null; }
  return data?.id ?? null;
}

/** Acknowledge an alert. */
export async function acknowledgeAlert(alertId: string, byPhone: string): Promise<void> {
  await supabase
    .from('geofence_alerts')
    .update({ acknowledged_by: byPhone, acknowledged_at: new Date().toISOString() })
    .eq('id', alertId);
}

/** Write a location ping to patient_locations. */
export async function writeLocationPing(params: {
  patientId: string;
  coords: Coords;
  accuracyM?: number;
  source: 'foreground' | 'background';
}): Promise<void> {
  const { error } = await supabase.from('patient_locations').insert({
    patient_id:  params.patientId,
    latitude:    params.coords.latitude,
    longitude:   params.coords.longitude,
    accuracy_m:  params.accuracyM,
    source:      params.source,
  });
  if (error) {
    console.warn('[geofence] writeLocationPing error:', error.message,
      '\npatientId:', params.patientId,
      '\ncoords:', params.coords);
  } else {
    console.log('[geofence] ping written ✓', params.coords.latitude.toFixed(5), params.coords.longitude.toFixed(5));
  }
}

/** Fetch the last N location pings for trail display. */
export async function fetchLocationTrail(
  patientId: string,
  limit = 20,
): Promise<Coords[]> {
  const { data } = await supabase
    .from('patient_locations')
    .select('latitude, longitude')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map((r: { latitude: number; longitude: number }) => ({
    latitude:  Number(r.latitude),
    longitude: Number(r.longitude),
  })).reverse();
}

/** Fetch the single most-recent location ping for a patient. */
export async function fetchLatestPatientLocation(
  patientId: string,
): Promise<(Coords & { recordedAt: number }) | null> {
  const { data } = await supabase
    .from('patient_locations')
    .select('latitude, longitude, recorded_at')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();
  if (!data) return null;
  return {
    latitude:   Number(data.latitude),
    longitude:  Number(data.longitude),
    recordedAt: new Date(data.recorded_at).getTime(),
  };
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
  const { data } = await supabase
    .from('geofence_alerts')
    .select('id, breach_type, latitude, longitude, distance_m, acknowledged_at, created_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((r: {
    id: string; breach_type: string; latitude: number | null;
    longitude: number | null; distance_m: number | null;
    acknowledged_at: string | null; created_at: string;
  }) => ({
    id:             r.id,
    breachType:     r.breach_type as 'exit' | 'enter',
    latitude:       r.latitude,
    longitude:      r.longitude,
    distanceM:      r.distance_m,
    acknowledgedAt: r.acknowledged_at,
    createdAt:      r.created_at,
  }));
}

/**
 * Subscribe to live patient location pings via Supabase Realtime.
 * Returns an unsubscribe function.
 */
export function subscribeToPatientLocation(
  patientId: string,
  onUpdate: (coords: Coords & { recordedAt: number }) => void,
): () => void {
  // Unique channel name per subscription to avoid "cannot add callbacks after subscribe()" error
  const channelName = `patient-loc-${patientId}-${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'patient_locations',
        filter: `patient_id=eq.${patientId}`,
      },
      (payload) => {
        const row = payload.new as {
          latitude: number; longitude: number; recorded_at: string;
        };
        onUpdate({
          latitude:   Number(row.latitude),
          longitude:  Number(row.longitude),
          recordedAt: new Date(row.recorded_at).getTime(),
        });
      },
    )
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
