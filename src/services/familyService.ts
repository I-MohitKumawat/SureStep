/**
 * SureStep — src/services/familyService.ts
 * API wrappers for the Family role. Invitation and profile operations are
 * expressed only through canonical Care Circle endpoints.
 */
import apiClient from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

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

export const getFamilyProfile = () =>
  apiClient.get<{ success: boolean; data: { profile: FamilyProfile } }>('/family/profile');

export const updateFamilyProfile = (data: Partial<FamilyProfile>) =>
  apiClient.patch<{ success: boolean; data: { profile: FamilyProfile } }>('/family/profile', data);
