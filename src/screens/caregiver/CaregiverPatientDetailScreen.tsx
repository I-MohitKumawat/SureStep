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
import { Animated, Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CaregiverStackParams } from '../../types/navigation.types';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useTasks } from '../../context/TaskContext';
import { styles, rSumStyles } from '../../components/caregiver/dashboard/dashboardStyles';
import { DashboardHomeTab }    from '../../components/caregiver/dashboard/DashboardHomeTab';
import { DashboardAlertsTab }  from '../../components/caregiver/dashboard/DashboardAlertsTab';
import { DashboardManageTab }  from '../../components/caregiver/dashboard/DashboardManageTab';
import { F } from '../../theme/fonts';
import { C } from '../../theme/colors';
import {
  IconDashboard, IconBell, IconActivity,
} from '../../../app/assets/icons/NavIcons';
import {
  checkBreach,
  fetchPatientGeofences,
  fetchLatestPatientLocation,
  subscribeToPatientLocation,
  haversineMeters,
  DEFAULT_GEOFENCE,
  type Coords,
  type GeofenceZone,
} from '../../../app/utils/geofence';

// ─── Types ────────────────────────────────────────────────────────────────────
type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverPatientDetailScreen'>;
type CaregiverTab = 'Home' | 'Alerts' | 'Manage';
type EditingTask  = { id: string; title: string; description: string; time: string; icon: string; status: string };
type PatientDetails = { fullName: string; dob: string; gender: string; city: string; language: string };

const TAB_ICON_COMPONENTS: Record<CaregiverTab, React.FC<{ active: boolean }>> = {
  Home:   ({ active }) => <IconDashboard size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Alerts: ({ active }) => <IconBell      size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Manage: ({ active }) => <IconActivity  size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
};

