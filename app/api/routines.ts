/**
 * app/api/routines.ts
 * Re-exports from the backend module so existing screen imports keep working.
 * All logic now lives in backend/routines.ts.
 */
export type { RoutineSummary, RoutineDraft } from '../../backend/routines';
export {
  fetchRoutinesForPatient,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  subscribeToRoutines,
  getCachedRoutines,
} from '../../backend/routines';
