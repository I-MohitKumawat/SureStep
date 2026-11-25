/**
 * SureStep — src/services/geofenceService.ts
 *
 * Patient awareness telemetry, location refresh, notification device
 * registration, and Patient SOS.
 *
 * Safe Zone CRUD and safety-alert reads/actions are canonical Care Circle
 * resources and live in careCircleService / safetyService.
 */
import apiClient from './apiClient';

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
    return (res.data?.data?.state as ApiPatientState) ?? null;
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
    device_type: deviceType,
    device_name: deviceName,
    app_version: appVersion,
  });
};

// ─── SOS Trigger ─────────────────────────────────────────────────────────────

export const triggerSOS = async (patientId: string): Promise<void> => {
  await apiClient.post(`/alerts/sos/patient/${patientId}`);
};
