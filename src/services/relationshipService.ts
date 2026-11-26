/**
 * SureStep — src/services/relationshipService.ts
 *
 * Coordinates caregiver-patient relationships, replacing legacy backend/caregiverLinks imports.
 * Communicates with backend Express API via apiClient.
 */
import apiClient from './apiClient';
import type { CaregiverListing } from '../screens/patient/CaregiverSearchView';
export type { CaregiverListing };


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
  const isDiscoverable = Boolean(row.isDiscoverable ?? row.is_discoverable);
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
    phone: row.phone || null,
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
  phone?: string | null;
  relationship_type: string;
  status: string;
  confirmed_at: string;
}

export interface ConnectedPerson {
  id: string;
  name: string;
  photoUrl?: string | null;
  phone?: string | null;
  relationship: string;
  isCaregiver: boolean;
  rawMember?: any;
}

export function formatRelationship(type: string): string {
  if (!type) return 'Family';
  const upper = type.toUpperCase();
  if (upper === 'CAREGIVER') return 'Caregiver';
  if (upper === 'DAUGHTER') return 'Daughter';
  if (upper === 'SON') return 'Son';
  if (upper === 'SISTER') return 'Sister';
  if (upper === 'BROTHER') return 'Brother';
  if (upper === 'MOTHER') return 'Mother';
  if (upper === 'FATHER') return 'Father';
  if (upper === 'GRANDSON') return 'Grandson';
  if (upper === 'GRANDDAUGHTER') return 'Granddaughter';
  if (upper === 'SPOUSE' || upper === 'WIFE' || upper === 'HUSBAND') return 'Spouse';
  if (upper === 'GUARDIAN') return 'Guardian';
  if (upper === 'FAMILY_CLOSE' || upper === 'CLOSE FAMILY') return 'Family';
  if (upper === 'FAMILY_EXTENDED' || upper === 'CIRCLE MEMBER' || upper === 'OWNER') return 'Family';
  return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
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
 * Unified helper for My People screen: aggregates confirmed family members
 * and actively assigned caregivers into a deduplicated list of ConnectedPerson.
 */
export const fetchConnectedPeople = async (): Promise<ConnectedPerson[]> => {
  try {
    const [family, caregivers] = await Promise.all([
      fetchMyFamily(),
      fetchMyCaregivers(),
    ]);

    const people: ConnectedPerson[] = [];
    const seenIds = new Set<string>();

    for (const f of family) {
      if (!seenIds.has(f.id)) {
        seenIds.add(f.id);
        people.push({
          id: f.id,
          name: f.name,
          photoUrl: f.photo_url,
          phone: f.phone || null,
          relationship: formatRelationship(f.relationship_type),
          isCaregiver: false,
          rawMember: f,
        });
      }
    }

    for (const c of caregivers) {
      const s = (c.status || '').toUpperCase();
      if ((s === 'ACTIVE' || s === 'CONFIRMED' || s === 'NOTICE_PERIOD') && !seenIds.has(c.id)) {
        seenIds.add(c.id);
        people.push({
          id: c.id,
          name: c.name,
          photoUrl: c.photoUrl || c.profile_photo_url,
          phone: c.phone || null,
          relationship: 'Caregiver',
          isCaregiver: true,
          rawMember: c,
        });
      }
    }

    return people;
  } catch (error) {
    console.warn('[relationshipService] fetchConnectedPeople failed:', error);
    return [];
  }
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
