/**
 * SureStep — src/services/medicationService.ts
 * Patient medication management and logging. Maps to /medications routes.
 */
import apiClient from './apiClient';

export const getMedications = (patientId: string) =>
  apiClient.get(`/medications/patient/${patientId}`);

export const addMedication = (patientId: string, body: unknown) =>
  apiClient.post(`/medications/patient/${patientId}`, body);

export const updateMedication = (medicationId: string, body: unknown) =>
  apiClient.patch(`/medications/${medicationId}`, body);

export const deleteMedication = (medicationId: string) =>
  apiClient.delete(`/medications/${medicationId}`);


export const logAdministration = (body: { medication_id: string; status: string; notes?: string }) =>
  apiClient.post('/medications/log', body);
