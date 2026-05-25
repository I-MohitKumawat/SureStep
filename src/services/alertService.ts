/**
 * SureStep — src/services/alertService.ts
 * Alert feed, acknowledgement, and SOS. Maps to backend /alerts routes.
 */
import apiClient from './apiClient';

export const getAlerts = (patientId: string, params?: Record<string, unknown>) =>
  apiClient.get(`/alerts/patient/${patientId}`, { params });

export const getCaregiversFeed = () =>
  apiClient.get('/alerts/caregiver/feed');

export const acknowledgeAlert = (alertId: string) =>
  apiClient.post(`/alerts/${alertId}/acknowledge`);

export const triggerSos = (body: { patient_id: string; lat?: number; lng?: number }) =>
  apiClient.post('/alerts/sos', body);

