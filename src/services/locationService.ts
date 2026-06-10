/**
 * SureStep — src/services/locationService.ts
 *
 * Location ping and trail API calls to the Express backend.
 */
import apiClient from './apiClient';

const locationService = {
  postPing: (ping: {
    lat: number;
    lng: number;
    accuracy_m?: number;
    speed_kmh?: number;
    heading?: number;
    battery_pct?: number;
    network_status?: string;
    source?: string;
    recorded_at: string;
  }) => apiClient.post('/location/ping', ping),

  getCurrentLocation: (patientId: string) =>
    apiClient.get(`/location/patient/${patientId}/current`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }),

  getTrail: (patientId: string, limit = 20, cursor?: string) =>
    apiClient.get(`/location/patient/${patientId}/trail`, {
      params: { limit, cursor },
    }),

  batchSync: (pings: any[]) =>
    apiClient.post('/location/pings/sync', pings),
};

export default locationService;
