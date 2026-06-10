import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, Alert, Image } from 'react-native';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useTasks } from '../../hooks/useTasks';
import type { Task as ContextTask, TaskStatus } from '../../hooks/useTasks';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import {
  IconHome,
  IconFamily,
  IconActivity,
  IconSearch,
  IconProfile,
} from '../../assets/icons/NavIcons';
import { CaregiverSearchView } from './CaregiverSearchView';
import type { CaregiverListing } from './CaregiverSearchView';
import { CaregiverDetailView } from './CaregiverDetailView';
import { PatientActivitiesView } from './PatientActivitiesScreen';
import { useAuth } from '../../hooks/useAuth';
import { useCaregiver } from '../../hooks/useCaregiver';
import { AiFab } from '../../components/shared/AiAssistantFab';
import { writeLocationPing } from '../../utils/geofenceUtils';
import { connectSocket } from '../../services/socketClient';
import type { PatientStackParams } from '../../types/navigation.types';
import messaging from '@react-native-firebase/messaging';
import { startBackgroundTracking, updateBackgroundTrackingMode } from '../../utils/locationTask';
import { getBatteryPercentage, getNetworkStatus } from '../../utils/deviceTelemetry';

type Props = NativeStackScreenProps<PatientStackParams, 'PatientHomeScreen'>;
type ActionState = 'done' | 'missed' | 'unsure' | 'overdue' | null;
type BottomTab = 'Home' | 'Family' | 'Activity' | 'Search';

import { getTaskMeta, statusColors } from '../../utils/patientUtils';
import { CaregiverProfileModal } from '../../components/patient/CaregiverProfileModal';
import { RoutineCard } from '../../components/patient/RoutineCard';
import type { Task } from '../../components/patient/RoutineCard';
import { UnlinkedCaregiverModal } from '../../components/patient/UnlinkedCaregiverModal';
import { TaskInstructionsModal } from '../../components/patient/TaskInstructionsModal';

type TabIconProps = { active: boolean };
const TAB_ICON_COMPONENTS: Record<BottomTab, React.FC<TabIconProps>> = {
  Home: ({ active }) => <IconHome size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Family: ({ active }) => <IconFamily size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Activity: ({ active }) => <IconActivity size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Search: ({ active }) => <IconSearch size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
};

function parseTaskTimeToToday(timeStr: string): Date {
  const [hours, minutes] = (timeStr || '').split(':').map(Number);
  const d = new Date();
  d.setHours(hours || 0, minutes || 0, 0, 0);
  return d;
}

