/**
 * alertsService.ts
 *
 * Centralised helpers for the three-level caregiver alert system.
 *
 * Level 1 – routine callouts (missed / unsure tasks) are derived entirely from
 *            the tasks table – no extra DB writes needed.
 * Level 2 – non-routine alerts (fall, geofence, battery, medical) stored in
 *            caregiver_alerts; seen state tracked in caregiver_alert_seen.
 * Level 3 – patient summary cards aggregate both sources for the
 *            CaregiverPatientsScreen Alerts tab.
 */

// import { supabase } from './supabaseClient'; // REMOVED: Supabase migration to Express/PostgreSQL

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertCategory = 'routine' | 'non_routine';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type NonRoutineAlertType =
  | 'fall_detected'
  | 'geofence_breach'
  | 'battery_critical'
  | 'medical_emergency';

export type CaregiverAlert = {
  id: string;
  patient_id: string;
  type: NonRoutineAlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  created_at: string;
};

export type AlertSeenRow = {
  alert_id: string;
  caregiver_phone: string;
  seen_at: string;
};

// ─── Fetch non-routine alerts for a patient ───────────────────────────────────
// REMOVED: Supabase migration to Express/PostgreSQL

export async function fetchNonRoutineAlerts(
  patientId: string,
): Promise<CaregiverAlert[]> {
  console.warn('[alertsService] fetchNonRoutineAlerts: Supabase removed, returning empty array');
  return [];
}

// ─── Fetch all non-routine alerts for multiple patients ───────────────────────

export async function fetchNonRoutineAlertsForPatients(
  patientIds: string[],
): Promise<CaregiverAlert[]> {
  console.warn('[alertsService] fetchNonRoutineAlertsForPatients: Supabase removed, returning empty array');
  return [];
}

// ─── Fetch seen alert IDs for a caregiver ────────────────────────────────────

export async function fetchSeenAlertIds(
  caregiverPhone: string,
): Promise<Set<string>> {
  console.warn('[alertsService] fetchSeenAlertIds: Supabase removed, returning empty set');
  return new Set();
}

// ─── Mark alerts as seen ──────────────────────────────────────────────────────

export async function markAlertsAsSeen(
  caregiverPhone: string,
  alertIds: string[],
): Promise<void> {
  console.warn('[alertsService] markAlertsAsSeen: Supabase removed, no-op');
}

// ─── Acknowledge a single alert ───────────────────────────────────────────────

export async function acknowledgeAlert(
  alertId: string,
  caregiverPhone: string,
): Promise<void> {
  console.warn('[alertsService] acknowledgeAlert: Supabase removed, no-op');
}

// ─── Insert a non-routine alert (used for demo / sensor triggers) ─────────────

export async function insertNonRoutineAlert(
  patientId: string,
  type: NonRoutineAlertType,
  severity: AlertSeverity,
  title: string,
  message: string,
): Promise<void> {
  console.warn('[alertsService] insertNonRoutineAlert: Supabase removed, no-op');
}

// ─── Realtime subscription to caregiver_alerts ───────────────────────────────

export function subscribeToNonRoutineAlerts(
  patientId: string,
  onChange: () => void,
): () => void {
  console.warn('[alertsService] subscribeToNonRoutineAlerts: Supabase removed, returning no-op');
  return () => {};
}

// ─── Risk assessment ──────────────────────────────────────────────────────────

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export function computePatientRiskLevel(params: {
  missedTaskCount: number;
  hasMedications: boolean;
  hasNonRoutineAlerts: boolean;
  criticalAlertCount: number;
}): RiskLevel {
  let score = 0;
  score += params.missedTaskCount * 3;
  if (params.hasMedications) score += 2;
  if (params.hasNonRoutineAlerts) score += 3;
  score += params.criticalAlertCount * 4;

  if (score >= 10) return 'critical';
  if (score >= 6)  return 'high';
  if (score >= 2)  return 'medium';
  return 'low';
}

export const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  critical: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
  high:     { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  medium:   { bg: '#FEF9EC', text: '#78350F', border: '#FDE68A' },
  low:      { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
};

export const SEVERITY_COLORS: Record<AlertSeverity, { bg: string; text: string; border: string; dot: string }> = {
  critical: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA', dot: '#DC2626' },
  high:     { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
  medium:   { bg: '#FEF9EC', text: '#78350F', border: '#FEF08A', dot: '#EAB308' },
  low:      { bg: '#E5E7EB', text: '#374151', border: '#D1D5DB', dot: '#9CA3AF' },
};

export const ALERT_TYPE_META: Record<NonRoutineAlertType, { emoji: string; label: string }> = {
  fall_detected:    { emoji: '🫁', label: 'Fall Detected' },
  geofence_breach:  { emoji: '📍', label: 'Outside Safe Zone' },
  battery_critical: { emoji: '🔋', label: 'Low Battery' },
  medical_emergency:{ emoji: '🚨', label: 'Medical Emergency' },
};
