import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { useTasks } from '../context/taskContext';
import { readPatientProfile } from '../utils/sharedProfile';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import {
  IconDashboard,
  IconBell,
  IconActivity,
  IconProfile,
} from '../assets/icons/NavIcons';
import {
  haversineMeters,
  PATIENT_GEOFENCES,
  DEFAULT_GEOFENCE,
  type Coords,
} from '../utils/geofence';

type Props = NativeStackScreenProps<HomeStackParamList, 'CaregiverDashboard'>;
type CaregiverTab = 'Home' | 'Alerts' | 'Manage' | 'Profile';

type TabIconProps = { active: boolean };
const TAB_ICON_COMPONENTS: Record<CaregiverTab, React.FC<TabIconProps>> = {
  Home: ({ active }) => <IconDashboard size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Alerts: ({ active }) => <IconBell size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Manage: ({ active }) => <IconActivity size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Profile: ({ active }) => <IconProfile size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
};

export const CaregiverDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const CAPSULE_HEIGHT = 84;
  const CAPSULE_GAP = 12;
  const CAPSULE_STEP = CAPSULE_HEIGHT + CAPSULE_GAP;
  const { tasks } = useTasks();
  const [reminderSentKeys, setReminderSentKeys] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<CaregiverTab>('Home');
  const [patientName, setPatientName] = useState('Srinivas');
  const [batteryLevel, setBatteryLevel] = useState(82);
  const [patientCoords, setPatientCoords] = useState<Coords | null>(null);
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geoSubRef = useRef<Location.LocationSubscription | null>(null);
  const capsuleScrollY = useRef(new Animated.Value(0)).current;

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

  // Load patient name and battery from shared profile (poll every 30 s)
  const loadProfile = useCallback(() => {
    readPatientProfile().then((p) => {
      if (p) {
        if (p.fullName) setPatientName(p.fullName);
        if (typeof p.batteryLevel === 'number') setBatteryLevel(p.batteryLevel);
      }
    });
  }, []);

  useEffect(() => {
    loadProfile();
    const interval = setInterval(loadProfile, 30_000);
    return () => clearInterval(interval);
  }, [loadProfile]);

  const patientId = 'p1';
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

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Patient Header ─────────────────────────────────────────── */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{patientName[0]?.toUpperCase() ?? 'S'}</Text>
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.overview}>PATIENT OVERVIEW</Text>
              <Text style={styles.name}>{patientName}</Text>
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
        </View>
      </ScrollView>

      {/* ── Reminder Toast ─────────────────────────────────────────────── */}
      {reminderSentKeys.size > 0 && (
        <View style={styles.reminderToastWrap} pointerEvents="none">
          <View style={styles.reminderToast}>
            <Text style={styles.reminderToastText}>✓  Reminder sent to {patientName}</Text>
          </View>
        </View>
      )}

      {/* ── Bottom Nav ──────────────────────────────────────────────────── */}
      <View style={styles.bottomBarBand}>
        <View style={styles.bottomBar}>
          {(['Home', 'Alerts', 'Manage', 'Profile'] as CaregiverTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent = TAB_ICON_COMPONENTS[tab];
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  setActiveTab(tab);
                  if (tab === 'Home') navigation.navigate('CaregiverPatients');
                  if (tab === 'Manage') navigation.navigate('CaregiverManage');
                }}
                style={styles.bottomTab}
              >
                <View style={styles.bottomTabIconWrap}>
                  <IconComponent active={isActive} />
                </View>
                <Text style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}>
                  {tab === 'Manage' ? 'manage' : tab}
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

const styles = StyleSheet.create({
  screen: { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 96 },

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
  name: { fontFamily: F.extraBold, fontSize: 26, color: C.textPrimary, marginTop: 1 },
  lastActivity: { fontFamily: F.medium, fontSize: 10, color: C.textSecondary, marginTop: 1, letterSpacing: 0.4 },

  // inline header actions (call + battery)
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  headerActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  headerCallBtn: { backgroundColor: C.primary },
  headerActionIcon: { fontSize: 14 },
  headerCallLabel: { fontFamily: F.bold, fontSize: 13, color: C.primaryText },
  headerBatteryChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.surface, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.border },
  headerBatteryLabel: { fontFamily: F.bold, fontSize: 13 },

  // Geofence card
  geoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 13,
    marginTop: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  geoDot:     { width: 10, height: 10, borderRadius: 5 },
  geoTitle:   { fontFamily: F.bold, fontSize: 15, marginBottom: 2 },
  geoMeta:    { fontFamily: F.regular, fontSize: 13, color: C.textSecondary },
  geoChevron: { fontFamily: F.bold, fontSize: 22, color: C.textMuted, lineHeight: 26 },

  routineHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: F.bold, fontSize: 18, color: C.textPrimary },
  completedPill: { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  completedText: { fontFamily: F.semiBold, fontSize: 14, color: C.primary },
  completedCount: { fontFamily: F.extraBold },

  // ── Routine outer wrapper ──────────────────────────────────────────
  routineOuterContainer: { marginBottom: 14 },

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

   routineOuterContainer: {
    backgroundColor: '#f0fff8ff', // creamish white
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginTop: 10,

    // optional depth (makes it look like a card)
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
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
