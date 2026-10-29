/**
 * SureStep — src/services/routineService.ts
 * Client service for routine definitions and routine occurrence sign-offs.
 * Connects to /patients/:patientId/routines and /routines/occurrences/:id/sign-off
 */
import apiClient from './apiClient';

export interface RoutineInstructionStep {
  step_order: number;
  title: string;
  description?: string;
  media_url?: string;
}

export interface RoutineDefinition {
  id: string;
  patient_id: string;
  title: string;
  category: 'MEDICATION' | 'MEAL' | 'ACTIVITY' | 'HYGIENE' | 'PERSONAL_CARE' | 'CUSTOM';
  scheduled_time: string; // "08:00"
  recurrence_pattern: string; // "DAILY", "WEEKDAYS", etc.
  instruction_steps: RoutineInstructionStep[];
  notes?: string | null;
  media_url?: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  created_at: string;
  updated_at: string;
}

export interface RoutineOccurrence {
  id: string;
  routine_id: string;
  patient_id: string;
  title: string;
  category: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  instruction_steps?: RoutineInstructionStep[];
  notes?: string;
  media_url?: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface CreateRoutineDTO {
  title: string;
  category: string;
  scheduled_time: string;
  recurrence_pattern?: string;
  instruction_steps?: RoutineInstructionStep[];
  notes?: string;
  media_url?: string;
}

export interface UpdateRoutineDTO extends Partial<CreateRoutineDTO> {
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
}

// ─── Routine Definitions ──────────────────────────────────────────────────────

export async function fetchRoutineDefinitions(patientId: string): Promise<RoutineDefinition[]> {
  try {
    const res = await apiClient.get(`/patients/${patientId}/routines`);
    return res.data?.data?.routines ?? res.data?.routines ?? [];
  } catch (err) {
    console.warn('[routineService] fetchRoutineDefinitions error:', err);
    return [];
  }
}

export async function getRoutineDefinition(patientId: string, routineId: string): Promise<RoutineDefinition | null> {
  try {
    const res = await apiClient.get(`/patients/${patientId}/routines/${routineId}`);
    return res.data?.data?.routine ?? res.data?.routine ?? null;
  } catch (err) {
    console.warn('[routineService] getRoutineDefinition error:', err);
    return null;
  }
}

export async function createRoutineDefinition(patientId: string, dto: CreateRoutineDTO): Promise<RoutineDefinition> {
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

export async function deleteRoutineDefinition(patientId: string, routineId: string): Promise<void> {
  await apiClient.delete(`/patients/${patientId}/routines/${routineId}`);
}

// ─── Routine Occurrences & Sign-Off ───────────────────────────────────────────

export async function fetchTodayOccurrences(patientId: string): Promise<RoutineOccurrence[]> {
  try {
    const res = await apiClient.get(`/patients/${patientId}/routines/occurrences`);
    return res.data?.data?.occurrences ?? res.data?.occurrences ?? [];
  } catch (err) {
    console.warn('[routineService] fetchTodayOccurrences error:', err);
    return [];
  }
}

export async function signOffOccurrence(
  occurrenceId: string,
  notes?: string
): Promise<any> {
  const res = await apiClient.post(`/routines/occurrences/${occurrenceId}/sign-off`, { notes });
  return res.data?.data ?? res.data;
}
