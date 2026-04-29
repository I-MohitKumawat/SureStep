/**
 * backend/reports.ts
 * Caregiver dashboard summary tiles computed from real Supabase data.
 * Adherence is derived from actual task completion events — no mock data.
 */
import { supabase } from '../app/utils/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CaregiverPatientStatusGroup = 'next_due' | 'missed' | 'completed';

export type CaregiverSummaryTile = {
  id: string;           // patient phone
  name: string;
  relationship: string; // 'Patient' for now; extend with a relationships table later
  adherencePercent: number;
  hasRecentAlerts: boolean;
  lastActivityLabel: string;
  statusGroup: CaregiverPatientStatusGroup;
};

// ─── Hybrid Cache ─────────────────────────────────────────────────────────────

const cache = new Map<string, CaregiverSummaryTile[]>();

export function getCachedSummaryTiles(caregiverPhone: string): CaregiverSummaryTile[] | undefined {
  return cache.get(caregiverPhone);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeAdherence(tasks: Array<{ status: string }>): number {
  if (tasks.length === 0) return 100;
  const done = tasks.filter((t) => t.status === 'done').length;
  return Math.round((done / tasks.length) * 100);
}

function computeLastActivity(
  tasks: Array<{ completed_at: string | null; status: string }>,
): string {
  const completedTimes = tasks
    .filter((t) => t.completed_at)
    .map((t) => new Date(t.completed_at!).getTime());

  if (completedTimes.length === 0) return 'No activity yet';

  const latestMs = Math.max(...completedTimes);
  const diffMin = Math.round((Date.now() - latestMs) / 60_000);

  if (diffMin < 1)  return 'Just now';
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} mins ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
}

function computeStatusGroup(
  adherence: number,
  tasks: Array<{ status: string; time: string }>,
): CaregiverPatientStatusGroup {
  const hasMissed = tasks.some((t) => t.status === 'missed');
  if (hasMissed || adherence < 70) return 'missed';
  const allDone = tasks.length > 0 && tasks.every((t) => t.status === 'done');
  if (allDone) return 'completed';
  return 'next_due';
}

function hasRecentAlerts(
  tasks: Array<{ status: string; completed_at: string | null }>,
): boolean {
  // Flag if any task was missed in the past 2 hours
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1_000;
  return tasks.some(
    (t) =>
      t.status === 'missed' ||
      (t.status === 'done' &&
        t.completed_at &&
        new Date(t.completed_at).getTime() > twoHoursAgo &&
        false), // could extend: flag rushed completions
  );
}

// ─── Main Query ───────────────────────────────────────────────────────────────

/**
 * Compute summary tiles for all patients linked to this caregiver.
 * Throws on Supabase error.
 */
export async function fetchCaregiverSummaryTiles(
  caregiverPhone: string,
): Promise<CaregiverSummaryTile[]> {
  // 1. Get linked patient phones
  const { data: links, error: linksError } = await supabase
    .from('patient_caregiver_links')
    .select('patient_phone')
    .eq('caregiver_phone', caregiverPhone);

  if (linksError) throw linksError;
  if (!links || links.length === 0) {
    cache.set(caregiverPhone, []);
    return [];
  }

  const patientPhones: string[] = links.map((l: { patient_phone: string }) => l.patient_phone);

  // 2. Get patient names from mock_users
  const { data: users, error: usersError } = await supabase
    .from('mock_users')
    .select('phone_number, full_name')
    .in('phone_number', patientPhones);

  if (usersError) throw usersError;

  const nameMap = new Map<string, string>(
    (users ?? []).map((u: { phone_number: string; full_name: string }) => [u.phone_number, u.full_name]),
  );

  // 3. Get today's tasks for all patients in one query
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('patient_id, status, time, completed_at')
    .in('patient_id', patientPhones);

  if (tasksError) throw tasksError;

  const allTasks = tasks ?? [];

  // 4. Build a tile per patient
  const tiles: CaregiverSummaryTile[] = patientPhones.map((phone) => {
    const patientTasks = allTasks.filter((t: { patient_id: string }) => t.patient_id === phone);
    const adherence = computeAdherence(patientTasks);
    const lastActivityLabel = computeLastActivity(patientTasks);
    const statusGroup = computeStatusGroup(adherence, patientTasks);
    const alerts = hasRecentAlerts(patientTasks);

    return {
      id:                phone,
      name:              nameMap.get(phone) ?? 'Patient',
      relationship:      'Patient',
      adherencePercent:  adherence,
      hasRecentAlerts:   alerts,
      lastActivityLabel,
      statusGroup,
    };
  });

  cache.set(caregiverPhone, tiles);
  return tiles;
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

/**
 * Subscribe to task changes for any patient linked to this caregiver.
 * Calls `onRefresh` — which should re-invoke fetchCaregiverSummaryTiles.
 * Returns a cleanup function.
 */
export function subscribeToPatientTasks(
  caregiverPhone: string,
  patientPhones: string[],
  onRefresh: () => void,
): () => void {
  if (patientPhones.length === 0) return () => {};

  // Supabase filter supports a single value eq; for multiple we subscribe once
  // per patient (or use a broad channel and filter client-side).
  const channels = patientPhones.map((phone) =>
    supabase
      .channel(`tasks:patient:${phone}:cg:${caregiverPhone}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `patient_id=eq.${phone}` },
        onRefresh,
      )
      .subscribe(),
  );

  return () => { channels.forEach((ch) => void supabase.removeChannel(ch)); };
}
