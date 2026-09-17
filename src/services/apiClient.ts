/**
 * SureStep — src/services/apiClient.ts
 * Single Axios instance with Firebase ID token auto-injection.
 * TDD Section 2.4 + Section 8.1.
 * NO screen or component imports axios directly — all calls go through this client.
 */
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

// Token resolver — set by AuthContext after Firebase signs in
let _getFirebaseToken: (() => Promise<string | null>) | null = null;

export const setFirebaseTokenResolver = (resolver: () => Promise<string | null>) => {
  _getFirebaseToken = resolver;
};

export const clearFirebaseTokenResolver = () => {
  _getFirebaseToken = null;
};

// ─── Axios instance ────────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  timeout: 45_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach Firebase ID token ─────────────────────────────
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (_getFirebaseToken && config.headers) {
    try {
      const token = await _getFirebaseToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[apiClient] Error resolving Firebase token:', error);
    }
  }
  return config;
});

export default apiClient;