export const CaregiverPatientDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const patientId    = route.params.patientId;
  const patientName  = route.params.patientName;

  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask } = useTasks();
  const patientTasks  = useMemo(() => tasks.filter(t => t.patientId === patientId), [tasks, patientId]);
  const manageLoading = tasksLoading && patientTasks.length === 0;

  // ── Tab state ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<CaregiverTab>('Home');

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
  const [batteryLevel,    setBatteryLevel]    = useState(82);
  const [patientCoords,   setPatientCoords]   = useState<Coords | null>(null);
  const [coordsTs,        setCoordsTs]        = useState(0);
  const [zones,           setZones]           = useState<GeofenceZone[]>([]);
  const [unackedAlerts,   setUnackedAlerts]   = useState(0);
  const [hasRealLocation, setHasRealLocation] = useState(false);
  const [hasRealZones,    setHasRealZones]    = useState(false);

  useEffect(() => {
    void fetchPatientGeofences(patientId).then((z) => { setZones(z); setHasRealZones(z.length > 0); });
    setUnackedAlerts(0);
  }, [patientId]);

  useEffect(() => {
    void fetchLatestPatientLocation(patientId).then((loc) => {
      if (loc) { setPatientCoords({ latitude: loc.latitude, longitude: loc.longitude }); setCoordsTs(loc.recordedAt); setHasRealLocation(true); }
    });
  }, [patientId]);

  useEffect(() => {
    const unsub = subscribeToPatientLocation(patientId, (loc) => {
      setPatientCoords({ latitude: loc.latitude, longitude: loc.longitude });
      setCoordsTs(loc.recordedAt);
      setHasRealLocation(true);
    });
    return unsub;
  }, [patientId]);

  // ── Patient profile modal ────────────────────────────────────────────────
  const [showPatientProfile, setShowPatientProfile] = useState(false);
  const [patientDetails,     setPatientDetails]     = useState<PatientDetails | null>(null);

  useEffect(() => {
    setPatientDetails({ fullName: patientName, dob: '—', gender: '—', city: '—', language: 'English' });
  }, [patientName]);

  // ── Manage-tab modal form state ──────────────────────────────────────────
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [editingRoutine,   setEditingRoutine]   = useState<EditingTask | null>(null);
  const [form,             setForm]             = useState({ title: '', description: '', time: '08:00', icon: '🍽️' });
  const [formError,        setFormError]        = useState<string | null>(null);
  const [saving,           setSaving]           = useState(false);

  const openAddRoutine = () => { setEditingRoutine(null); setForm({ title: '', description: '', time: '08:00', icon: '🍽️' }); setFormError(null); setShowRoutineModal(true); };
  const openEditRoutine = (task: EditingTask) => { setEditingRoutine(task); setForm({ title: task.title, description: task.description, time: task.time, icon: task.icon }); setFormError(null); setShowRoutineModal(true); };

  const saveRoutine = async () => {
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    if (!form.time.trim())  { setFormError('Time is required.');  return; }
    setSaving(true); setFormError(null);
    try {
      if (editingRoutine) await updateTask(editingRoutine.id, { title: form.title, description: form.description, time: form.time, icon: form.icon });
      else await createTask({ patientId, title: form.title, description: form.description, time: form.time, icon: form.icon });
      setShowRoutineModal(false);
    } catch { setFormError('Save failed. Please try again.'); }
    finally { setSaving(false); }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const batteryColor  = batteryLevel >= 50 ? C.safeText : batteryLevel >= 20 ? '#D97706' : C.error;
  const capsuleScrollY = useRef(new Animated.Value(0)).current;

  const routineItems = useMemo(() =>
    patientTasks.slice().sort((a, b) => a.time.localeCompare(b.time)).map(t => ({
      key: t.id, emoji: t.icon ?? '📋', title: t.title,
      meta: t.description ? `${t.time} · ${t.description}` : t.time,
      done: t.status === 'done', status: t.status,
    })), [patientTasks]);

  const activeRoutineIndex = useMemo(() => {
    const i = routineItems.findIndex(r => r.status === 'pending' || r.status === 'unsure');
    return i === -1 ? Math.max(routineItems.length - 1, 0) : i;
  }, [routineItems]);

  const routineCallouts = useMemo(() => {
    const out: Array<{ id: string; emoji: string; title: string; message: string; severity: 'high' | 'medium' }> = [];
    for (const t of patientTasks) {
      if (t.status === 'missed') out.push({ id: `missed-${t.id}`, emoji: t.icon ?? '📋', title: 'Missed routine', message: t.title, severity: 'high' });
      else if (t.status === 'unsure') out.push({ id: `unsure-${t.id}`, emoji: t.icon ?? '📋', title: 'Needs follow-up', message: t.title, severity: 'medium' });
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
          <Pressable onPress={() => navigation.navigate('CaregiverProfileEditScreen')} style={({ pressed }) => [styles.myProfileBtn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.myProfileBtnText}>👤 My Profile</Text>
          </Pressable>
        </View>

        {/* Tab content */}
        {activeTab === 'Alerts' ? (
          <DashboardAlertsTab
            nonRoutineAlerts={nonRoutineAlerts}
            seenNonRoutineIds={seenNonRoutineIds}
            onAcknowledge={(id) => setAcknowledgedIds(prev => new Set(prev).add(id))}
          />
        ) : activeTab === 'Manage' ? (
          <DashboardManageTab
            patientName={patientName}
            patientTasks={patientTasks}
            manageLoading={manageLoading}
            showRoutineModal={showRoutineModal}
            editingRoutine={editingRoutine}
            form={form}
            formError={formError}
            saving={saving}
            onOpenAdd={openAddRoutine}
            onOpenEdit={openEditRoutine}
            onDelete={(id) => void deleteTask(id)}
            onSave={() => void saveRoutine()}
            onCloseModal={() => setShowRoutineModal(false)}
            onFormChange={(patch) => setForm(f => ({ ...f, ...patch }))}
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
            activeRoutineIndex={activeRoutineIndex}
            routineItems={routineItems}
            routineCallouts={routineCallouts}
            dismissedCallouts={dismissedCallouts}
            reminderSentKeys={reminderSentKeys}
            capsuleScrollY={capsuleScrollY}
            showRoutineSummary={showRoutineSummary}
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
