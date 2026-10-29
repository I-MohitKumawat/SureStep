/**
 * SureStep — src/services/familyService.ts
 * API wrappers for the Family role.
 */
import apiClient from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FamilyPatient {
  id: string;
  name: string;
  photo_url: string | null;
  date_of_birth: string | null;
  phone: string;
  relationship_type: string;
  status: string;
  confirmed_at: string;
  // Patient state
  location_state: string | null;
  safety_state: string | null;
  routine_state: string | null;
  last_ping_at: string | null;
  sos_active: boolean;
  battery_pct: number | null;
  network_status: string | null;
  computed_at: string | null;
  current_zone_name: string | null;
  last_known_lat: number | null;
  last_known_lng: number | null;
  // Family profile
  relation_label: string | null;
  notify_on_breach: boolean;
  notify_on_missed_critical: boolean;
  notify_on_sos: boolean;
}

export interface CareCircleMember {
  id: string;
  name: string;
  photo_url: string | null;
  relationship_type: string;
  status: string;
  confirmed_at: string;
  relation_label: string | null;
  check_in_lat?: number | null;
  check_in_lng?: number | null;
  last_location_update?: string | null;
}

export interface CareNote {
  id: string;
  patient_id: string;
  author_id: string;
  author_name: string;
  author_photo: string | null;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface FamilyProfile {
  user_id: string;
  name: string;
  photo_url: string | null;
  relation_label: string | null;
  proximity?: string | null;
  involvement_interests?: string[];
  avatar_url: string | null;
  whatsapp_number: string | null;
  notify_on_breach: boolean;
  notify_on_missed_critical: boolean;
  notify_on_sos: boolean;
  notify_on_daily_digest: boolean;
  digest_frequency: 'DAILY' | 'WEEKLY';
}

// ─── API Calls ────────────────────────────────────────────────────────────────

export const getMyPatient = () =>
  apiClient.get<{ success: boolean; data: { patient: FamilyPatient } }>('/family/my-patient');

export const getCareCircle = () =>
  apiClient.get<{ success: boolean; data: { members: CareCircleMember[] } }>('/family/care-circle');

export const getCareNotes = () =>
  apiClient.get<{ success: boolean; data: { notes: CareNote[] } }>('/family/care-notes');

export const createCareNote = (content: string, is_pinned?: boolean) =>
  apiClient.post<{ success: boolean; data: { note: CareNote } }>('/family/care-notes', { content, is_pinned });

export const deleteCareNote = (id: string) =>
  apiClient.delete(`/family/care-notes/${id}`);

export const validateInviteCode = async (code: string) => {
  const clean = (code || '').trim();
  const res = await apiClient.get(`/care-circles/invitations/${encodeURIComponent(clean)}`);
  const data = res.data?.data ?? res.data;
  const circleName = data?.circleName ?? data?.circle_name ?? '';
  return {
    ...res,
    data: {
      success: true,
      data: {
        valid: Boolean(data?.id || data?.circleId || data?.circle_id),
        patientName: circleName,
        circleName,
        ownerName: data?.ownerName ?? data?.owner_name ?? '',
        code: clean,
        expiresAt: data?.expiresAt ?? data?.expires_at,
      },
    },
  };
};

export const redeemInviteCode = (code: string) =>
  apiClient.post(`/care-circles/invitations/${encodeURIComponent((code || '').trim())}/join`);

export const requestAccessByPhone = (patient_phone: string) =>
  apiClient.post<{ success: boolean; data: { relationship: any; message: string } }>('/family/request-access', { patient_phone });

export const getAccessStatus = () =>
  apiClient.get<{ success: boolean; data: { status: { status: string; relationship_type: string; patient_name: string } | null } }>('/family/access-status');

export const getFamilyProfile = () =>
  apiClient.get<{ success: boolean; data: { profile: FamilyProfile } }>('/family/profile');

export const updateFamilyProfile = (data: Partial<FamilyProfile>) =>
  apiClient.patch<{ success: boolean; data: { profile: FamilyProfile } }>('/family/profile', data);

// ─── Caregiver: Generate Invite Code ─────────────────────────────────────────

export const generateInviteCode = (patient_id: string, relationship_type: string = 'FAMILY_CLOSE') =>
  apiClient.post<{ success: boolean; data: { invite: { code: string; expires_at: string } } }>(
    '/relationships/invite-code/generate',
    { patient_id, relationship_type },
  );

export const getPendingFamilyRequests = () =>
  apiClient.get<{ success: boolean; data: { requests: any[] } }>('/relationships/family/pending');

export const approveFamilyRequest = (id: string) =>
  apiClient.post(`/relationships/family/${id}/approve`);

export const rejectFamilyRequest = (id: string) =>
  apiClient.post(`/relationships/family/${id}/reject`);

export const getInviteCodesForPatient = (patientId: string) =>
  apiClient.get<{ success: boolean; data: { inviteCodes: any[] } }>(`/relationships/patient/${patientId}/invite-codes`);

export const revokeInviteCode = (code: string) =>
  apiClient.post<{ success: boolean; data: { revoked: boolean } }>(`/relationships/invite-code/${code}/revoke`);

export const getCareCircleForPatient = (patientId: string) =>
  apiClient.get<{ success: boolean; data: { members: CareCircleMember[] } }>(`/relationships/patient/${patientId}/care-circle`);
