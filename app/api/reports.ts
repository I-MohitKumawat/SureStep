/**
 * app/api/reports.ts
 * Re-exports from the backend module so existing screen imports keep working.
 * All logic (real Supabase queries + adherence math) lives in backend/reports.ts.
 */
export type { CaregiverPatientStatusGroup, CaregiverSummaryTile } from '../../backend/reports';
export {
  fetchCaregiverSummaryTiles,
  getCachedSummaryTiles,
  subscribeToPatientTasks,
} from '../../backend/reports';
