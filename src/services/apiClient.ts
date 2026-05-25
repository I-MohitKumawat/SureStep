/**
 * SureStep — src/services/apiClient.ts
 * Single Axios instance with JWT auto-injection and 401 refresh rotation.
 * TDD Section 2.4 + Section 8.1.
 * NO screen or component imports axios directly — all calls go through this client.
 */
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

let _getClerkToken: (() => Promise<string | null>) | null = null;

export const setClerkTokenResolver = (resolver: () => Promise<string | null>) => {
  _getClerkToken = resolver;
};

// Deprecated: Kept temporarily for compilation compatibility until AuthContext is fully migrated.
export const tokenStore = {
  getAccessToken:    () => null as string | null,
  getRefreshToken:   () => null as string | null,
  setAccessToken:    (t: string | null) => {},
  setRefreshToken:   (t: string | null) => {},
  clearAll:          () => {},
};

// ─── Axios instance ────────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach access token ─────────────────────────────────
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (_getClerkToken && config.headers) {
    try {
      const token = await _getClerkToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[apiClient] Error resolving Clerk token:', error);
    }
  }
  return config;
});

export default apiClient;
