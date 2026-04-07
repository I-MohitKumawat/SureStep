import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  IconPatients,
  IconProfile,
} from '../assets/icons/NavIcons';

type Props = NativeStackScreenProps<HomeStackParamList, 'CaregiverDashboard'>;
type CaregiverTab = 'Home' | 'Alerts' | 'Patients' | 'Profile';

type TabIconProps = { active: boolean };
const TAB_ICON_COMPONENTS: Record<CaregiverTab, React.FC<TabIconProps>> = {
  Home:     ({ active }) => <IconDashboard size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Alerts:   ({ active }) => <IconBell     size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Patients: ({ active }) => <IconPatients size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Profile:  ({ active }) => <IconProfile  size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
};

export const CaregiverDashboardScreen: React.FC<Props> = () => {
  const { tasks } = useTasks();
  const [showReminderSent, setShowReminderSent] = useState(false);
  const [activeTab, setActiveTab] = useState<CaregiverTab>('Home');
  const [patientName, setPatientName] = useState('Srinivas');
  const [batteryLevel, setBatteryLevel] = useState(82);
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const patientTasks  = tasks.filter((t) => t.patientId === patientId);
  const completedTasks = patientTasks.filter((t) => t.status === 'done').length;
  const totalTasks     = patientTasks.length;

  const routineStatus = {
    medication: patientTasks.find((t) => t.title.toLowerCase().includes('med'))?.status === 'done',
    breakfast:  patientTasks.find((t) => t.title.toLowerCase().includes('breakfast'))?.status === 'done',
    walk:       patientTasks.find((t) => t.title.toLowerCase().includes('walk'))?.status === 'done',
  };

  useEffect(() => () => { if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current); }, []);

  const openDialPad = async () => Linking.openURL('tel:');

  const sendReminder = () => {
    setShowReminderSent(true);
    if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);
    reminderTimerRef.current = setTimeout(() => setShowReminderSent(false), 2500);
  };

  const batteryColor = batteryLevel >= 50 ? C.safeText : batteryLevel >= 20 ? '#D97706' : C.error;

  const routineItems = [
    { key: 'medication', emoji: '💊', title: 'Morning Medication', meta: 'Taken at 08:30 AM',  done: routineStatus.medication },
    { key: 'breakfast',  emoji: '🍽️', title: 'Healthy Breakfast',  meta: 'Completed at 09:15 AM', done: routineStatus.breakfast },
    { key: 'walk',       emoji: '🚶', title: 'Daily Walk',         meta: 'Scheduled for 11:00 AM', done: routineStatus.walk },
  ];

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Patient Header ─────────────────────────────────────────── */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            {/* Avatar placeholder */}
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{patientName[0]?.toUpperCase() ?? 'S'}</Text>
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.overview}>PATIENT OVERVIEW</Text>
              <Text style={styles.name}>{patientName}</Text>
              <Text style={styles.lastActivity}>LAST ACTIVITY · {lastActivityLabel}</Text>
            </View>
            <View style={styles.safePill}>
              <Text style={styles.safeIcon}>◉</Text>
              <Text style={styles.safeText}>Safe</Text>
            </View>
          </View>

          {/* Routine progress row */}
          <View style={styles.routineHeaderRow}>
            <Text style={styles.sectionTitle}>Daily Routine</Text>
            <View style={styles.completedPill}>
              <Text style={styles.completedText}>
                <Text style={styles.completedCount}>{completedTasks}/{totalTasks}</Text> Completed
              </Text>
            </View>
          </View>
        </View>

        {/* ── Routine List ────────────────────────────────────────────── */}
        <View style={styles.routineList}>
          {routineItems.map((item) => (
            <View key={item.key} style={[styles.routineRowCard, !item.done && styles.routineRowCardPending]}>
              <View style={[styles.routineIconBubble, item.done ? styles.bubbleDone : styles.bubblePending]}>
                <Text style={styles.routineEmoji}>{item.emoji}</Text>
              </View>
              <View style={styles.routineTextCol}>
                <Text style={styles.routineTitle}>{item.title}</Text>
                <Text style={styles.routineMeta}>{item.meta}</Text>
              </View>
              <View style={item.done ? styles.doneCircle : styles.pendingCircle}>
                {item.done && <Text style={styles.checkMark}>✓</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* ── Stats Card ──────────────────────────────────────────────── */}
        <View style={styles.statsCard}>
          <View style={styles.metricCol}>
            <Text style={styles.metricIcon}>🦶</Text>
            <Text style={styles.metricLabel}>STEPS</Text>
            <Text style={styles.metricValue}>1,246</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricIcon}>🔋</Text>
            <Text style={styles.metricLabel}>BATTERY</Text>
            <Text style={[styles.metricValue, { color: batteryColor }]}>
              {batteryLevel}<Text style={styles.metricUnit}>%</Text>
            </Text>
          </View>
        </View>

        {/* ── Action Buttons ──────────────────────────────────────────── */}
        <View style={styles.actionsCard}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.primaryAction, pressed && { opacity: 0.88 }]}
            onPress={() => void openDialPad()}
          >
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionLabelPrimary}>Call {patientName}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.secondaryAction, pressed && { opacity: 0.88 }]}
            onPress={sendReminder}
          >
            <Text style={styles.actionIcon}>🔔</Text>
            <Text style={styles.actionLabelSecondary}>
              {showReminderSent ? 'Reminder sent!' : 'Send Reminder'}
            </Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* ── Reminder Toast ─────────────────────────────────────────────── */}
      {showReminderSent && (
        <View style={styles.reminderToastWrap} pointerEvents="none">
          <View style={styles.reminderToast}>
            <Text style={styles.reminderToastText}>✓  Reminder sent to {patientName}</Text>
          </View>
        </View>
      )}

      {/* ── Bottom Nav ──────────────────────────────────────────────────── */}
      <View style={styles.bottomBarBand}>
        <View style={styles.bottomBar}>
          {(['Home', 'Alerts', 'Patients', 'Profile'] as CaregiverTab[]).map((tab) => {
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
  overview:     { fontFamily: F.bold, fontSize: 11, letterSpacing: 1.2, color: C.primary },
  name:         { fontFamily: F.extraBold, fontSize: 26, color: C.textPrimary, marginTop: 1 },
  lastActivity: { fontFamily: F.medium, fontSize: 10, color: C.textSecondary, marginTop: 1, letterSpacing: 0.4 },

  safePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.safe, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: C.safeBorder,
  },
  safeIcon: { fontSize: 12, color: C.safeText },
  safeText: { fontFamily: F.bold, fontSize: 14, color: C.safeText },

  routineHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: F.bold, fontSize: 18, color: C.textPrimary },
  completedPill: { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  completedText: { fontFamily: F.semiBold, fontSize: 14, color: C.primary },
  completedCount: { fontFamily: F.extraBold },

  // ── Routine rows ────────────────────────────────────────────────────────────
  routineList: { gap: 10, marginBottom: 14 },
  routineRowCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  routineRowCardPending: { borderWidth: 1.5, borderColor: C.border },

  bubbleDone:    { backgroundColor: '#A7F3D0' },   // green tint for done
  bubblePending: { backgroundColor: '#EAF6F8' },   // blue-teal tint for pending

  routineIconBubble: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  routineEmoji:   { fontSize: 22 },
  routineTextCol: { flex: 1, marginLeft: 12 },
  routineTitle:   { fontFamily: F.bold, fontSize: 15, color: C.textPrimary },
  routineMeta:    { fontFamily: F.regular, fontSize: 13, color: C.textSecondary, marginTop: 2 },

  doneCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.done, alignItems: 'center', justifyContent: 'center',
  },
  pendingCircle: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: C.pendingBorder, backgroundColor: C.pending,
  },
  checkMark: { fontFamily: F.bold, fontSize: 18, color: C.primaryText },

  // ── Stats ───────────────────────────────────────────────────────────────────
  statsCard: {
    backgroundColor: C.surface,
    borderRadius: 18, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 8, paddingVertical: 16,
    marginBottom: 14,
    flexDirection: 'row', justifyContent: 'space-around',
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  metricCol:   { alignItems: 'center', minWidth: 88 },
  metricIcon:  { fontSize: 18, marginBottom: 4 },
  metricLabel: { fontFamily: F.bold, fontSize: 10, color: C.textSecondary, letterSpacing: 0.8 },
  metricValue: { fontFamily: F.extraBold, fontSize: 22, color: C.textPrimary, marginTop: 2 },
  metricUnit:  { fontFamily: F.semiBold, fontSize: 13 },
  metricDivider: { width: 1, backgroundColor: C.borderMid, marginVertical: 4 },

  // ── Actions ─────────────────────────────────────────────────────────────────
  actionsCard: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 12,
  },
  actionButton: {
    flex: 1, borderRadius: 18,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
  },
  primaryAction:   {
    backgroundColor: C.primary,
    shadowColor: C.primary, shadowOpacity: 0.28, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6,
  },
  secondaryAction: {
    backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: C.border,
  },
  actionIcon:           { fontSize: 28 },
  actionLabelPrimary:   { fontFamily: F.bold, fontSize: 15, color: C.primaryText, marginTop: 6 },
  actionLabelSecondary: { fontFamily: F.bold, fontSize: 15, color: C.primary, marginTop: 6 },

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
