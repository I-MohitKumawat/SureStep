// Re-export apiClient for dynamic import inside geofenceUtils.ts
// (avoids circular dependency when imported via require())
export { default } from '../services/apiClient';

