/**
 * SureStep — Background Location Task (Adaptive Tracking)
 *
 * Implements the Adaptive Power & Frequency Algorithm from TDD §1.1:
 *
 * | Speed Category | Speed (m/s) | Interval |
 * |---|---|---|
 * | Stationary     | < 0.5       | 5 min    |
 * | Walking        | 0.5–3.0     | 30 s     |
 * | Jogging        | 3.0–7.0     | 15 s     |
 * | Vehicle        | >= 7.0      | 10 s     |
 *
 * Emergency breach overrides:
 *   Moving   → 10 s
 *   Stationary → 30 s
 *
 * GPS Confidence Filter (TDD §1.2):
 *   High:   accuracy < 15m  → triggers breach alerts ✓
 *   Medium: accuracy < 50m  → triggers breach alerts ✓
 *   Low:    accuracy >= 50m → recorded but NO breach alert
 *
 * IMPORTANT: Background tasks only work in bare / dev-client builds.
 *            They are silently ignored in Expo Go.
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  checkBreach,
  fetchPatientGeofences,
  writeLocationPing,
  type Coords,
  type GeofenceZone,
} from './geofenceUtils';
import { getBatteryPercentage, getNetworkStatus } from './deviceTelemetry';

// ─── Constants ────────────────────────────────────────────────────────────────

export const LOCATION_TASK_NAME = 'surestep-bg-location';

const PATIENT_ID_KEY      = 'surestep_bg_patient_id';
const ZONES_CACHE_KEY     = 'surestep_bg_zones_cache';
const BREACH_STATE_KEY    = 'surestep_bg_breach_active';
const LAST_PING_KEY       = 'surestep_bg_last_ping_ts';
const EMERGENCY_STATE_KEY = 'surestep_bg_emergency_active';

const ZONES_CACHE_TTL_MS  = 5 * 60 * 1000;  // Refresh zones every 5 min

// ─── Adaptive interval (TDD §1.1) ────────────────────────────────────────────

/**
 * Returns the minimum ping interval in milliseconds based on GPS speed (m/s).
 * Emergency breach overrides use tighter intervals.
 */
function adaptiveIntervalMs(speedMs: number, inEmergency: boolean): number {
  if (inEmergency) {
    return speedMs >= 0.5 ? 10_000 : 30_000;  // Emergency: 10s moving / 30s stationary
  }
  if (speedMs < 0.5)  return 5 * 60_000;   // Stationary: 5 min
  if (speedMs < 3.0)  return 30_000;        // Walking:    30 s
  if (speedMs < 7.0)  return 15_000;        // Jogging:    15 s
  return 10_000;                             // Vehicle:    10 s
}

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
  const accuracyM  = loc.coords.accuracy  ?? undefined;
  const speedMs    = loc.coords.speed     ?? 0;  // m/s from expo-location
  const heading    = loc.coords.heading   ?? undefined;
  const altitudeM  = loc.coords.altitude  ?? undefined;

  try {
    const inEmergency  = (await AsyncStorage.getItem(EMERGENCY_STATE_KEY)) === 'true';
    const minIntervalMs = adaptiveIntervalMs(speedMs, inEmergency);

    // ── Rate-limit pings to adaptive interval ──────────────────────────────
    const lastPingStr = await AsyncStorage.getItem(LAST_PING_KEY);
    const lastPingTs  = lastPingStr ? parseInt(lastPingStr, 10) : 0;
    const now         = Date.now();
    if (now - lastPingTs < minIntervalMs) return;
    await AsyncStorage.setItem(LAST_PING_KEY, String(now));

    // ── Resolve patient ID ──────────────────────────────────────────────────
    const patientId = await AsyncStorage.getItem(PATIENT_ID_KEY);
    if (!patientId) return;

    // Fetch telemetry data (safe inside try-catch block of the task)
    const [batteryPct, networkStatus] = await Promise.all([
      getBatteryPercentage(),
      getNetworkStatus(),
    ]);

    // ── Write ping to backend API (with offline queuing fallback) ──────────
    await writeLocationPing({
      patientId,
      coords,
      accuracyM,
      speedKmh: speedMs * 3.6,
      heading,
      batteryPct,
      networkStatus,
      source: 'background',
    });

    // ── Load zones (from cache; refresh every 5 min) ────────────────────────
    let zones: GeofenceZone[] = [];
    const cacheStr = await AsyncStorage.getItem(ZONES_CACHE_KEY);
    if (cacheStr) {
      const cache = JSON.parse(cacheStr) as { ts: number; zones: GeofenceZone[] };
      if (now - cache.ts < ZONES_CACHE_TTL_MS) {
        zones = cache.zones;
      }
    }
    if (zones.length === 0) {
      zones = await fetchPatientGeofences(patientId);
      await AsyncStorage.setItem(ZONES_CACHE_KEY, JSON.stringify({ ts: now, zones }));
    }

    // ── GPS Confidence Filter (TDD §1.2) ────────────────────────────────────
    // Low Confidence (>= 50m) pings are still sent to backend but do NOT
    // update local breach state, so we don't trigger false local notifications.
    const isLowConfidence = accuracyM !== undefined && accuracyM >= 50;

    if (!isLowConfidence) {
      const breachStatus = checkBreach(coords, zones);
      const wasInBreach  = (await AsyncStorage.getItem(BREACH_STATE_KEY)) === 'true';

      if (breachStatus.status === 'breach' && !wasInBreach) {
        await AsyncStorage.setItem(BREACH_STATE_KEY, 'true');
        void updateBackgroundTrackingMode(patientId, true);
      } else if (breachStatus.status === 'safe' && wasInBreach) {
        await AsyncStorage.setItem(BREACH_STATE_KEY, 'false');
        void updateBackgroundTrackingMode(patientId, false);
      }
    }
  } catch (err) {
    console.warn('[BG Location] processing error:', err);
  }
});

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Updates the background tracking parameters based on emergency status.
 * Re-registers the task with tighter intervals and higher accuracy if inEmergency is true.
 */
