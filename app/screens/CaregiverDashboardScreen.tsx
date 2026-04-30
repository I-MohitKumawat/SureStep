import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
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
  haversineMeters,
  PATIENT_GEOFENCES,
  DEFAULT_GEOFENCE,
  type Coords,
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
  const { tasks } = useTasks();
  const [reminderSentKeys, setReminderSentKeys] = React.useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = React.useState<CaregiverTab>('Home');

  // Patient identity comes from route params — never from AsyncStorage
  const patientPhone = route.params?.patientPhone ?? '';
  const [patientName, setPatientName] = React.useState(
    route.params?.patientName ?? 'Patient'
  );
  const [batteryLevel, setBatteryLevel] = React.useState(82);
  const [patientCoords, setPatientCoords] = React.useState<Coords | null>(null);
  const reminderTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const geoSubRef = React.useRef<Location.LocationSubscription | null>(null);
  const capsuleScrollY = React.useRef(new Animated.Value(0)).current;

  // ── Patient profile details (for avatar-tap modal) ───────────────────
  const [showPatientProfile, setShowPatientProfile] = React.useState(false);
  type PatientDetails = { fullName: string; dob: string; gender: string; city: string; language: string };
  const [patientDetails, setPatientDetails] = React.useState<PatientDetails | null>(null);

  // ── Manage-tab routine state ──────────────────────────────────────────
  type RoutineTask = {
    id: string;
    title: string;
    description: string;
    time: string;
    icon: string;
    status: 'pending' | 'done' | 'missed' | 'unsure';
  };
  const ICON_OPTIONS = ['🍽️', '💊', '🚶', '🛁', '🛌', '🏋️', '🩺', '📖', '☕', '🧘', '🚗', '💧'];
  const [routineTasks,     setRoutineTasks]     = React.useState<RoutineTask[]>([]);
  const [manageLoading,    setManageLoading]    = React.useState(false);
  const [showRoutineModal, setShowRoutineModal] = React.useState(false);
  const [editingRoutine,   setEditingRoutine]   = React.useState<RoutineTask | null>(null);
  const [form,             setForm]             = React.useState({ title: '', description: '', time: '08:00', icon: '🍽️' });
  const [formError,        setFormError]        = React.useState<string | null>(null);
  const [saving,           setSaving]           = React.useState(false);

  const loadRoutineTasks = React.useCallback(async () => {
    if (!patientPhone) return;
    setManageLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select('id, title, description, time, status')
      .eq('patient_id', patientPhone)
      .order('time', { ascending: true });
    setRoutineTasks(
      (data ?? []).map((r) => ({
        id:          r.id,
        title:       r.title       ?? '',
        description: r.description ?? '',
        time:        r.time        ?? '',
        icon:        '🍽️',
        status:      r.status as RoutineTask['status'],
      }))
    );
    setManageLoading(false);
  }, [patientPhone]);

  // Realtime for manage tab
  React.useEffect(() => {
    if (!patientPhone) return;
    const ch = supabase
      .channel(`manage_${patientPhone}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `patient_id=eq.${patientPhone}` },
        () => void loadRoutineTasks()
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [patientPhone, loadRoutineTasks]);

  const openAddRoutine = () => {
    setEditingRoutine(null);
    setForm({ title: '', description: '', time: '08:00', icon: '🍽️' });
    setFormError(null);
    setShowRoutineModal(true);
  };

  const openEditRoutine = (task: RoutineTask) => {
    setEditingRoutine(task);
    setForm({ title: task.title, description: task.description, time: task.time, icon: task.icon });
    setFormError(null);
    setShowRoutineModal(true);
  };

  const saveRoutine = async () => {
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    if (!form.time.trim())  { setFormError('Time is required.'); return; }
    setSaving(true); setFormError(null);
    const payload = {
      patient_id:  patientPhone,
      title:       form.title.trim(),
      description: form.description.trim(),
      time:        form.time.trim(),
      status:      'pending' as const,
    };
    if (editingRoutine) {
      await supabase.from('tasks').update(payload).eq('id', editingRoutine.id);
    } else {
      const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await supabase.from('tasks').insert({ ...payload, id });
    }
    setSaving(false);
    setShowRoutineModal(false);
    void loadRoutineTasks();
  };

  const deleteRoutine = async (id: string) => {
    setRoutineTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };




  // Use the patient's phone as the scope ID for tasks
  const patientId = patientPhone;

  // ── Last activity: derive from most recent completedAt across tasks ──────
  const lastActivityLabel = (() => {
    const completedTimes = tasks
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

  // patientId is derived above from route.params.patientPhone
  const patientTasks = tasks.filter((t) => t.patientId === patientId);
  const completedTasks = patientTasks.filter((t) => t.status === 'done').length;
  const totalTasks = patientTasks.length;

  const routineStatus = {
    medication: patientTasks.find((t) => t.title.toLowerCase().includes('med'))?.status === 'done',
    breakfast: patientTasks.find((t) => t.title.toLowerCase().includes('breakfast'))?.status === 'done',
    walk: patientTasks.find((t) => t.title.toLowerCase().includes('walk'))?.status === 'done',
  };

  useEffect(() => () => { if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current); }, []);

  // ── Location tracking (expo-location) ────────────────────────────────
  useEffect(() => {
    const fence = PATIENT_GEOFENCES[patientId] ?? DEFAULT_GEOFENCE;
    const init = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('permission denied');
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setPatientCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        geoSubRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 20 },
          (l) => setPatientCoords({ latitude: l.coords.latitude, longitude: l.coords.longitude }),
        );
      } catch {
        // Simulator / permission denied — demo offset for testing
        setPatientCoords({
          latitude:  fence.center.latitude  + 0.0018,
          longitude: fence.center.longitude - 0.0012,
        });
      }
    };
    void init();
    return () => { geoSubRef.current?.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDialPad = async () => Linking.openURL('tel:');

  const sendReminder = (key: string) => {
    setReminderSentKeys((prev) => new Set(prev).add(key));
    if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);
    reminderTimerRef.current = setTimeout(() => {
      setReminderSentKeys((prev) => { const s = new Set(prev); s.delete(key); return s; });
    }, 2500);
  };

  const batteryColor = batteryLevel >= 50 ? C.safeText : batteryLevel >= 20 ? '#D97706' : C.error;

  const routineItems = [
    { key: 'medication', emoji: '💊', title: 'Morning Medication', meta: 'Taken at 08:30 AM', done: routineStatus.medication },
    { key: 'breakfast', emoji: '🍽️', title: 'Healthy Breakfast', meta: 'Completed at 09:15 AM', done: routineStatus.breakfast },
    { key: 'walk', emoji: '🚶', title: 'Daily Walk', meta: 'Scheduled for 11:00 AM', done: routineStatus.walk },
  ];

  const activeRoutineIndex = useMemo(() => {
    const firstPendingIndex = routineItems.findIndex((item) => !item.done);
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

  const patientAlerts = useMemo(() => {
    const alerts: Array<{ id: string; title: string; message: string; level: 'high' | 'medium' | 'low' }> = [];
    const missed = patientTasks.filter((t) => t.status === 'missed');
    const unsure = patientTasks.filter((t) => t.status === 'unsure');

    for (const task of missed) {
      alerts.push({
        id: `missed-${task.id}`,
        title: 'Missed routine',
        message: task.title,
        level: 'high',
      });
    }
    for (const task of unsure) {
      alerts.push({
        id: `unsure-${task.id}`,
        title: 'Needs follow-up',
        message: task.title,
        level: 'medium',
      });
    }
    if (batteryLevel < 20) {
      alerts.push({
        id: 'battery-low',
        title: 'Low battery',
        message: `Patient device battery at ${batteryLevel}%`,
        level: 'medium',
      });
    }
    if (patientCoords) {
      const fence = PATIENT_GEOFENCES[patientId] ?? DEFAULT_GEOFENCE;
      const dist = haversineMeters(
        fence.center.latitude,
        fence.center.longitude,
        patientCoords.latitude,
        patientCoords.longitude,
      );
      if (dist > fence.radiusM) {
        alerts.push({
          id: 'geo-outside',
          title: 'Outside safe zone',
          message: `${Math.round(dist - fence.radiusM)}m beyond boundary`,
          level: 'high',
        });
      }
    }
    const rank = { high: 0, medium: 1, low: 2 } as const;
    return alerts.sort((a, b) => rank[a.level] - rank[b.level]);
  }, [batteryLevel, patientCoords, patientId, patientTasks]);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Pressable
          onPress={() => navigation.navigate('CaregiverPatients')}
          style={({ pressed }) => [styles.backNavBtn, pressed && { opacity: 0.72 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backNavText}>← Back</Text>
        </Pressable>

        {activeTab === 'Alerts' ? (
          <View style={styles.alertsContainer}>
            <Text style={styles.alertsTitle}>Patient Alerts</Text>
            {patientAlerts.length === 0 ? (
              <Text style={styles.alertsEmpty}>No active alerts for this patient.</Text>
            ) : patientAlerts.map((alert) => (
              <View
                key={alert.id}
                style={[
                  styles.alertCard,
                  alert.level === 'high' ? styles.alertCardHigh : alert.level === 'medium' ? styles.alertCardMedium : styles.alertCardLow,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertCardTitle}>{alert.title}</Text>
                  <Text style={styles.alertCardMessage}>{alert.message}</Text>
                </View>
                <View style={styles.alertCardRight}>
                  <Text style={styles.alertCardLevel}>{alert.level.toUpperCase()}</Text>
                  <Pressable
                    onPress={() => void openDialPad()}
                    style={({ pressed }) => [styles.alertSosBtn, pressed && { opacity: 0.72 }]}
                  >
                    <Text style={styles.alertSosText}>SOS</Text>
                  </Pressable>
                </View>
              </View>
            ))}
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
            ) : routineTasks.length === 0 ? (
              <View style={mStyles.emptyWrap}>
                <Text style={mStyles.emptyEmoji}>📋</Text>
                <Text style={mStyles.emptyText}>No routines yet.</Text>
                <Text style={mStyles.emptyHint}>Tap "Add Routine" to get started.</Text>
              </View>
            ) : (
              routineTasks.map((task) => (
                <View key={task.id} style={mStyles.card}>
                  {/* Icon circle */}
                  <View style={mStyles.iconCircle}>
                    <Text style={mStyles.iconEmoji}>{task.icon}</Text>
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
                        onPress={() => openEditRoutine(task)}
                        hitSlop={10}
                        style={({ pressed }) => [mStyles.actionBtn, pressed && { opacity: 0.55 }]}
                      >
                        <Text style={mStyles.editIcon}>✏️</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => void deleteRoutine(task.id)}
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
        <View style={styles.routineOuterContainer}>
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
                          {item.title}
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

          {/* ── Geofence Status Card ───────────────────────────────── */}
          {(() => {
            const fence = PATIENT_GEOFENCES[patientId] ?? DEFAULT_GEOFENCE;
            const dist = patientCoords
              ? haversineMeters(
                  fence.center.latitude, fence.center.longitude,
                  patientCoords.latitude, patientCoords.longitude,
                )
              : null;
            const inZone   = dist !== null && dist <= fence.radiusM;
            const zoneColor = inZone ? C.primary : '#DC2626';
            const zoneBg    = inZone ? C.primaryLight : '#FEE2E2';
            const distLabel = dist === null
              ? 'Acquiring location…'
              : inZone
                ? `${Math.round(fence.radiusM - dist)} m inside boundary`
                : `${Math.round(dist - fence.radiusM)} m from boundary`;
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.geoCard,
                  { backgroundColor: zoneBg, borderColor: zoneColor },
                  pressed && { opacity: 0.86 },
                ]}
                onPress={() =>
                  navigation.navigate('GeofenceMap', {
                    patientId,
                    patientName,
                  })
                }
              >
                <View style={[styles.geoDot, { backgroundColor: zoneColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.geoTitle, { color: zoneColor }]}>
                    {dist === null ? 'Locating patient…' : inZone ? 'In Safe Zone' : 'Outside Safe Zone'}
                  </Text>
                  <Text style={styles.geoMeta}>{distLabel}</Text>
                </View>
                <Text style={styles.geoChevron}>›</Text>
              </Pressable>
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
  backNavBtn: { alignSelf: 'flex-start', marginBottom: 8, paddingVertical: 4, paddingRight: 4 },
  backNavText: { fontFamily: F.bold, fontSize: 14, color: C.textSecondary },

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



  // Geofence card
  geoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 13,
    marginTop: 12, marginHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  geoDot:     { width: 10, height: 10, borderRadius: 5 },
  geoTitle:   { fontFamily: F.bold, fontSize: 15, marginBottom: 2 },
  geoMeta:    { fontFamily: F.regular, fontSize: 13, color: C.textSecondary },
  geoChevron: { fontFamily: F.bold, fontSize: 22, color: C.textMuted, lineHeight: 26 },

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

