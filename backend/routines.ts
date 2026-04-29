/**
 * backend/routines.ts
 * Dedicated Supabase query module for routines.
 * Pattern: Supabase is source of truth. Local cache is warmed on first load
 * and invalidated by Realtime events — never used as a silent fallback.
 */
import { supabase } from '../app/utils/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RoutineSummary = {
  id: string;
  patientId: string;
  name: string;
  isActive: boolean;
  scheduleLabel: string;
  createdAt: string;
  updatedAt: string;
};

export type RoutineDraft = {
  patientId: string;
  name: string;
  isActive: boolean;
  scheduleLabel: string;
};

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): RoutineSummary {
  return {
    id:            row.id as string,
    patientId:     row.patient_id as string,
    name:          row.name as string,
    isActive:      row.is_active as boolean,
    scheduleLabel: (row.schedule_label as string) ?? '',
    createdAt:     row.created_at as string,
    updatedAt:     row.updated_at as string,
  };
}

// ─── Hybrid Cache ─────────────────────────────────────────────────────────────
// A simple in-process Map used as a read cache per patient.
// It is populated on the first real fetch and cleared/updated by Realtime.
// It is NEVER used as a silent data source when Supabase fails.

const cache = new Map<string, RoutineSummary[]>();

export function getCachedRoutines(patientId: string): RoutineSummary[] | undefined {
  return cache.get(patientId);
}

function setCache(patientId: string, routines: RoutineSummary[]): void {
  cache.set(patientId, routines);
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch all routines for a patient from Supabase and warm the cache.
 * Throws on error — callers decide how to surface the failure.
 */
export async function fetchRoutinesForPatient(patientId: string): Promise<RoutineSummary[]> {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const routines = (data ?? []).map(mapRow);
  setCache(patientId, routines);
  return routines;
}

/**
 * Insert a new routine and return the persisted row.
 * Throws on error.
 */
export async function createRoutine(draft: RoutineDraft): Promise<RoutineSummary> {
  const { data, error } = await supabase
    .from('routines')
    .insert({
      id:             `routine_${Date.now()}`,
      patient_id:     draft.patientId,
      name:           draft.name,
      is_active:      draft.isActive,
      schedule_label: draft.scheduleLabel,
    })
    .select()
    .single();

  if (error) throw error;

  const routine = mapRow(data);

  // Update cache
  const current = cache.get(draft.patientId) ?? [];
  setCache(draft.patientId, [...current, routine]);

  return routine;
}

/**
 * Patch an existing routine and return the updated row.
 * Throws on error.
 */
export async function updateRoutine(
  routineId: string,
  patch: Partial<Pick<RoutineSummary, 'name' | 'isActive' | 'scheduleLabel'>>,
): Promise<RoutineSummary> {
  const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name           !== undefined) dbPatch.name           = patch.name;
  if (patch.isActive       !== undefined) dbPatch.is_active      = patch.isActive;
  if (patch.scheduleLabel  !== undefined) dbPatch.schedule_label = patch.scheduleLabel;

  const { data, error } = await supabase
    .from('routines')
    .update(dbPatch)
    .eq('id', routineId)
    .select()
    .single();

  if (error) throw error;

  const updated = mapRow(data);

  // Update cache for the owning patient
  const patientId = updated.patientId;
  const current = cache.get(patientId) ?? [];
  setCache(patientId, current.map((r) => (r.id === routineId ? updated : r)));

  return updated;
}

/**
 * Delete a routine by id. Throws on error.
 */
export async function deleteRoutine(routineId: string): Promise<void> {
  const { error } = await supabase.from('routines').delete().eq('id', routineId);
  if (error) throw error;

  // Evict from all patient caches (we don't know the patientId here)
  for (const [pid, routines] of cache.entries()) {
    const next = routines.filter((r) => r.id !== routineId);
    if (next.length !== routines.length) setCache(pid, next);
  }
}

// ─── Realtime helper ─────────────────────────────────────────────────────────
/**
 * Subscribe to all routine changes for a specific patient.
 * Calls `onChange` with the updated list whenever Supabase pushes an event.
 * Returns a cleanup function to unsubscribe.
 */
export function subscribeToRoutines(
  patientId: string,
  onChange: (routines: RoutineSummary[]) => void,
): () => void {
  const channel = supabase
    .channel(`routines:patient:${patientId}:${Date.now()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'routines', filter: `patient_id=eq.${patientId}` },
      (payload) => {
        const current = cache.get(patientId) ?? [];
        let next: RoutineSummary[];

        if (payload.eventType === 'INSERT') {
          next = [...current, mapRow(payload.new as Record<string, unknown>)];
        } else if (payload.eventType === 'UPDATE') {
          const updated = mapRow(payload.new as Record<string, unknown>);
          next = current.map((r) => (r.id === updated.id ? updated : r));
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as { id: string }).id;
          next = current.filter((r) => r.id !== deletedId);
        } else {
          return;
        }

        setCache(patientId, next);
        onChange(next);
      },
    )
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
}
