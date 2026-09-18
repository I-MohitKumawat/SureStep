/**
 * SureStep — src/services/authService.ts
 * Auth-related API calls: user provisioning and device management.
 */
import apiClient from './apiClient';

export type ProvisionPayload = {
  name: string;
  role?: 'PATIENT' | 'CAREGIVER' | 'FAMILY' | 'DOCTOR';
  phone?: string;
  preferred_language?: string;
};

export const provisionUser = (payload: ProvisionPayload) =>
  apiClient.post<{
    success: boolean;
    data: {
      user: {
        id: string;
        firebase_uid: string;
        name: string;
        role: 'PATIENT' | 'CAREGIVER' | 'FAMILY' | 'DOCTOR';
        phone: string;
        preferred_language: string;
        is_active: boolean;
      };
    };
  }>('/auth/provision', payload);

export const logout = () => apiClient.post('/auth/logout');
