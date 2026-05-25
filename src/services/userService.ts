/**
 * SureStep — src/services/userService.ts
 * Current user profile read and update. Maps to /users routes.
 */
import apiClient from './apiClient';

export const getMe = () =>
  apiClient.get('/users/me');

export const updateMe = (body: unknown) =>
  apiClient.patch('/users/me', body);

export const getPatientProfile = (patientId: string) =>
  apiClient.get(`/profiles/patient/${patientId}`);

export const updatePatientProfile = (body: unknown) =>
  apiClient.put('/profiles/patient', body);

export const getCaregiverProfile = (caregiverId: string) =>
  apiClient.get(`/profiles/caregiver/${caregiverId}`);

export const updateCaregiverProfile = (body: unknown) =>
  apiClient.put('/profiles/caregiver', body);


export const uploadPhoto = (formData: FormData) =>
  apiClient.post('/media/upload/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
