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

/**
 * Fetch the currently confirmed caregiver profile for a patient.
 */
export const fetchConfirmedCaregiver = async (patientPhone: string): Promise<CaregiverListing | null> => {
  try {
    const { data } = await apiClient.get(`/relationships/caregiver/confirmed`, {
      params: { patientPhone },
    });
    return data.data || null;
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
