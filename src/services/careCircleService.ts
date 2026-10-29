/**
 * SureStep — src/services/careCircleService.ts
 * Canonical client service for Care Circle lifecycle, memberships, invitations,
 * permissions, safe zones, and patient associations.
 */
import apiClient from './apiClient';

export interface CareCircle {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  role_in_circle?: 'OWNER' | 'MEMBER' | 'CAREGIVER';
  is_owner?: boolean;
  owner_name?: string;
}

export type SafeZone = SafeZoneItem;

export interface CircleMember {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  photo_url?: string | null;
  role_in_circle: 'OWNER' | 'MEMBER' | 'CAREGIVER';
  is_owner: boolean;
  joined_at: string;
  permissions?: string[];
}

export interface CirclePatient {
  id: string;
  name: string;
  photo_url?: string | null;
  phone?: string;
  gender?: string;
  relationship_label?: string;
  care_mode?: 'SELF' | 'ASSISTED';
  safety_state?: string;
  current_zone_name?: string | null;
  last_known_lat?: number | null;
  last_known_lng?: number | null;
  battery_pct?: number | null;
  last_ping_at?: string | null;
  associated_at?: string;
}

export interface SafeZoneItem {
  id: string;
  circle_id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  is_active: boolean;
  boundary_type?: 'soft' | 'hard';
  monitored_patients?: { patient_id: string; patient_name?: string }[];
  created_at?: string;
}

export interface JoinRequest {
  id: string;
  circle_id: string;
  user_id: string;
  user_name?: string;
  user_phone?: string;
  role_requested: string;
  role_in_circle?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: string;
}

// ─── Care Circles CRUD ────────────────────────────────────────────────────────

export async function listMyCareCircles(): Promise<CareCircle[]> {
  try {
    let res;
    try {
      res = await apiClient.get('/care-circles/my');
    } catch {
      res = await apiClient.get('/care-circles');
    }
    const payload = res.data;
    if (!payload) return [];

    if (Array.isArray(payload.circles)) {
      return payload.circles;
    }
    if (Array.isArray(payload.data?.circles)) {
      return payload.data.circles;
    }

    const single = payload.circle ?? payload.data;
    if (Array.isArray(single)) {
      return single;
    }
    if (single && typeof single === 'object' && single.id) {
      return [single];
    }
    return [];
  } catch (err) {
    console.warn('[careCircleService] listMyCareCircles error:', err);
    return [];
  }
}

