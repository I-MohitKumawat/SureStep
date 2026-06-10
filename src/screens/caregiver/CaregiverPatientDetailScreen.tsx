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
import { Alert, Animated, Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
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
import {
  getRoutineTemplates,
  deactivateRoutineTemplate,
} from '../../services/taskService';
import { getCarePlan } from '../../services/carePlanService';
import { fetchPatientRelationship, completeMeeting } from '../../services/relationshipService';

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

  const loadRelationshipAndCarePlan = useCallback(async () => {
    try {
      const [rel, plan] = await Promise.all([
        fetchPatientRelationship(patientId),
        getCarePlan(patientId),
      ]);
      if (rel) {
        setRelStatus(rel.status);
      }
      setCarePlan(plan);
    } catch (err) {
      console.warn('Failed to load relationship or care plan:', err);
    }
  }, [patientId]);

  // Load templates only — templates change rarely (user-triggered), no need to poll
  const loadTemplates = useCallback(async () => {
    try {
      const templatesRes = await getRoutineTemplates(patientId);
      setTemplatesList(templatesRes.data?.data?.templates ?? []);
    } catch (err) {
      console.warn('Failed to load templates:', err);
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

  const handleCompleteMeeting = async () => {
    try {
      await completeMeeting(patientId);
      Alert.alert('Meeting Completed', 'You can now start the structured Patient Assessment.');
      void loadRelationshipAndCarePlan();
    } catch (err) {
      console.warn('Failed to complete meeting:', err);
      Alert.alert('Error', 'Failed to mark meeting as completed.');
    }
  };

  useEffect(() => {
    if (!isFocused) return;
    const shouldForce = !!(route.params as any)?.refresh;
    void loadRoutines(shouldForce);
    if (shouldForce) {
      navigation.setParams({ refresh: undefined } as any);
    }
  }, [isFocused, (route.params as any)?.refresh, loadRoutines, navigation]);

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deactivateRoutineTemplate(templateId);
      Alert.alert('Success', 'Routine template deleted successfully.');
      setTemplatesList(prev => prev.filter(t => t.id !== templateId));
    } catch (err) {
      console.warn('Failed to delete template:', err);
      Alert.alert('Error', 'Failed to delete routine template.');
    }
  };

  const { updateTaskStatus: updateContextTaskStatus } = useTasks();
  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      // Route through TaskContext so optimistic update propagates to patient screen too
      await updateContextTaskStatus(taskId, status as any);
    } catch (err) {
      console.warn('Failed to update task status:', err);
      Alert.alert('Error', 'Failed to update routine task status.');
    }
  };

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
        if (t.status === 'missed' || t.status === 'overdue' || isPast) {
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
      if (t.status === 'missed')  out.push({ id: `missed-${t.id}`,  emoji: t.icon ?? '', title: 'Missed routine',     message: t.title, severity: 'high' });
      if (t.status === 'overdue') out.push({ id: `overdue-${t.id}`, emoji: t.icon ?? '', title: 'Overdue — act now',   message: t.title, severity: 'high' });
      if (t.status === 'unsure')  out.push({ id: `unsure-${t.id}`,  emoji: t.icon ?? '', title: 'Needs follow-up',    message: t.title, severity: 'medium' });
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
            onOpenAdd={() => navigation.navigate('CaregiverRoutineEditorScreen', { patientId, patientName, mode: 'create' })}
            onOpenEdit={(routine) => navigation.navigate('CaregiverRoutineEditorScreen', { patientId, patientName, mode: 'edit', routine })}
            onDeleteTemplate={handleDeleteTemplate}
            onUpdateTaskStatus={handleUpdateTaskStatus}
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
            onShowPatientProfile={() => setShowPatientProfile(true)}
            onShowRoutineSummary={() => setShowRoutineSummary(true)}
            onDismissCallout={(id) => setDismissedCallouts(prev => new Set(prev).add(id))}
            onSendReminder={sendReminder}
            onNavigateManage={() => setActiveTab('Manage')}
            onNavigateGeofenceMap={() => navigation.navigate('CaregiverPatientMapScreen', { patientId, patientName })}
            onNavigateGeofenceEditor={() => navigation.navigate('CaregiverGeofenceEditorScreen', {
              patientId, patientName,
              existingZone: zones[0] ? { id: zones[0].id, label: zones[0].label, center: zones[0].center, radiusM: zones[0].radiusM } : null,
            })}
            relationshipStatus={relStatus}
            carePlan={carePlan}
            onNavigateAssessment={() => navigation.navigate('CaregiverAssessmentScreen', { patientId, patientName })}
            onCompleteMeeting={handleCompleteMeeting}
            onNavigateCareCircle={() => navigation.navigate('CaregiverCareCircleScreen', { patientId, patientName })}
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
                { filter: (t: typeof patientTasks[0]) => t.status === 'missed',  bg: '#FEF2F2', border: '#FECACA', label: 'Missed',    dot: '#DC2626', textColor: '#991B1B' },
                { filter: (t: typeof patientTasks[0]) => t.status === 'pending' || t.status === 'unsure', bg: '#FFFBEB', border: '#FDE68A', label: 'Pending',   dot: '#F59E0B', textColor: '#92400E' },
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
                        <Text style={rSumStyles.taskEmoji}>{t.icon ?? '📋'}</Text>
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
              { label: 'Date of Birth', value: patientDetails?.dob ?? '—',        emoji: '🎂' },
              { label: 'Gender',        value: patientDetails?.gender ?? '—',      emoji: '👤' },
              { label: 'City',          value: patientDetails?.city ?? '—',        emoji: '📍' },
              { label: 'Language',      value: patientDetails?.language ?? 'English', emoji: '🌐' },
              { label: 'Patient ID',    value: patientId,                           emoji: '🆔' },
            ]).map(row => (
              <View key={row.label} style={styles.profileModalRow}>
                <Text style={styles.profileModalRowEmoji}>{row.emoji}</Text>
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
    </ScreenContainer>
  );
};
