/**
 * SureStep — src/services/relationshipService.ts
 *
 * Coordinates caregiver-patient relationships, replacing legacy backend/caregiverLinks imports.
 * Communicates with backend Express API via apiClient.
 */
import apiClient from './apiClient';
import type { CaregiverListing } from '../screens/patient/CaregiverSearchView';

export type PatientRequest = {
  patient_phone: string;
  patient_name: string;
  confirmed_at: string;
};

export const mapCaregiverRow = (row: any): CaregiverListing => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  specialty: row.specializations?.[0] || 'Caregiver',
  patients: row.current_patient_count || row.max_patients || 0,
  rating: row.rating ? parseFloat(row.rating) : 5.0,
  fee: row.hourly_rate_inr ? `₹${parseFloat(row.hourly_rate_inr).toFixed(0)}/hr` : 'Contact for rates',
  emoji: '👩‍⚕️',
  bio: row.bio || '',
  availability: row.availability_types?.join(', ') || 'Contact for availability',
  location: row.city || '',
  profile_photo_url: row.photo_url,
  years_experience: row.years_of_experience,
  specializations: row.specializations,
  availability_types: row.availability_types,
  hourly_rate: row.hourly_rate_inr,
  daily_rate: row.daily_rate_inr,
  about_me: row.bio,
  languages_spoken: row.languages_spoken,
  service_radius_km: row.service_radius_km,
  patients_handled: row.current_patient_count || row.max_patients || 0,
  status: row.status || null,
});

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
 */
export const removeCaregiver = async (patientPhone: string): Promise<void> => {
  await apiClient.delete('/relationships/caregiver', {
    params: { patientPhone },
  });
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

/**
 * Search discoverable caregivers in the patient's city.
 */
export const searchCaregivers = async (query: string): Promise<CaregiverListing[]> => {
  const { data } = await apiClient.get('/relationships/caregivers/search', {
    params: { query },
  });
  
  const rawListings = data.data?.caregivers || [];
  
  // Map backend database format to frontend CaregiverListing format
  return rawListings.map((row: any) => mapCaregiverRow(row));
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


