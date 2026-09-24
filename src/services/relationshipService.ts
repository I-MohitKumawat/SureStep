/**
 * SureStep — src/services/relationshipService.ts
 *
 * Coordinates caregiver-patient relationships, replacing legacy backend/caregiverLinks imports.
 * Communicates with backend Express API via apiClient.
 */
import apiClient from './apiClient';
import type { CaregiverListing } from '../screens/patient/CaregiverSearchView';
export type { CaregiverListing };

export type PatientRequest = {
  patient_phone: string;
  patient_name: string;
  confirmed_at: string;
};

export const mapCaregiverRow = (row: any): CaregiverListing => {
  const id = row.caregiverId || row.caregiver_id || row.id;
  const name = row.name || 'Caregiver';
  const professionalRole = row.professionalRole || row.professional_role || row.specializations?.[0] || 'Caregiver';
  const yearsExp = row.yearsOfExperience ?? row.years_of_experience ?? row.years_experience ?? 0;
  const dementiaExp = row.dementiaExperienceYears ?? row.dementia_experience_years ?? 0;
  const hasDementiaTraining = Boolean(row.hasDementiaTraining ?? row.has_dementia_training);
  const careCapabilities = row.careCapabilities || row.care_capabilities || [];
  const specializations = row.specializations || [];
  const languagesSpoken = row.languagesSpoken || row.languages_spoken || ['English'];
  const availabilityTypes = row.availabilityTypes || row.availability_types || [];
  const serviceCity = row.serviceCity || row.service_city || row.city || '';
  const serviceRadiusKm = row.serviceRadiusKm ?? row.service_radius_km ?? 10;
  const hourlyRateNum = row.hourlyRateInr != null ? Number(row.hourlyRateInr) : (row.hourly_rate != null ? Number(row.hourly_rate) : null);
  const dailyRateNum = row.dailyRateInr != null ? Number(row.dailyRateInr) : (row.daily_rate != null ? Number(row.daily_rate) : null);
  const ratingNum = row.rating != null ? parseFloat(row.rating) : null;
  const ratingCount = row.ratingCount ?? row.rating_count ?? (ratingNum != null ? 1 : 0);
  const photoUrl = row.photoUrl || row.photo_url || row.profile_photo_url || null;
  const bio = row.fullBio || row.bio || row.bioSummary || row.bio_summary || '';
  const verificationStatus = row.verificationStatus || row.verification_status || (row.is_verified ? 'VERIFIED' : 'PENDING');
  const isDiscoverable = Boolean(row.isDiscoverable ?? row.is_discoverable ?? true);
  const qualifications = Array.isArray(row.qualifications) ? row.qualifications : [];

  let feeFormatted = 'Contact for rates';
  if (hourlyRateNum != null && hourlyRateNum > 0) {
    feeFormatted = `₹${hourlyRateNum.toFixed(0)}/hr`;
  } else if (dailyRateNum != null && dailyRateNum > 0) {
    feeFormatted = `₹${dailyRateNum.toFixed(0)}/day`;
  }

  return {
    id,
    caregiverId: id,
    name,
    specialty: professionalRole,
    professional_role: professionalRole,
    professionalRole,
    patients: row.current_patient_count || row.max_patients || row.patients || 0,
    patients_handled: row.current_patient_count || row.max_patients || 0,
    rating: ratingNum,
    ratingCount,
    rating_count: ratingCount,
    fee: feeFormatted,
    emoji: '👩‍⚕️',
    bio,
    bioSummary: row.bioSummary || row.bio_summary || (bio.length > 160 ? `${bio.slice(0, 157)}...` : bio),
    fullBio: row.fullBio || bio,
    availability: availabilityTypes.length > 0 ? availabilityTypes.join(', ') : 'Contact for availability',
    location: serviceCity,
    service_city: serviceCity,
    serviceCity,
    service_radius_km: serviceRadiusKm,
    serviceRadiusKm,
    profile_photo_url: photoUrl,
    photoUrl,
    years_experience: yearsExp,
    yearsOfExperience: yearsExp,
    dementia_experience_years: dementiaExp,
    dementiaExperienceYears: dementiaExp,
    has_dementia_training: hasDementiaTraining,
    hasDementiaTraining,
    care_capabilities: careCapabilities,
    careCapabilities,
    specializations,
    languages_spoken: languagesSpoken,
    languagesSpoken,
    availability_types: availabilityTypes,
    availabilityTypes,
    hourly_rate: hourlyRateNum != null ? String(hourlyRateNum) : undefined,
    hourlyRateInr: hourlyRateNum,
    daily_rate: dailyRateNum != null ? String(dailyRateNum) : undefined,
    dailyRateInr: dailyRateNum,
    qualifications,
    verification_status: verificationStatus,
    verificationStatus,
    is_verified: verificationStatus === 'VERIFIED',
    is_discoverable: isDiscoverable,
    isDiscoverable,
    status: row.status || null,
    about_me: bio,
    dementia_experience: dementiaExp > 0 || hasDementiaTraining,
    relationshipId: row.relationship_id || row.relationshipId || row.relationship?.id,
    relationship_id: row.relationship_id || row.relationshipId || row.relationship?.id,
    ended_at: row.ended_at || row.endedAt,
    end_reason: row.end_reason || row.endReason,
    end_notes: row.end_notes || row.endNotes,
    updated_at: row.updatedAt || row.updated_at,
    updatedAt: row.updatedAt || row.updated_at,
  };
};