export function circleErrorMessage(err: any, fallback = 'Request failed'): string {
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

export async function createCareCircle(name: string): Promise<CareCircle> {
  const res = await apiClient.post('/care-circles', { name });
  const circle = res.data?.circle ?? res.data?.data?.circle ?? res.data?.data ?? res.data;
  return circle;
}

export async function getCareCircleDetails(circleId: string): Promise<CareCircle | null> {
  try {
    const res = await apiClient.get(`/care-circles/${circleId}`);
    return res.data?.circle ?? res.data?.data?.circle ?? res.data?.data ?? null;
  } catch (err) {
    console.warn('[careCircleService] getCareCircleDetails error:', err);
    return null;
  }
}

export async function leaveCareCircle(circleId: string): Promise<void> {
  await apiClient.post(`/care-circles/${circleId}/leave`);
}

export async function deleteCareCircle(circleId: string): Promise<void> {
  await apiClient.delete(`/care-circles/${circleId}`);
}

export async function transferCircleOwnership(circleId: string, newOwnerId: string): Promise<void> {
  await apiClient.post(`/care-circles/${circleId}/transfer-ownership`, { newOwnerId });
}

// ─── Members & Permissions ───────────────────────────────────────────────────

export async function listCircleMembers(circleId: string): Promise<CircleMember[]> {
  try {
    const res = await apiClient.get(`/care-circles/${circleId}/members`);
    const d = res.data?.data ?? res.data?.members;
    const rawList = Array.isArray(d) ? d : (Array.isArray(res.data?.data?.members) ? res.data.data.members : []);
    return rawList.map((m: any) => ({
      id: m.id || m.member_id,
      user_id: m.user_id,
      name: m.name || 'Member',
      phone: m.phone,
      photo_url: m.photo_url,
      role_in_circle: m.role_in_circle,
      is_owner: m.role_in_circle === 'OWNER' || Boolean(m.is_owner),
      joined_at: m.joined_at,
      permissions: Array.isArray(m.permissions)
        ? m.permissions.map((p: any) => (typeof p === 'string' ? p : p.permission_name))
        : [],
    }));
  } catch (err) {
    console.warn('[careCircleService] listCircleMembers error:', err);
    return [];
  }
}

export async function removeCircleMember(circleId: string, memberId: string): Promise<void> {
  await apiClient.delete(`/care-circles/${circleId}/members/${memberId}`);
}

export async function grantMemberPermission(
  circleId: string,
  memberId: string,
  permissionName: string
): Promise<void> {
  await apiClient.post(`/care-circles/${circleId}/members/${memberId}/permissions`, { permissionName });
}

export async function revokeMemberPermission(
  circleId: string,
  memberId: string,
  permissionName: string
): Promise<void> {
  await apiClient.delete(`/care-circles/${circleId}/members/${memberId}/permissions`, {
    params: { permissionName },
  });
}

export async function updateMemberPermissions(
  circleId: string,
  memberId: string,
  permissions: string[]
): Promise<void> {
  try {
    await apiClient.put(`/care-circles/${circleId}/members/${memberId}/permissions`, { permissions });
  } catch (err) {
    await apiClient.patch(`/care-circles/${circleId}/members/${memberId}/permissions`, { permissions });
  }
}

// ─── Invitations & Join Requests ──────────────────────────────────────────────

export async function generateCircleInvite(
  circleId: string,
  _roleInCircle?: 'MEMBER' | 'CAREGIVER'
): Promise<{ code: string; expires_at: string }> {
  const res = await apiClient.post(`/care-circles/${circleId}/invitations`);
  const payload = res.data?.data?.code
    ? res.data.data
    : (res.data?.data?.invitation ?? res.data?.invitation ?? res.data?.data ?? res.data);
  return {
    code: payload?.code || '',
    expires_at: payload?.expires_at || payload?.expiresAt || '',
  };
}

export async function getActiveCircleInvite(
  circleId: string
): Promise<{ code: string; expires_at: string } | null> {
  const res = await apiClient.get(`/care-circles/${circleId}/invitations`);
  const payload = res.data?.data?.invitation ?? res.data?.invitation ?? res.data?.data ?? null;
  if (!payload?.code) return null;
  return {
    code: payload.code,
    expires_at: payload.expires_at || payload.expiresAt || '',
  };
}

export async function revokeActiveCircleInvite(circleId: string): Promise<void> {
  await apiClient.post(`/care-circles/${circleId}/invitations/revoke`);
}

export async function lookupCircleInvite(code: string): Promise<{
  id: string;
  circleId: string;
  circleName: string;
  ownerName: string;
  expiresAt: string;
  status: string;
}> {
  const clean = (code || '').trim();
  const res = await apiClient.get(`/care-circles/invitations/${encodeURIComponent(clean)}`);
  const data = res.data?.data ?? res.data;
  return {
    id: data.id,
    circleId: data.circleId ?? data.circle_id,
    circleName: data.circleName ?? data.circle_name,
    ownerName: data.ownerName ?? data.owner_name,
    expiresAt: data.expiresAt ?? data.expires_at,
    status: data.status,
  };
}

export async function redeemCircleInvite(code: string): Promise<any> {
  const clean = (code || '').trim();
  const res = await apiClient.post(`/care-circles/invitations/${encodeURIComponent(clean)}/join`);
  return res.data?.data ?? res.data;
}

export async function listJoinRequests(circleId: string): Promise<JoinRequest[]> {
  try {
    const res = await apiClient.get(`/care-circles/${circleId}/join-requests`);
    const d = res.data?.data ?? res.data?.requests;
    const rawList = Array.isArray(d) ? d : (Array.isArray(res.data?.data?.requests) ? res.data.data.requests : []);
    return rawList.map((row: any) => ({
      id: row.id,
      circle_id: row.circle_id,
      user_id: row.user_id,
      user_name: row.user_name || row.name,
      user_phone: row.user_phone || row.phone,
      role_requested: row.role_requested || row.applicant_role || row.role_in_circle,
      role_in_circle: row.role_in_circle || row.applicant_role,
      status: row.status,
      created_at: row.created_at,
    }));
  } catch (err) {
    console.warn('[careCircleService] listJoinRequests error:', err);
    return [];
  }
}

export async function reviewJoinRequest(
  circleId: string,
  requestId: string,
  decision: 'ACCEPTED' | 'REJECTED'
): Promise<void> {
  await apiClient.post(`/care-circles/${circleId}/join-requests/${requestId}/review`, { decision });
}

// ─── Associated Patients ──────────────────────────────────────────────────────

export async function listCirclePatients(circleId: string): Promise<CirclePatient[]> {
  try {
    const res = await apiClient.get(`/care-circles/${circleId}/patients`);
    const d = res.data?.data ?? res.data?.patients;
    const rawList = Array.isArray(d) ? d : (Array.isArray(res.data?.data?.patients) ? res.data.data.patients : []);
    return rawList.map((p: any) => ({
      id: p.id || p.patient_id || p.association_id,
      name: p.name || 'Patient',
      photo_url: p.photo_url,
      phone: p.phone,
      gender: p.gender,
      relationship_label: p.relationship_label,
      care_mode: p.care_mode,
      safety_state: p.safety_state,
      current_zone_name: p.current_zone_name,
      last_known_lat: p.last_known_lat,
      last_known_lng: p.last_known_lng,
      battery_pct: p.battery_pct,
      last_ping_at: p.last_ping_at,
      associated_at: p.associated_at,
    }));
  } catch (err) {
    console.warn('[careCircleService] listCirclePatients error:', err);
    return [];
  }
}

export async function associatePatientToCircle(circleId: string, patientId: string): Promise<void> {
  await apiClient.post(`/care-circles/${circleId}/patients`, { patientId });
}

// ─── Safe Zones ───────────────────────────────────────────────────────────────

export async function listCircleSafeZones(circleId: string): Promise<SafeZoneItem[]> {
  try {
    const res = await apiClient.get(`/care-circles/${circleId}/safe-zones`);
    const d = res.data?.data ?? res.data?.safe_zones;
    if (Array.isArray(d)) return d;
    if (Array.isArray(res.data?.data?.safe_zones)) return res.data.data.safe_zones;
    return [];
  } catch (err) {
    console.warn('[careCircleService] listCircleSafeZones error:', err);
    return [];
  }
}

export async function createCircleSafeZone(
  circleId: string,
  dto: {
    name: string;
    centerLat: number;
    centerLng: number;
    radiusMeters: number;
    monitoredPatientIds?: string[];
  }
): Promise<SafeZoneItem> {
  const res = await apiClient.post(`/care-circles/${circleId}/safe-zones`, dto);
  return res.data?.data?.safe_zone ?? res.data?.safe_zone;
}

export async function updateCircleSafeZone(
  circleId: string,
  zoneId: string,
  dto: {
    name?: string;
    centerLat?: number;
    centerLng?: number;
    radiusMeters?: number;
    isActive?: boolean;
  }
): Promise<SafeZoneItem> {
  const res = await apiClient.patch(`/care-circles/${circleId}/safe-zones/${zoneId}`, dto);
  return res.data?.data?.safe_zone ?? res.data?.safe_zone;
}

export async function deleteCircleSafeZone(circleId: string, zoneId: string): Promise<void> {
  await apiClient.delete(`/care-circles/${circleId}/safe-zones/${zoneId}`);
}

export async function attachPatientToSafeZone(
  circleId: string,
  zoneId: string,
  patientId: string
): Promise<void> {
  await apiClient.post(`/care-circles/${circleId}/safe-zones/${zoneId}/patients/${patientId}`);
}

export async function detachPatientFromSafeZone(
  circleId: string,
  zoneId: string,
  patientId: string
): Promise<void> {
  await apiClient.delete(`/care-circles/${circleId}/safe-zones/${zoneId}/patients/${patientId}`);
}
