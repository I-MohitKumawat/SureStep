/**
 * SureStep — src/services/geofenceService.ts
 *
 * All geofence CRUD and alert operations via the real Express backend API.
 * Replaces the AsyncStorage-only implementation in geofenceUtils.ts.
 */
import apiClient from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiZone {
  id: string;
  patient_id: string;
  created_by: string;
  label: string;
  zone_type: string;
  center_lat: number;
  center_lng: number;
  radius_m: number;
  boundary_type: 'SOFT' | 'HARD';
  approach_threshold_pct: number;
  is_active: boolean;
  notify_on_arrival: boolean;
  notify_on_departure: boolean;
  colour: string;
  active_hours_start?: string | null;
  active_hours_end?: string | null;
  created_at: string;
}

export interface ApiAlert {
  id: string;
  patient_id: string;
  zone_id: string | null;
  alert_type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status?: string;
  lat: number;
  lng: number;
  distance_from_zone_m?: number;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  acknowledged_by_name?: string | null;
  acknowledged_by_role?: string | null;
  responder_id?: string | null;
  responder_name?: string | null;
  responder_role?: string | null;
  responded_at?: string | null;
  resolved_by?: string | null;
  resolved_by_name?: string | null;
  resolved_by_role?: string | null;
  resolved_at?: string | null;
  dedup_key?: string;
  created_at: string;
  patient_name?: string; // Joined in caregiver feed
}


export interface ApiPatientState {
  patient_id: string;
  location_state: string;
  safety_state: string;
  routine_state: string;
  engagement_state: string;
  last_known_lat: number | null;
  last_known_lng: number | null;
  last_known_zone_id?: string | null;
  current_zone_name?: string | null;
  last_ping_at: string | null;
  stationary_since: string | null;
  sos_active: boolean;
  computed_at: string;
  name?: string;
  photo_url?: string | null;
  battery_pct?: number | null;
  network_status?: string | null;
}

export type CreateZonePayload = {
  label: string;
  zone_type?: string;
  center_lat: number;
  center_lng: number;
  radius_m: number;
  boundary_type?: 'SOFT' | 'HARD';
  approach_threshold_pct?: number;
  notify_on_arrival?: boolean;
  notify_on_departure?: boolean;
  colour?: string;
  active_hours_start?: string | null;
  active_hours_end?: string | null;
};

export type UpdateZonePayload = Partial<CreateZonePayload> & { is_active?: boolean };

// ─── Zone CRUD ────────────────────────────────────────────────────────────────

export const fetchZones = async (patientId: string): Promise<ApiZone[]> => {
  const res = await apiClient.get(`/location/geofences/patient/${patientId}`);
  return (res.data?.data?.zones ?? []) as ApiZone[];
};

export const createZone = async (
  patientId: string,
  payload: CreateZonePayload,
): Promise<ApiZone> => {
  const res = await apiClient.post(`/location/geofences/patient/${patientId}`, payload);
  return res.data?.data?.zone as ApiZone;
};

export const updateZone = async (
  zoneId: string,
  payload: UpdateZonePayload,
): Promise<ApiZone> => {
  const res = await apiClient.patch(`/location/geofences/${zoneId}`, payload);
  return res.data?.data?.zone as ApiZone;
};

export const deleteZone = async (zoneId: string): Promise<void> => {
  await apiClient.delete(`/location/geofences/${zoneId}`);
};

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const fetchAlerts = async (
  patientId: string,
  params?: { limit?: number; cursor?: string; type?: string; severity?: string },
): Promise<{ alerts: ApiAlert[]; has_more: boolean; next_cursor: string | null }> => {
  const res = await apiClient.get(`/alerts/patient/${patientId}`, { params });
  return res.data?.data ?? { alerts: [], has_more: false, next_cursor: null };
};

export const acknowledgeAlert = async (alertId: string): Promise<ApiAlert> => {
  const res = await apiClient.post(`/alerts/${alertId}/acknowledge`);
  return res.data?.data?.alert as ApiAlert;
};

export const respondAlert = async (alertId: string): Promise<ApiAlert> => {
  const res = await apiClient.post(`/alerts/${alertId}/respond`);
  return res.data?.data?.alert as ApiAlert;
};

export const resolveActiveIncident = async (patientId: string): Promise<void> => {
  await apiClient.post(`/alerts/patient/${patientId}/resolve`);
};

export interface CareCircleMember {
  id: string;
  name: string;
  role: string;
  relationship_type: string;
  photo_url?: string | null;
  relation_label?: string | null;
  check_in_lat?: number | null;
  check_in_lng?: number | null;
  last_location_update?: string | null;
  last_known_lat?: number | null;
  last_known_lng?: number | null;
  last_ping_at?: string | null;
}

export const fetchPatientCareCircle = async (patientId: string): Promise<CareCircleMember[]> => {
  const res = await apiClient.get(`/relationships/patient/${patientId}/care-circle`);
  return (res.data?.data?.members ?? []) as CareCircleMember[];
};


export const fetchCaregiverAlertFeed = async (params?: {
  limit?: number;
  cursor?: string;
}): Promise<{ alerts: ApiAlert[]; has_more: boolean; next_cursor: string | null }> => {
  const res = await apiClient.get('/alerts/caregiver/feed', { params });
  return res.data?.data ?? { alerts: [], has_more: false, next_cursor: null };
};

// ─── Patient State ────────────────────────────────────────────────────────────

export const fetchPatientState = async (patientId: string): Promise<ApiPatientState | null> => {
  try {
    const res = await apiClient.get(`/awareness/patient/${patientId}/state`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    return res.data?.data?.state as ApiPatientState ?? null;
  } catch {
    return null;
  }
};

export const requestLocationRefresh = async (patientId: string): Promise<void> => {
  await apiClient.post(`/location/patient/${patientId}/refresh-request`);
};

// ─── FCM Device Token Registration ───────────────────────────────────────────

export const registerDeviceToken = async (
  deviceToken: string,
  deviceType: 'PHONE_IOS' | 'PHONE_ANDROID',
  deviceName?: string,
  appVersion?: string,
): Promise<void> => {
  await apiClient.post('/alerts/devices/register', {
    device_token: deviceToken,
    device_type:  deviceType,
    device_name:  deviceName,
    app_version:  appVersion,
  });
};

// ─── SOS Trigger ─────────────────────────────────────────────────────────────

export const triggerSOS = async (patientId: string): Promise<void> => {
  await apiClient.post(`/alerts/sos/patient/${patientId}`);
};
