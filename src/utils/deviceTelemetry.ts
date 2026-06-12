import * as Battery from 'expo-battery';
import NetInfo from '@react-native-community/netinfo';
import { NativeModules, Platform, Linking } from 'react-native';

const { DiagnosticsModule } = NativeModules;

/**
 * Check if the app can schedule exact alarms on Android.
 */
export async function checkExactAlarmPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    return await DiagnosticsModule.canScheduleExactAlarms();
  } catch (err) {
    console.warn('[Telemetry] canScheduleExactAlarms failed:', err);
    return true; // Safe fallback
  }
}

/**
 * Check if battery optimization is enabled (meaning the app is optimized/throttled).
 */
export async function checkBatteryOptimizationEnabled(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return await Battery.isBatteryOptimizationEnabledAsync();
  } catch (err) {
    console.warn('[Telemetry] isBatteryOptimizationEnabledAsync failed:', err);
    return false;
  }
}

/**
 * Direct the user to the battery optimization settings list.
 */
export async function openBatteryOptimizationSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
  } catch (err) {
    console.warn('[Telemetry] Failed to open battery settings intent:', err);
    Linking.openSettings();
  }
}

/**
 * Direct the user to the exact alarm / reminders permission settings.
 */
export async function openExactAlarmSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Linking.sendIntent('android.settings.REQUEST_SCHEDULE_EXACT_ALARM');
  } catch (err) {
    console.warn('[Telemetry] Failed to open exact alarm settings intent:', err);
    Linking.openSettings();
  }
}

/**
 * Fetch patient device's current battery percentage.
 * Returns a rounded integer between 0 and 100, or undefined if unavailable/error.
 */
export async function getBatteryPercentage(): Promise<number | undefined> {
  try {
    const level = await Battery.getBatteryLevelAsync();
    if (level < 0) return undefined;
    return Math.round(level * 100);
  } catch (e) {
    console.warn('[Telemetry] Failed to get battery level:', e);
    return undefined;
  }
}

/**
 * Fetch patient device's network connection status mapped to a qualitative label.
 * Returns: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Offline'
 */
export async function getNetworkStatus(): Promise<string> {
  try {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return 'Offline';
    if (state.type === 'wifi') return 'Excellent';
    if (state.type === 'cellular') {
      const gen = state.details?.cellularGeneration;
      if (gen === '5g') return 'Excellent';
      if (gen === '4g') return 'Good';
      if (gen === '3g') return 'Fair';
      if (gen === '2g') return 'Poor';
    }
    return 'Good'; // default cellular/other connected state fallback
  } catch (e) {
    console.warn('[Telemetry] Failed to get network status:', e);
    return 'Offline';
  }
}

