/**
 * SureStep — src/types/caregiverDashboard.types.ts
 * Types and interfaces for the Caregiver Dashboard.
 */

import type { Ionicons } from '@expo/vector-icons';

export type IconName = keyof typeof Ionicons.glyphMap;

export type CaregiverTab = 'Home' | 'Alerts' | 'Settings';

export type CaregiverDashboardTabItem = {
  id: CaregiverTab;
  label: string;
  icon: IconName;
  activeIcon: IconName;
};

export type Patient = {
  id: string;
  name: string;
  photoUrl: string | null;
  city: string | null;
  phone: string;
  dateOfBirth: string | null;

  locationState:
    | 'MOVING'
    | 'STATIONARY_KNOWN'
    | 'STATIONARY_UNKNOWN'
    | 'NO_SIGNAL'
    | null;

  safetyState:
    | 'SAFE'
    | 'APPROACHING'
    | 'BREACH'
    | 'CRITICAL'
    | null;

  currentZoneName: string | null;
  lastKnownZoneName: string | null;
  lastPingAt: string | null;
  accuracyM: number | null;
  locationFreshness: 'CURRENT' | 'RECENT' | 'STALE' | 'UNAVAILABLE';
  isBoundaryUncertain?: boolean;
  monitoredZoneCount: number;
  hasActiveSafeZone: boolean;
  sosActive: boolean;
  batteryPct: number | null;
  networkStatus: string | null;

  completedTasks: number;
  totalTasks: number;
  overdueTasks: number;
  ongoingTasks: number;
  lastActivity: string;
  tasksAvailable: boolean;
};
