/**
 * SureStep — src/services/routineService.ts
 *
 * Canonical client for routine definitions, routine occurrences, and
 * occurrence sign-off.
 *
 * Baselines:
 *   - docs/architecture/TARGET_ARCHITECTURE.md (Sections 3.4, 4.3, 5.2)
 *   - docs/workflows/04-PATIENT-CARE.md (Sections 3, 12, 14, 26)
 *
 * There is no Skip, Missed, Snoozed, or "unsure" state. The only care
 * participation mutation is signing off a scheduled/ongoing occurrence.
 */
import apiClient from './apiClient';

export type RoutineCategory =
  | 'MEDICATION'
  | 'MEAL'
  | 'EXERCISE'
  | 'HYGIENE'
  | 'APPOINTMENT';

export type RoutineStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';

export interface RoutineSchedulePattern {
  frequency?: 'DAILY' | 'WEEKLY' | string;
  time?: string;
  daysOfWeek?: number[];
  times?: string[];
}

export interface RoutineDefinition {
  id: string;
  patient_id: string;
  title: string;
  category: RoutineCategory;
  description: string | null;
  schedule_pattern: RoutineSchedulePattern;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RoutineOccurrence {
  id: string;
  routine_id: string;
  patient_id: string;
  title: string;
  category: RoutineCategory;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string;
  status: RoutineStatus;
  started_at?: string | null;
  completed_at?: string | null;
  completed_by?: string | null;
  completion_source?: 'PATIENT_SELF' | 'CAREGIVER_ASSISTED' | 'FAMILY' | null;
  completion_notes?: string | null;
  signed_off_at?: string | null;
  created_at: string;
}

export interface CreateRoutineDTO {
  title: string;
  category: RoutineCategory;
  description?: string | null;
  schedulePattern: RoutineSchedulePattern;
}

export interface UpdateRoutineDTO {
  title?: string;
  category?: RoutineCategory;
  description?: string | null;
  schedulePattern?: RoutineSchedulePattern;
  isActive?: boolean;
}

// ─── Routine Definitions ──────────────────────────────────────────────────────

export async function fetchRoutineDefinitions(
  patientId: string,
  includeInactive = false
): Promise<RoutineDefinition[]> {
  const res = await apiClient.get(`/patients/${patientId}/routines`);
  const routines: RoutineDefinition[] = res.data?.data?.routines ?? res.data?.routines ?? [];
  return includeInactive ? routines : routines.filter((r) => r.is_active !== false);
}

export async function getRoutineDefinition(
  patientId: string,
  routineId: string
): Promise<RoutineDefinition | null> {
  const res = await apiClient.get(`/patients/${patientId}/routines/${routineId}`);
  return res.data?.data?.routine ?? res.data?.routine ?? null;
}

export async function createRoutineDefinition(
  patientId: string,
  dto: CreateRoutineDTO
): Promise<RoutineDefinition> {
  const res = await apiClient.post(`/patients/${patientId}/routines`, dto);
  return res.data?.data?.routine ?? res.data?.routine;
}

export async function updateRoutineDefinition(
  patientId: string,
  routineId: string,
  dto: UpdateRoutineDTO
): Promise<RoutineDefinition> {
  const res = await apiClient.patch(`/patients/${patientId}/routines/${routineId}`, dto);
  return res.data?.data?.routine ?? res.data?.routine;
}

export async function deleteRoutineDefinition(
  patientId: string,
  routineId: string
): Promise<void> {
  await apiClient.delete(`/patients/${patientId}/routines/${routineId}`);
}

// ─── Routine Occurrences & Sign-Off ───────────────────────────────────────────

export async function fetchOccurrences(
  patientId: string,
  date?: string
): Promise<RoutineOccurrence[]> {
  const res = await apiClient.get(`/patients/${patientId}/routines/occurrences`, {
    params: date ? { date } : undefined,
  });
  return res.data?.data?.occurrences ?? res.data?.occurrences ?? [];
}

/** @deprecated Use fetchOccurrences(patientId, date); kept as a named convenience. */
export const fetchTodayOccurrences = (patientId: string) => fetchOccurrences(patientId);

export async function signOffOccurrence(occurrenceId: string, notes?: string): Promise<any> {
  const res = await apiClient.post(`/routines/occurrences/${occurrenceId}/sign-off`, { notes });
  return res.data?.data ?? res.data;
}

// ─── Display Helpers ──────────────────────────────────────────────────────────

const CATEGORY_ALIASES: Record<string, RoutineCategory> = {
  MEDICATION: 'MEDICATION',
  MEDS: 'MEDICATION',
  MEAL: 'MEAL',
  FOOD: 'MEAL',
  EXERCISE: 'EXERCISE',
  ACTIVITY: 'EXERCISE',
  WALK: 'EXERCISE',
  HYGIENE: 'HYGIENE',
  PERSONAL_CARE: 'HYGIENE',
  APPOINTMENT: 'APPOINTMENT',
  THERAPY: 'APPOINTMENT',
};

export function normalizeRoutineCategory(value?: string | null): RoutineCategory {
  return CATEGORY_ALIASES[(value || '').toUpperCase()] ?? 'APPOINTMENT';
}

export function routineTime(definition: Pick<RoutineDefinition, 'schedule_pattern'>): string {
  return definition.schedule_pattern?.time || definition.schedule_pattern?.times?.[0] || '09:00';
}

export function routineDays(definition: Pick<RoutineDefinition, 'schedule_pattern'>): number[] {
  return definition.schedule_pattern?.daysOfWeek ?? [];
}

export function routineFrequency(definition: Pick<RoutineDefinition, 'schedule_pattern'>): 'DAILY' | 'WEEKLY' {
  return definition.schedule_pattern?.frequency === 'WEEKLY' ? 'WEEKLY' : 'DAILY';
}