export interface FamilyMemberItem {
  id: string;
  name: string;
  photo_url: string | null;
  relationship_type: string;
  status: string;
  confirmed_at: string;
}

/**
 * Fetch all confirmed family members in the care circle for the current patient.
 */
export const fetchMyFamily = async (): Promise<FamilyMemberItem[]> => {
  try {
    const { data } = await apiClient.get('/relationships/my-family');
    return data.data?.family || [];
  } catch (error) {
    console.warn('[relationshipService] fetchMyFamily failed:', error);
    return [];
  }
};

/**
 * Fetch all connected caregivers for the current patient.
 */
export const fetchMyCaregivers = async (): Promise<CaregiverListing[]> => {
  try {
    const { data } = await apiClient.get('/relationships/my-caregivers');
    const rows = data.data?.caregivers || [];
    return rows.map((row: any) => mapCaregiverRow(row));
  } catch (error) {
    console.warn('[relationshipService] fetchMyCaregivers failed:', error);
    return [];
  }
};

/**
 * Fetch the currently confirmed caregiver profile for a patient.
 */
export const fetchConfirmedCaregiver = async (patientPhone: string): Promise<CaregiverListing | null> => {
  try {
    const { data } = await apiClient.get(`/relationships/caregiver/confirmed`, {
      params: { patientPhone },
    });
    return data.data ? mapCaregiverRow(data.data) : null;
  } catch (error) {
    console.warn('[relationshipService] fetchConfirmedCaregiver failed:', error);
    return null;
  }
};

/**
 * Confirm a caregiver-patient linkage request.
 */
export const confirmCaregiver = async (
  patientPhone: string,
  caregiver: CaregiverListing,
  patientName?: string,
): Promise<void> => {
  await apiClient.post('/relationships/caregiver/confirm', {
    patientPhone,
    caregiverId: caregiver.id,
    patientName,
  });
};

/**
 * Remove a caregiver linkage for a patient.
 * @deprecated Legacy endpoint. Use canonical endCareRelationship instead.
 */
export const removeCaregiver = async (patientPhone: string): Promise<void> => {
  await apiClient.delete('/relationships/caregiver', {
    params: { patientPhone },
  });
};

export const CANONICAL_END_REASONS = [
  'CARE_NO_LONGER_REQUIRED',
  'FAMILY_TAKING_OVER',
  'FOUND_DIFFERENT_CARE',
  'CAREGIVER_NOT_A_GOOD_FIT',
  'SCHEDULE_CHANGED',
  'CAREGIVER_REQUESTED_END',
  'OTHER',
] as const;

export type CareRelationshipEndReason = typeof CANONICAL_END_REASONS[number];

export interface EndCareRelationshipPayload {
  reason: CareRelationshipEndReason;
  notes?: string | null;
}

export interface CareRelationshipHistoryItem {
  id: string;
  caregiver_id: string;
  name: string;
  photo_url: string | null;
  city: string | null;
  professional_role: string | null;
  rating: number | null;
  rating_count: number;
  relationship_id: string;
  relationship_type: string;
  status: string;
  previous_status: string | null;
  confirmed_at: string | null;
  ended_at: string | null;
  ended_by: string | null;
  end_reason: string | null;
  end_notes: string | null;
}

/**
 * Canonical Phase 3A: End Care Relationship
 * Transitions an active/established care relationship to ENDED.
 */
export const endCareRelationship = async (
  relationshipId: string,
  payload: EndCareRelationshipPayload,
): Promise<any> => {
  const { data } = await apiClient.post(`/care-relationships/${relationshipId}/end`, payload);
  return data?.data?.relationship;
};

/**
 * Canonical Phase 3A: Fetch Care History
 * Retrieves historical ENDED care relationships for the patient.
 */
