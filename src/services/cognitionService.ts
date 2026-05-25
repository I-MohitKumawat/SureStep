/**
 * SureStep — src/services/cognitionService.ts
 * Cognitive game sessions, mood check-ins, and assessments.
 */
import apiClient from './apiClient';

export const postGameSession = (body: unknown) =>
  apiClient.post('/cognition/sessions', body);

export const getSessions = (patientId: string) =>
  apiClient.get(`/cognition/sessions/${patientId}`);

export const getAssessments = (patientId: string) =>
  apiClient.get(`/cognition/assessments/${patientId}`);


export const postMoodCheckin = (body: { patient_id: string; context: string; mood_score: number; notes?: string }) =>
  apiClient.post('/cognition/mood-checkin', body);
