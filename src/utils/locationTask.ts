/**
 * IMPORTANT: Background tasks only work in a bare / dev-client build.
 *            They are silently ignored in Expo Go.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Usage:
 *   import './src/utils/locationTask';   // ← add to index.js
 *   Then call startBackgroundTracking() once the user grants permission.
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  checkBreach,
  fetchPatientGeofences,
  logBreachAlert,
  writeLocationPing,
  type Coords,
  type GeofenceZone,
} from './geofenceUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

export const LOCATION_TASK_NAME = 'surestep-bg-location';

/** AsyncStorage key for the current patient's phone/ID — written during login. */
const PATIENT_ID_KEY = 'surestep_bg_patient_id';

/** AsyncStorage key to cache zones locally so the bg task doesn't hit the network each tick. */
const ZONES_CACHE_KEY = 'surestep_bg_zones_cache';

/** AsyncStorage key to track whether we are currently in a breach (deduplicate alerts). */
const BREACH_STATE_KEY = 'surestep_bg_breach_active';

/** Write interval floor — ignore pings faster than this to avoid DB spam. */
const MIN_PING_INTERVAL_MS = 25_000; // 25 seconds
const LAST_PING_KEY = 'surestep_bg_last_ping_ts';

// ─── Task Registration ────────────────────────────────────────────────────────

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.warn('[BG Location] task error:', error.message);
    return;
  }

  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations?.length) return;

  const loc = locations[locations.length - 1]!;
  const coords: Coords = {
    latitude:  loc.coords.latitude,
    longitude: loc.coords.longitude,
  };

  try {
    // ── Rate-limit pings ────────────────────────────────────────────────────
    const lastPingStr = await AsyncStorage.getItem(LAST_PING_KEY);
    const lastPingTs  = lastPingStr ? parseInt(lastPingStr, 10) : 0;
    const now = Date.now();
    if (now - lastPingTs < MIN_PING_INTERVAL_MS) return;
    await AsyncStorage.setItem(LAST_PING_KEY, String(now));

    // ── Resolve patient ID ──────────────────────────────────────────────────
    const patientId = await AsyncStorage.getItem(PATIENT_ID_KEY);
    if (!patientId) return;

    // ── Write ping to Supabase ──────────────────────────────────────────────
    await writeLocationPing({
      patientId,
      coords,
      accuracyM: loc.coords.accuracy ?? undefined,
      source: 'background',
    });

    // ── Load zones (from cache; refresh every 5 min) ────────────────────────
    let zones: GeofenceZone[] = [];
    const cacheStr = await AsyncStorage.getItem(ZONES_CACHE_KEY);
    if (cacheStr) {
      const cache = JSON.parse(cacheStr) as { ts: number; zones: GeofenceZone[] };
      if (now - cache.ts < 5 * 60 * 1000) {
        zones = cache.zones;
      }
    }
    if (zones.length === 0) {
      zones = await fetchPatientGeofences(patientId);
      await AsyncStorage.setItem(ZONES_CACHE_KEY, JSON.stringify({ ts: now, zones }));
    }

    // ── Check breach ────────────────────────────────────────────────────────
    const breachStatus = checkBreach(coords, zones);
    const wasInBreach  = (await AsyncStorage.getItem(BREACH_STATE_KEY)) === 'true';

    if (breachStatus.status === 'breach' && !wasInBreach) {
      // New breach — log alert
      await AsyncStorage.setItem(BREACH_STATE_KEY, 'true');
      await logBreachAlert({
        patientId,
        geofenceId: breachStatus.zone?.id ?? null,
        breachType: 'exit',
        coords,
        distanceM:  breachStatus.distanceM,
      });
      // NOTE: Push notification would be triggered here via Expo Push API or
      //       Supabase Edge Function listening on geofence_alerts realtime.
    } else if (breachStatus.status === 'safe' && wasInBreach) {
      // Patient returned inside — log re-entry
      await AsyncStorage.setItem(BREACH_STATE_KEY, 'false');
      await logBreachAlert({
        patientId,
        geofenceId: breachStatus.zone.id,
        breachType: 'enter',
        coords,
        distanceM:  0,
      });
    }
  } catch (err) {
    console.warn('[BG Location] processing error:', err);
  }
});

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Call this once permissions are granted (e.g. from geofenceContext).
 * Safe to call multiple times — checks if already started.
 */
export async function startBackgroundTracking(patientId: string): Promise<boolean> {
  try {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') return false;

    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    if (bg !== 'granted') {
      console.warn('[BG Location] background permission denied — foreground only');
    }

    await AsyncStorage.setItem(PATIENT_ID_KEY, patientId);

    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
    if (isRunning) return true;

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy:           Location.Accuracy.Balanced,
      timeInterval:       25_000,   // fire every 25 s at minimum
      distanceInterval:   15,       // or every 15 m of movement
      deferredUpdatesInterval:   25_000,
      deferredUpdatesDistance:   15,
      showsBackgroundLocationIndicator: true,  // iOS blue bar
      foregroundService: {
        notificationTitle: 'SureStep',
        notificationBody:  'Monitoring patient location',
        notificationColor: '#0e7a67',
      },
      pausesUpdatesAutomatically: false,
    });

    return true;
  } catch (err) {
    console.warn('[BG Location] startBackgroundTracking error:', err);
    return false;
  }
}

/** Stop background tracking (call when caregiver logs out or disables tracking). */
export async function stopBackgroundTracking(): Promise<void> {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
    await AsyncStorage.removeItem(PATIENT_ID_KEY);
    await AsyncStorage.removeItem(ZONES_CACHE_KEY);
    await AsyncStorage.removeItem(BREACH_STATE_KEY);
    await AsyncStorage.removeItem(LAST_PING_KEY);
  } catch (err) {
    console.warn('[BG Location] stopBackgroundTracking error:', err);
  }
}

/** Pre-seed the zones cache so the bg task has data immediately. */
export async function primeZonesCache(patientId: string): Promise<void> {
  const zones = await fetchPatientGeofences(patientId);
  await AsyncStorage.setItem(ZONES_CACHE_KEY, JSON.stringify({ ts: Date.now(), zones }));
}