export const fetchCareRelationshipHistory = async (
  patientId?: string,
): Promise<CareRelationshipHistoryItem[]> => {
  try {
    const { data } = await apiClient.get('/care-relationships/history', {
      params: patientId ? { patientId } : undefined,
    });
    return data?.data?.history || [];
  } catch (error) {
    console.warn('[relationshipService] fetchCareRelationshipHistory failed:', error);
    return [];
  }
};

// ─── Phase 3B: Caregiver Resignation API ──────────────────────────────────────

export const CANONICAL_RESIGNATION_REASONS = [
  'PERSONAL_CIRCUMSTANCES',
  'SCHEDULE_CONFLICT',
  'OUTSIDE_SERVICE_AREA',
  'CARE_NEEDS_CHANGED',
  'CAPACITY_CONSTRAINT',
  'ROLE_NO_LONGER_SUITABLE',
  'OTHER',
] as const;

export type CaregiverResignationReason = typeof CANONICAL_RESIGNATION_REASONS[number];

export interface CaregiverResignationRecord {
  id: string;
  relationship_id: string;
  caregiver_id: string;
  patient_id: string;
  reason: CaregiverResignationReason;
  notes: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'WITHDRAWN' | 'DECLINED' | 'EXPIRED';
  requested_at: string;
  responded_at: string | null;
  responded_by: string | null;
  created_at: string;
  updated_at: string;
  caregiver_name?: string;
  patient_name?: string;
}

export interface SubmitResignationPayload {
  reason: CaregiverResignationReason;
  notes?: string | null;
}

/**
 * Phase 3B: Caregiver submits request to end care (resignation).
 */
export const submitCaregiverResignation = async (
  relationshipId: string,
  payload: SubmitResignationPayload,
): Promise<CaregiverResignationRecord> => {
  const { data } = await apiClient.post(`/care-relationships/${relationshipId}/resignation`, payload);
  return data?.data?.resignation;
};

/**
 * Phase 3B: Fetch latest resignation request for a relationship.
 */
export const fetchCaregiverResignation = async (
  relationshipId: string,
): Promise<CaregiverResignationRecord | null> => {
  try {
    const { data } = await apiClient.get(`/care-relationships/${relationshipId}/resignation`);
    return data?.data?.resignation || null;
  } catch (error) {
    console.warn('[relationshipService] fetchCaregiverResignation failed:', error);
    return null;
  }
};

/**
 * Phase 3B: Fetch pending resignation requests for the patient / care circle.
 */
export const fetchPendingResignations = async (
  patientId?: string,
): Promise<CaregiverResignationRecord[]> => {
  try {
    const { data } = await apiClient.get('/care-relationships/resignations/pending', {
      params: patientId ? { patientId } : undefined,
    });
    return data?.data?.resignations || [];
  } catch (error) {
    console.warn('[relationshipService] fetchPendingResignations failed:', error);
    return [];
  }
};

/**
 * Phase 3B: Patient or authorized family member accepts caregiver resignation.
 */
export const acceptCaregiverResignation = async (
  relationshipId: string,
): Promise<any> => {
  const { data } = await apiClient.post(`/care-relationships/${relationshipId}/resignation/accept`);
  return data?.data;
};

/**
 * Phase 3B: Patient or authorized family member declines caregiver resignation.
 */
export const declineCaregiverResignation = async (
  relationshipId: string,
  notes?: string | null,
): Promise<CaregiverResignationRecord> => {
  const { data } = await apiClient.post(`/care-relationships/${relationshipId}/resignation/decline`, { notes });
  return data?.data?.resignation;
};

/**
 * Phase 3B: Caregiver withdraws pending resignation request.
 */
export const withdrawCaregiverResignation = async (
  relationshipId: string,
): Promise<CaregiverResignationRecord> => {
  const { data } = await apiClient.post(`/care-relationships/${relationshipId}/resignation/withdraw`);
  return data?.data?.resignation;
};


/**
 * Fetch all pending caregiver linkage requests from patients.
 */
export const fetchPendingRequests = async (caregiverPhone: string): Promise<PatientRequest[]> => {
  try {
    const { data } = await apiClient.get('/relationships/caregiver/pending', {
      params: { phone: caregiverPhone },
    });
    return data.data || [];
  } catch (error) {
    console.warn('[relationshipService] fetchPendingRequests failed:', error);
    return [];
  }
};

/**
 * Respond to a pending patient linkage request.
 */
export const respondToPatientRequest = async (
  caregiverPhone: string,
  patientPhone: string,
  action: 'confirmed' | 'rejected',
): Promise<void> => {
  await apiClient.post('/relationships/caregiver/respond', {
    caregiverPhone,
    patientPhone,
    action,
  });
};

/**
 * Real-time subscription stub for link changes.
 * Returns an unsubscribe handler.
 */
