/**
 * CaregiverPatientsScreen.tsx
 *
 * Patient list sourced exclusively from Supabase:
 *  - patient_caregiver_links  → which patients belong to this caregiver
 *  - mock_users / patients    → patient names
 *  - tasks                    → real completion stats, last activity, alerts
 *
 * Realtime: re-fetches the full list whenever a new link INSERT fires.
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
// Navigation types migrated to src/types/navigation.types.ts
import type { CaregiverStackParams } from '../../types/navigation.types';
import {
  subscribeToCaregiversLinks,
  fetchPendingRequests,
  respondToPatientRequest,
} from '../../services/relationshipService';
import {
  getPendingFamilyRequests,
  approveFamilyRequest,
  rejectFamilyRequest,
} from '../../services/familyService';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import { relativeTime } from '../../utils/dateUtils';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import {
  IconDashboard,
  IconBell,
  IconSettings,
} from '../../assets/icons/NavIcons';
import { Ionicons } from '@expo/vector-icons';
import { connectSocket } from '../../services/socketClient';
import { fetchCaregiverAlertFeed, type ApiAlert } from '../../services/geofenceService';

type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverTriageScreen'>;
type CaregiverTab = 'Home' | 'Alerts' | 'Settings';

type TabIconProps = { active: boolean };
const TAB_ICON_COMPONENTS: Record<CaregiverTab, React.FC<TabIconProps>> = {
  Home:     ({ active }) => <IconDashboard size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Alerts:   ({ active }) => <IconBell     size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Settings: ({ active }) => <IconSettings size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
};

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Patient = {
  id: string;
  name: string;
  photoUrl: string | null;
  city: string | null;
  preferredLanguage: string;
  relationshipId: string;
  relationshipType: string;
  confirmedAt: string;
  locationState: 'MOVING' | 'STATIONARY_KNOWN' | 'STATIONARY_UNKNOWN' | 'NO_SIGNAL' | null;
  safetyState: 'SAFE' | 'APPROACHING' | 'BREACH' | 'CRITICAL' | null;
  routineState: 'ON_TRACK' | 'BEHIND' | 'MISSED_CRITICAL' | 'ALL_DONE' | null;
  engagementState: 'ACTIVE' | 'IDLE' | 'NO_INTERACTION' | null;
  lastPingAt: string | null;
  sosActive: boolean;
  computedAt: string | null;
  currentZoneName: string | null;
  batteryPct: number | null;
  networkStatus?: string | null;
  accuracyM: number | null;
  speedKmh: number | null;
  dateOfBirth: string | null;
  phone: string;
  
  completedTasks: number;
  totalTasks: number;
  lastActivity: string;
  statusLabel: 'On track' | 'Needs attention' | 'All done';
};

type RawTask = {
  id: string;
  patient_id: string;
  title: string;
  status: string;
  completed_at: string | null;
};

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function computeLastActivity(tasks: RawTask[]): string {
  const times = tasks.filter((t) => t.completed_at).map((t) => new Date(t.completed_at!).getTime());
  if (times.length === 0) return 'No activity yet';
  return relativeTime(Math.max(...times));
}

function deriveStatusLabel(
  completed: number,
  total: number,
  hasMissed: boolean,
): Patient['statusLabel'] {
  if (hasMissed) return 'Needs attention';
  if (total > 0 && completed === total) return 'All done';
  return 'On track';
}

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return relativeTime(dateStr);
}

function getAge(dobStr?: string | null): number | null {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function getSignalStrength(accuracyM?: number | null, locationState?: string | null): { label: string; icon: any } {
  if (locationState === 'NO_SIGNAL' || !accuracyM) {
    return { label: 'Offline', icon: 'cellular-outline' };
  }
  if (accuracyM <= 15) return { label: 'Strong', icon: 'cellular-outline' };
  if (accuracyM <= 50) return { label: 'Good', icon: 'cellular-outline' };
  return { label: 'Weak', icon: 'cellular-outline' };
}

function getBatteryIcon(batteryPct?: number | null): any {
  if (batteryPct == null) return 'battery-dead-outline';
  if (batteryPct < 20) return 'battery-dead-outline';
  if (batteryPct < 50) return 'battery-half-outline';
  return 'battery-full-outline';
}

function getBatteryColor(batteryPct?: number | null): string {
  if (batteryPct == null) return '#9CA3AF';
  if (batteryPct < 20) return '#EF4444';
  if (batteryPct < 50) return '#F59E0B';
  return '#10B981';
}

function getNetworkIcon(status?: string | null): any {
  if (!status || status === 'Offline') return 'cellular-outline';
  return 'cellular';
}

function getNetworkColor(status?: string | null): string {
  if (!status || status === 'Offline') return '#9CA3AF';
  if (status === 'Excellent' || status === 'Good') return '#16A34A';
  if (status === 'Fair') return '#F59E0B';
  return '#EF4444';
}

// â”€â”€â”€ Status colours â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STATUS_COLORS: Record<Patient['statusLabel'], { bg: string; text: string; dot: string }> = {
  'On track':        { bg: C.primaryLight, text: C.safeText,  dot: C.primary  },
  'All done':        { bg: '#D1FAE5',       text: '#065F46',   dot: '#10B981'  },
  'Needs attention': { bg: '#FEE2E2',       text: '#991B1B',   dot: '#DC2626'  },
};

// â”€â”€â”€ Risk helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  critical: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
  high:     { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  medium:   { bg: '#FEF9EC', text: '#78350F', border: '#FDE68A' },
  low:      { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
};
const RISK_RANK: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function computeRiskLevel(missedCount: number, hasMeds: boolean, criticalAlerts: number): RiskLevel {
  let score = missedCount * 3 + (hasMeds ? 2 : 0) + criticalAlerts * 4;
  if (score >= 10) return 'critical';
  if (score >= 6)  return 'high';
  if (score >= 2)  return 'medium';
  return 'low';
}

// â”€â”€â”€ Patient Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PatientCard = ({
  patient,
  activeAlert,
  onPress,
  onCallPress,
  onLiveLocationPress,
}: {
  patient: Patient;
  activeAlert?: ApiAlert;
  onPress: () => void;
  onCallPress: () => void;
  onLiveLocationPress: () => void;
}) => {
  const age = getAge(patient.dateOfBirth);
  const signal = getSignalStrength(patient.accuracyM, patient.locationState);
  const batteryIcon = getBatteryIcon(patient.batteryPct);
  const batteryColor = getBatteryColor(patient.batteryPct);

  // REAL alert/awareness/geofencing data state:
  const isAlertActive = !!(patient.sosActive || patient.safetyState === 'BREACH' || patient.safetyState === 'CRITICAL');

  let locationText = 'Safe at Home';
  if (patient.locationState === 'NO_SIGNAL') {
    locationText = 'Connection Lost';
  } else if (patient.locationState === 'MOVING') {
    locationText = `Moving – ${patient.currentZoneName || 'Outdoors'}`;
  } else if (patient.locationState === 'STATIONARY_KNOWN') {
    locationText = `Safe at ${patient.currentZoneName || 'Home'}`;
  } else if (patient.locationState === 'STATIONARY_UNKNOWN') {
    locationText = `Stationary – Outside`;
  }

  const avatarUri = patient.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=0E7364&color=fff&size=128&bold=true`;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isAlertActive && styles.cardWithAlert,
        pressed && { opacity: 0.95 }
      ]}
      onPress={onPress}
    >
      {isAlertActive && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning" size={16} color="#DC2626" style={{ marginRight: 6 }} />
          <Text style={styles.alertBannerText}>
            {patient.sosActive
              ? 'SOS Emergency – Help Requested'
              : activeAlert?.alert_type === 'ZONE_EXIT' || patient.safetyState === 'BREACH'
              ? `Geofence Breach – Left ${patient.currentZoneName || 'Home'} Zone`
              : activeAlert?.alert_type === 'STATIONARY_UNKNOWN'
              ? 'Stationary Outside Safe Zone'
              : activeAlert?.alert_type === 'APPROACHING_BOUNDARY'
              ? `Approaching ${patient.currentZoneName || 'Home'} Zone Boundary`
              : 'Safety Alert Detected'}
          </Text>
        </View>
      )}

      <View style={styles.cardContentWrap}>
        <View style={styles.mainInfoRow}>
          <Image source={{ uri: avatarUri }} style={styles.cardAvatarImage} />

          <View style={styles.middleInfoCol}>
            <View style={styles.nameRow}>
              <Text style={styles.patientNameText} numberOfLines={1}>
                {patient.name}
                {age != null ? ` ${age}` : ''}
              </Text>
              {isAlertActive && (
                <View style={styles.alertLabelBadge}>
                  <Text style={styles.alertLabelBadgeText}>Alert</Text>
                </View>
              )}
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color="#9CA3AF" style={{ marginRight: 4 }} />
              <Text style={styles.locationLabelText} numberOfLines={1}>{locationText}</Text>
            </View>
          </View>
        </View>

        <View style={styles.telemetryRow}>
          <View style={styles.telemetryItem}>
            <Ionicons 
              name={patient.locationState === 'NO_SIGNAL' ? 'battery-dead-outline' : batteryIcon} 
              size={14} 
              color={patient.locationState === 'NO_SIGNAL' ? '#9CA3AF' : batteryColor} 
              style={{ marginRight: 4 }} 
            />
            <Text style={styles.telemetryText}>
              {patient.locationState === 'NO_SIGNAL' ? 'Offline' : (patient.batteryPct != null ? `${patient.batteryPct}%` : '—')}
            </Text>
          </View>

          <View style={styles.telemetryItem}>
            <Ionicons 
              name={patient.locationState === 'NO_SIGNAL' ? 'cellular-outline' : getNetworkIcon(patient.networkStatus)} 
              size={14} 
              color={patient.locationState === 'NO_SIGNAL' ? '#9CA3AF' : getNetworkColor(patient.networkStatus)} 
              style={{ marginRight: 4 }} 
            />
            <Text style={styles.telemetryText}>
              {patient.locationState === 'NO_SIGNAL' ? 'Offline' : (patient.networkStatus || 'Offline')}
            </Text>
          </View>

          <View style={styles.telemetryItem}>
            <Ionicons name="time-outline" size={14} color="#9CA3AF" style={{ marginRight: 4 }} />
            <Text style={styles.telemetryText}>{timeAgo(patient.lastPingAt)}</Text>
          </View>
        </View>

        <View style={styles.cardActionRow}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.liveLocationBtn, pressed && { opacity: 0.8 }]}
            onPress={onLiveLocationPress}
          >
            <Ionicons name="location-outline" size={16} color="#2563EB" style={{ marginRight: 6 }} />
            <Text style={styles.liveLocationBtnText}>Live Location</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.callOutlineBtn, pressed && { opacity: 0.8 }]}
            onPress={onCallPress}
          >
            <Ionicons name="call-outline" size={16} color="#16A34A" style={{ marginRight: 6 }} />
            <Text style={styles.callOutlineBtnText}>Call</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

// â”€â”€â”€ Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const CaregiverTriageScreen: React.FC<Props> = ({ navigation }) => {
  const { status, user, firebaseUser } = useAuth();
  const caregiverPhone = status === 'authenticated' && user ? user.phone : null;

  const [activeTab,   setActiveTab]   = useState<CaregiverTab>('Home');
  const [patients,    setPatients]    = useState<Patient[]>([]);
  const [rawTasks,    setRawTasks]    = useState<RawTask[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Array<{
    patient_phone: string;
    patient_name: string;
    confirmed_at: string;
  }>>([]);
  const [pendingFamilyRequests, setPendingFamilyRequests] = useState<Array<{
    id: string;
    patient_user_id: string;
    related_user_id: string;
    relationship_type: string;
    created_at: string;
    family_name: string;
    family_photo: string | null;
    patient_name: string;
  }>>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [alertsFeed,  setAlertsFeed]  = useState<ApiAlert[]>([]);

  // â”€â”€ Data fetcher â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // REMOVED: Supabase migration to Express/PostgreSQL
  const loadPatients = useCallback(async (phone: string) => {
    setPatients((prev) => { if (prev.length === 0) setLoading(true); return prev; });
    setError(null);
    try {
      const { data } = await apiClient.get('/relationships/my-patients');
      const patientRows: any[] = data?.data?.patients ?? [];
      
      try {
        const feedRes = await fetchCaregiverAlertFeed({ limit: 100 });
        setAlertsFeed(feedRes.alerts ?? []);
      } catch (feedErr) {
        console.error('[CaregiverPatients] Error fetching alert feed:', feedErr);
      }

      const allTasks: RawTask[] = [];
      const mappedPatients: Patient[] = [];

      await Promise.all(
        patientRows.map(async (p: any) => {
          try {
            const res = await apiClient.get(`/tasks/patient/${p.id}/today`);
            const tasksList: any[] = res?.data?.data?.tasks ?? res?.data?.tasks ?? [];
            const mappedTasks: RawTask[] = tasksList.map((t: any) => ({
              id: t.id,
              patient_id: t.patient_id,
              title: t.title,
              status: t.status,
              completed_at: t.completed_at,
            }));
            
            allTasks.push(...mappedTasks);

            const completedTasks = mappedTasks.filter((t) => t.status === 'done').length;
            const totalTasks = mappedTasks.length;
            const hasMissed = mappedTasks.some((t) => t.status === 'missed');
            
            const lastActivity = computeLastActivity(mappedTasks);
            const statusLabel = deriveStatusLabel(completedTasks, totalTasks, hasMissed);

            mappedPatients.push({
              id: p.id,
              name: p.name,
              photoUrl: p.photo_url,
              city: p.city,
              preferredLanguage: p.preferred_language,
              relationshipId: p.relationship_id,
              relationshipType: p.relationship_type,
              confirmedAt: p.confirmed_at,
              locationState: p.location_state,
              safetyState: p.safety_state,
              routineState: p.routine_state,
              engagementState: p.engagement_state,
              lastPingAt: p.last_ping_at,
              sosActive: !!p.sos_active,
              computedAt: p.computed_at,
              currentZoneName: p.current_zone_name,
              batteryPct: p.battery_pct != null ? Number(p.battery_pct) : null,
              networkStatus: p.network_status,
              accuracyM: p.accuracy_m != null ? Number(p.accuracy_m) : null,
              speedKmh: p.speed_kmh != null ? Number(p.speed_kmh) : null,
              dateOfBirth: p.date_of_birth,
              phone: p.phone,
              completedTasks,
              totalTasks,
              lastActivity,
              statusLabel,
            });
          } catch (e) {
            console.error(`[CaregiverPatients] Error loading tasks for patient ${p.id}:`, e);
            mappedPatients.push({
              id: p.id,
              name: p.name,
              photoUrl: p.photo_url,
              city: p.city,
              preferredLanguage: p.preferred_language,
              relationshipId: p.relationship_id,
              relationshipType: p.relationship_type,
              confirmedAt: p.confirmed_at,
              locationState: p.location_state,
              safetyState: p.safety_state,
              routineState: p.routine_state,
              engagementState: p.engagement_state,
              lastPingAt: p.last_ping_at,
              sosActive: !!p.sos_active,
              computedAt: p.computed_at,
              currentZoneName: p.current_zone_name,
              batteryPct: p.battery_pct != null ? Number(p.battery_pct) : null,
              networkStatus: p.network_status,
              accuracyM: p.accuracy_m != null ? Number(p.accuracy_m) : null,
              speedKmh: p.speed_kmh != null ? Number(p.speed_kmh) : null,
              dateOfBirth: p.date_of_birth,
              phone: p.phone,
              completedTasks: 0,
              totalTasks: 0,
              lastActivity: 'Error loading activity',
              statusLabel: 'On track',
            });
          }
        })
      );

      // Sort patients by name to keep order consistent
      mappedPatients.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      setPatients(mappedPatients);
      setRawTasks(allTasks);
    } catch (e: any) {
      console.error('[CaregiverPatients] loadPatients error:', e);
      setError(e?.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load pending requests ──────────────────────────────────────────────────────
  const loadPendingRequests = useCallback(async (phone: string) => {
    setRequestsLoading(true);
    try {
      console.log('[DEBUG] Loading pending requests for:', phone);
      const requests = await fetchPendingRequests(phone);
      console.log('[DEBUG] Pending requests found:', JSON.stringify(requests));
      setPendingRequests(requests);

      const famRes = await getPendingFamilyRequests();
      setPendingFamilyRequests(famRes.data?.data?.requests || []);
    } catch (e) {
      console.error('[CaregiverPatients] loadPendingRequests error:', e);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const handleRespond = useCallback(async (
    patientPhone: string,
    action: 'confirmed' | 'rejected',
  ) => {
    if (!caregiverPhone) return;
    try {
      await respondToPatientRequest(caregiverPhone, patientPhone, action);
      void loadPendingRequests(caregiverPhone);
      void loadPatients(caregiverPhone);
    } catch (e) {
      console.error('[CaregiverPatients] handleRespond error:', e);
    }
  }, [caregiverPhone, loadPendingRequests, loadPatients]);

  const handleRespondFamily = useCallback(async (
    requestId: string,
    action: 'approve' | 'reject',
  ) => {
    if (!caregiverPhone) return;
    try {
      if (action === 'approve') {
        await approveFamilyRequest(requestId);
      } else {
        await rejectFamilyRequest(requestId);
      }
      void loadPendingRequests(caregiverPhone);
      void loadPatients(caregiverPhone);
    } catch (e) {
      console.error('[CaregiverPatients] handleRespondFamily error:', e);
    }
  }, [caregiverPhone, loadPendingRequests, loadPatients]);

  // ── Initial load ─────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (caregiverPhone) {
      void loadPatients(caregiverPhone);
      void loadPendingRequests(caregiverPhone);
    }
  }, [caregiverPhone, loadPatients, loadPendingRequests]);
  // ── Realtime subscription ────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!caregiverPhone) return;
    return subscribeToCaregiversLinks(caregiverPhone, () => {
      void loadPatients(caregiverPhone);
      void loadPendingRequests(caregiverPhone);
    });
  }, [caregiverPhone, loadPatients, loadPendingRequests]);

  const patientIds = useMemo(() => patients.map(p => p.id).join(','), [patients]);

  // ── WebSocket subscription per patient ─────────────────────────────────────────
  React.useEffect(() => {
    if (!firebaseUser) return;
    let active = true;
    let socketInstance: any = null;
    const refreshData = () => {
      if (caregiverPhone) {
        void loadPatients(caregiverPhone);
      }
    };

    const handleRelationshipChange = (data: any) => {
      console.log('[Caregiver] Relationship change received via WebSocket:', data);
      if (caregiverPhone) {
        void loadPatients(caregiverPhone);
        void loadPendingRequests(caregiverPhone);
      }
    };

    void firebaseUser.getIdToken().then((token) => {
      if (!active) return;
      const socket = connectSocket(token);
      socketInstance = socket;

      const ids = patientIds.split(',').filter(Boolean);
      ids.forEach((patientId) => {
        socket.emit('join:patient', { patientId });
      });

      socket.on('state:change', refreshData);
      socket.on('alert:new', refreshData);
      socket.on('alert:acknowledged', refreshData);
      socket.on('geofences:change', refreshData);
      socket.on('task:change', refreshData);
      socket.on('relationship:change', handleRelationshipChange);
    });

    return () => {
      active = false;
      if (socketInstance) {
        socketInstance.off('state:change', refreshData);
        socketInstance.off('alert:new', refreshData);
        socketInstance.off('alert:acknowledged', refreshData);
        socketInstance.off('geofences:change', refreshData);
        socketInstance.off('task:change', refreshData);
        socketInstance.off('relationship:change', handleRelationshipChange);
      }
    };
  }, [firebaseUser, patientIds, caregiverPhone, loadPendingRequests]);

  // ── Total alert count for nav badge ───────────────────────────────────────────
  const totalAlertCount = useMemo(() => {
    const activeAlerts = alertsFeed.filter(a => !a.acknowledged_at).length;
    return activeAlerts + pendingRequests.length + pendingFamilyRequests.length;
  }, [alertsFeed, pendingRequests, pendingFamilyRequests]);

  // ── Derived: filtered patient list ───────────────────────────────────────────
  const filteredPatients = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    let list = patients;

    if (!needle) return list;
    return list.filter(
      (p) => p.name.toLowerCase().includes(needle) || (p.phone && p.phone.toLowerCase().includes(needle)),
    );
  }, [patients, searchQuery]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>

      {/* ── Home tab ────────────────────────────────────────────────────────────── */}
      {activeTab === 'Home' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.welcomeText}>Welcome, {user?.name || 'Caregiver'}</Text>
          <View style={styles.headerContainer}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitleText}>My Patients</Text>
              <Text style={styles.headerSubtitleText}>
                {patients.length} {patients.length === 1 ? 'patient' : 'patients'} under care
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable 
                onPress={() => navigation.navigate('NotificationHistoryScreen')} 
                style={({ pressed }) => [styles.searchIconButton, { marginRight: 8 }, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="notifications-outline" size={22} color="#111827" />
              </Pressable>
              <Pressable 
                onPress={() => setIsSearchVisible(!isSearchVisible)} 
                style={({ pressed }) => [styles.searchIconButton, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="search-outline" size={22} color="#111827" />
              </Pressable>
            </View>
          </View>

          {isSearchVisible && (
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search patient by name or phone"
              placeholderTextColor={C.textMuted}
              style={styles.searchInput}
              autoFocus
            />
          )}

          {loading && (
            <View style={{ alignItems: 'center', paddingTop: 32 }}>
              <ActivityIndicator color={C.primary} />
            </View>
          )}
          {error && !loading && (
            <Text style={styles.stateNote}>{error}</Text>
          )}
          {!loading && !error && patients.length === 0 && (
            <Text style={styles.stateNote}>
              No patients yet. Ask your patient to confirm you as their caregiver.
            </Text>
          )}

          {filteredPatients.map((patient) => {
            const activeAlert = alertsFeed.find(
              (a) => a.patient_id === patient.id && !a.acknowledged_at,
            );
            return (
              <PatientCard
                key={patient.id}
                patient={patient}
                activeAlert={activeAlert}
                onPress={() =>
                  navigation.navigate('CaregiverPatientDetailScreen', {
                    patientId: patient.id,
                    patientName: patient.name,
                  })
                }
                onCallPress={() => {
                  if (patient.phone) {
                    Linking.openURL(`tel:${patient.phone}`).catch((e) =>
                      console.error('Failed to open dialer', e)
                    );
                  }
                }}
                onLiveLocationPress={() =>
                  navigation.navigate('CaregiverPatientMapScreen', {
                    patientId: patient.id,
                    patientName: patient.name,
                  })
                }
              />
            );
          })}
        </ScrollView>
      )}

      {activeTab === 'Alerts' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={[styles.overline, { fontSize: 20, fontWeight: '600' }]}>PATIENT ALERTS</Text>
          </View>

          {/* ── Patient request section ────────────────────────────────────── */}
          {pendingRequests.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>PENDING REQUESTS</Text>
              {pendingRequests.map((req) => (
                <View key={req.patient_phone} style={requestStyles.card}>
                  <View style={requestStyles.avatar}>
                    <Text style={requestStyles.avatarInitial}>{req.patient_name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={requestStyles.info}>
                    <Text style={requestStyles.name}>{req.patient_name}</Text>
                    <Text style={requestStyles.sub}>Wants to add you as their caregiver</Text>
                  </View>
                  <View style={requestStyles.actions}>
                    <Pressable
                      style={({ pressed }) => [requestStyles.acceptBtn, pressed && { opacity: 0.8 }]}
                      onPress={() => handleRespond(req.patient_phone, 'confirmed')}
                    >
                      <Text style={requestStyles.acceptText}>Accept</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [requestStyles.rejectBtn, pressed && { opacity: 0.8 }]}
                      onPress={() => handleRespond(req.patient_phone, 'rejected')}
                    >
                      <Text style={requestStyles.rejectText}>Reject</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          )}

          {pendingFamilyRequests.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 12 }]}>PENDING FAMILY REQUESTS</Text>
              {pendingFamilyRequests.map((req) => (
                <View key={req.id} style={requestStyles.card}>
                  <View style={requestStyles.avatar}>
                    {req.family_photo ? (
                      <Image source={{ uri: req.family_photo }} style={requestStyles.avatarImage} />
                    ) : (
                      <Text style={requestStyles.avatarInitial}>
                        {(req.family_name || 'F')[0]?.toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={requestStyles.info}>
                    <Text style={requestStyles.name}>{req.family_name}</Text>
                    <Text style={requestStyles.sub}>
                      Wants to join care circle of patient {req.patient_name}
                    </Text>
                  </View>
                  <View style={requestStyles.actions}>
                    <Pressable
                      style={({ pressed }) => [requestStyles.acceptBtn, pressed && { opacity: 0.8 }]}
                      onPress={() => handleRespondFamily(req.id, 'approve')}
                    >
                      <Text style={requestStyles.acceptText}>Approve</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [requestStyles.rejectBtn, pressed && { opacity: 0.8 }]}
                      onPress={() => handleRespondFamily(req.id, 'reject')}
                    >
                      <Text style={requestStyles.rejectText}>Reject</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* ── Level 3: Patient Alert Summary Cards ─────────────────────────────────── */}
          <Text style={[styles.sectionLabel, { marginTop: pendingRequests.length > 0 ? 12 : 0 }]}>PATIENT SAFETY OVERVIEW</Text>

          {loading && <ActivityIndicator color={C.primary} style={{ marginTop: 20 }} />}
          {!loading && patients.length === 0 && (
            <Text style={styles.stateNote}>No patients linked yet.</Text>
          )}

          {!loading && (() => {
            // Build per-patient alert summaries sorted by risk
            const summaries = patients.map(p => {
              const pts = rawTasks.filter(t => t.patient_id === p.id);
              const missed = pts.filter(t => t.status === 'missed');
              const unsure = pts.filter(t => t.status === 'unsure');
              const hasMeds = pts.some(t =>
                t.title.toLowerCase().includes('medic') ||
                t.title.toLowerCase().includes('tablet') ||
                t.title.toLowerCase().includes('pill')
              );
              const totalAlerts = missed.length + unsure.length;
              const criticalCount = missed.length;
              const risk = computeRiskLevel(missed.length, hasMeds, 0);
              return { patient: p, totalAlerts, criticalCount, unsureCount: unsure.length, risk };
            }).sort((a, b) => RISK_RANK[a.risk] - RISK_RANK[b.risk]);

            return summaries.map(({ patient, totalAlerts, criticalCount, unsureCount, risk }) => {
              const riskC = RISK_COLORS[risk];
              return (
                <Pressable
                  key={patient.id}
                  style={({ pressed }) => [l3Styles.card, pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] }]}
                  onPress={() => navigation.navigate('CaregiverPatientDetailScreen', {
                    patientId: patient.id,
                    patientName: patient.name,
                  })}
                >
                  {/* Header row */}
                  <View style={l3Styles.cardHeader}>
                    <View style={l3Styles.avatar}>
                      <Text style={l3Styles.avatarText}>{patient.name[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[l3Styles.patientName, totalAlerts > 0 && l3Styles.patientNameUnseen]}>
                        {patient.name}
                      </Text>
                      <Text style={l3Styles.lastSeen}>Last activity · {patient.lastActivity}</Text>
                    </View>
                    <View style={[l3Styles.riskBadge, { backgroundColor: riskC.bg, borderColor: riskC.border }]}>
                      <Text style={[l3Styles.riskText, { color: riskC.text }]}>{risk.toUpperCase()}</Text>
                    </View>
                  </View>

                  {/* Alert counts */}
                  {totalAlerts > 0 ? (
                    <View style={l3Styles.countRow}>
                      <View style={l3Styles.countChip}>
                        <Text style={l3Styles.countChipNum}>{totalAlerts}</Text>
                        <Text style={l3Styles.countChipLabel}> Total Alerts</Text>
                      </View>
                      {criticalCount > 0 && (
                        <View style={[l3Styles.countChip, l3Styles.countChipCrit]}>
                          <Text style={[l3Styles.countChipNum, { color: '#991B1B' }]}>{criticalCount}</Text>
                          <Text style={[l3Styles.countChipLabel, { color: '#991B1B' }]}> Missed</Text>
                        </View>
                      )}
                      {unsureCount > 0 && (
                        <View style={[l3Styles.countChip, l3Styles.countChipWarn]}>
                          <Text style={[l3Styles.countChipNum, { color: '#92400E' }]}>{unsureCount}</Text>
                          <Text style={[l3Styles.countChipLabel, { color: '#92400E' }]}> Follow-up</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={l3Styles.allClearRow}>
                      <Text style={l3Styles.allClearText}>âœ“  No active alerts</Text>
                    </View>
                  )}

                  {/* Action buttons */}
                  <View style={l3Styles.actionRow}>
                    <Pressable
                      style={({ pressed }) => [l3Styles.actionBtn, l3Styles.callBtn, pressed && { opacity: 0.8 }]}
                      onPress={() => void Linking.openURL('tel:')}
                    >
                      <Text style={l3Styles.callBtnText}>📞  Call</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [l3Styles.actionBtn, l3Styles.notifyBtn, pressed && { opacity: 0.8 }]}
                      onPress={() => void Linking.openURL('sms:')}
                    >
                      <Text style={l3Styles.notifyBtnText}>👨‍👩‍👧  Notify Family</Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            });
          })()}
        </ScrollView>
      )}

      {/* â”€â”€ Settings tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === 'Settings' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={[styles.overline, { fontSize: 20, fontWeight: '600' }]}>SETTINGS</Text>
          </View>

          {/* Profile card */}
          <View style={settingsStyles.profileCard}>
            <View style={settingsStyles.avatarWrap}>
              {user?.photo_url ? (
                <Image source={{ uri: user.photo_url }} style={settingsStyles.avatarImage} />
              ) : (
                <Text style={settingsStyles.avatarInitial}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : (caregiverPhone ? caregiverPhone.charAt(0) : 'C')}
                </Text>
              )}
            </View>
            <Text style={settingsStyles.profileTag}>{user?.name ? user.name.toUpperCase() : 'CAREGIVER PROFILE'}</Text>
            <Text style={settingsStyles.profilePhone}>{caregiverPhone ?? '—'}</Text>
            <Pressable
              onPress={() => navigation.navigate('CaregiverProfileEditScreen')}
              style={{
                marginTop: 12,
                backgroundColor: C.primaryLight,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: C.primary,
              }}
            >
              <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.primary }}>Edit Profile</Text>
            </Pressable>
          </View>

          <View style={settingsStyles.divider} />

          {/* Read-only identity fields */}
          <Text style={settingsStyles.sectionHeading}>Account</Text>
          {([
            { label: 'Phone Number', value: caregiverPhone ?? '—', emoji: '📞' },
            { label: 'Role',         value: 'Caregiver',           emoji: '🧑‍⚕️' },
            { label: 'Account Type', value: 'Standard',            emoji: '📊' },
          ] as Array<{ label: string; value: string; emoji: string }>).map((row) => (
            <View key={row.label} style={settingsStyles.fieldRow}>
              <View style={settingsStyles.fieldEmojiWrap}>
                <Text style={settingsStyles.fieldEmoji}>{row.emoji}</Text>
              </View>
              <View style={settingsStyles.fieldTextWrap}>
                <Text style={settingsStyles.fieldLabel}>{row.label}</Text>
                <Text style={settingsStyles.fieldValue}>{row.value}</Text>
              </View>
            </View>
          ))}

          <View style={settingsStyles.divider} />

          {/* Preferences */}
          <Text style={settingsStyles.sectionHeading}>Preferences</Text>
          {([
            { label: 'Notifications', value: 'Enabled', emoji: '🔔' },
            { label: 'Language',      value: 'English', emoji: '🌐' },
            { label: 'App Version',   value: '1.0.0',   emoji: 'â„¹ï¸'  },
          ] as Array<{ label: string; value: string; emoji: string }>).map((row) => (
            <View key={row.label} style={settingsStyles.fieldRow}>
              <View style={settingsStyles.fieldEmojiWrap}>
                <Text style={settingsStyles.fieldEmoji}>{row.emoji}</Text>
              </View>
              <View style={settingsStyles.fieldTextWrap}>
                <Text style={settingsStyles.fieldLabel}>{row.label}</Text>
                <Text style={settingsStyles.fieldValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}


      {/* â”€â”€ Bottom Nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={styles.bottomBarBand}>
        <View style={styles.bottomBar}>
          {(['Home', 'Alerts', 'Settings'] as CaregiverTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent = TAB_ICON_COMPONENTS[tab];
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={styles.bottomTab}
              >
                <View style={styles.bottomTabIconWrap}>
                  <IconComponent active={isActive} />
                </View>
                <Text style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}>
                  {tab}{tab === 'Alerts' && totalAlertCount > 0
                  ? ` (${totalAlertCount})`
                  : ''}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScreenContainer>
  );
};

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const styles = StyleSheet.create({
  screen:        { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 96 },
  welcomeText:   { fontFamily: F.bold, fontSize: 14, color: C.primary, marginBottom: 4, marginTop: 4 },

  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  overline:     { fontFamily: F.bold, fontSize: 11, letterSpacing: 1.4, color: C.primary, marginBottom: 2 },
  sectionLabel: { fontFamily: F.bold, fontSize: 10, letterSpacing: 1.4, color: C.textMuted, marginBottom: 10 },
  stateNote:    { fontFamily: F.regular, color: C.textMuted, textAlign: 'center', marginTop: 32, fontSize: 14 },

  searchInput: {
    height: 46, borderRadius: 12,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, color: C.textPrimary,
    fontFamily: F.medium, fontSize: 14, marginBottom: 12,
  },

  card: {
    backgroundColor: C.surface,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
    marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 2,
    overflow: 'hidden',
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.primaryLight, borderWidth: 2, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarInitial:    { fontFamily: F.extraBold, fontSize: 20, color: C.primary },
  cardCenter:       { flex: 1 },
  nameRow:          { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 2 },
  patientName:      { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary },
  lastActivity:     { fontFamily: F.regular, fontSize: 11, color: C.textMuted, marginBottom: 8 },
  progressBarTrack: { height: 5, borderRadius: 999, backgroundColor: C.border, overflow: 'hidden', marginBottom: 4 },
  progressBarFill:  { height: '100%', borderRadius: 999, backgroundColor: C.primary },
  progressLabel:    { fontFamily: F.semiBold, fontSize: 11, color: C.textSecondary },
  cardRight:        { alignItems: 'flex-end', gap: 10, marginLeft: 8 },
  statusPill:       { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  statusDot:        { width: 6, height: 6, borderRadius: 3 },
  statusText:       { fontFamily: F.bold, fontSize: 10 },
  chevron:          { fontFamily: F.bold, fontSize: 22, color: C.textMuted, lineHeight: 24 },

  // â”€â”€ Alerts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  alertRow: {
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 10, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  alertHigh:    { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  alertMedium:  { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  alertLow:     { backgroundColor: '#E5E7EB', borderColor: '#D1D5DB' },
  alertTextWrap:{ flex: 1, paddingRight: 10 },
  alertPatient: { fontFamily: F.bold, color: C.textPrimary, fontSize: 14, marginBottom: 2 },
  alertMessage: { fontFamily: F.regular, color: C.textSecondary, fontSize: 12 },
  alertRight:   { alignItems: 'flex-end', gap: 6 },
  alertPriority:{ fontFamily: F.bold, color: C.textPrimary, fontSize: 10, letterSpacing: 0.6 },
  alertSosBtn:  { backgroundColor: '#DC2626', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  alertSosText: { fontFamily: F.bold, color: '#FFFFFF', fontSize: 10, letterSpacing: 0.4 },

  // â”€â”€ Bottom nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  bottomBarBand:     { position: 'absolute', left: 0, right: 0, bottom: 0, height: 76, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },
  bottomBar:         { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8 },
  bottomTab:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, position: 'relative' },
  bottomTabIconWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  bottomLabel:       { fontFamily: F.medium, fontSize: 10, color: C.textMuted, letterSpacing: 0.3 },
  bottomLabelActive: { fontFamily: F.bold, color: C.primary },
  activeIndicator:   { position: 'absolute', bottom: 0, width: 18, height: 2.5, borderRadius: 2, backgroundColor: C.primary },

  // ── New Caregiver Patient List Styles ──────────────────────────────────────────
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitleText: {
    fontFamily: F.extraBold,
    fontSize: 28,
    color: '#111827',
  },
  headerSubtitleText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  searchIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAgeText: {
    fontFamily: F.regular,
    fontSize: 15,
    color: '#6B7280',
  },
  cardWithAlert: {
    borderColor: '#FCA5A5',
    borderWidth: 1.5,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
  },
  alertBannerText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#DC2626',
  },
  cardContentWrap: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  mainInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  middleInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  patientNameText: {
    fontFamily: F.bold,
    fontSize: 17,
    color: C.textPrimary,
    marginRight: 8,
  },
  alertLabelBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'center',
  },
  alertLabelBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationLabelText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textSecondary,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  telemetryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  telemetryText: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: C.textSecondary,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
  },
  liveLocationBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  liveLocationBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#2563EB',
  },
  callOutlineBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  callOutlineBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#16A34A',
  },
});

const settingsStyles = StyleSheet.create({
  profileCard: {
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
    paddingVertical: 24, paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 2,
  },
  avatarWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.primaryLight, borderWidth: 2, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarInitial:  { fontFamily: F.extraBold, fontSize: 30, color: C.primary },
  profileTag:     { fontFamily: F.bold, fontSize: 11, letterSpacing: 1.4, color: C.primary, marginBottom: 4 },
  profilePhone:   { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary },

  divider:        { height: 1, backgroundColor: C.border, marginVertical: 14 },
  sectionHeading: { fontFamily: F.bold, fontSize: 12, letterSpacing: 1.2, color: C.textMuted, marginBottom: 8 },

  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 1,
  },
  fieldEmojiWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  fieldEmoji:    { fontSize: 18 },
  fieldTextWrap: { flex: 1 },
  fieldLabel:    { fontFamily: F.medium, fontSize: 11, color: C.textSecondary, letterSpacing: 0.4 },
  fieldValue:    { fontFamily: F.bold, fontSize: 15, color: C.textPrimary, marginTop: 1 },
});


const requestStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.primaryLight,
    borderWidth: 2, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  avatarInitial: { fontFamily: F.extraBold, fontSize: 18, color: C.primary },
  info:          { flex: 1 },
  name:          { fontFamily: F.bold, fontSize: 15, color: C.textPrimary },
  sub:           { fontFamily: F.regular, fontSize: 11, color: C.textMuted, marginTop: 2 },
  actions:       { flexDirection: 'column', gap: 6 },
  acceptBtn: {
    backgroundColor: '#0E7364',
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6,
    alignItems: 'center',
  },
  acceptText: { fontFamily: F.bold, color: '#FFFFFF', fontSize: 12 },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },
  rejectText: { fontFamily: F.bold, color: '#DC2626', fontSize: 12 },
});

// â”€â”€â”€ Level 3 patient summary card styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const l3Styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 14,
    marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 3,
  },
  cardHeader:        { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar:            { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primaryLight, borderWidth: 2, borderColor: C.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText:        { fontFamily: F.extraBold, fontSize: 18, color: C.primary },
  patientName:       { fontFamily: F.bold, fontSize: 17, color: C.textPrimary },
  patientNameUnseen: { fontFamily: F.extraBold },
  lastSeen:          { fontFamily: F.regular, fontSize: 11, color: C.textMuted, marginTop: 1 },
  riskBadge:         { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center', justifyContent: 'center' },
  riskText:          { fontFamily: F.bold, fontSize: 10, letterSpacing: 0.8 },
  countRow:          { flexDirection: 'row', gap: 8, marginBottom: 12 },
  countChip:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  countChipCrit:     { backgroundColor: '#FEE2E2' },
  countChipWarn:     { backgroundColor: '#FEF3C7' },
  countChipNum:      { fontFamily: F.extraBold, fontSize: 14, color: C.textPrimary },
  countChipLabel:    { fontFamily: F.medium, fontSize: 12, color: C.textSecondary },
  allClearRow:       { marginBottom: 12, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#D1FAE5', borderRadius: 10 },
  allClearText:      { fontFamily: F.semiBold, fontSize: 13, color: '#065F46' },
  actionRow:         { flexDirection: 'row', gap: 8 },
  actionBtn:         { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  callBtn:           { backgroundColor: C.primary, shadowColor: C.primary, shadowOpacity: 0.2, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 3 },
  callBtnText:       { fontFamily: F.bold, fontSize: 13, color: '#fff' },
  notifyBtn:         { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: C.primary },
  notifyBtnText:     { fontFamily: F.bold, fontSize: 13, color: C.primary },
});
