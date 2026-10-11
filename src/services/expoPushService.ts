/**
 * SureStep — src/services/expoPushService.ts
 *
 * Registers the device's Expo Push Token with the SureStep backend.
 * Uses Expo Push Service for remote push notifications across iOS and Android.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { registerDeviceToken } from './geofenceService';

/**
 * Checks permission and registers the Expo push token with the backend.
 * Safe to call multiple times — backend performs an upsert into device_registry.
 */
export async function bootstrapExpoPushToken(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[ExpoPush] Notification permissions not granted');
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      'f32fc97d-48cd-404a-ba88-8f508db31b6e';

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const token = tokenData.data;
    if (token) {
      const deviceType = Platform.OS === 'ios' ? 'PHONE_IOS' : 'PHONE_ANDROID';
      await registerDeviceToken(token, deviceType);
      console.log('[ExpoPush] Expo push token registered successfully');
    }
    return token;
  } catch (err) {
    // Non-fatal — app functions without push notifications
    console.warn('[ExpoPush] Failed to register Expo push token:', err);
    return null;
  }
}

