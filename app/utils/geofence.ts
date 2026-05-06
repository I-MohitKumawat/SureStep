/**
 * SureStep – Geofence utilities
 * Haversine distance + per-patient geofence config.
 */

export type Coords = { latitude: number; longitude: number };

/** Haversine great-circle distance in metres. */
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

/** Static geofence config per patient (centre + radius in metres). */
export const PATIENT_GEOFENCES: Record<string, { center: Coords; radiusM: number }> = {
  p1: { center: { latitude: 12.9716, longitude: 77.5946 }, radiusM: 500 },
  p2: { center: { latitude: 12.9780, longitude: 77.6030 }, radiusM: 400 },
  p3: { center: { latitude: 12.9650, longitude: 77.5880 }, radiusM: 600 },
};

/** Default fallback geofence (used when no patient-specific one exists). */
export const DEFAULT_GEOFENCE = PATIENT_GEOFENCES.p1;