// --- Main Screen --------------------------------------------------------------
export const PatientHomeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { status, user, firebaseUser } = useAuth();
  const { tasks, loadTasksForPatient, updateTaskStatus } = useTasks();
  const isFocused = useIsFocused();
  // Accept initialTab from route params (from Games/Activities/Family screens)
  const initialTab = (route.params as any)?.initialTab as BottomTab | undefined;
  const [activeTab, setActiveTab] = useState<BottomTab>(initialTab ?? 'Home');
  const [currentDateTime] = useState(new Date());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [helpTask, setHelpTask] = useState<Task | null>(null);
  const [viewingInstructionsTask, setViewingInstructionsTask] = useState<Task | null>(null);

  // Active alarm task and snoozed list
  const [activeAlarmTask, setActiveAlarmTask] = useState<Task | null>(null);
  const [snoozedTasks, setSnoozedTasks] = useState<Record<string, number>>({});

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Caregiver search sub-view state ─────────────────────
  const [searchSubView, setSearchSubView] = useState<'list' | 'detail' | null>(null);
  const [viewingCaregiver, setViewingCaregiver] = useState<CaregiverListing | null>(null);
  const { confirmedCaregiver, setConfirmedCaregiver, reloadCaregiver, loading } = useCaregiver();

  const hasLinkedCaregiver = !!confirmedCaregiver && (
    confirmedCaregiver.status === 'CONFIRMED' ||
    confirmedCaregiver.status === 'ACCEPTED' ||
    confirmedCaregiver.status === 'MEETING_COMPLETED' ||
    confirmedCaregiver.status === 'ASSESSMENT_PENDING' ||
    confirmedCaregiver.status === 'ACTIVE_CARE'
  );
  const hasPendingRequest = !!confirmedCaregiver && (
    confirmedCaregiver.status === 'PENDING' ||
    confirmedCaregiver.status === 'REQUESTED'
  );

  // Patient phone comes from auth — no AsyncStorage needed
  const patientId = status === 'authenticated' ? user?.id : null;

  useEffect(() => {
    if (!patientId || !isFocused) return;
    void loadTasksForPatient(patientId);
    // Poll for updates every 60s as a fallback — WebSocket synchronization handles real-time updates.
    const interval = setInterval(() => {
      void loadTasksForPatient(patientId);
    }, 60_000);
    return () => clearInterval(interval);
  }, [patientId, isFocused, loadTasksForPatient]);

  // Raw tasks from context, filtered strictly to this patient
  const patientTasks: Task[] = useMemo(
    () => patientId
      ? tasks.filter((t: ContextTask) => t.patientId === patientId).map((t: ContextTask) => ({
          id: t.id, title: t.title, time: t.time,
          icon: t.icon,
          state: t.status === 'pending' ? null : (t.status as ActionState),
          instructionsMd: t.instructionsMd,
          description: t.description,
        }))
      : [],
    [tasks, patientId],
  );

  const handleUpdateTaskStatus = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      try {
        await updateTaskStatus(taskId, newStatus);
      } catch (err) {
        console.warn('Failed to update task status:', err);
      }
    },
    [updateTaskStatus],
  );

  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const getGreeting = () => {
    const h = currentDateTime.getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  // Name comes from user object
  const displayName = user?.name ?? 'You';

  // -- Location publishing — write pings to Supabase so caregivers can see us --
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const [locationStatus, setLocationStatus] = React.useState<'idle' | 'sharing' | 'error' | 'denied'>('idle');

  useEffect(() => {
    if (!patientId) return;
    let active = true;

    const startPublishing = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || !active) {
          if (active) setLocationStatus('denied');
          return;
        }

        // Fetch telemetry data first
        const [batteryPct, networkStatus] = await Promise.all([
          getBatteryPercentage(),
          getNetworkStatus(),
        ]);

        // Write first ping immediately
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (active) {
          await writeLocationPing({
            patientId,
            coords: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
            accuracyM: loc.coords.accuracy ?? undefined,
            batteryPct,
            networkStatus,
            source: 'foreground',
          });
          if (active) setLocationStatus('sharing');
        }

        // Then watch and write every 30 s or every 10 m of movement
        locationSubRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 30_000, distanceInterval: 10 },
          async (l) => {
            if (!active) return;
            try {
              const [bPct, nStatus] = await Promise.all([
                getBatteryPercentage(),
                getNetworkStatus(),
              ]);
              await writeLocationPing({
                patientId,
                coords: { latitude: l.coords.latitude, longitude: l.coords.longitude },
                accuracyM: l.coords.accuracy ?? undefined,
                batteryPct: bPct,
                networkStatus: nStatus,
                source: 'foreground',
              });
              if (active) setLocationStatus('sharing');
            } catch {
              if (active) setLocationStatus('error');
            }
          },
        );
      } catch (err) {
        console.warn('[PatientRoleScreen] location publish error:', err);
        if (active) setLocationStatus('error');
      }
    };

    void startPublishing();
    return () => {
      active = false;
      locationSubRef.current?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Start adaptive background location tracking
  useEffect(() => {
    if (patientId) {
      void startBackgroundTracking(patientId);
    }
  }, [patientId]);

  // Listen for foreground FCM location request push notifications
  useEffect(() => {
    if (!patientId) return;
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      if (remoteMessage.data?.type === 'LOCATION_REQUEST') {
        console.log('[Patient Foreground] Received location request via FCM');
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          await writeLocationPing({
            patientId,
            coords: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
            accuracyM: loc.coords.accuracy ?? undefined,
            source: 'foreground',
          });
          console.log('[Patient Foreground] Published fresh location ping');
        } catch (err) {
          console.warn('[Patient Foreground] Failed to get/publish location:', err);
        }
      }
    });
    return unsubscribe;
  }, [patientId]);

  // ─── Real-time WebSocket connection for location refresh requests ──────────────────
  useEffect(() => {
    if (!firebaseUser || !patientId) return;
    let socketRef: any;

    void firebaseUser.getIdToken().then((token) => {
      socketRef = connectSocket(token);
      socketRef.emit('join:patient', patientId);

      const handleLocationRequest = async () => {
        console.log('[Patient] Received location refresh request from caregiver');
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          await writeLocationPing({
            patientId,
            coords: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
            accuracyM: loc.coords.accuracy ?? undefined,
            source: 'foreground',
          });
          console.log('[Patient] Successfully published fresh location ping');
        } catch (err) {
          console.warn('[Patient] Failed to get/publish fresh location fix:', err);
        }
      };

      socketRef.on('location:request', handleLocationRequest);

      const handleStateChange = (data: any) => {
        console.log('[Patient] Safety state change received via WebSocket:', data);
        const inEmergency =
          data?.safety_status === 'WANDERING' ||
          data?.safety_status === 'CRITICAL' ||
          data?.safety_status === 'UNSAFE' ||
          data?.sos_active === true;
        void updateBackgroundTrackingMode(patientId, inEmergency);
      };

      socketRef.on('state:change', handleStateChange);

      const handleRelationshipChange = (data: any) => {
        console.log('[Patient] Relationship change received via WebSocket:', data);
        if (patientId) {
          void reloadCaregiver(patientId, true);
        }
      };

      socketRef.on('relationship:change', handleRelationshipChange);
    });

    return () => {
      if (socketRef) {
        socketRef.off('location:request');
        socketRef.off('state:change');
        socketRef.off('relationship:change');
      }
    };
  }, [firebaseUser, patientId, reloadCaregiver]);

  // Load confirmed caregiver on focus or mount
  React.useEffect(() => {
    if (patientId && isFocused) void reloadCaregiver(patientId, true);
  }, [patientId, isFocused, reloadCaregiver]);

  const hasAlertedRef = useRef(false);

  React.useEffect(() => {
    if (!loading && patientId) {
      if (!confirmedCaregiver && !hasAlertedRef.current) {
        hasAlertedRef.current = true;
        setShowWarningModal(true);
      }
    }
  }, [loading, confirmedCaregiver, patientId]);

  React.useEffect(() => {
    if (!patientId || patientTasks.length === 0) return;

    const checkAlarmsAndExpiry = async () => {
      const now = new Date();
      for (const task of patientTasks) {
        if (task.state === 'done' || task.state === 'missed' || task.state === 'unsure') {
          continue;
        }

        const taskTime = parseTaskTimeToToday(task.time);
        const timeDiffMs = now.getTime() - taskTime.getTime();

        // 1. Expiry Check (over 30 minutes past scheduled time)
        if (timeDiffMs >= 30 * 60 * 1000) {
          console.log(`[Expiry] Task "${task.title}" expired. Marking as missed.`);
          try {
            await handleUpdateTaskStatus(task.id, 'missed');
            // If the active alarm is this task, clear it
            if (activeAlarmTask?.id === task.id) {
              setActiveAlarmTask(null);
            }
          } catch (err) {
            console.error('Failed to auto-miss expired task:', err);
          }
          continue;
        }

        // 2. Active Alarm Check (within 30 minutes of scheduled time)
        if (timeDiffMs >= 0 && timeDiffMs < 30 * 60 * 1000) {
          const snoozeUntil = snoozedTasks[task.id] || 0;
          if (now.getTime() > snoozeUntil) {
            if (!activeAlarmTask || activeAlarmTask.id !== task.id) {
              setActiveAlarmTask(task);
            }
          }
        }
      }
    };

    void checkAlarmsAndExpiry();
    const timer = setInterval(() => {
      void checkAlarmsAndExpiry();
    }, 10_000);

    return () => clearInterval(timer);
  }, [patientId, patientTasks, snoozedTasks, activeAlarmTask, handleUpdateTaskStatus]);

  const nextActionableIndex = useMemo(() => {
    const len = patientTasks.length;
    if (len === 0) return 0;

    const start = Math.max(0, Math.min(currentIndex, len - 1));
    for (let step = 0; step < len; step++) {
      const idx = (start + step) % len;
      const t = patientTasks[idx];
      if (t && t.state !== 'done' && t.state !== 'missed') return idx;
    }
    return start;
  }, [patientTasks, currentIndex]);



  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>

      {/* -- Family tab ---------------------------------------------------- */}
      {activeTab === 'Family' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerCard}>
            <View>
              <Text style={styles.greetingOverline}>FAMILY</Text>
              <Text style={[styles.greetingName, { fontSize: 26 }]}>My Care Team</Text>
            </View>
          </View>
          {hasLinkedCaregiver ? (
            <View style={styles.mainRoutineCard}>
              <Text style={[styles.sectionTitle, { marginBottom: 14, fontSize: 14, letterSpacing: 0.6 }]}>YOUR CAREGIVER</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                {confirmedCaregiver.profile_photo_url ? (
                  <Image source={{ uri: confirmedCaregiver.profile_photo_url }} style={styles.caregiverAvatar} />
                ) : (
                  <Text style={{ fontSize: 36 }}>{confirmedCaregiver.emoji || '👩‍⚕️'}</Text>
                )}
                <View>
                  <Text style={{ fontFamily: F.bold, fontSize: 18, color: C.textPrimary }}>{confirmedCaregiver.name}</Text>
                  <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.textSecondary }}>{confirmedCaregiver.specialty}</Text>
                </View>
              </View>
            </View>
          ) : hasPendingRequest ? (
            <View style={styles.mainRoutineCard}>
              <Text style={[styles.sectionTitle, { marginBottom: 14, fontSize: 14, letterSpacing: 0.6 }]}>PENDING REQUEST</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                <Text style={{ fontSize: 36 }}>⏳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: F.bold, fontSize: 18, color: C.textPrimary }}>{confirmedCaregiver.name}</Text>
                  <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.textSecondary }}>{confirmedCaregiver.specialty}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 1, borderRadius: 10, padding: 12 }}>
                <Text style={{ fontFamily: F.medium, fontSize: 13, color: '#92400E', lineHeight: 18 }}>
                  Waiting for caregiver to accept your request. We'll update your dashboard as soon as they confirm!
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.mainRoutineCard, { alignItems: 'center', paddingVertical: 32 }]}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>👨‍👩‍👧</Text>
              <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.textPrimary, textAlign: 'center', marginBottom: 6 }}>No caregiver linked yet</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
                Go to the Search tab to find and link a caregiver.
              </Text>
            </View>
          )}
        </ScrollView>

      /* -- Activity tab — render activities list inline ----------- */
      ) : activeTab === 'Activity' ? (
        <PatientActivitiesView navigation={navigation} />

      ) : activeTab === 'Search' && hasLinkedCaregiver ? (
        // -- Confirmed Caregiver Profile Card ---------------------------------
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerCard}>
            <View>
              <Text style={styles.greetingOverline}>YOUR CAREGIVER</Text>
              <Text style={[styles.greetingName, { fontSize: 28 }]}>{confirmedCaregiver.name}</Text>
              <Text style={styles.greetingDate}>{confirmedCaregiver.specialty}</Text>
            </View>
            <View style={[styles.caregiverTile, { backgroundColor: '#e8f5e9' }]}>
              <Text style={styles.caregiverIcon}>{confirmedCaregiver.emoji || '🧑‍⚕️'}</Text>
            </View>
          </View>

          <View style={[styles.mainRoutineCard, { marginBottom: 12 }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 14, fontSize: 14, letterSpacing: 0.6 }]}>CONTACT DETAILS</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 18, marginRight: 10 }}>📞</Text>
              <View>
                <Text style={{ fontFamily: F.medium, fontSize: 11, color: C.textSecondary }}>Phone Number</Text>
                <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.textPrimary }}>{confirmedCaregiver.id || 'Not available'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, marginRight: 10 }}>📍</Text>
              <View>
                <Text style={{ fontFamily: F.medium, fontSize: 11, color: C.textSecondary }}>Location</Text>
                <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.textPrimary }}>{confirmedCaregiver.location || 'Bangalore, India'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.mainRoutineCard}>
            <Text style={[styles.sectionTitle, { marginBottom: 8, fontSize: 14, letterSpacing: 0.6 }]}>BIO</Text>
            <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.textSecondary, lineHeight: 20 }}>
              {confirmedCaregiver.bio || 'No bio available.'}
            </Text>
          </View>
        </ScrollView>
      ) : activeTab === 'Search' && searchSubView === 'detail' && viewingCaregiver ? (
        <CaregiverDetailView
          caregiver={viewingCaregiver}
          linkStatus={
            confirmedCaregiver?.id === viewingCaregiver.id
              ? (confirmedCaregiver.status || 'PENDING')
              : null
          }
          onBack={() => {
            if (confirmedCaregiver && confirmedCaregiver.status === 'CONFIRMED') {
              // Already requested/confirmed — back goes to Home, not the search list
              setActiveTab('Home');
              setSearchSubView(null);
              setViewingCaregiver(null);
            } else {
              setSearchSubView('list');
              setViewingCaregiver(null);
            }
          }}
          onConfirm={async (c) => {
            // Pass patient name so it's written to Supabase at confirm time
            await setConfirmedCaregiver(c, patientId ?? '', displayName);
            // Stay on the same detail screen and reload caregiver status
            if (patientId) {
              await reloadCaregiver(patientId, true);
            }
          }}
        />
      ) : activeTab === 'Search' ? (
        <CaregiverSearchView
          onSelect={(c) => {
            setViewingCaregiver(c);
            setSearchSubView('detail');
          }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* -- Header --------------------------------------------------- */}
          <View style={styles.headerCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingOverline}>{getGreeting()},</Text>
              <Text style={styles.greetingName}>{displayName}</Text>
              <Text style={styles.greetingDate}>{formattedDate}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable
                onPress={() => navigation.navigate('NotificationHistoryScreen')}
                style={({ pressed }) => [
                  {
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: C.border,
                  },
                  pressed && { opacity: 0.72 },
                ]}
              >
                <Ionicons name="notifications-outline" size={22} color={C.primary} />
              </Pressable>

              {hasLinkedCaregiver && (
                <Pressable
                  onPress={() => {
                    setViewingCaregiver(confirmedCaregiver);
                    setSearchSubView('detail');
                    setActiveTab('Search');
                  }}
                  style={({ pressed }) => [styles.caregiverTile, pressed && { opacity: 0.82 }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {confirmedCaregiver.profile_photo_url ? (
                    <Image source={{ uri: confirmedCaregiver.profile_photo_url }} style={styles.caregiverTileImage} />
                  ) : (
                    <Text style={styles.caregiverIcon}>{confirmedCaregiver.emoji}</Text>
                  )}
                  <Text style={styles.caregiverTileLabel} numberOfLines={2}>{confirmedCaregiver.name.split(' ')[0]}</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* -- Location sharing status pill --------------------------- */}
          {locationStatus !== 'idle' && (
            <View style={[
              styles.locStatusPill,
              locationStatus === 'sharing' && { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
              locationStatus === 'error'   && { backgroundColor: '#FEF2F2', borderColor: '#EF4444' },
              locationStatus === 'denied'  && { backgroundColor: '#F3F4F6', borderColor: '#9CA3AF' },
            ]}>
              <Text style={[
                styles.locStatusText,
                locationStatus === 'sharing' && { color: '#065F46' },
                locationStatus === 'error'   && { color: '#991B1B' },
                locationStatus === 'denied'  && { color: '#6B7280' },
              ]}>
                {locationStatus === 'sharing' ? '📡 Sharing location with caregiver' :
                 locationStatus === 'error'   ? '⚠️ Location sharing failed — re-run supabase_geofence_schema.sql' :
                                               '🔒 Location permission denied'}
              </Text>
            </View>
          )}

          {/* -- Your Routine ---------------------------------------------- */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitleIcon}>🕒</Text>
              <Text style={styles.sectionTitle}>Your Routine</Text>
            </View>
          </View>

          {patientTasks.length > 0 ? (
            <View style={{ gap: 12, marginBottom: 20 }}>
              {patientTasks.map((task) => (
                <RoutineCard
                  key={task.id}
                  task={task}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onViewInstructions={setViewingInstructionsTask}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No tasks assigned yet.</Text>
          )}

          {/* Modals rendered inside ScrollView so they're always present */}
          <UnlinkedCaregiverModal
            visible={showWarningModal}
            onClose={() => setShowWarningModal(false)}
            onSearch={() => {
              setShowWarningModal(false);
              setActiveTab('Search');
              setSearchSubView('list');
            }}
          />
          <TaskInstructionsModal
            visible={viewingInstructionsTask !== null}
            task={viewingInstructionsTask}
            onClose={() => setViewingInstructionsTask(null)}
          />
        </ScrollView>
      )}

      {/* -- Bottom Nav: Left 2 | FAB center | Right 2 ---------------- */}
      <View style={styles.bottomBarBand}>
        {/* Left tabs */}
        <View style={styles.bottomBar}>
          {(['Home', 'Family'] as BottomTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent = TAB_ICON_COMPONENTS[tab];
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}  // inline — no navigation.navigate()
                style={styles.bottomTab}
              >
                <View style={styles.bottomTabIconWrap}>
                  <IconComponent active={isActive} />
                </View>
                <Text style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}>{tab}</Text>
                {isActive && <View style={styles.activeIndicator} />}
              </Pressable>
            );
          })}
        </View>

        {/* Center FAB slot */}
        <View style={styles.fabSlot}>
          <AiFab />
        </View>

        {/* Right tabs */}
        <View style={styles.bottomBar}>
          {(['Activity', 'Search'] as BottomTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent =
              tab === 'Search' && hasLinkedCaregiver
                ? IconProfile
                : TAB_ICON_COMPONENTS[tab];
            const label =
              tab === 'Search'
                ? (hasLinkedCaregiver ? 'Caregiver Profile' : 'Search')
                : tab;
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  // All tabs render inline — no navigation.navigate()
                  setActiveTab(tab);
                  if (tab === 'Search') {
                    if (hasLinkedCaregiver) {
                      setViewingCaregiver(confirmedCaregiver);
                      setSearchSubView('detail');
                    } else {
                      setSearchSubView('list');
                    }
                  }
                }}
                style={styles.bottomTab}
              >
                <View style={styles.bottomTabIconWrap}>
                  <IconComponent active={isActive} />
                </View>
                <Text
                  style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {label}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 🔔 Premium Interactive Alarm Modal Overlay */}
      {activeAlarmTask && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.alarmOverlay}>
            <View style={styles.alarmCard}>
              <View style={styles.alarmIconContainer}>
                <Text style={styles.alarmEmoji}>{activeAlarmTask.icon || '⏰'}</Text>
              </View>
              
              <Text style={styles.alarmSubtitle}>ACTIVELY REMINDING</Text>
              <Text style={styles.alarmTitle}>{activeAlarmTask.title}</Text>
              
              <View style={styles.alarmTimeBadge}>
                <Ionicons name="time-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.alarmTimeText}>Due at {activeAlarmTask.time}</Text>
              </View>

              {activeAlarmTask.description ? (
                <Text style={styles.alarmDesc}>{activeAlarmTask.description}</Text>
              ) : null}

              <View style={styles.alarmButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.alarmSnoozeBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => {
                    const taskId = activeAlarmTask.id;
                    setSnoozedTasks((prev) => ({
                      ...prev,
                      [taskId]: Date.now() + 5 * 60 * 1000,
                    }));
                    setActiveAlarmTask(null);
                  }}
                >
                  <Text style={styles.alarmSnoozeBtnText}>Snooze (5m)</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.alarmCompleteBtn,
                    pressed && { opacity: 0.9 },
                  ]}
                  onPress={async () => {
                    const taskId = activeAlarmTask.id;
                    try {
                      await handleUpdateTaskStatus(taskId, 'done');
                      setActiveAlarmTask(null);
                    } catch (err) {
                      console.error('Failed to complete task from alarm modal:', err);
                    }
                  }}
                >
                  <Text style={styles.alarmCompleteBtnText}>Complete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScreenContainer>
  );
};