export const subscribeToCaregiversLinks = (
  caregiverPhone: string,
  callback: () => void,
): (() => void) => {
  // In a full implementation, this attaches socket listeners.
  // For now, we mock/stub it to prevent runtime crashes.
  console.log(`[relationshipService] Subscribed to caregiver links for ${caregiverPhone}`);
  
  // Return dummy unsubscribe handler
  return () => {
    console.log(`[relationshipService] Unsubscribed from caregiver links for ${caregiverPhone}`);
  };
};

export interface DiscoveryFilterOptions {
  search?: string;
  role?: string;
  city?: string;
  dementiaExperience?: boolean;
  minExperienceYears?: number;
  maxHourlyRate?: number;
  capabilities?: string[];
  specializations?: string[];
  languages?: string[];
  availability?: string[];
  sortBy?: 'newest' | 'experience' | 'price_asc' | 'price_desc' | 'rating';
  targetPatientId?: string;
  page?: number;
  limit?: number;
}

export interface DiscoverySearchResult {
  caregivers: CaregiverListing[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Full discovery search returning both caregivers list and pagination metadata.
 */
export const fetchCaregiversDiscovery = async (
  options?: DiscoveryFilterOptions,
): Promise<DiscoverySearchResult> => {
  const params: Record<string, any> = {};

  if (options?.search) params.search = options.search;
  if (options?.role && options.role !== 'All') params.role = options.role;
  if (options?.city) params.city = options.city;
  if (options?.dementiaExperience) params.dementiaExperience = 'true';
  if (options?.minExperienceYears != null && options.minExperienceYears > 0) {
    params.minExperienceYears = options.minExperienceYears;
  }
  if (options?.maxHourlyRate != null && options.maxHourlyRate > 0) {
    params.maxHourlyRate = options.maxHourlyRate;
  }
  if (options?.capabilities && options.capabilities.length > 0) {
    params.capabilities = options.capabilities.join(',');
  }
  if (options?.specializations && options.specializations.length > 0) {
    params.specializations = options.specializations.join(',');
  }
  if (options?.languages && options.languages.length > 0) {
    params.languages = options.languages.join(',');
  }
  if (options?.availability && options.availability.length > 0) {
    params.availability = options.availability.join(',');
  }
  if (options?.sortBy) params.sortBy = options.sortBy;
  if (options?.targetPatientId) params.targetPatientId = options.targetPatientId;
  if (options?.page) params.page = options.page;
  if (options?.limit) params.limit = options.limit;

  const { data } = await apiClient.get('/care/discovery/caregivers', { params });

  const rawListings = data.data?.caregivers || [];
  const caregivers = rawListings.map((row: any) => mapCaregiverRow(row));

  const pagination = data.data?.pagination || {
    total: caregivers.length,
    page: options?.page || 1,
    limit: options?.limit || 20,
    totalPages: 1,
    hasMore: false,
  };

  return { caregivers, pagination };
};

/**
 * Search discoverable caregivers in the patient's city / criteria.
 */
export const searchCaregivers = async (
  queryOrOptions?: string | DiscoveryFilterOptions,
  legacyOptions?: { targetPatientId?: string; sort?: string; limit?: number; page?: number },
): Promise<CaregiverListing[]> => {
  const opts: DiscoveryFilterOptions =
    typeof queryOrOptions === 'string'
      ? { search: queryOrOptions, ...legacyOptions }
      : queryOrOptions || {};

  const result = await fetchCaregiversDiscovery(opts);
  return result.caregivers;
};

/**
 * Fetch detailed caregiver profile for discovery / profile view.
 */
export const fetchCaregiverDiscoveryProfile = async (
  caregiverId: string,
  targetPatientId?: string,
): Promise<CaregiverListing | null> => {
  try {
    const { data } = await apiClient.get(`/care/discovery/caregivers/${caregiverId}`, {
      params: targetPatientId ? { targetPatientId } : undefined,
    });
    const caregiverData = data.data?.caregiver;
    return caregiverData ? mapCaregiverRow(caregiverData) : null;
  } catch (error) {
    console.warn('[relationshipService] fetchCaregiverDiscoveryProfile failed:', error);
    return null;
  }
};

/**
 * Mark in-person meeting completed.
 */
export const completeMeeting = async (patientId: string): Promise<any> => {
  const { data } = await apiClient.post(`/relationships/patient/${patientId}/meet`);
  return data;
};

/**
 * Fetch specific caregiver-patient relationship (with status).
 */
export const fetchPatientRelationship = async (patientId: string): Promise<any> => {
  try {
    const { data } = await apiClient.get(`/relationships/patient/${patientId}/relationship`);
    return data.data?.relationship || null;
  } catch (error) {
    console.warn('[relationshipService] fetchPatientRelationship failed:', error);
    return null;
  }
};