export async function updateBackgroundTrackingMode(patientId: string, inEmergency: boolean): Promise<boolean> {
  try {
    await AsyncStorage.setItem(PATIENT_ID_KEY, patientId);
    await AsyncStorage.setItem(EMERGENCY_STATE_KEY, inEmergency ? 'true' : 'false');

    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }

    if (inEmergency) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy:          Location.Accuracy.BestForNavigation,
        timeInterval:      10000, // TDD §1.1: 10s moving
        distanceInterval:  2,     // report on any movement of 2 meters
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'SureStep [Emergency Mode]',
          notificationBody:  'High frequency patient tracking active.',
          notificationColor: '#EF4444',
        },
        pausesUpdatesAutomatically: false,
      });
      console.log('[BG Location] Switched to high frequency emergency tracking');
    } else {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy:          Location.Accuracy.Balanced,
        timeInterval:      30000, // standard 30s walking interval
        distanceInterval:  10,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'SureStep',
          notificationBody:  'Monitoring patient location',
          notificationColor: '#2563EB',
        },
        pausesUpdatesAutomatically: false,
      });
      console.log('[BG Location] Switched to standard background tracking');
    }
    return true;
  } catch (err) {
    console.warn('[BG Location] Failed to update background tracking mode:', err);
    return false;
  }
}

/**
 * Start background location tracking for a patient.
 * Safe to call multiple times — checks if already started.
 */
export async function startBackgroundTracking(patientId: string): Promise<boolean> {
  try {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') return false;

    await Location.requestBackgroundPermissionsAsync().catch(() => {
      console.warn('[BG Location] background permission denied — foreground only');
    });

    const inEmergency = (await AsyncStorage.getItem(EMERGENCY_STATE_KEY)) === 'true';
    return await updateBackgroundTrackingMode(patientId, inEmergency);
  } catch (err) {
    console.warn('[BG Location] startBackgroundTracking error:', err);
    return false;
  }
}

/** Stop background tracking. */
export async function stopBackgroundTracking(): Promise<void> {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
      .catch(() => false);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
    await AsyncStorage.multiRemove([
      PATIENT_ID_KEY,
      ZONES_CACHE_KEY,
      BREACH_STATE_KEY,
      LAST_PING_KEY,
      EMERGENCY_STATE_KEY,
    ]);
  } catch (err) {
    console.warn('[BG Location] stopBackgroundTracking error:', err);
  }
}

/** Pre-seed the zones cache so the bg task has data immediately on start. */
export async function primeZonesCache(patientId: string): Promise<void> {
  const zones = await fetchPatientGeofences(patientId);
  await AsyncStorage.setItem(
    ZONES_CACHE_KEY,
    JSON.stringify({ ts: Date.now(), zones }),
  );
}