// --- Styles ------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 110 },

  // Header card
  headerCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.headerBg,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locStatusPill: {
    borderRadius: 10, borderWidth: 1, marginBottom: 12,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  locStatusText: { fontFamily: F.medium, fontSize: 12 },
  greetingOverline: { fontFamily: F.bold, color: C.textLabel, fontSize: 12, letterSpacing: 1.2 },
  greetingName: { fontFamily: F.extraBold, color: C.textPrimary, fontSize: 40, marginTop: -2 },
  greetingDate: { fontFamily: F.medium, color: C.textSecondary, fontSize: 14, marginTop: 0 },
  caregiverTile: {
    width: 68, height: 80, borderRadius: 16, backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  caregiverIcon: { fontSize: 26 },
  caregiverAvatar: { width: 50, height: 50, borderRadius: 25 },
  caregiverTileImage: { width: 34, height: 34, borderRadius: 17 },
  caregiverTileLabel: {
    fontFamily: F.bold,
    fontSize: 9,
    color: C.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitleIcon: { fontSize: 18 },
  sectionTitle: { fontFamily: F.bold, fontSize: 17, color: C.textPrimary },
  progressPillWrap: { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  progressPill: { fontFamily: F.bold, fontSize: 13, color: C.primary },

  // Routine card
  mainRoutineCard: {
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    marginBottom: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  routineTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  routineIconWrap: { width: 50, height: 50, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  routineIcon: { fontSize: 22 },
  routineTextWrap: { marginLeft: 12, flex: 1 },
  routineTaskTitle: { fontFamily: F.bold, fontSize: 20, color: C.textPrimary },
  routineTaskMeta: { fontFamily: F.medium, fontSize: 14, color: C.textSecondary, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionButton: {
    minWidth: 90, height: 48, borderRadius: 14,
    paddingHorizontal: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
  },
  actionIcon: { fontSize: 20, marginRight: 6 },
  actionText: { fontFamily: F.bold, fontSize: 15, color: C.textBody },
  actionTextDone: { color: C.primaryText },
  actionTextSkip: { color: '#fff' },

  emptyText: { fontFamily: F.regular, fontSize: 15, color: C.textSecondary, textAlign: 'center', marginTop: 24, fontStyle: 'italic' },

  // Help / question-mark button
  helpCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FEF9C3',
    borderWidth: 1.5, borderColor: '#F59E0B',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 6,
  },
  helpCircleText: { fontFamily: F.bold, color: '#B45309', fontSize: 16 },

  // -- Overlay/sheet ---------------------------------------------------------
  detailOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24,
  },
  detailSheet: {
    width: '100%', backgroundColor: C.bg,
    borderRadius: 28, paddingBottom: 28,
    flexDirection: 'column',
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 8 }, shadowRadius: 24, elevation: 20,
  },
  detailHeader: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: 16, paddingTop: 14, marginBottom: 0,
  },
  detailCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
  },
  detailCloseText: { fontFamily: F.bold, fontSize: 15, color: C.textMuted },
  detailIllustration: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 16,
  },
  detailEmoji: { fontSize: 46 },
  detailTitle: { fontFamily: F.extraBold, fontSize: 22, color: C.textPrimary, textAlign: 'center', paddingHorizontal: 20, marginBottom: 12 },
  detailMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', paddingHorizontal: 16, marginBottom: 16 },
  detailPill: {
    backgroundColor: C.primaryLight, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  detailPillText: { fontFamily: F.semiBold, fontSize: 12, color: C.primary },
  detailDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 14 },
  detailInstructionLabel: { fontFamily: F.bold, fontSize: 11, letterSpacing: 1.2, color: C.textMuted, paddingHorizontal: 20, marginBottom: 8 },
  detailInstruction: { fontFamily: F.regular, fontSize: 14, color: C.textSecondary, lineHeight: 22, paddingHorizontal: 20, marginBottom: 24 },
  detailDoneBtn: {
    marginHorizontal: 20, borderRadius: 14, backgroundColor: C.primary,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: C.primary, shadowOpacity: 0.28, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6,
  },
  detailDoneBtnText: { fontFamily: F.bold, fontSize: 16, color: C.primaryText },

  // -- Caregiver profile modal ------------------------------------------------
  profileSheet: {
    width: '100%',
    backgroundColor: C.bg,
    borderRadius: 28,
    paddingBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 20,
  },
  profileAvatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  profileAvatarText: { fontSize: 44 },
  caregiverTagline: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: -2,
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  profileName: {
    fontFamily: F.extraBold,
    fontSize: 22,
    color: C.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  profileSubtitle: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  profileLabel: { fontFamily: F.bold, fontSize: 13, color: C.textMuted },
  profileValue: { fontFamily: F.medium, fontSize: 13, color: C.textPrimary },

  // -- Completed Tasks Modal --------------------------------------------------
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, maxHeight: '75%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontFamily: F.bold, fontSize: 18, color: C.textPrimary },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontFamily: F.bold, fontSize: 15, color: C.textMuted },

  // -- Undo button ------------------------------------------------------------
  undoBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    marginLeft: 8,
  },
  undoBtnText: { fontFamily: F.bold, fontSize: 12, color: C.textMuted },

  // -- Bottom nav -------------------------------------------------------------
  bottomBarBand: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 76,
    backgroundColor: C.surface,
    borderTopWidth: 1, borderTopColor: C.border,
    flexDirection: 'row',
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  bottomBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
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
  bottomLabel: { fontFamily: F.medium, fontSize: 10, color: C.textMuted, letterSpacing: 0.3 },
  bottomLabelActive: { fontFamily: F.bold, color: C.primary },
  activeIndicator: {
    position: 'absolute', bottom: 0,
    width: 18, height: 2.5, borderRadius: 2,
    backgroundColor: C.primary,
  },

  // FAB
  fabSlot: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    marginTop: -40,
  },
  fab: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.38, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 10,
    borderWidth: 3, borderColor: C.surface,
  },
  fabPressed: { transform: [{ scale: 0.95 }] },
  fabSymbol: { fontFamily: F.extraBold, color: C.primaryText, fontSize: 22 },

  // Unlinked Caregiver custom dialog styles
  alertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  alertCard: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 24,
    width: '84%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },
  alertIconWrap: {
    backgroundColor: C.primaryLight,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  alertIcon: {
    fontSize: 28,
  },
  alertTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: C.textPrimary,
    marginBottom: 8,
  },
  alertMessage: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  alertBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  alertCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
  },
  alertCancelText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.textSecondary,
  },
  alertConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
  },
  alertConfirmText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  alertBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    borderRadius: 10,
  },
  cardActionBtnDone: {
    backgroundColor: '#E6F4EA',
    borderColor: '#86EFAC',
  },
  cardActionBtnUnsure: {
    backgroundColor: '#FFEDD5',
    borderColor: '#FDBA74',
  },
  cardActionBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.textSecondary,
  },
  noStepsText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
    fontStyle: 'italic',
  },
  stepsContainer: {
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepNumberCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontFamily: F.extraBold,
    fontSize: 10,
    color: C.textSecondary,
  },
  stepContent: {
    flex: 1,
    gap: 8,
  },
  stepText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textPrimary,
    lineHeight: 18,
  },
  stepPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  alarmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alarmCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  alarmIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  alarmEmoji: {
    fontSize: 40,
  },
  alarmSubtitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#EF4444',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  alarmTitle: {
    fontFamily: F.extraBold,
    fontSize: 22,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  alarmTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  alarmTimeText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#991B1B',
  },
  alarmDesc: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  alarmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  alarmSnoozeBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmSnoozeBtnText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#4B5563',
  },
  alarmCompleteBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmCompleteBtnText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
