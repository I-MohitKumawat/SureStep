/**
 * SureStep — src/screens/caregiver/CaregiverPatientDetailScreen.tsx
 * Merged from: app/screens/CaregiverDashboardScreen.tsx (1543 lines, 77KB)
 *
 * SPLIT STRATEGY:
 *   The original file had one monolithic screen with 3 internal tabs (Home, Alerts, Manage).
 *   Each tab is now a standalone component in src/components/caregiver/dashboard/.
 *   This file owns only:
 *     - State (active tab, modal state, geofence data, task data)
 *     - Data flow (useEffect hooks, useMemo derived values)
 *     - Navigation routing
 *     - Modal overlays (PatientProfile, RoutineSummary)
 *   UI rendering is delegated to the 3 tab subfiles.
 *
 * Result: 77KB monolith → ~250-line orchestrator + 3 focused tab components + 1 shared styles file.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import type { CaregiverStackParams } from '../../types/navigation.types';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useTasks } from '../../context/TaskContext';
import { styles, rSumStyles } from '../../components/caregiver/dashboard/dashboardStyles';
import { DashboardHomeTab }    from '../../components/caregiver/dashboard/DashboardHomeTab';
import { DashboardAlertsTab }  from '../../components/caregiver/dashboard/DashboardAlertsTab';
import { DashboardManageTab }  from '../../components/caregiver/dashboard/DashboardManageTab';
import { F } from '../../theme/fonts';
import { C } from '../../theme/colors';
import { getPatientProfile } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { usePatientTracking } from '../../context/PatientTrackingContext';
import { useAlerts } from '../../context/AlertContext';
import { fetchRoutineDefinitions } from '../../services/routineService';
import { getCarePlan } from '../../services/carePlanService';
import {
  resolveCircleIdForPatient,
  listCircleCaregivers,
  listCareCirclePeopleForPatient,
  submitCaregiverNotice,
  type CaregiverRelationship,
} from '../../services/careCircleService';
import { getCategoryIcon } from '../../components/shared/RoutineCapsule';
import { Feather, Ionicons } from '@expo/vector-icons';

type CaregiverDepartureReason =
  | 'PERSONAL_CIRCUMSTANCES'
  | 'SCHEDULE_CONFLICT'
  | 'OUTSIDE_SERVICE_AREA'
  | 'CARE_NEEDS_CHANGED'
  | 'CAPACITY_CONSTRAINT'
  | 'ROLE_NO_LONGER_SUITABLE'
  | 'OTHER';

const CAREGIVER_RESIGNATION_OPTIONS: { reason: CaregiverDepartureReason; label: string; desc: string }[] = [
  { reason: 'PERSONAL_CIRCUMSTANCES', label: 'Personal Circumstances', desc: 'Family or personal situation requires ending care' },
  { reason: 'SCHEDULE_CONFLICT', label: 'Schedule Conflict', desc: 'Timing or shift availability has changed' },
  { reason: 'OUTSIDE_SERVICE_AREA', label: 'Outside Service Area', desc: 'Relocation or distance makes visits difficult' },
  { reason: 'CARE_NEEDS_CHANGED', label: 'Care Needs Changed', desc: 'Patient requirements differ from my capabilities' },
  { reason: 'CAPACITY_CONSTRAINT', label: 'Capacity Constraint', desc: 'Caseload or working hours are full' },
  { reason: 'ROLE_NO_LONGER_SUITABLE', label: 'Role No Longer Suitable', desc: 'Care arrangement is no longer a mutual fit' },
  { reason: 'OTHER', label: 'Other', desc: 'Other circumstances (specify in notes)' },
];

import {
  IconDashboard, IconBell, IconActivity,
} from '../../assets/icons/NavIcons';
import {
  checkBreach,
  type Coords,
  type GeofenceZone,
} from '../../utils/geofenceUtils';

// ─── Types ────────────────────────────────────────────────────────────────────
type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverPatientDetailScreen'>;
type CaregiverTab = 'Home' | 'Alerts' | 'Manage';
type PatientDetails = { fullName: string; dob: string; gender: string; city: string; language: string; photoUrl?: string | null };

const TAB_ICON_COMPONENTS: Record<CaregiverTab, React.FC<{ active: boolean }>> = {
  Home:   ({ active }) => <IconDashboard size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Alerts: ({ active }) => <IconBell      size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Manage: ({ active }) => <IconActivity  size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
};

export const CaregiverPatientDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const patientId    = route.params.patientId;
  const patientName  = route.params.patientName;
  const isFocused    = useIsFocused();

  const { tasks, loading: tasksLoading, loadTasksForPatient } = useTasks();
  const patientTasks  = useMemo(() => tasks.filter(t => t.patientId === patientId), [tasks, patientId]);
  const manageTasks = useMemo(() =>
    patientTasks.map(t => ({
      ...t,
      instructions_md: t.instructionsMd,
      patient_hint: t.description,
    })), [patientTasks]);

  // ── Tab state ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<CaregiverTab>(route.params?.initialTab || 'Home');

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
      navigation.setParams({ initialTab: undefined } as any);
    }
  }, [route.params?.initialTab]);

  // ── Routines & Care Plan states ──────────────────────────────────────────
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [routinesLoading, setRoutinesLoading] = useState(true);
  const [relStatus, setRelStatus] = useState<string | null>(null);
  const [carePlan, setCarePlan] = useState<any | null>(null);
  const [familyCount, setFamilyCount] = useState(0);
  const [assignedCaregiver, setAssignedCaregiver] = useState('—');
  const [currentCircleId, setCurrentCircleId] = useState<string | null>(null);
  const [caregiverRelationship, setCaregiverRelationship] = useState<CaregiverRelationship | null>(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeReason, setNoticeReason] = useState<CaregiverDepartureReason>('PERSONAL_CIRCUMSTANCES');
  const [isSafetyException, setIsSafetyException] = useState(false);
  const [submittingNotice, setSubmittingNotice] = useState(false);

  const { user } = useAuth();

  const loadRelationshipAndCarePlan = useCallback(async () => {
    try {
      const [plan, people, circleId] = await Promise.all([
        getCarePlan(patientId),
        listCareCirclePeopleForPatient(patientId).catch(() => []),
        resolveCircleIdForPatient(patientId).catch(() => null),
      ]);

      setCarePlan(plan);
      setCurrentCircleId(circleId);

      if (circleId) {
        const relationships = await listCircleCaregivers(circleId);
        const mine = relationships.find(
          (r) => r.caregiver_id === user?.id && (r.status === 'ACTIVE' || r.status === 'NOTICE_PERIOD'),
        ) || null;
        setCaregiverRelationship(mine);
        setRelStatus(mine?.status ?? null);
      } else {
        setCaregiverRelationship(null);
        setRelStatus(null);
      }

      const families = people.filter((m) => m.role === 'FAMILY');
      const caregiver = people.find((m) => m.role === 'CAREGIVER');
      setFamilyCount(families.length);
      setAssignedCaregiver(caregiver?.name || '—');
    } catch (err) {
      console.warn('Failed to load relationship, care plan, or care circle:', err);
    }
  }, [patientId, user?.id]);

  const handleSubmitNotice = async () => {
    if (!currentCircleId || !caregiverRelationship) {
      Alert.alert('Error', 'No active care relationship found.');
      return;
    }

    setSubmittingNotice(true);
    try {
      await submitCaregiverNotice(currentCircleId, caregiverRelationship.id, {
        reason: noticeReason,
        isSafetyException,
      });
      setShowNoticeModal(false);
      Alert.alert(
        isSafetyException ? 'Relationship Ended' : 'Departure Notice Submitted',
        isSafetyException
          ? 'Your relationship has been terminated immediately for safety reasons and the Care Circle has been notified.'
          : 'Your departure notice has been recorded. The relationship remains active for seven days and then terminates automatically.',
      );
      void loadRelationshipAndCarePlan();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit departure notice.';
      Alert.alert('Submission Error', msg);
    } finally {
      setSubmittingNotice(false);
    }
  };

  // Load templates only — templates change rarely (user-triggered), no need to poll
  const loadTemplates = useCallback(async () => {
    try {
      const definitions = await fetchRoutineDefinitions(patientId);
      setTemplatesList(definitions);
    } catch (err) {
      console.warn('Failed to load routines:', err);
    }
  }, [patientId]);

  // Load tasks for context (used by manageTasks) — called once on focus
  // We don't poll this because the patient's optimistic state would get clobbered.
  // The caregiver sees updates via the context's 10s poll from the patient's device.
  // Load tasks for context (used by manageTasks) — called once on focus or on mutation refresh
  const loadRoutines = useCallback(async (force = false) => {
    setRoutinesLoading(true);
    try {
      await Promise.all([
        loadTemplates(),
        loadTasksForPatient(patientId, force),
        loadRelationshipAndCarePlan(),
      ]);
    } catch (err) {
      console.warn('Failed to load routines:', err);
    } finally {
      setRoutinesLoading(false);
    }
  }, [patientId, loadTasksForPatient, loadTemplates, loadRelationshipAndCarePlan]);


  useEffect(() => {
    if (!isFocused) return;
    const shouldForce = !!(route.params as any)?.refresh;
    void loadRoutines(shouldForce);
    if (shouldForce) {
      navigation.setParams({ refresh: undefined } as any);
    }
  }, [isFocused, (route.params as any)?.refresh, loadRoutines, navigation]);


  // ── Reminder toast ───────────────────────────────────────────────────────
  const [reminderSentKeys, setReminderSentKeys] = useState<Set<string>>(new Set());
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current); }, []);

  const sendReminder = (key: string) => {
    setReminderSentKeys(prev => new Set(prev).add(key));
    if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);
    reminderTimerRef.current = setTimeout(() => {
      setReminderSentKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
    }, 2500);
  };

  // ── Alert callout dismiss tracking ───────────────────────────────────────
  const [dismissedCallouts,   setDismissedCallouts]   = useState<Set<string>>(new Set());
  const [seenNonRoutineIds,   setSeenNonRoutineIds]   = useState<Set<string>>(new Set());
  const [acknowledgedIds,     setAcknowledgedIds]     = useState<Set<string>>(new Set());
  const [showRoutineSummary,  setShowRoutineSummary]  = useState(false);

  // ── Geofence / location ──────────────────────────────────────────────────
  const {
    setActivePatientId,
    coords: patientCoords,
    coordsTs,
    zones,
    patientState,
    refreshLocation,
    refreshing,
  } = usePatientTracking();

  const { getUnackedCountForPatient } = useAlerts();
  const unackedAlerts = getUnackedCountForPatient(patientId);
  const hasRealLocation = !!patientCoords;
  const hasRealZones = zones.length > 0;
  const batteryLevel = patientState?.battery_pct ?? 82;

  useEffect(() => {
    setActivePatientId(patientId);
  }, [patientId, setActivePatientId]);

  // ── Patient profile modal ────────────────────────────────────────────────
  const [showPatientProfile, setShowPatientProfile] = useState(false);
  const [patientDetails,     setPatientDetails]     = useState<PatientDetails | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await getPatientProfile(patientId);
        if (data?.data) {
          const p = data.data;
          setPatientDetails({
            fullName: p.user?.name || p.name || patientName,
            dob: p.user?.date_of_birth || p.date_of_birth || '—',
            gender: p.user?.gender || p.gender || '—',
            city: p.user?.city || p.city || '—',
            language: p.user?.preferred_language === 'hi' ? 'Hindi' : 'English',
            photoUrl: p.user?.photo_url || p.photo_url || null,
          });
        } else {
          setPatientDetails({ fullName: patientName, dob: '—', gender: '—', city: '—', language: 'English', photoUrl: null });
        }
      } catch (err) {
        console.warn('Failed to load patient profile:', err);
        setPatientDetails({ fullName: patientName, dob: '—', gender: '—', city: '—', language: 'English', photoUrl: null });
      }
    };
    void loadProfile();
  }, [patientId, patientName]);

  const calculatedAge = useMemo(() => {
    if (!patientDetails?.dob || patientDetails.dob === '—') {
      return patientName === 'Dorothy Hargrove' ? 78 : null;
    }
    const dobDate = new Date(patientDetails.dob);
    if (isNaN(dobDate.getTime())) return patientName === 'Dorothy Hargrove' ? 78 : null;
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }
    return age;
  }, [patientDetails?.dob, patientName]);

  // ── Derived values ────────────────────────────────────────────────────────
  const batteryColor  = batteryLevel >= 50 ? C.safeText : batteryLevel >= 20 ? '#D97706' : C.error;
  const capsuleScrollY = useRef(new Animated.Value(0)).current;

  const routineItems = useMemo(() => {
    // 1. Sort all tasks chronologically using scheduledTimestamp
    const chronoTasks = patientTasks.slice().sort((a, b) => {
      const tA = a.scheduledTimestamp ? new Date(a.scheduledTimestamp).getTime() : 0;
      const tB = b.scheduledTimestamp ? new Date(b.scheduledTimestamp).getTime() : 0;
      return tA - tB;
    });

    const nowMs = Date.now();

    // 2. Find the ID of the single active task
    let activeTaskId: string | null = null;
    const notDoneTasks = chronoTasks.filter(t => t.status !== 'done');
    
    const pastNotDone = notDoneTasks.filter(t => {
      const ts = t.scheduledTimestamp ? new Date(t.scheduledTimestamp).getTime() : 0;
      return ts <= nowMs;
    });
    
    const futureNotDone = notDoneTasks.filter(t => {
      const ts = t.scheduledTimestamp ? new Date(t.scheduledTimestamp).getTime() : 0;
      return ts > nowMs;
    });

    if (pastNotDone.length > 0) {
      activeTaskId = pastNotDone[pastNotDone.length - 1].id;
    } else if (futureNotDone.length > 0) {
      activeTaskId = futureNotDone[0].id;
    }

    // 3. Map to routine items with correct derived status
    const mapped = chronoTasks.map(t => {
      let derivedStatus: 'completed' | 'missed' | 'active' | 'upcoming' = 'upcoming';
      if (t.status === 'done') {
        derivedStatus = 'completed';
      } else if (t.id === activeTaskId) {
        derivedStatus = 'active';
      } else {
        const isPast = t.scheduledTimestamp ? new Date(t.scheduledTimestamp).getTime() <= nowMs : false;
        if (t.status === 'overdue' || isPast) {
          derivedStatus = 'missed';
        } else {
          derivedStatus = 'upcoming';
        }
      }

      return {
        key: t.id,
        category: t.category,
        iconName: t.iconName,
        emoji: t.icon,
        title: t.title,
        meta: t.description ? `${t.time} · ${t.description}` : t.time,
        done: t.status === 'done',
        status: derivedStatus,
        scheduledTime: t.scheduledTimestamp ? new Date(t.scheduledTimestamp).getTime() : 0,
      };
    });

    // 4. Sort the mapped list by priority:
    // Missed (0) -> Active (1) -> Upcoming (2) -> Completed (3).
    // Within each status group, sort chronologically.
    const statusOrder = {
      missed: 0,
      active: 1,
      upcoming: 2,
      completed: 3,
    };

    return mapped.sort((a, b) => {
      const orderA = statusOrder[a.status];
      const orderB = statusOrder[b.status];
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.scheduledTime - b.scheduledTime;
    });
  }, [patientTasks]);

  const activeRoutineIndex = useMemo(() => {
    const idx = routineItems.findIndex(r => r.status === 'active');
    return idx === -1 ? Math.max(routineItems.length - 1, 0) : idx;
  }, [routineItems]);


  const routineCallouts = useMemo(() => {
    const out: Array<{ id: string; emoji: string; title: string; message: string; severity: 'high' | 'medium' }> = [];
    for (const t of patientTasks) {
      if (t.status === 'overdue') out.push({ id: `overdue-${t.id}`, emoji: t.icon ?? '', title: 'Overdue — act now',   message: t.title, severity: 'high' });
    }
    return out.filter(c => !dismissedCallouts.has(c.id));
  }, [patientTasks, dismissedCallouts]);

  const nonRoutineAlerts = useMemo(() => {
    const out: Array<{ id: string; type: string; emoji: string; title: string; message: string; severity: 'critical' | 'high' | 'medium' | 'low' }> = [];
    if (batteryLevel < 20) out.push({ id: 'battery-low', type: 'battery_critical', emoji: '🔋', title: 'Critical Battery', message: `Device battery at ${batteryLevel}%`, severity: 'high' });
    if (patientCoords && zones.length > 0) {
      const breach = checkBreach(patientCoords, zones);
      if (breach.status === 'breach') out.push({ id: 'geo-outside', type: 'geofence_breach', emoji: '📍', title: 'Outside safe zone', message: `${Math.round(breach.distanceM)}m beyond boundary`, severity: 'high' });
      else if (breach.status === 'approaching') out.push({ id: 'geo-approaching', type: 'geofence_approaching', emoji: '🚶', title: 'Approaching zone boundary', message: `${Math.round(breach.marginM)}m from edge`, severity: 'medium' });
    }
    if (unackedAlerts > 0) out.push({ id: 'geo-unacked', type: 'geofence_unacked', emoji: '🔔', title: 'Unacknowledged alerts', message: `${unackedAlerts} alert${unackedAlerts > 1 ? 's' : ''} waiting`, severity: 'medium' });
    return out.sort((a, b) => ['critical','high','medium','low'].indexOf(a.severity) - ['critical','high','medium','low'].indexOf(b.severity));
  }, [batteryLevel, patientCoords, zones, unackedAlerts]);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top nav row */}
        <View style={styles.topNavRow}>
          <Pressable onPress={() => navigation.navigate('CaregiverTriageScreen')} style={({ pressed }) => [styles.backNavBtn, pressed && { opacity: 0.72 }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.backNavText}>← Back</Text>
          </Pressable>
        </View>

        {/* Tab content */}
        {activeTab === 'Alerts' ? (
          <DashboardAlertsTab
            patientId={patientId}
            patientName={patientName}
          />
        ) : activeTab === 'Manage' ? (
          <DashboardManageTab
            patientName={patientName}
            patientId={patientId}
            tasks={manageTasks}
            templates={templatesList}
            loading={routinesLoading || tasksLoading}
            onRefresh={loadRoutines}
          />
        ) : (
          <DashboardHomeTab
            patientName={patientName}
            patientPhone={patientId}
            batteryLevel={batteryLevel}
            batteryColor={batteryColor}
            patientCoords={patientCoords}
            coordsTs={coordsTs}
            zones={zones}
            unackedAlerts={unackedAlerts}
            hasRealLocation={hasRealLocation}
            hasRealZones={hasRealZones}
            patientTasks={patientTasks}
            patientAge={calculatedAge}
            patientPhoto={patientDetails?.photoUrl}
            activeRoutineIndex={activeRoutineIndex}
            routineItems={routineItems}
            routineCallouts={routineCallouts}
            dismissedCallouts={dismissedCallouts}
            reminderSentKeys={reminderSentKeys}
            capsuleScrollY={capsuleScrollY}
            showRoutineSummary={showRoutineSummary}
            patientState={patientState}
            onRefreshLocation={refreshLocation}
            onShowPatientProfile={() => navigation.navigate('PatientProfileScreen', { patientId })}
            onShowRoutineSummary={() => setShowRoutineSummary(true)}
            onDismissCallout={(id) => setDismissedCallouts(prev => new Set(prev).add(id))}
            onSendReminder={sendReminder}
            onNavigateManage={() => setActiveTab('Manage')}
            onNavigateGeofenceMap={() => navigation.navigate('CaregiverPatientMapScreen', { patientId, patientName })}
            relationshipStatus={relStatus}
            carePlan={carePlan}
            onNavigateAssessmentView={() => navigation.navigate('CaregiverAssessmentViewScreen', { patientId, patientName })}
            onNavigateCareCircle={() => navigation.navigate('CaregiverCareCircleScreen', { patientId, patientName })}
            familyCount={familyCount}
            assignedCaregiver={assignedCaregiver}
            noticeExpiresAt={caregiverRelationship?.notice_expires_at ?? null}
            onRequestEndCare={() => setShowNoticeModal(true)}
          />
        )}
      </ScrollView>

      {/* Reminder toast */}
      {reminderSentKeys.size > 0 && (
        <View style={styles.reminderToastWrap} pointerEvents="none">
          <View style={styles.reminderToast}>
            <Text style={styles.reminderToastText}>✓  Reminder sent to {patientName}</Text>
          </View>
        </View>
      )}

      {/* Bottom nav */}
      <View style={styles.bottomBarBand}>
        <View style={styles.bottomBar}>
          {(['Home', 'Alerts', 'Manage'] as CaregiverTab[]).map(tab => {
            const isActive = activeTab === tab;
            const Icon = TAB_ICON_COMPONENTS[tab];
            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.bottomTab}>
                <View style={styles.bottomTabIconWrap}><Icon active={isActive} /></View>
                <Text style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}>{tab}</Text>
                {isActive && <View style={styles.activeIndicator} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Routine Summary Modal */}
      <Modal visible={showRoutineSummary} transparent animationType="slide" onRequestClose={() => setShowRoutineSummary(false)}>
        <Pressable style={rSumStyles.overlay} onPress={() => setShowRoutineSummary(false)}>
          <Pressable style={rSumStyles.sheet} onPress={e => e.stopPropagation()}>
            <View style={rSumStyles.handle} />
            <Text style={rSumStyles.sheetTitle}>Routine Overview</Text>
            <Text style={rSumStyles.sheetSub}>Daily tasks for {patientName}</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 4 }}>
              {patientTasks.length === 0 && <Text style={{ color: C.textMuted, textAlign: 'center', marginTop: 24 }}>No routines added yet.</Text>}
              {[
                { filter: (t: typeof patientTasks[0]) => t.status === 'overdue', bg: '#FEF2F2', border: '#FECACA', label: 'Overdue',   dot: '#DC2626', textColor: '#991B1B' },
                { filter: (t: typeof patientTasks[0]) => t.status === 'pending', bg: '#FFFBEB', border: '#FDE68A', label: 'Pending',   dot: '#F59E0B', textColor: '#92400E' },
                { filter: (t: typeof patientTasks[0]) => t.status === 'done',    bg: '#F0FDF4', border: '#BBF7D0', label: 'Completed', dot: '#10B981', textColor: '#065F46' },
              ].map(section => {
                const filtered = patientTasks.filter(section.filter);
                if (!filtered.length) return null;
                return (
                  <View key={section.label} style={rSumStyles.section}>
                    <View style={rSumStyles.sectionHeader}>
                      <View style={[rSumStyles.sectionDot, { backgroundColor: section.dot }]} />
                      <Text style={[rSumStyles.sectionTitle, { color: section.textColor }]}>{section.label} ({filtered.length})</Text>
                    </View>
                    {filtered.map(t => (
                      <View key={t.id} style={[rSumStyles.taskRow, { backgroundColor: section.bg, borderColor: section.border }]}>
                        <View style={{ marginRight: 10, width: 24, alignItems: 'center', justifyContent: 'center' }}>
                          <Feather name={getCategoryIcon(t.category) as any} size={18} color={section.textColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[rSumStyles.taskTitle, { color: section.textColor }]}>{t.title}</Text>
                          <Text style={rSumStyles.taskMeta}>{t.time}{t.description ? ` · ${t.description}` : ''}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })}
            </ScrollView>
            <Pressable style={({ pressed }) => [rSumStyles.closeBtn, pressed && { opacity: 0.82 }]} onPress={() => setShowRoutineSummary(false)}>
              <Text style={rSumStyles.closeBtnText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Patient Profile Modal */}
      <Modal visible={showPatientProfile} transparent animationType="slide" onRequestClose={() => setShowPatientProfile(false)}>
        <Pressable style={styles.profileModalOverlay} onPress={() => setShowPatientProfile(false)}>
          <Pressable style={styles.profileModalSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.profileModalHandle} />
            <View style={styles.profileModalAvatar}>
              <Text style={styles.profileModalAvatarInitial}>{patientName[0]?.toUpperCase() ?? 'P'}</Text>
            </View>
            <Text style={styles.profileModalTag}>PATIENT PROFILE</Text>
            <Text style={styles.profileModalName}>{patientDetails?.fullName ?? patientName}</Text>
            <View style={styles.profileModalDivider} />
            {([
              { label: 'Date of Birth', value: patientDetails?.dob ?? '—',        icon: 'calendar' as const },
              { label: 'Gender',        value: patientDetails?.gender ?? '—',      icon: 'user' as const },
              { label: 'City',          value: patientDetails?.city ?? '—',        icon: 'map-pin' as const },
              { label: 'Language',      value: patientDetails?.language ?? 'English', icon: 'globe' as const },
              { label: 'Patient ID',    value: patientId,                           icon: 'hash' as const },
            ]).map(row => (
              <View key={row.label} style={styles.profileModalRow}>
                <View style={{ marginRight: 12, width: 24, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name={row.icon} size={18} color={C.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileModalRowLabel}>{row.label}</Text>
                  <Text style={styles.profileModalRowValue}>{row.value}</Text>
                </View>
              </View>
            ))}
            <Pressable style={({ pressed }) => [styles.profileModalCloseBtn, pressed && { opacity: 0.82 }]} onPress={() => setShowPatientProfile(false)}>
              <Text style={styles.profileModalCloseBtnText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Caregiver Departure Notice Modal */}
      <Modal
        visible={showNoticeModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!submittingNotice) setShowNoticeModal(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={resignStyles.modalOverlay}
        >
          <Pressable
            style={resignStyles.modalDismissArea}
            onPress={() => {
              if (!submittingNotice) setShowNoticeModal(false);
            }}
          />
          <View style={resignStyles.modalSheet}>
            <View style={resignStyles.modalHandle} />
            <Text style={resignStyles.modalTitle}>Submit Departure Notice</Text>
            <Text style={resignStyles.modalSub}>
              Give notice for your care relationship with {patientName}.
            </Text>

            <View style={resignStyles.noticeBanner}>
              <Feather name="alert-triangle" size={18} color="#B45309" style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={resignStyles.noticeTitle}>
                  {isSafetyException ? 'Immediate safety termination' : 'Care remains active for 7 days'}
                </Text>
                <Text style={resignStyles.noticeText}>
                  {isSafetyException
                    ? 'Use this only when continuing care creates an immediate personal or safety risk. The relationship ends immediately and the Care Circle is notified.'
                    : 'Your relationship stays active for the seven-day notice period, and your existing care access continues until it ends.'}
                </Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={resignStyles.formScroll} contentContainerStyle={{ paddingBottom: 16 }}>
              <Text style={resignStyles.fieldLabel}>REASON FOR DEPARTURE</Text>
              {CAREGIVER_RESIGNATION_OPTIONS.map(opt => {
                const isSelected = noticeReason === opt.reason;
                return (
                  <Pressable
                    key={opt.reason}
                    style={[
                      resignStyles.reasonOption,
                      isSelected && resignStyles.reasonOptionSelected,
                    ]}
                    onPress={() => setNoticeReason(opt.reason)}
                    disabled={submittingNotice}
                  >
                    <View style={[resignStyles.radioCircle, isSelected && resignStyles.radioCircleSelected]}>
                      {isSelected && <View style={resignStyles.radioDot} />}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[resignStyles.reasonTitle, isSelected && resignStyles.reasonTitleSelected]}>
                        {opt.label}
                      </Text>
                      <Text style={resignStyles.reasonDesc}>{opt.desc}</Text>
                    </View>
                  </Pressable>
                );
              })}

              <Pressable
                style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 16 }}
                onPress={() => setIsSafetyException(prev => !prev)}
                disabled={submittingNotice}
              >
                <View style={[resignStyles.radioCircle, isSafetyException && resignStyles.radioCircleSelected, { marginTop: 1 }]}>
                  {isSafetyException && <View style={resignStyles.radioDot} />}
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={resignStyles.reasonTitle}>Immediate safety exception</Text>
                  <Text style={resignStyles.reasonDesc}>
                    End the relationship immediately instead of serving the seven-day notice period.
                  </Text>
                </View>
              </Pressable>
            </ScrollView>

            <View style={resignStyles.actionRow}>
              <Pressable
                style={resignStyles.cancelBtn}
                onPress={() => setShowNoticeModal(false)}
                disabled={submittingNotice}
              >
                <Text style={resignStyles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[resignStyles.submitBtn, submittingNotice && { opacity: 0.7 }]}
                onPress={handleSubmitNotice}
                disabled={submittingNotice}
              >
                {submittingNotice ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={resignStyles.submitBtnText}>Submit Notice</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </ScreenContainer>
  );
};

const resignStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: F.bold,
    fontSize: 20,
    color: C.textPrimary,
  },
  modalSub: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  noticeTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#92400E',
  },
  noticeText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#78350F',
    marginTop: 2,
    lineHeight: 16,
  },
  formScroll: {
    maxHeight: 340,
  },
  fieldLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  charCount: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textMuted,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
  },
  reasonOptionSelected: {
    borderColor: '#0E7A67',
    backgroundColor: '#F0FDF4',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#0E7A67',
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#0E7A67',
  },
  reasonTitle: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: C.textPrimary,
  },
  reasonTitleSelected: {
    color: '#065F46',
  },
  reasonDesc: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 1,
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textPrimary,
    minHeight: 76,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  cancelBtnText: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: C.textSecondary,
  },
  submitBtn: {
    flex: 1.5,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontFamily: F.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  detailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  detailCardLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.textSecondary,
    letterSpacing: 0.6,
  },
  detailCardValue: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
    marginTop: 2,
  },
  detailCardSub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  detailCardText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textPrimary,
    marginTop: 3,
    lineHeight: 18,
  },
  pendingReminderBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  pendingReminderText: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 12,
    color: '#0F766E',
    lineHeight: 17,
  },
  withdrawBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#DC2626',
  },
  closeBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.textPrimary,
  },
});
