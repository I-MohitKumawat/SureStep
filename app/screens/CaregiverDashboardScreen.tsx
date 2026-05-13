import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { useTasks } from '../context/taskContext';
import { readPatientProfile } from '../utils/sharedProfile';
import { supabase } from '../utils/supabaseClient';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import {
  IconDashboard,
  IconBell,
  IconActivity,
} from '../assets/icons/NavIcons';
import {
  checkBreach,
  fetchPatientGeofences,
  fetchLatestPatientLocation,
  subscribeToPatientLocation,
  haversineMeters,
  DEFAULT_GEOFENCE,
  type Coords,
  type GeofenceZone,
  type BreachStatus,
} from '../utils/geofence';

type Props = NativeStackScreenProps<HomeStackParamList, 'CaregiverDashboard'>;
type CaregiverTab = 'Home' | 'Alerts' | 'Manage';

type TabIconProps = { active: boolean };
const TAB_ICON_COMPONENTS: Record<CaregiverTab, React.FC<TabIconProps>> = {
  Home:   ({ active }) => <IconDashboard size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Alerts: ({ active }) => <IconBell     size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Manage: ({ active }) => <IconActivity size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
};

export const CaregiverDashboardScreen: React.FC<Props> = ({ navigation, route }) => {
  const CAPSULE_HEIGHT = 84;
  const CAPSULE_GAP = 12;
  const CAPSULE_STEP = CAPSULE_HEIGHT + CAPSULE_GAP;
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask } = useTasks();
  const [reminderSentKeys, setReminderSentKeys] = React.useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = React.useState<CaregiverTab>('Home');
  // Level 1 – routine callout dismiss tracking
  const [dismissedCallouts, setDismissedCallouts] = React.useState<Set<string>>(new Set());
  // Level 2 – non-routine alert seen tracking
  const [seenNonRoutineIds, setSeenNonRoutineIds] = React.useState<Set<string>>(new Set());
  const [acknowledgedIds, setAcknowledgedIds] = React.useState<Set<string>>(new Set());
  // Routine summary modal
  const [showRoutineSummary, setShowRoutineSummary] = React.useState(false);

  // Patient identity comes from route params — never from AsyncStorage
  const patientPhone = route.params?.patientPhone ?? '';
  const [patientName, setPatientName] = React.useState(
    route.params?.patientName ?? 'Patient'
  );
  const [batteryLevel,    setBatteryLevel]    = React.useState(82);
  const [patientCoords,   setPatientCoords]   = React.useState<Coords | null>(null);
  const [coordsTs,        setCoordsTs]        = React.useState(0);
  const [zones,           setZones]           = React.useState<GeofenceZone[]>([]);
  const [unackedAlerts,   setUnackedAlerts]   = React.useState(0);
  // True only when we have REAL Supabase data (not fallback placeholders)
  const [hasRealLocation, setHasRealLocation] = React.useState(false);
  const [hasRealZones,    setHasRealZones]    = React.useState(false);
  const reminderTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const capsuleScrollY = React.useRef(new Animated.Value(0)).current;

  // ── Patient profile details (for avatar-tap modal) ───────────────────
  const [showPatientProfile, setShowPatientProfile] = React.useState(false);
  type PatientDetails = { fullName: string; dob: string; gender: string; city: string; language: string };
  const [patientDetails, setPatientDetails] = React.useState<PatientDetails | null>(null);

  // ── Manage-tab modal form state (pure UI — data lives in context) ────────
  const ICON_OPTIONS = ['🍽️', '💊', '🚶', '🛁', '🛌', '🏋️', '🩺', '📖', '☕', '🧘', '🚗', '💧'];
  type EditingTask = { id: string; title: string; description: string; time: string; icon: string; status: string };
  const [showRoutineModal, setShowRoutineModal] = React.useState(false);
  const [editingRoutine,   setEditingRoutine]   = React.useState<EditingTask | null>(null);
  const [form,             setForm]             = React.useState({ title: '', description: '', time: '08:00', icon: '🍽️' });
  const [formError,        setFormError]        = React.useState<string | null>(null);
  const [saving,           setSaving]           = React.useState(false);

  // patientTasks — strictly this patient's tasks from the shared context
  const patientId = patientPhone;
  const patientTasks  = React.useMemo(() => tasks.filter(t => t.patientId === patientId), [tasks, patientId]);
  // manageLoading is just the global context loading flag on first mount
  const manageLoading = tasksLoading && patientTasks.length === 0;

  const openAddRoutine = () => {
    setEditingRoutine(null);
    setForm({ title: '', description: '', time: '08:00', icon: '🍽️' });
    setFormError(null);
    setShowRoutineModal(true);
  };

  const openEditRoutine = (task: EditingTask) => {
    setEditingRoutine(task);
    setForm({ title: task.title, description: task.description, time: task.time, icon: task.icon });
    setFormError(null);
    setShowRoutineModal(true);
  };

  const saveRoutine = async () => {
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    if (!form.time.trim())  { setFormError('Time is required.'); return; }
    setSaving(true); setFormError(null);
    try {
      if (editingRoutine) {
        await updateTask(editingRoutine.id, {
          title: form.title, description: form.description, time: form.time, icon: form.icon,
        });
      } else {
        await createTask({
          patientId, title: form.title, description: form.description, time: form.time, icon: form.icon,
        });
      }
      setShowRoutineModal(false);
    } catch (e) {
      setFormError('Save failed. Please try again.');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    await deleteTask(id);
  };

  // ── Last activity: derive from most recent completedAt across tasks ──────
  const lastActivityLabel = (() => {
    const completedTimes = patientTasks
      .filter((t) => t.completedAt)
      .map((t) => new Date(t.completedAt!).getTime());
    if (completedTimes.length === 0) return 'No activity yet';
    const latestMs = Math.max(...completedTimes);
    const diffMin = Math.round((Date.now() - latestMs) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin === 1) return '1 MIN AGO';
    if (diffMin < 60) return `${diffMin} MINS AGO`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr} HR${diffHr > 1 ? 'S' : ''} AGO`;
  })();

  // Load patient battery from shared profile (only supplemental — name comes from params)
  const loadProfile = useCallback(() => {
    readPatientProfile().then((p) => {
      if (p && typeof p.batteryLevel === 'number') setBatteryLevel(p.batteryLevel);
    });
  }, []);

  useEffect(() => {
    loadProfile();
    const interval = setInterval(loadProfile, 30_000);
    return () => clearInterval(interval);
  }, [loadProfile]);

  // Load patient DB details for the Profile modal
  useEffect(() => {
    supabase
      .from('mock_users')
      .select('full_name, dob, gender, city, language')
      .eq('phone_number', patientPhone)
      .single()
      .then(({ data }) => {
        if (data) {
          setPatientDetails({
            fullName: data.full_name ?? patientName,
            dob: data.dob ?? '—',
            gender: data.gender ?? '—',
            city: data.city ?? '—',
            language: data.language ?? 'English',
          });
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientPhone]);

  // patientId already defined above
  const completedTasks = patientTasks.filter((t) => t.status === 'done').length;
  const totalTasks = patientTasks.length;

  useEffect(() => () => { if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current); }, []);

  // ── Load zones + unacked alerts from Supabase ─────────────────────
  useEffect(() => {
    void fetchPatientGeofences(patientId).then((z) => {
      setZones(z);
      setHasRealZones(z.length > 0);
    });
    supabase
      .from('geofence_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .is('acknowledged_at', null)
      .then(({ count }) => setUnackedAlerts(count ?? 0));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // ── Read PATIENT location from Supabase (not caregiver's own GPS) ────────
  // 1. Fetch last known location on mount
  useEffect(() => {
    void fetchLatestPatientLocation(patientId).then((loc) => {
      if (loc) {
        setPatientCoords({ latitude: loc.latitude, longitude: loc.longitude });
        setCoordsTs(loc.recordedAt);
        setHasRealLocation(true);
      }
      // If null: no pings yet — leave patientCoords null, show "Locating"
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // 2. Subscribe to live pings from the patient device via Supabase Realtime
  useEffect(() => {
    const unsub = subscribeToPatientLocation(patientId, (loc) => {
      setPatientCoords({ latitude: loc.latitude, longitude: loc.longitude });
      setCoordsTs(loc.recordedAt);
      setHasRealLocation(true);
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);


  const openDialPad = async () => Linking.openURL('tel:');

  const sendReminder = (key: string) => {
    setReminderSentKeys((prev) => new Set(prev).add(key));
    if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);
    reminderTimerRef.current = setTimeout(() => {
      setReminderSentKeys((prev) => { const s = new Set(prev); s.delete(key); return s; });
    }, 2500);
  };

  const batteryColor = batteryLevel >= 50 ? C.safeText : batteryLevel >= 20 ? '#D97706' : C.error;

  // ── Live capsule items from context ─────────────────────────────────────
  // Each task is a capsule — sorted by time asc, using real Supabase status.
  const routineItems = React.useMemo(() =>
    patientTasks
      .slice()
      .sort((a, b) => a.time.localeCompare(b.time))
      .map(t => ({
        key:   t.id,
        emoji: t.icon ?? '📋',
        title: t.title,
        meta:  t.description ? `${t.time} · ${t.description}` : t.time,
        done:  t.status === 'done',
        status: t.status,
      }))
  , [patientTasks]);

  const activeRoutineIndex = useMemo(() => {
    const firstPendingIndex = routineItems.findIndex(item => item.status === 'pending' || item.status === 'unsure');
    return firstPendingIndex === -1 ? Math.max(routineItems.length - 1, 0) : firstPendingIndex;
  }, [routineItems]);

  const getCapsuleColors = (itemIndex: number, done: boolean) => {
    if (itemIndex < activeRoutineIndex) {
      return done
        ? { backgroundColor: C.safeText, borderColor: C.safeText, titleColor: C.primaryText, metaColor: C.primaryText, statusColor: C.primaryText }
        : { backgroundColor: C.error, borderColor: C.error, titleColor: C.primaryText, metaColor: C.primaryText, statusColor: C.primaryText };
    }
    if (itemIndex === activeRoutineIndex) {
      return { backgroundColor: C.primary, borderColor: C.primary, titleColor: C.primaryText, metaColor: C.primaryText, statusColor: C.primaryText };
    }
    return {
      backgroundColor: C.borderMid,
      borderColor: C.borderMid,
      titleColor: C.textPrimary,
      metaColor: C.textSecondary,
      statusColor: C.textSecondary,
    };
  };

  // ── Level 1: routine callouts (missed / unsure tasks only) ─────────────────
  const routineCallouts = useMemo(() => {
    type Callout = { id: string; emoji: string; title: string; message: string; severity: 'high' | 'medium' };
    const out: Callout[] = [];
    for (const t of patientTasks) {
      if (t.status === 'missed') {
        out.push({ id: `missed-${t.id}`, emoji: t.icon ?? '📋', title: 'Missed routine', message: t.title, severity: 'high' });
      } else if (t.status === 'unsure') {
        out.push({ id: `unsure-${t.id}`, emoji: t.icon ?? '📋', title: 'Needs follow-up', message: t.title, severity: 'medium' });
      }
    }
    return out.filter(c => !dismissedCallouts.has(c.id));
  }, [patientTasks, dismissedCallouts]);

  // ── Level 2: non-routine alerts (battery / geofence / etc.) ────────────────
  type NonRoutineAlert = { id: string; type: string; emoji: string; title: string; message: string; severity: 'critical' | 'high' | 'medium' | 'low' };
  const nonRoutineAlerts = useMemo(() => {
    const out: NonRoutineAlert[] = [];
    if (batteryLevel < 20) {
      out.push({ id: 'battery-low', type: 'battery_critical', emoji: '🔋', title: 'Critical Battery', message: `Device battery at ${batteryLevel}% — charge required`, severity: 'high' });
    }
    if (patientCoords && zones.length > 0) {
      const breach = checkBreach(patientCoords, zones);
      if (breach.status === 'breach') {
        out.push({
          id: 'geo-outside', type: 'geofence_breach', emoji: '📍',
          title: 'Outside safe zone',
          message: `${Math.round(breach.distanceM)}m beyond boundary`,
          severity: 'high',
        });
      } else if (breach.status === 'approaching') {
        out.push({
          id: 'geo-approaching', type: 'geofence_approaching', emoji: '🚶',
          title: 'Approaching zone boundary',
          message: `${Math.round(breach.marginM)}m from edge of ${breach.zone.label}`,
          severity: 'medium',
        });
      }
    }
    if (unackedAlerts > 0) {
      out.push({
        id: 'geo-unacked', type: 'geofence_unacked', emoji: '🔔',
        title: 'Unacknowledged breach alerts',
        message: `${unackedAlerts} alert${unackedAlerts > 1 ? 's' : ''} waiting for acknowledgement`,
        severity: 'medium',
      });
    }
    const rank: Record<NonRoutineAlert['severity'], number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
  }, [batteryLevel, patientCoords, patientId, patientTasks, zones, unackedAlerts]);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topNavRow}>
          <Pressable
            onPress={() => navigation.navigate('CaregiverPatients')}
            style={({ pressed }) => [styles.backNavBtn, pressed && { opacity: 0.72 }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backNavText}>← Back</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('CaregiverProfileEdit')}
            style={({ pressed }) => [styles.myProfileBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.myProfileBtnText}>👤 My Profile</Text>
          </Pressable>
        </View>

        {activeTab === 'Alerts' ? (
          <View style={styles.alertsContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <Text style={styles.alertsTitle}>Safety Alerts</Text>
              {nonRoutineAlerts.length > 0 && (
                <View style={alertStyles.countBadge}>
                  <Text style={alertStyles.countBadgeText}>{nonRoutineAlerts.length}</Text>
                </View>
              )}
            </View>
            <Text style={alertStyles.sectionLabel}>NON-ROUTINE ALERTS</Text>
            {nonRoutineAlerts.length === 0 ? (
              <View style={alertStyles.emptyBox}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
                <Text style={alertStyles.emptyTitle}>All Clear</Text>
                <Text style={alertStyles.emptyMsg}>No safety alerts at this time.</Text>
              </View>
            ) : nonRoutineAlerts.map((alert) => {
              const isSeen = seenNonRoutineIds.has(alert.id);
              const sevColors = alert.severity === 'critical'
                ? { bg: '#FEE2E2', border: '#FECACA', dot: '#DC2626' }
                : alert.severity === 'high'
                ? { bg: '#FEF3C7', border: '#FDE68A', dot: '#F59E0B' }
                : { bg: '#E5E7EB', border: '#D1D5DB', dot: '#9CA3AF' };
              return (
                <View key={alert.id} style={[alertStyles.card, { backgroundColor: sevColors.bg, borderColor: sevColors.border }, isSeen && alertStyles.cardSeen]}>
                  <View style={[alertStyles.dot, { backgroundColor: sevColors.dot }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[alertStyles.cardTitle, !isSeen && alertStyles.unseen]}>{alert.emoji}  {alert.title}</Text>
                    <Text style={[alertStyles.cardMsg, isSeen && alertStyles.seenMsg]}>{alert.message}</Text>
                    <Text style={alertStyles.cardTime}>{alert.severity.toUpperCase()} · {alert.type.replace(/_/g, ' ')}</Text>
                  </View>
                  <View style={{ gap: 6 }}>
                    <Pressable
                      onPress={() => void openDialPad()}
                      style={({ pressed }) => [alertStyles.callBtn, pressed && { opacity: 0.8 }]}
                    >
                      <Text style={alertStyles.callBtnText}>📞 Call</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setAcknowledgedIds(prev => new Set(prev).add(alert.id))}
                      style={({ pressed }) => [alertStyles.ackBtn, pressed && { opacity: 0.8 }]}
                    >
                      <Text style={alertStyles.ackBtnText}>✓ Done</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : activeTab === 'Manage' ? (
          <View style={mStyles.container}>
            {/* Header row */}
            <View style={mStyles.headerRow}>
              <View>
                <Text style={mStyles.title}>Daily Flow</Text>
                <Text style={mStyles.sub}>For {patientName}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [mStyles.addBtn, pressed && { opacity: 0.85 }]}
                onPress={openAddRoutine}
              >
                <Text style={mStyles.addBtnPlus}>＋</Text>
                <Text style={mStyles.addBtnText}>Add Routine</Text>
              </Pressable>
            </View>

            {manageLoading ? (
              <Text style={mStyles.emptyText}>Loading…</Text>
            ) : patientTasks.length === 0 ? (
              <View style={mStyles.emptyWrap}>
                <Text style={mStyles.emptyEmoji}>📋</Text>
                <Text style={mStyles.emptyText}>No routines yet.</Text>
                <Text style={mStyles.emptyHint}>Tap "Add Routine" to get started.</Text>
              </View>
            ) : (
              patientTasks
                .slice()
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((task) => (
                <View key={task.id} style={mStyles.card}>
                  {/* Icon circle */}
                  <View style={mStyles.iconCircle}>
                    <Text style={mStyles.iconEmoji}>{task.icon ?? '📋'}</Text>
                  </View>

                  {/* Main content */}
                  <View style={mStyles.cardBody}>
                    {/* Time + status badge + actions */}
                    <View style={mStyles.cardTopRow}>
                      <Text style={mStyles.cardTime}>{task.time}</Text>
                      {task.status === 'pending' && (
                        <View style={mStyles.pendingBadge}>
                          <Text style={mStyles.pendingText}>PENDING</Text>
                        </View>
                      )}
                      {task.status === 'done' && (
                        <View style={[mStyles.pendingBadge, mStyles.doneBadge]}>
                          <Text style={[mStyles.pendingText, { color: C.primary }]}>DONE</Text>
                        </View>
                      )}
                      {task.status === 'missed' && (
                        <View style={[mStyles.pendingBadge, mStyles.missedBadge]}>
                          <Text style={[mStyles.pendingText, { color: '#DC2626' }]}>MISSED</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }} />
                      <Pressable
                        onPress={() => openEditRoutine({
                          id: task.id,
                          title: task.title,
                          description: task.description ?? '',
                          time: task.time,
                          icon: task.icon ?? '📋',
                          status: task.status,
                        })}
                        hitSlop={10}
                        style={({ pressed }) => [mStyles.actionBtn, pressed && { opacity: 0.55 }]}
                      >
                        <Text style={mStyles.editIcon}>✏️</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => void handleDeleteRoutine(task.id)}
                        hitSlop={10}
                        style={({ pressed }) => [mStyles.actionBtn, mStyles.deleteBtn, pressed && { opacity: 0.55 }]}
                      >
                        <Text style={mStyles.deleteIcon}>🗑</Text>
                      </Pressable>
                    </View>
                    <Text style={mStyles.cardTitle}>{task.title}</Text>
                    {!!task.description && (
                      <Text style={mStyles.cardDesc} numberOfLines={2}>{task.description}</Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <>

        {/* ── Patient Header ─────────────────────────────────────────── */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            {/* Avatar */}
            <Pressable
              onPress={() => setShowPatientProfile(true)}
              style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.75 }]}
            >
              <Text style={styles.avatarInitial}>{patientName[0]?.toUpperCase() ?? 'S'}</Text>
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.overview}>PATIENT OVERVIEW</Text>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{patientName}</Text>
              </View>
              <Text style={styles.lastActivity}>LAST ACTIVITY · {lastActivityLabel}</Text>
              {/* Call + battery inline beneath name */}
              <View style={styles.headerActions}>
                <Pressable
                  style={({ pressed }) => [styles.headerActionBtn, styles.headerCallBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => void openDialPad()}
                >
                  <Text style={styles.headerActionIcon}>📞</Text>
                  <Text style={styles.headerCallLabel}>Call</Text>
                </Pressable>
                <View style={styles.headerBatteryChip}>
                  <Text style={styles.headerActionIcon}>🔋</Text>
                  <Text style={[styles.headerBatteryLabel, { color: batteryColor }]}>{batteryLevel}%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Routine section + geofence card sibling block */}
        </View>
        {/* ── Daily Routine ──────────────────────────────────── */}
        {routineItems.length === 0 ? (
          <View style={styles.routineOuterContainer}>
            <Pressable
              style={{ alignItems: 'center', paddingVertical: 28 }}
              onPress={() => setActiveTab('Manage')}
            >
              <Text style={{ fontSize: 36, marginBottom: 10 }}>📋</Text>
              <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.textPrimary, textAlign: 'center' }}>
                No routines yet
              </Text>
              <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.textSecondary, marginTop: 4, textAlign: 'center' }}>
                Tap here or go to Manage to add routines for {patientName}.
              </Text>
            </Pressable>
          </View>
        ) : (
        <View style={styles.routineOuterContainer}>
          {/* ── Routine Summary Bar ───────────────────────────────────── */}
          {(() => {
            const missedTasks  = patientTasks.filter(t => t.status === 'missed');
            const pendingTasks = patientTasks.filter(t => t.status === 'pending' || t.status === 'unsure');
            const doneTasks    = patientTasks.filter(t => t.status === 'done');
            return (
              <Pressable
                style={({ pressed }) => [rSumStyles.bar, pressed && { opacity: 0.88 }]}
                onPress={() => setShowRoutineSummary(true)}
              >
                <View style={rSumStyles.statChip}>
                  <View style={[rSumStyles.statDot, { backgroundColor: '#DC2626' }]} />
                  <Text style={rSumStyles.statNum}>{missedTasks.length}</Text>
                  <Text style={rSumStyles.statLabel}>Missed</Text>
                </View>
                <View style={rSumStyles.divider} />
                <View style={rSumStyles.statChip}>
                  <View style={[rSumStyles.statDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={rSumStyles.statNum}>{pendingTasks.length}</Text>
                  <Text style={rSumStyles.statLabel}>Pending</Text>
                </View>
                <View style={rSumStyles.divider} />
                <View style={rSumStyles.statChip}>
                  <View style={[rSumStyles.statDot, { backgroundColor: '#10B981' }]} />
                  <Text style={rSumStyles.statNum}>{doneTasks.length}</Text>
                  <Text style={rSumStyles.statLabel}>Completed</Text>
                </View>
                <Text style={rSumStyles.chevron}>›</Text>
              </Pressable>
            );
          })()}

          {/* ── Level 1: Routine Alert Callouts ──────────────────────────── */}
          {routineCallouts.length > 0 && (
            <View style={alertStyles.calloutStrip}>
              <Text style={alertStyles.calloutHeader}>⚠️  Routine Alerts</Text>
              {routineCallouts.map(c => (
                <View key={c.id} style={[alertStyles.calloutChip, c.severity === 'high' ? alertStyles.calloutHigh : alertStyles.calloutMed]}>
                  <Text style={alertStyles.calloutEmoji}>{c.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={alertStyles.calloutTitle}>{c.title}</Text>
                    <Text style={alertStyles.calloutMsg}>{c.message}</Text>
                  </View>
                  <Pressable
                    hitSlop={10}
                    onPress={() => setDismissedCallouts(prev => new Set(prev).add(c.id))}
                    style={({ pressed }) => [alertStyles.dismissBtn, pressed && { opacity: 0.6 }]}
                  >
                    <Text style={alertStyles.dismissText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          <View style={styles.routineListViewport}>
            <Animated.ScrollView
              nestedScrollEnabled
              bounces={false}
              showsVerticalScrollIndicator={false}
              snapToInterval={CAPSULE_STEP}
              decelerationRate="fast"
              disableIntervalMomentum
              contentContainerStyle={styles.routineListContent}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { y: capsuleScrollY } } }],
                  { useNativeDriver: true },
                )}
                scrollEventThrottle={16}
              >
                {routineItems.map((item, index) => {
                  const capsuleColors = getCapsuleColors(index, item.done);
                  const scale = capsuleScrollY.interpolate({
                    inputRange: [(index - 1) * CAPSULE_STEP, index * CAPSULE_STEP, (index + 1) * CAPSULE_STEP],
                    outputRange: [0.92, 1, 0.92],
                    extrapolate: 'clamp',
                  });

                  return (
                    <Animated.View
                      key={item.key}
                      style={[
                        styles.routineCapsule,
                        {
                          backgroundColor: capsuleColors.backgroundColor,
                          borderColor: capsuleColors.borderColor,
                          transform: [{ scale }],
                          opacity: 1,
                        },
                      ]}
                    >
                      <View style={styles.routineCapsuleTextCol}>
                        <Text style={[styles.routineCapsuleTitle, { color: capsuleColors.titleColor }]}>
                          {item.emoji}  {item.title}
                        </Text>
                        <Text style={[styles.routineCapsuleMeta, { color: capsuleColors.metaColor }]}>
                          {item.meta}
                        </Text>
                      </View>

                      <View style={styles.capsuleRight}>
                        <Text style={[styles.routineCapsuleStatus, { color: capsuleColors.statusColor }]}>
                          {index < activeRoutineIndex
                            ? (item.done ? 'Done' : 'Missed')
                            : index === activeRoutineIndex
                            ? 'Now'
                            : 'Next'}
                        </Text>

                        <Pressable
                          onPress={() => sendReminder(item.key)}
                          style={({ pressed }) => [styles.capsuleReminderBtn, pressed && { opacity: 0.72 }]}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.capsuleReminderIcon}>
                            {reminderSentKeys.has(item.key) ? '✓' : '🔔'}
                          </Text>
                        </Pressable>
                      </View>
                    </Animated.View>
                  );
                })}
            </Animated.ScrollView>
          </View>
        </View>
        )}


          {/* ── Geofence Status Card (v2 — at-a-glance) ─────────────── */}
          {(() => {
            const coordsAgeS = coordsTs > 0 ? Math.floor((Date.now() - coordsTs) / 1000) : 999;
            // Only compute breach when we have REAL data from Supabase
            // (prevents false "Safe at Home" when both location and zones are defaults)
            const breach: BreachStatus = hasRealLocation && hasRealZones && patientCoords
              ? checkBreach(patientCoords, zones)
              : { status: 'no_signal' };

            // ── Visual config per state ────────────────────────────────
            type GeoCardCfg = { bg: string; border: string; dotColor: string; icon: string; title: string; titleColor: string };
            const cfg: GeoCardCfg = coordsAgeS > 120
              ? { bg: '#1F2937', border: '#374151', dotColor: '#6B7280', icon: '📵', title: 'No Signal', titleColor: '#D1D5DB' }
              : breach.status === 'safe'
              ? { bg: '#ECFDF5', border: '#10B981',  dotColor: '#10B981',  icon: '🏠', title: 'Safe at Home',        titleColor: '#065F46' }
              : breach.status === 'approaching'
              ? { bg: '#FFFBEB', border: '#F59E0B',  dotColor: '#F59E0B',  icon: '🚶', title: 'Moving Nearby',       titleColor: '#92400E' }
              : breach.status === 'breach'
              ? { bg: '#FEF2F2', border: '#EF4444',  dotColor: '#EF4444',  icon: '⚠️', title: 'Outside Safe Area',   titleColor: '#991B1B' }
              : { bg: C.surface, border: C.border,   dotColor: C.textMuted, icon: '📡', title: 'Locating Patient…',   titleColor: C.textSecondary };

            // Distance label
            const distLabel = (() => {
              if (!patientCoords || zones.length === 0) return 'Acquiring GPS signal…';
              const nearest = zones.reduce((best, z) => {
                const d = haversineMeters(z.center.latitude, z.center.longitude, patientCoords.latitude, patientCoords.longitude);
                const bd = haversineMeters(best.center.latitude, best.center.longitude, patientCoords.latitude, patientCoords.longitude);
                return d < bd ? z : best;
              }, zones[0]);
              const d = haversineMeters(nearest.center.latitude, nearest.center.longitude, patientCoords.latitude, patientCoords.longitude);
              return d <= nearest.radiusM
                ? `${Math.round(nearest.radiusM - d)} m inside "${nearest.label}" zone`
                : `${Math.round(d - nearest.radiusM)} m beyond "${nearest.label}" boundary`;
            })();

            return (
              <View style={[styles.geoCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                {/* Top row: icon + status + age */}
                <Pressable
                  style={styles.geoTopRow}
                  onPress={() => navigation.navigate('GeofenceMap', { patientId, patientName, caregiverPhone: patientPhone })}
                >
                  <Text style={styles.geoIcon}>{cfg.icon}</Text>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={[styles.geoTitle, { color: cfg.titleColor }]}>{cfg.title}</Text>
                    <Text style={styles.geoMeta} numberOfLines={2}>{distLabel}</Text>
                  </View>
                  {/* Unacked badge */}
                  {unackedAlerts > 0 && (
                    <View style={styles.geoAlertBadge}>
                      <Text style={styles.geoAlertBadgeText}>{unackedAlerts}</Text>
                    </View>
                  )}
                  <Text style={styles.geoChevron}>›</Text>
                </Pressable>

                {/* Bottom row: zone pills + edit + age */}
                <View style={styles.geoBottomRow}>
                  <View style={styles.geoZonePills}>
                    {zones.filter((z) => z.isActive).map((z) => (
                      <View key={z.id} style={styles.geoZonePill}>
                        <Text style={styles.geoZonePillText}>🏠 {z.label}  ⊙ {z.radiusM} m</Text>
                      </View>
                    ))}
                    {zones.length === 0 && (
                      <Text style={styles.geoNoZone}>No zone set</Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => navigation.navigate('GeofenceEditor', {
                      patientId, patientName,
                      existingZone: zones[0] ? {
                        id: zones[0].id, label: zones[0].label,
                        center: zones[0].center, radiusM: zones[0].radiusM,
                      } : null,
                    })}
                    style={({ pressed }) => [styles.geoEditBtn, pressed && { opacity: 0.75 }]}
                  >
                    <Text style={styles.geoEditBtnText}>
                      {zones.length === 0 ? '＋ Set Zone' : '✏ Edit Zone'}
                    </Text>
                  </Pressable>
                </View>

                {/* Age indicator */}
                {coordsTs > 0 && (
                  <Text style={styles.geoAge}>
                    Updated {coordsAgeS < 5 ? 'just now' : `${coordsAgeS}s ago`}
                  </Text>
                )}
              </View>
            );
          })()}
          </>
        )}
      </ScrollView>

      {/* ── Reminder Toast ─────────────────────────────────────────────── */}
      {reminderSentKeys.size > 0 && (
        <View style={styles.reminderToastWrap} pointerEvents="none">
          <View style={styles.reminderToast}>
            <Text style={styles.reminderToastText}>✓  Reminder sent to {patientName}</Text>
          </View>
        </View>
      )}

      {/* ── Add / Edit Routine Modal ──────────────────────────────────────── */}
      <Modal
        visible={showRoutineModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoutineModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={mStyles.modalOverlay} onPress={() => setShowRoutineModal(false)}>
            <Pressable style={mStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <View style={mStyles.modalHandle} />
              <Text style={mStyles.modalTitle}>{editingRoutine ? 'Edit Routine' : 'New Routine'}</Text>

              {/* Icon picker */}
              <Text style={mStyles.fieldLabel}>Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={mStyles.iconPicker}>
                {ICON_OPTIONS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => setForm((f) => ({ ...f, icon: emoji }))}
                    style={[mStyles.iconOption, form.icon === emoji && mStyles.iconOptionActive]}
                  >
                    <Text style={{ fontSize: 22 }}>{emoji}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Title */}
              <Text style={mStyles.fieldLabel}>Title *</Text>
              <TextInput
                style={mStyles.input}
                placeholder="e.g. Morning Medication"
                placeholderTextColor={C.textMuted}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                returnKeyType="next"
              />

              {/* Description */}
              <Text style={mStyles.fieldLabel}>Description</Text>
              <TextInput
                style={[mStyles.input, mStyles.inputMulti]}
                placeholder="e.g. Blood pressure tablet + Vitamins"
                placeholderTextColor={C.textMuted}
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                multiline
                numberOfLines={3}
              />

              {/* Time */}
              <Text style={mStyles.fieldLabel}>Time (HH:MM) *</Text>
              <TextInput
                style={mStyles.input}
                placeholder="08:00"
                placeholderTextColor={C.textMuted}
                value={form.time}
                onChangeText={(v) => setForm((f) => ({ ...f, time: v }))}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />

              {!!formError && <Text style={mStyles.formError}>{formError}</Text>}

              <Pressable
                style={({ pressed }) => [mStyles.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]}
                onPress={() => void saveRoutine()}
                disabled={saving}
              >
                <Text style={mStyles.saveBtnText}>{saving ? 'Saving…' : editingRoutine ? 'Save Changes' : 'Add Routine'}</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>


      {/* ── Bottom Nav ──────────────────────────────────────────────────── */}
      <View style={styles.bottomBarBand}>
        <View style={styles.bottomBar}>
          {(['Home', 'Alerts', 'Manage'] as CaregiverTab[]).map((tab) => {
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
                  {tab}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Routine Summary Modal ─────────────────────────────────────── */}
      <Modal
        visible={showRoutineSummary}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoutineSummary(false)}
      >
        <Pressable style={rSumStyles.overlay} onPress={() => setShowRoutineSummary(false)}>
          <Pressable style={rSumStyles.sheet} onPress={e => e.stopPropagation()}>
            <View style={rSumStyles.handle} />
            <Text style={rSumStyles.sheetTitle}>Routine Overview</Text>
            <Text style={rSumStyles.sheetSub}>Daily tasks for {patientName}</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 4 }}>
              {/* Missed */}
              {(() => {
                const missed = patientTasks.filter(t => t.status === 'missed');
                return missed.length > 0 ? (
                  <View style={rSumStyles.section}>
                    <View style={rSumStyles.sectionHeader}>
                      <View style={[rSumStyles.sectionDot, { backgroundColor: '#DC2626' }]} />
                      <Text style={[rSumStyles.sectionTitle, { color: '#991B1B' }]}>Missed ({missed.length})</Text>
                    </View>
                    {missed.map(t => (
                      <View key={t.id} style={[rSumStyles.taskRow, rSumStyles.taskRowMissed]}>
                        <Text style={rSumStyles.taskEmoji}>{t.icon ?? '📋'}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={rSumStyles.taskTitle}>{t.title}</Text>
                          <Text style={rSumStyles.taskMeta}>{t.time}{t.description ? ` · ${t.description}` : ''}</Text>
                        </View>
                        <View style={rSumStyles.missedBadge}>
                          <Text style={rSumStyles.missedBadgeText}>MISSED</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null;
              })()}

              {/* Pending / Unsure */}
              {(() => {
                const pending = patientTasks.filter(t => t.status === 'pending' || t.status === 'unsure');
                return pending.length > 0 ? (
                  <View style={rSumStyles.section}>
                    <View style={rSumStyles.sectionHeader}>
                      <View style={[rSumStyles.sectionDot, { backgroundColor: '#F59E0B' }]} />
                      <Text style={[rSumStyles.sectionTitle, { color: '#92400E' }]}>Pending ({pending.length})</Text>
                    </View>
                    {pending.map(t => (
                      <View key={t.id} style={[rSumStyles.taskRow, rSumStyles.taskRowPending]}>
                        <Text style={rSumStyles.taskEmoji}>{t.icon ?? '📋'}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={rSumStyles.taskTitle}>{t.title}</Text>
                          <Text style={rSumStyles.taskMeta}>{t.time}{t.description ? ` · ${t.description}` : ''}</Text>
                        </View>
                        <View style={[rSumStyles.missedBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                          <Text style={[rSumStyles.missedBadgeText, { color: '#92400E' }]}>
                            {t.status === 'unsure' ? 'CHECK' : 'PENDING'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null;
              })()}

              {/* Completed */}
              {(() => {
                const done = patientTasks.filter(t => t.status === 'done');
                return done.length > 0 ? (
                  <View style={rSumStyles.section}>
                    <View style={rSumStyles.sectionHeader}>
                      <View style={[rSumStyles.sectionDot, { backgroundColor: '#10B981' }]} />
                      <Text style={[rSumStyles.sectionTitle, { color: '#065F46' }]}>Completed ({done.length})</Text>
                    </View>
                    {done.map(t => (
                      <View key={t.id} style={[rSumStyles.taskRow, rSumStyles.taskRowDone]}>
                        <Text style={rSumStyles.taskEmoji}>{t.icon ?? '📋'}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[rSumStyles.taskTitle, { color: '#065F46' }]}>{t.title}</Text>
                          <Text style={rSumStyles.taskMeta}>{t.time}{t.description ? ` · ${t.description}` : ''}</Text>
                        </View>
                        <View style={[rSumStyles.missedBadge, { backgroundColor: '#D1FAE5', borderColor: '#6EE7B7' }]}>
                          <Text style={[rSumStyles.missedBadgeText, { color: '#065F46' }]}>✓ DONE</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null;
              })()}

              {patientTasks.length === 0 && (
                <Text style={{ fontFamily: F.regular, color: C.textMuted, textAlign: 'center', marginTop: 24 }}>
                  No routines added yet.
                </Text>
              )}
            </ScrollView>

            <Pressable
              style={({ pressed }) => [rSumStyles.closeBtn, pressed && { opacity: 0.82 }]}
              onPress={() => setShowRoutineSummary(false)}
            >
              <Text style={rSumStyles.closeBtnText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Patient Profile Modal ──────────────────────────────────────── */}
      <Modal
        visible={showPatientProfile}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPatientProfile(false)}
      >
        <Pressable style={styles.profileModalOverlay} onPress={() => setShowPatientProfile(false)}>
          <Pressable style={styles.profileModalSheet} onPress={(e) => e.stopPropagation()}>
            {/* Handle bar */}
            <View style={styles.profileModalHandle} />

            {/* Avatar */}
            <View style={styles.profileModalAvatar}>
              <Text style={styles.profileModalAvatarInitial}>
                {(patientDetails?.fullName ?? patientName)[0]?.toUpperCase() ?? 'P'}
              </Text>
            </View>

            <Text style={styles.profileModalTag}>PATIENT PROFILE</Text>
            <Text style={styles.profileModalName}>{patientDetails?.fullName ?? patientName}</Text>

            <View style={styles.profileModalDivider} />

            {/* Detail rows */}
            {([
              { label: 'Date of Birth', value: patientDetails?.dob ?? '—', emoji: '🎂' },
              { label: 'Gender',        value: patientDetails?.gender ?? '—', emoji: '👤' },
              { label: 'City',          value: patientDetails?.city ?? '—', emoji: '📍' },
              { label: 'Language',      value: patientDetails?.language ?? 'English', emoji: '🌐' },
              { label: 'Phone',         value: patientPhone, emoji: '📞' },
            ] as Array<{ label: string; value: string; emoji: string }>).map((row) => (
              <View key={row.label} style={styles.profileModalRow}>
                <Text style={styles.profileModalRowEmoji}>{row.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileModalRowLabel}>{row.label}</Text>
                  <Text style={styles.profileModalRowValue}>{row.value}</Text>
                </View>
              </View>
            ))}

            <Pressable
              style={({ pressed }) => [styles.profileModalCloseBtn, pressed && { opacity: 0.82 }]}
              onPress={() => setShowPatientProfile(false)}
            >
              <Text style={styles.profileModalCloseBtnText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 96 },
  backNavBtn:      { paddingVertical: 4, paddingRight: 4 },
  backNavText:     { fontFamily: F.bold, fontSize: 14, color: C.textSecondary },
  topNavRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  myProfileBtn:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: C.primaryLight ?? '#D1FAE5' },
  myProfileBtnText:{ fontFamily: F.semiBold ?? F.bold, fontSize: 13, color: C.primary },

  // ── Header ──────────────────────────────────────────────────────────────────
  headerCard: { marginBottom: 14 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },

  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.primary,
  },
  avatarInitial: { fontFamily: F.bold, fontSize: 22, color: C.primary },

  headerCenter: { flex: 1, marginLeft: 12 },
  overview: { fontFamily: F.bold, fontSize: 11, letterSpacing: 1.2, color: C.primary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 1 },
  name: { fontFamily: F.extraBold, fontSize: 26, color: C.textPrimary },
  lastActivity: { fontFamily: F.medium, fontSize: 10, color: C.textSecondary, marginTop: 1, letterSpacing: 0.4 },

  // inline header actions (call + battery)
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  headerActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  headerCallBtn: { backgroundColor: '#FCD9A5' },
  headerActionIcon: { fontSize: 14 },
  headerCallLabel: { fontFamily: F.bold, fontSize: 13, color: C.textPrimary },
  headerBatteryChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.surface, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.border },
  headerBatteryLabel: { fontFamily: F.bold, fontSize: 13 },

  // ── Manage tab ──────────────────────────────────────────────────────────────
  manageContainer:  { paddingTop: 4 },
  manageHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  manageTitle:      { fontFamily: F.bold, fontSize: 20, color: C.textPrimary },
  manageSub:        { fontFamily: F.regular, fontSize: 13, color: C.textSecondary, marginTop: 1 },
  manageNote:       { fontFamily: F.regular, fontSize: 13, color: C.textSecondary, marginBottom: 14, lineHeight: 18 },
  manageEmpty:      { fontFamily: F.regular, fontSize: 14, color: C.textMuted, textAlign: 'center', marginTop: 24 },
  manageCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 13, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  manageCardLeft:  { flex: 1 },
  manageCardTime:  { fontFamily: F.bold, fontSize: 10, color: C.primary, letterSpacing: 1, marginBottom: 2 },
  manageCardTitle: { fontFamily: F.bold, fontSize: 16, color: C.textPrimary },
  manageCardMeta:  { fontFamily: F.regular, fontSize: 12, color: C.textSecondary, marginTop: 2 },
  manageStatusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },



  // ── Geofence card (v2) ────────────────────────────────────────────────
  geoCard: {
    borderRadius: 20, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 14,
    marginTop: 12, marginHorizontal: 0,
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 3,
  },
  geoTopRow:      { flexDirection: 'row', alignItems: 'center' },
  geoIcon:        { fontSize: 26, lineHeight: 32 },
  geoTitle:       { fontFamily: F.extraBold, fontSize: 14, letterSpacing: 0.3 },
  geoMeta:        { fontFamily: F.medium, fontSize: 12, color: '#374151', marginTop: 3 },
  geoChevron:     { fontFamily: F.bold, fontSize: 22, color: C.textMuted, lineHeight: 26 },
  geoAlertBadge:  { backgroundColor: '#DC2626', borderRadius: 999, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginRight: 6 },
  geoAlertBadgeText: { fontFamily: F.bold, fontSize: 11, color: '#fff' },
  geoBottomRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  geoZonePills:   { flexDirection: 'row', flexWrap: 'wrap', gap: 5, flex: 1 },
  geoZonePill:    { backgroundColor: 'rgba(14,122,103,0.10)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(14,122,103,0.22)' },
  geoZonePillText:{ fontFamily: F.semiBold, fontSize: 11, color: C.primary },
  geoNoZone:      { fontFamily: F.regular, fontSize: 12, color: C.textMuted },
  geoEditBtn:     { backgroundColor: C.primaryLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 8 },
  geoEditBtnText: { fontFamily: F.bold, fontSize: 12, color: C.primary },
  geoAge:         { fontFamily: F.regular, fontSize: 10, color: C.textMuted, marginTop: 6, textAlign: 'right' },

  // Alerts tab
  alertsContainer: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginTop: 6,
  },
  alertsTitle: { fontFamily: F.bold, fontSize: 18, color: C.textPrimary, marginBottom: 10 },
  alertsEmpty: { fontFamily: F.regular, fontSize: 14, color: C.textSecondary },
  alertCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertCardHigh: { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  alertCardMedium: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  alertCardLow: { backgroundColor: '#E5E7EB', borderColor: '#D1D5DB' },
  alertCardRight: { alignItems: 'flex-end', gap: 6 },
  alertCardTitle: { fontFamily: F.bold, color: C.textPrimary, fontSize: 14, marginBottom: 2 },
  alertCardMessage: { fontFamily: F.regular, color: C.textSecondary, fontSize: 12 },
  alertCardLevel: { fontFamily: F.bold, color: C.textPrimary, fontSize: 10, letterSpacing: 0.6 },
  alertSosBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  alertSosText: { fontFamily: F.bold, color: '#FFFFFF', fontSize: 10, letterSpacing: 0.4 },

  routineHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: F.bold, fontSize: 18, color: C.textPrimary },
  completedPill: { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  completedText: { fontFamily: F.semiBold, fontSize: 14, color: C.primary },
  completedCount: { fontFamily: F.extraBold },

  // ── Routine outer wrapper ──────────────────────────────────────────
  routineOuterContainer: {
    backgroundColor: '#f0fff8',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  // ── Routine capsules ────────────────────────────────────────────────────────
  routineListViewport: {
    height: 276,
    marginBottom: 14,
    overflow: 'hidden',
  },
  routineListContent: {
    paddingVertical: 96,
  },
  routineCapsule: {
    height: 84,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  routineCapsuleTextCol: { flex: 1, paddingRight: 8 },
  routineCapsuleTitle: { fontFamily: F.bold, fontSize: 16 },
  routineCapsuleMeta: { fontFamily: F.regular, fontSize: 13, marginTop: 3 },
  routineCapsuleStatus: { fontFamily: F.bold, fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 },
  capsuleRight: { alignItems: 'center', gap: 4 },
  capsuleReminderBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  capsuleReminderIcon: { fontSize: 16 },



  // ── Patient Profile Modal ────────────────────────────────────────────────
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  profileModalSheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 20,
    elevation: 20,
  },
  profileModalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.borderMid,
    alignSelf: 'center',
    marginBottom: 18,
  },
  profileModalAvatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.primaryLight,
    borderWidth: 2, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  profileModalAvatarInitial: {
    fontFamily: F.extraBold, fontSize: 30, color: C.primary,
  },
  profileModalTag: {
    fontFamily: F.bold, fontSize: 11, letterSpacing: 1.4,
    color: C.primary, textAlign: 'center', marginBottom: 4,
  },
  profileModalName: {
    fontFamily: F.extraBold, fontSize: 24, color: C.textPrimary,
    textAlign: 'center', marginBottom: 14,
  },
  profileModalDivider: {
    height: 1, backgroundColor: C.border, marginBottom: 14,
  },
  profileModalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  profileModalRowEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  profileModalRowLabel: {
    fontFamily: F.medium, fontSize: 11, color: C.textSecondary, letterSpacing: 0.4,
  },
  profileModalRowValue: {
    fontFamily: F.bold, fontSize: 15, color: C.textPrimary, marginTop: 1,
  },
  profileModalCloseBtn: {
    marginTop: 20, borderRadius: 14, backgroundColor: C.primary,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: C.primary, shadowOpacity: 0.28, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6,
  },
  profileModalCloseBtnText: {
    fontFamily: F.bold, fontSize: 16, color: C.primaryText,
  },
  // ── Stats ───────────────────────────────────────────────────────────────────
  statsCard: {
    backgroundColor: C.surface,
    borderRadius: 18, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 8, paddingVertical: 16,
    marginBottom: 14,
    flexDirection: 'row', justifyContent: 'space-around',
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  metricCol: { alignItems: 'center', minWidth: 88 },
  metricIcon: { fontSize: 18, marginBottom: 4 },
  metricLabel: { fontFamily: F.bold, fontSize: 10, color: C.textSecondary, letterSpacing: 0.8 },
  metricValue: { fontFamily: F.extraBold, fontSize: 22, color: C.textPrimary, marginTop: 2 },
  metricUnit: { fontFamily: F.semiBold, fontSize: 13 },
  metricDivider: { width: 1, backgroundColor: C.borderMid, marginVertical: 4 },

  // ── (global action buttons removed) ──────────────────────────────────────

  // ── Toast ───────────────────────────────────────────────────────────────────
  reminderToastWrap: { position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center' },
  reminderToast: {
    backgroundColor: C.primary, borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 10,
    shadowColor: C.primary, shadowOpacity: 0.25, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 6,
  },
  reminderToastText: { fontFamily: F.semiBold, color: C.primaryText, fontSize: 14 },

  // ── Bottom nav ──────────────────────────────────────────────────────────────
  bottomBarBand: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 76,
    backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
  },
  bottomBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  bottomTabIconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  bottomLabel: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.textMuted,
    letterSpacing: 0.3,
  },
  bottomLabelActive: {
    fontFamily: F.bold,
    color: C.primary,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 18,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: C.primary,
  },
});

// ── Alert-system styles ────────────────────────────────────────────────────────
const alertStyles = StyleSheet.create({
  // Level 1 callout strip
  calloutStrip: { marginBottom: 10, gap: 6 },
  calloutHeader: { fontFamily: F.bold, fontSize: 11, color: '#92400E', letterSpacing: 0.8, marginBottom: 4 },
  calloutChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  calloutHigh: { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  calloutMed:  { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  calloutEmoji: { fontSize: 20 },
  calloutTitle: { fontFamily: F.bold, fontSize: 13, color: '#111827' },
  calloutMsg:   { fontFamily: F.regular, fontSize: 12, color: '#6B7280', marginTop: 1 },
  dismissBtn:   { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  dismissText:  { fontFamily: F.bold, fontSize: 11, color: '#6B7280' },
  // Level 2 non-routine alert card
  sectionLabel: { fontFamily: F.bold, fontSize: 10, letterSpacing: 1.4, color: '#9CA3AF', marginBottom: 10 },
  countBadge:   { marginLeft: 8, backgroundColor: '#DC2626', borderRadius: 999, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  countBadgeText: { fontFamily: F.bold, fontSize: 11, color: '#fff' },
  emptyBox:     { alignItems: 'center', paddingVertical: 32 },
  emptyTitle:   { fontFamily: F.bold, fontSize: 16, color: '#111827', marginBottom: 4 },
  emptyMsg:     { fontFamily: F.regular, fontSize: 13, color: '#6B7280' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 },
  cardSeen: { opacity: 0.72 },
  dot: { width: 9, height: 9, borderRadius: 5, alignSelf: 'flex-start', marginTop: 4 },
  cardTitle:  { fontFamily: F.bold, fontSize: 15, color: '#111827', marginBottom: 2 },
  unseen:     { fontFamily: F.extraBold },
  cardMsg:    { fontFamily: F.regular, fontSize: 13, color: '#374151' },
  seenMsg:    { color: '#9CA3AF' },
  cardTime:   { fontFamily: F.medium, fontSize: 10, color: '#9CA3AF', marginTop: 4, letterSpacing: 0.6 },
  callBtn:    { backgroundColor: '#0E7A67', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center' },
  callBtnText:{ fontFamily: F.bold, fontSize: 11, color: '#fff' },
  ackBtn:     { backgroundColor: '#E5E7EB', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center' },
  ackBtnText: { fontFamily: F.bold, fontSize: 11, color: '#374151' },
});

// ─── Rich Manage-tab styles ───────────────────────────────────────────────────
const mStyles = StyleSheet.create({
  // List container
  container:  { paddingTop: 6 },
  headerRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title:      { fontFamily: F.extraBold, fontSize: 24, color: C.textPrimary },
  sub:        { fontFamily: F.regular, fontSize: 13, color: C.textSecondary, marginTop: 2 },

  // Add button
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.primary, borderRadius: 999,
    paddingHorizontal: 16, paddingVertical: 10,
    shadowColor: C.primary, shadowOpacity: 0.28, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 5,
  },
  addBtnPlus: { fontFamily: F.bold, fontSize: 18, color: C.primaryText, lineHeight: 22 },
  addBtnText: { fontFamily: F.bold, fontSize: 14, color: C.primaryText },

  // Empty state
  emptyWrap:  { alignItems: 'center', marginTop: 48 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText:  { fontFamily: F.semiBold, fontSize: 15, color: C.textSecondary, textAlign: 'center' },
  emptyHint:  { fontFamily: F.regular, fontSize: 13, color: C.textMuted, marginTop: 4 },

  // Routine card
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 2,
  },
  iconCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, marginTop: 2,
    borderWidth: 1, borderColor: C.border,
  },
  iconEmoji: { fontSize: 26 },

  cardBody:   { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardTime:   { fontFamily: F.bold, fontSize: 13, color: C.primary },
  cardTitle:  { fontFamily: F.bold, fontSize: 17, color: C.textPrimary, marginBottom: 2 },
  cardDesc:   { fontFamily: F.regular, fontSize: 13, color: C.textSecondary, lineHeight: 18 },

  // Status badges
  pendingBadge: {
    backgroundColor: '#D1FAE5', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  pendingText:  { fontFamily: F.bold, fontSize: 10, color: '#065F46', letterSpacing: 0.5 },
  doneBadge:    { backgroundColor: C.primaryLight },
  missedBadge:  { backgroundColor: '#FEE2E2' },

  // Edit / delete action buttons
  actionBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn:   { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  editIcon:    { fontSize: 14 },
  deleteIcon:  { fontSize: 14 },

  // ── Add / Edit Modal ──────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 12, paddingBottom: 40,
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: -4 }, shadowRadius: 20, elevation: 24,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: C.borderMid,
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontFamily: F.extraBold, fontSize: 22, color: C.textPrimary, marginBottom: 18 },

  // Icon picker strip
  iconPicker:       { marginBottom: 14 },
  iconOption: {
    width: 48, height: 48, borderRadius: 14, marginRight: 8,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  iconOptionActive: {
    borderColor: C.primary, backgroundColor: C.primaryLight,
    shadowColor: C.primary, shadowOpacity: 0.22, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3,
  },

  // Form fields
  fieldLabel: { fontFamily: F.semiBold, fontSize: 12, color: C.textSecondary, letterSpacing: 0.4, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: F.regular, fontSize: 15, color: C.textPrimary,
    marginBottom: 12,
  },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  formError:  { fontFamily: F.regular, fontSize: 13, color: C.error, marginBottom: 8 },

  // Save button
  saveBtn: {
    backgroundColor: C.primary, borderRadius: 16, paddingVertical: 15,
    alignItems: 'center', marginTop: 6,
    shadowColor: C.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 5 }, shadowRadius: 10, elevation: 7,
  },
  saveBtnText: { fontFamily: F.bold, fontSize: 16, color: C.primaryText },
});

// ── Routine Summary Bar + Modal styles ────────────────────────────────────────
const rSumStyles = StyleSheet.create({
  // Summary bar
  bar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  statChip:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  statDot:   { width: 8, height: 8, borderRadius: 4 },
  statNum:   { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary },
  statLabel: { fontFamily: F.medium, fontSize: 12, color: C.textSecondary },
  divider:   { width: 1, height: 28, backgroundColor: C.border },
  chevron:   { fontFamily: F.bold, fontSize: 20, color: C.textMuted, marginLeft: 8 },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
    maxHeight: '85%',
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: -4 }, shadowRadius: 20, elevation: 24,
  },
  handle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: C.borderMid, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:{ fontFamily: F.extraBold, fontSize: 22, color: C.textPrimary, marginBottom: 2 },
  sheetSub:  { fontFamily: F.regular, fontSize: 13, color: C.textSecondary, marginBottom: 10 },
  // Sections
  section:     { marginBottom: 16 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionDot:  { width: 10, height: 10, borderRadius: 5 },
  sectionTitle:{ fontFamily: F.bold, fontSize: 14, letterSpacing: 0.4 },
  // Task rows
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6,
  },
  taskRowMissed:  { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  taskRowPending: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  taskRowDone:    { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  taskEmoji:  { fontSize: 22 },
  taskTitle:  { fontFamily: F.bold, fontSize: 14, color: C.textPrimary },
  taskMeta:   { fontFamily: F.regular, fontSize: 11, color: C.textMuted, marginTop: 1 },
  missedBadge:{ borderRadius: 999, borderWidth: 1, backgroundColor: '#FEE2E2', borderColor: '#FECACA', paddingHorizontal: 8, paddingVertical: 3 },
  missedBadgeText: { fontFamily: F.bold, fontSize: 10, color: '#991B1B', letterSpacing: 0.5 },
  // Close button
  closeBtn: {
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 14,
    shadowColor: C.primary, shadowOpacity: 0.28, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6,
  },
  closeBtnText: { fontFamily: F.bold, fontSize: 16, color: C.primaryText },
});
