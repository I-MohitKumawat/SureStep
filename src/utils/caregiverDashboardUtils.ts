/**
 * SureStep — src/utils/caregiverDashboardUtils.ts
 * Formatting and safety utility helpers for the Caregiver Dashboard.
 */

import { ROLE_LABELS } from '../constants/caregiverDashboard';
import type { SafetyAlert } from '../services/safetyService';
import type { IconName, Patient } from '../types/caregiverDashboard.types';
import { relativeTime } from './dateUtils';

export const humanize = (value: string): string =>
  value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const formatRole = (value?: string): string =>
  value ? ROLE_LABELS[value] || humanize(value) : 'Professional Caregiver';

export const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';

export const normalizeCallablePhone = (phone?: string | null): string | null => {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed || /[a-zA-Z]/.test(trimmed)) return null;
  const sanitized = trimmed.replace(/[\s\-().]/g, '');
  return /^\+?\d{5,15}$/.test(sanitized) ? sanitized : null;
};

export const hasValidPhoneNumber = (phone?: string | null): boolean =>
  normalizeCallablePhone(phone) !== null;

export const getAge = (dob?: string | null): number | null => {
  if (!dob) return null;

  const birthDate = new Date(dob.slice(0, 10) + 'T12:00:00');

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const month = today.getMonth() - birthDate.getMonth();

  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
};

const FUTURE_SKEW_TOLERANCE_MS = 60_000;

export const formatTime = (value?: string | null): string => {
  if (!value) return 'Unavailable';

  const ms = new Date(value).getTime();
  if (Number.isNaN(ms) || ms - Date.now() > FUTURE_SKEW_TOLERANCE_MS) {
    return 'Unavailable';
  }

  return relativeTime(value);
};

export type LocationFreshness = 'CURRENT' | 'RECENT' | 'STALE' | 'UNAVAILABLE';

/**
 * Location freshness uses the architecture engineering defaults from
 * TARGET_ARCHITECTURE.md §6.1 (<=5m and <=50m CURRENT, <=20m RECENT,
 * >20m STALE, plus 60s clock-skew tolerance), rather than clinical thresholds.
 * Missing, invalid, or future-dated (>60s) timestamps return UNAVAILABLE.
 */
export const resolveLocationFreshness = (
  patient: Pick<Patient, 'lastPingAt' | 'accuracyM' | 'locationState' | 'locationFreshness'>
): LocationFreshness => {
  if (!patient.lastPingAt || patient.locationState === 'NO_SIGNAL') {
    return 'UNAVAILABLE';
  }
  const nowMs = Date.now();
  const pingMs = new Date(patient.lastPingAt).getTime();
  if (Number.isNaN(pingMs) || pingMs - nowMs > FUTURE_SKEW_TOLERANCE_MS) {
    return 'UNAVAILABLE';
  }
  const ageMin = Math.max(0, (nowMs - pingMs) / 60000);
  const isLowConfidence = patient.accuracyM != null && patient.accuracyM > 50;
  if (ageMin <= 5 && !isLowConfidence) {
    return 'CURRENT';
  }
  if (ageMin <= 20) {
    return 'RECENT';
  }
  return 'STALE';
};

export const getLocationLabel = (patient: Patient): string => {
  const freshness = resolveLocationFreshness(patient);
  if (freshness === 'UNAVAILABLE') {
    return 'Location unavailable';
  }
  if (freshness === 'RECENT' || freshness === 'STALE') {
    return `Last known location · ${formatTime(patient.lastPingAt)}`;
  }

  if (patient.hasActiveSafeZone === false) {
    return patient.locationState === 'MOVING'
      ? 'Moving · No Safe Zone configured'
      : 'Location current · No Safe Zone configured';
  }

  if (patient.isBoundaryUncertain) {
    return 'Location current · Boundary uncertain';
  }

  if (patient.currentZoneName) {
    return `Inside ${patient.currentZoneName}`;
  }

  if (patient.locationState === 'MOVING') {
    return 'Moving · Outside Safe Zones';
  }

  return 'Outside configured Safe Zones';
};

export const getBatteryIcon = (value: number | null): IconName => {
  if (value === null || value < 20) {
    return 'battery-dead-outline';
  }

  if (value < 60) {
    return 'battery-half-outline';
  }

  return 'battery-full-outline';
};

export const getBatteryColor = (value: number | null): string => {
  if (value === null) return '#9CA3AF';
  if (value < 20) return '#DC2626';
  if (value < 40) return '#B45309';

  return '#0E7A67';
};

export const isUnresolvedAlert = (alert: SafetyAlert): boolean =>
  alert.status !== 'RESOLVED';

