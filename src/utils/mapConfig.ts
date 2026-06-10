import { Platform } from 'react-native';

/**
 * Checks if the native Google Maps view should be disabled on the client side.
 * This is crucial on Android to prevent immediate application crashes when
 * the Google Maps SDK is initialized without a valid API key configured.
 */
export function isNativeMapDisabled(): boolean {
  // Explicit override to bypass native MapView (useful for testing and development)
  if (process.env.EXPO_PUBLIC_DISABLE_NATIVE_MAPS === 'true') {
    return true;
  }

  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

  // On Android, if no API key is specified, or it contains placeholder text, disable native maps
  if (
    Platform.OS === 'android' &&
    (!key ||
      key === '' ||
      key.startsWith('YOUR_') ||
      key.includes('A1...') ||
      key.startsWith('AIzaSyA1'))
  ) {
    return true;
  }

  return false;
}
