/**
 * SureStep — src/services/safetyService.ts
 * Canonical client service for Safety Incidents (SOS & Geofence Breaches),
 * Responder Ledger ("I'm Responding"), Incident Resolution (Owner only),
 * and Patient Telemetry.
 */
import apiClient from './apiClient';

export interface SafetyAlert {
  id: string;
  circle_id?: string;
  patient_id: string;
  patient_name?: string;
  patient_photo_url?: string | null;
  alert_type: 'SOS_MANUAL' | 'ZONE_BREACH' | 'ZONE_APPROACH' | 'FALL_DETECTED';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  status: 'TRIGGERED' | 'ACKNOWLEDGED' | 'RESPONDED' | 'RESOLVED';
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

// ─── Alerts CRUD & Actions ───────────────────────────────────────────────────

export async function listCircleSafetyAlerts(
  circleId: string,
  status?: string
): Promise<SafetyAlert[]> {
  try {
    const res = await apiClient.get(`/care-circles/${circleId}/alerts`, {
      params: status ? { status } : undefined,
    });
    return res.data?.data?.alerts ?? res.data?.alerts ?? [];
  } catch (err) {
    console.warn('[safetyService] listCircleSafetyAlerts error:', err);
    return [];
  }
}

export async function respondToAlert(
  alertId: string,
  notes?: string
): Promise<any> {
  const res = await apiClient.post(`/notifications/alerts/${alertId}/respond`, { notes });
  return res.data?.data ?? res.data;
}

export async function resolveAlert(
  alertId: string,
  notes?: string
): Promise<any> {
  const res = await apiClient.post(`/notifications/alerts/${alertId}/resolve`, { notes });
  return res.data?.data ?? res.data;
}

export async function triggerPatientSOS(
  patientId: string,
  lat?: number,
  lng?: number
): Promise<any> {
  const res = await apiClient.post(`/notifications/sos/${patientId}`, { lat, lng });
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
