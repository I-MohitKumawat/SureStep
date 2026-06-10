/**
 * SureStep — src/services/fcmTokenService.ts
 *
 * Registers the device's FCM push token with the SureStep backend.
 * Called once after authentication succeeds.
 *
 * Flow:
 *  1. Request notification permission (iOS requires explicit request)
 *  2. Get FCM token from Firebase Messaging
 *  3. POST token to /alerts/devices/register via registerDeviceToken
 */
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { registerDeviceToken } from './geofenceService';

/**
 * Request permission and register the FCM token with the backend.
 * Safe to call multiple times — backend does an upsert.
 */
export async function bootstrapFcmToken(): Promise<void> {
  try {
    // iOS requires explicit permission request
    const authStatus = await messaging().requestPermission();
    const authorized =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!authorized) {
      console.log('[FCM] Notification permission denied — skipping token registration');
      return;
    }

    const token = await messaging().getToken();
    if (!token) {
      console.warn('[FCM] No FCM token available');
      return;
    }

    const deviceType = Platform.OS === 'ios' ? 'PHONE_IOS' : 'PHONE_ANDROID';
    await registerDeviceToken(token, deviceType);
    console.log('[FCM] Token registered successfully');
  } catch (err) {
    // Non-fatal — app works without push notifications
    console.warn('[FCM] Failed to register device token:', err);
  }
}