export const hasUrgentSafetyState = (
  patient: Patient,
  activeAlerts: SafetyAlert[] = []
): boolean => {
  const patientAlerts = activeAlerts.filter(
    (alert) => alert.patient_id === patient.id && isUnresolvedAlert(alert)
  );
  return (
    patient.sosActive ||
    patient.safetyState === 'CRITICAL' ||
    patient.safetyState === 'BREACH' ||
    patientAlerts.some(
      (alert) => alert.alert_type === 'SOS_MANUAL' || alert.alert_type === 'ZONE_BREACH'
    )
  );
};

export const getAlertTitle = (
  patient: Patient,
  activeAlerts: SafetyAlert[]
): string | null => {
  const unresolvedForPatient = activeAlerts.filter(
    (alert) => alert.patient_id === patient.id && isUnresolvedAlert(alert)
  );
  const sosAlert = unresolvedForPatient.find(
    (alert) => alert.alert_type === 'SOS_MANUAL'
  );

  if (patient.sosActive || sosAlert) {
    return 'SOS emergency — help requested';
  }

  const breachAlert = unresolvedForPatient.find(
    (alert) => alert.alert_type === 'ZONE_BREACH'
  );

  if (patient.safetyState === 'BREACH' || breachAlert) {
    return breachAlert?.zone_name
      ? `Safe Zone breach · ${breachAlert.zone_name}`
      : 'Safe Zone breach';
  }

  if (patient.safetyState === 'CRITICAL') {
    return 'Critical safety alert';
  }

  if (unresolvedForPatient.length > 0) {
    return `${unresolvedForPatient.length} active safety ${
      unresolvedForPatient.length === 1 ? 'alert' : 'alerts'
    }`;
  }

  return null;
};

const getEarliestUnresolvedAlertMs = (
  patientId: string,
  alerts: SafetyAlert[]
): number => {
  const timestamps = alerts
    .filter((a) => a.patient_id === patientId && isUnresolvedAlert(a))
    .map((a) => new Date(a.created_at).getTime())
    .filter(Number.isFinite);
  return timestamps.length > 0 ? Math.min(...timestamps) : Number.MAX_SAFE_INTEGER;
};

/**
 * Deterministic 6-tier caregiver triage prioritization:
 *   0: Unresolved SOS alerts
 *   1: Unresolved Safe Zone breach alerts
 *   2: Other documented actionable care issues (other alerts, approaching boundary, stale/unavailable location)
 *   3: Overdue routine occurrences
 *   4: Ordinary scheduled care (ongoing or remaining today)
 *   5: No currently actionable issues
 */
export const getPatientPriority = (
  patient: Patient,
  alerts: SafetyAlert[]
): number => {
  const patientAlerts = alerts.filter(
    (alert) => alert.patient_id === patient.id && isUnresolvedAlert(alert)
  );

  // Tier 0: Unresolved SOS alerts
  if (
    patient.sosActive ||
    patientAlerts.some((alert) => alert.alert_type === 'SOS_MANUAL')
  ) {
    return 0;
  }

  // Tier 1: Unresolved Safe Zone breach alerts
  if (
    patient.safetyState === 'BREACH' ||
    patient.safetyState === 'CRITICAL' ||
    patientAlerts.some((alert) => alert.alert_type === 'ZONE_BREACH')
  ) {
    return 1;
  }

  // Tier 2: Other documented actionable care issues
  const freshness = resolveLocationFreshness(patient);
  if (
    patientAlerts.length > 0 ||
    patient.safetyState === 'APPROACHING' ||
    freshness === 'UNAVAILABLE' ||
    freshness === 'STALE'
  ) {
    return 2;
  }

  // Tier 3: Overdue routine occurrences
  if (patient.tasksAvailable && patient.overdueTasks > 0) {
    return 3;
  }

  // Tier 4: Ordinary scheduled care
  if (
    patient.tasksAvailable &&
    (patient.ongoingTasks > 0 || patient.totalTasks > patient.completedTasks)
  ) {
    return 4;
  }

  // Tier 5: No currently actionable issues
  return 5;
};

export const comparePatientsByPriority = (
  a: Patient,
  b: Patient,
  alerts: SafetyAlert[]
): number => {
  const tierDiff = getPatientPriority(a, alerts) - getPatientPriority(b, alerts);
  if (tierDiff !== 0) return tierDiff;

  // Earliest unresolved alert timestamp first (oldest waiting emergency takes precedence)
  const alertTsDiff =
    getEarliestUnresolvedAlertMs(a.id, alerts) -
    getEarliestUnresolvedAlertMs(b.id, alerts);
  if (alertTsDiff !== 0) return alertTsDiff;

  // Most overdue routines first
  const overdueDiff = b.overdueTasks - a.overdueTasks;
  if (overdueDiff !== 0) return overdueDiff;

  // Most pending/ongoing routines first
  const openA = Math.max(0, a.totalTasks - a.completedTasks);
  const openB = Math.max(0, b.totalTasks - b.completedTasks);
  if (openB !== openA) return openB - openA;

  // Final tie-breaker: alphabetical name
  return a.name.localeCompare(b.name);
};
