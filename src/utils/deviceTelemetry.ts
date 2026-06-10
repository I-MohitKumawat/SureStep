import * as Battery from 'expo-battery';
import NetInfo from '@react-native-community/netinfo';

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
