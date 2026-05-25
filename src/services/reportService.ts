/**
 * SureStep — src/services/reportService.ts
 * Family digest and caregiver summary reports.
 */
import apiClient from './apiClient';

export const getFamilyDigest = (patientId: string) =>
  apiClient.get(`/reports/family-digest/${patientId}`);

export const getCaregiverSummary = (patientId: string) =>
  apiClient.get(`/reports/caregiver-summary/${patientId}`);


export const getWellbeingReport = () =>
  apiClient.get('/reports/wellbeing/caregiver');
