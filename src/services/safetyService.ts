/**
 * SureStep — src/services/safetyService.ts
 *
 * Canonical client service for Safety Alerts (SOS & Safe Zone breaches),
 * responder actions ("I'm Responding"), and Owner-only resolution.
 *
 * Baselines:
 *   - docs/architecture/TARGET_ARCHITECTURE.md (Sections 3.6, 4.3, 5.3)
 *   - docs/workflows/07-SAFETY.md
 *
 * Responding and resolving are distinct operations. Only the Circle Owner may
 * resolve an alert; any authorized recipient may record a responder action.
 */
import apiClient from './apiClient';
import { listMyCareCircles, resolveCircleIdForPatient } from './careCircleService';

export interface SafetyAlert {
  id: string;
  circle_id?: string;
  patient_id: string;
  patient_name?: string;
  patient_photo_url?: string | null;
  alert_type: 'SOS_MANUAL' | 'ZONE_BREACH';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  status: 'TRIGGERED' | 'ACTIVE' | 'VIEWED' | 'RESOLVED';
  lat?: number | null;
  lng?: number | null;
  zone_name?: string | null;
  zone_id?: string | null;
  distance_from_zone_m?: number | null;
  responders?: {
    id: string;
    responder_id: string;
    responder_name: string;
    responder_role: string;
    responded_at: string;
    notes?: string;
  }[];
  resolved_by?: string | null;
  resolved_by_name?: string | null;
  resolved_at?: string | null;
  resolution_notes?: string | null;
  created_at: string;
}

export interface PatientTelemetry {
  patient_id: string;
  latitude: number | null;
  longitude: number | null;
  accuracy_meters?: number | null;
  battery_pct?: number | null;
  network_status?: string | null;
  safety_state?: string;
  current_zone_name?: string | null;
  last_ping_at?: string | null;
  freshness_tier?: 'CURRENT' | 'RECENT' | 'STALE' | 'UNAVAILABLE';
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

function normalizeAlert(row: any): SafetyAlert {
  const responders = Array.isArray(row.responses)
    ? row.responses.map((r: any) => ({
        id: r.response_id ?? r.id,
        responder_id: r.responder_id,
        responder_name: r.responder_name,
        responder_role: r.responder_role,
        responded_at: r.created_at,
        notes: r.notes ?? undefined,
      }))
    : [];

  return {
    id: row.id,
    circle_id: row.circle_id,
    patient_id: row.patient_id,
    patient_name: row.patient_name,
    patient_photo_url: row.patient_photo ?? row.patient_photo_url ?? null,
    alert_type: row.alert_type,
    severity: row.alert_type === 'SOS_MANUAL' ? 'CRITICAL' : 'WARNING',
    status: row.status,
    lat: row.trigger_lat ?? row.lat ?? null,
    lng: row.trigger_lng ?? row.lng ?? null,
    zone_id: row.safe_zone_id ?? row.zone_id ?? null,
    zone_name: row.zone_name ?? null,
    distance_from_zone_m: row.distance_from_zone_m ?? null,
    responders,
    resolved_by: row.resolved_by ?? null,
    resolved_by_name: row.resolved_by_name ?? null,
    resolved_at: row.resolved_at ?? null,
    resolution_notes: row.resolution_notes ?? null,
    created_at: row.triggered_at ?? row.created_at,
  };
}

export async function listCircleSafetyAlerts(
  circleId: string,
  status?: string
): Promise<SafetyAlert[]> {
  try {
    const res = await apiClient.get(`/care-circles/${circleId}/alerts`, {
      params: status ? { status } : undefined,
    });
    const rows = res.data?.data?.alerts ?? res.data?.data ?? res.data?.alerts ?? [];
    return Array.isArray(rows) ? rows.map(normalizeAlert) : [];
  } catch (err) {
    console.warn('[safetyService] listCircleSafetyAlerts error:', err);
    return [];
  }
}

/** Aggregate canonical alerts across the caller's active Circles. */
export async function listMySafetyAlerts(status?: string): Promise<SafetyAlert[]> {
  const circles = await listMyCareCircles();
  const results = await Promise.all(
    circles.map((circle) => listCircleSafetyAlerts(circle.id, status))
  );
  const byId = new Map<string, SafetyAlert>();
  for (const alert of results.flat()) byId.set(alert.id, alert);
  return [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/** List alerts for one Patient, resolving their active Circle. */
export async function listPatientSafetyAlerts(
  patientId: string,
  status?: string
): Promise<SafetyAlert[]> {
  const circleId = await resolveCircleIdForPatient(patientId);
  if (!circleId) return [];
  const alerts = await listCircleSafetyAlerts(circleId, status);
  return alerts.filter((a) => a.patient_id === patientId);
}

export async function respondToAlert(
  circleId: string,
  alertId: string,
  notes?: string
): Promise<any> {
  const res = await apiClient.post(
    `/care-circles/${circleId}/alerts/${alertId}/respond`,
    { notes }
  );
  return res.data?.data ?? res.data;
}

export async function resolveAlert(
  circleId: string,
  alertId: string,
  notes?: string
): Promise<any> {
  const res = await apiClient.post(
    `/care-circles/${circleId}/alerts/${alertId}/resolve`,
    { notes }
  );
  return res.data?.data ?? res.data;
}

export async function triggerPatientSOS(
  patientId: string,
  lat?: number,
  lng?: number
): Promise<any> {
  const res = await apiClient.post(`/notifications/sos/patient/${patientId}`, { lat, lng });
  return res.data?.data ?? res.data;
}

// ─── Telemetry ───────────────────────────────────────────────────────────────

export async function fetchPatientTelemetry(patientId: string): Promise<PatientTelemetry | null> {
  try {
    const res = await apiClient.get(`/location/patient/${patientId}/current`);
    return res.data?.data ?? res.data ?? null;
  } catch (err) {
    console.warn('[safetyService] fetchPatientTelemetry error:', err);
    return null;
  }
}
