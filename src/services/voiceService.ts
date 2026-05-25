/**
 * SureStep — src/services/voiceService.ts
 * Voice sample recording, cloning, and message retrieval.
 */
import apiClient from './apiClient';

export const uploadSample = (formData: FormData) =>
  apiClient.post('/voice/samples', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getSamples = () =>
  apiClient.get('/voice/samples');

export const deleteSample = (sampleId: string) =>
  apiClient.delete(`/voice/samples/${sampleId}`);

export const triggerVoiceMessage = (patientId: string, triggerType: string) =>
  apiClient.post('/voice/trigger', { patient_id: patientId, trigger_type: triggerType });

export const getVoiceMessages = (patientId: string) =>
  apiClient.get(`/voice/messages/${patientId}`);

export const markVoiceMessageHeard = (messageId: string) =>
  apiClient.patch(`/voice/messages/${messageId}/heard`);

