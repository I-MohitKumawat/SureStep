/**
 * SureStep — src/services/locationService.ts
 * Patient location pings and trail. Maps to backend /location routes.
 */
import apiClient from './apiClient';

export const postPing = (body: { latitude: number; longitude: number; accuracy?: number }) =>
  apiClient.post('/location/ping', body);

export const getCurrentLocation = (patientId: string) =>
  apiClient.get(`/location/patient/${patientId}/current`);

export const getTrail = (patientId: string, hours = 24) =>
  apiClient.get(`/location/patient/${patientId}/trail`, { params: { hours } });

export const getRouteHistory = (patientId: string, date: string) =>
  apiClient.get(`/location/patient/${patientId}/history`, { params: { date } });

