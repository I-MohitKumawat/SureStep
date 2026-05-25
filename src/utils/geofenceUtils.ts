/**
 * SureStep — src/utils/geofenceUtils.ts
 * Geofence computation utilities.
 * Currently re-exports from the existing app/utils/geofence.ts to avoid
 * duplicating the haversine / breach-check logic during migration.
 * When app/utils/ is fully retired, move the implementation here.
 */
export {
  checkBreach,
  fetchPatientGeofences,
  saveGeofenceZone,
  deleteGeofenceZone,
  fetchLatestPatientLocation,
  subscribeToPatientLocation,
  haversineMeters,
  writeLocationPing,
  logBreachAlert,
  acknowledgeAlert,
  fetchLocationTrail,
  fetchBreachHistory,
  DEFAULT_GEOFENCE,
} from '../../app/utils/geofence';

export type { Coords, GeofenceZone, BreachStatus, BreachAlert } from '../../app/utils/geofence';
