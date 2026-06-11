/**
 * SureStep — src/services/backgroundLocationService.ts
 *
 * Patient background location using expo-task-manager + expo-location.
 * Posts pings to the backend while the app is backgrounded.
 *
 * Android Limitation:
 *   When the app is force-killed by the user (swipe up in recents), expo-task-manager
 *   background tasks are terminated. The FCM silent data message (LOCATION_REQUEST) is
 *   our fallback in that case — the backend sends it when caregivers request a refresh.
 *
 * Usage (called from AuthContext after PATIENT login):
 *   await requestBackgroundLocationPermission();
 *   await startBackgroundLocationUpdates();
 */
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Battery from 'expo-battery';
import locationService from './locationService';

export const BACKGROUND_LOCATION_TASK = 'SURESTEP_BACKGROUND_LOCATION';

// ─── Task Definition (must be at module top level, outside components) ────────

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('[BackgroundLocation] Task error:', error.message);
    return;
  }

  const locations: Location.LocationObject[] = data?.locations ?? [];
  for (const loc of locations) {
    try {
      let batteryPct: number | undefined;
      const level = await Battery.getBatteryLevelAsync().catch(() => -1);
      if (level >= 0) batteryPct = Math.round(level * 100);

      await locationService.postPing({
        lat:        loc.coords.latitude,
        lng:        loc.coords.longitude,
        accuracy_m: loc.coords.accuracy ?? undefined,
        speed_kmh:  loc.coords.speed != null && loc.coords.speed >= 0
          ? loc.coords.speed * 3.6
          : undefined,
        heading:    loc.coords.heading ?? undefined,
        battery_pct: batteryPct,
        recorded_at: new Date(loc.timestamp).toISOString(),
        source:     'PHONE',
      });
    } catch (err) {
      console.warn('[BackgroundLocation] Failed to post ping:', err);
    }
  }
});

// ─── Permission ────────────────────────────────────────────────────────────────

/**
 * Request both foreground and background location permissions.
 * Must be called before startBackgroundLocationUpdates().
 * Returns true if background permission is granted.
 */
export async function requestBackgroundLocationPermission(): Promise<boolean> {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') {
    console.warn('[BackgroundLocation] Foreground permission denied');
    return false;
  }

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') {
    console.warn('[BackgroundLocation] Background permission denied — using foreground-only');
    return false;
  }

  return true;
}

// ─── Start / Stop ──────────────────────────────────────────────────────────────

/**
 * Start background location updates for the patient.
 * Safe to call multiple times — checks if already running.
 */
export async function startBackgroundLocationUpdates(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
      console.log('[BackgroundLocation] Task already registered');
      return;
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy:           Location.Accuracy.Balanced,
      timeInterval:       30_000,   // 30 seconds
      distanceInterval:   15,       // 15 metres
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true, // iOS: shows blue bar
      foregroundService: {                    // Android: keeps task alive
        notificationTitle: 'SureStep is tracking your location',
        notificationBody:  'Your care team can see your location while you use SureStep.',
        notificationColor: '#0E7A67',
      },
    });

    console.log('[BackgroundLocation] Started');
  } catch (err) {
    console.warn('[BackgroundLocation] Failed to start:', err);
  }
}

/**
 * Stop background location updates.
 * Called on logout or when patient explicitly disables tracking.
 */
export async function stopBackgroundLocationUpdates(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('[BackgroundLocation] Stopped');
    }
  } catch (err) {
    console.warn('[BackgroundLocation] Failed to stop:', err);
  }
}
