/**
 * SureStep — src/services/userService.ts
 * Current user profile read and update. Maps to /users routes.
 */
import apiClient from './apiClient';
import type { UserMeData, PatientOnboardingPayload, CaregiverOnboardingPayload } from '../types/api.types';

export const getMe = () =>
  apiClient.get<{ success: boolean; data: UserMeData }>('/users/me');

export const updateMe = (body: unknown) =>
  apiClient.patch('/users/me', body);

export const getPatientProfile = (patientId: string) =>
  apiClient.get(`/profiles/patient/${patientId}`);

export const updatePatientProfile = (body: PatientOnboardingPayload | unknown) =>
  apiClient.put('/profiles/patient', body);

export const getCaregiverProfile = (caregiverId: string) =>
  apiClient.get(`/profiles/caregiver/${caregiverId}`);

export const updateCaregiverProfile = (body: CaregiverOnboardingPayload | unknown) =>
  apiClient.put('/profiles/caregiver', body);


export const uploadPhoto = (formData: FormData) =>
  apiClient.post('/media/upload/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const uploadProfilePhoto = async (localUri: string): Promise<string> => {
  if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
    return localUri;
  }
  const filename = localUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image/jpeg`;

  const formData = new FormData();
  formData.append('photo', {
    uri: localUri,
    name: filename,
    type,
  } as any);

  const response = await uploadPhoto(formData);
  const data = response.data?.data || response.data;
  const url = data?.photoUrl || data?.url;
  if (!url) {
    throw new Error('Upload succeeded but returned no image URL');
  }
  return url;
};
