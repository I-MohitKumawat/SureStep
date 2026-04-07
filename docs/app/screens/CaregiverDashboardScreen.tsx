import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'CaregiverDashboard'>;

export const CaregiverDashboardScreen: React.FC<Props> = () => {
  const [routineDone, setRoutineDone] = useState({
    medication: true,
    breakfast: true,
    walk: false
  });
  const [showReminderSent, setShowReminderSent] = useState(false);
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);
    };
  }, []);

  const toggleRoutine = (key: 'medication' | 'breakfast' | 'walk') => {
    setRoutineDone((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openDialPad = async () => {
    await Linking.openURL('tel:');
  };

  const sendReminder = () => {
    setShowReminderSent(true);
    if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);
    reminderTimerRef.current = setTimeout(() => setShowReminderSent(false), 2500);
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.avatar} />
            <View style={styles.headerCenter}>
              <Text style={styles.overview}>PATIENT OVERVIEW</Text>
              <Text style={styles.name}>Srinivas</Text>
              <Text style={styles.lastActivity}>LAST ACTIVITY: 6 MIN AGO</Text>
            </View>
            <View style={styles.safePill}>
              <Text style={styles.safeText}>Safe</Text>
            </View>
          </View>
          <View style={styles.routineHeaderRow}>
            <Text style={styles.sectionTitle}>Daily Routine</Text>
            <Text style={styles.completedText}>
              <Text style={styles.completedCount}>2/3</Text> Completed
            </Text>
          </View>
        </View>

        <View style={styles.routineList}>
          <Pressable style={styles.routineRowCard} onPress={() => toggleRoutine('medication')}>
            <View style={styles.routineIconBubble}>
              <Text style={styles.routineEmoji}>💊</Text>
            </View>
            <View style={styles.routineTextCol}>
              <Text style={styles.routineTitle}>Morning Medication</Text>
              <Text style={styles.routineMeta}>Taken at 08:30 AM</Text>
            </View>
            <View style={routineDone.medication ? styles.doneCircle : styles.pendingCircle}>
              {routineDone.medication ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
          </Pressable>

          <Pressable style={styles.routineRowCard} onPress={() => toggleRoutine('breakfast')}>
            <View style={styles.routineIconBubble}>
              <Text style={styles.routineEmoji}>🍽️</Text>
            </View>
            <View style={styles.routineTextCol}>
              <Text style={styles.routineTitle}>Healthy Breakfast</Text>
              <Text style={styles.routineMeta}>Completed at 09:15 AM</Text>
            </View>
            <View style={routineDone.breakfast ? styles.doneCircle : styles.pendingCircle}>
              {routineDone.breakfast ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
          </Pressable>

          <Pressable style={[styles.routineRowCard, styles.walkCard]} onPress={() => toggleRoutine('walk')}>
            <View style={styles.routineIconBubble}>
              <Text style={styles.routineEmoji}>🚶</Text>
            </View>
            <View style={styles.routineTextCol}>
              <Text style={styles.routineTitle}>Daily Walk</Text>
              <Text style={styles.routineMeta}>Scheduled for 11:00 AM</Text>
            </View>
            <View style={routineDone.walk ? styles.doneCircle : styles.pendingCircle}>
              {routineDone.walk ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
          </Pressable>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>STEPS</Text>
            <Text style={styles.metricValue}>1,246</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>PULSE</Text>
            <Text style={styles.metricValue}>
              76 <Text style={styles.metricUnit}>BPM</Text>
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>BATTERY</Text>
            <Text style={styles.metricValue}>
              95 <Text style={styles.metricUnit}>%</Text>
            </Text>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <Pressable style={[styles.actionButton, styles.primaryAction]} onPress={() => void openDialPad()}>
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionLabelPrimary}>Call Srinivas</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.secondaryAction]} onPress={sendReminder}>
            <Text style={styles.actionIcon}>🔔</Text>
            <Text style={styles.actionLabelSecondary}>Send Reminder</Text>
          </Pressable>
        </View>
      </ScrollView>

      {showReminderSent ? (
        <View style={styles.reminderToastWrap} pointerEvents="none">
          <View style={styles.reminderToast}>
            <Text style={styles.reminderToastText}>sent a remainder</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.bottomBarBand}>
        <View style={styles.bottomBar}>
          <Pressable style={[styles.bottomTab, styles.bottomTabActivePill]}>
            <Text style={styles.bottomTabIcon}>▦</Text>
            <Text style={[styles.bottomLabel, styles.bottomLabelActive]}>Home</Text>
          </Pressable>
          <Pressable style={styles.bottomTab}>
            <Text style={styles.bottomTabIcon}>🔔</Text>
            <Text style={styles.bottomLabel}>Alerts</Text>
          </Pressable>
          <Pressable style={styles.bottomTab}>
            <Text style={styles.bottomTabIcon}>👥</Text>
            <Text style={styles.bottomLabel}>Manage</Text>
          </Pressable>
          <Pressable style={styles.bottomTab}>
            <Text style={styles.bottomTabIcon}>👤</Text>
            <Text style={styles.bottomLabel}>Profile</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F1F4F4', paddingHorizontal: 0, paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 124 },
  headerCard: { marginBottom: 10 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#8B949E' },
  headerCenter: { flex: 1, marginLeft: 10 },
  overview: { fontSize: 12, letterSpacing: 1.1, color: '#2C5964', fontWeight: '700' },
  name: { fontSize: 26, color: '#1F2937', fontWeight: '600', marginTop: -2 },
  lastActivity: { fontSize: 11, color: '#2A2A31', marginTop: -2 },
  safePill: { backgroundColor: '#90EE90', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  safeText: { fontSize: 16, color: '#0F3D21', fontWeight: '700' },
  routineHeaderRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, color: '#1F2937', fontWeight: '700' },
  completedText: { fontSize: 16, color: '#146B5A', fontWeight: '600' },
  completedCount: { fontWeight: '800' },
  routineList: { marginTop: 8 },
  routineRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  walkCard: { borderWidth: 1.2, borderColor: '#D6DDDD' },
  routineIconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#B7F7C6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  routineEmoji: { fontSize: 24 },
  routineTextCol: { flex: 1, marginLeft: 12 },
  routineTitle: { fontSize: 16, color: '#1F2937', fontWeight: '700' },
  routineMeta: { fontSize: 12, color: '#374151', marginTop: 1 },
  doneCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0A7A32',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pendingCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#B7BDBD',
    backgroundColor: '#FFFFFF'
  },
  checkMark: { fontSize: 20, color: '#FFFFFF', fontWeight: '800' },
  statsCard: {
    backgroundColor: '#EEF2F2',
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  metricCol: { alignItems: 'center', minWidth: 88 },
  metricLabel: { fontSize: 12, color: '#4B5563', fontWeight: '700', letterSpacing: 0.6 },
  metricValue: { fontSize: 22, color: '#111827', fontWeight: '700' },
  metricUnit: { fontSize: 13, fontWeight: '600' },
  metricDivider: { width: 1, backgroundColor: '#D6DDDD', marginVertical: 2 },
  actionsCard: {
    borderRadius: 18,
    paddingVertical: 2,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  actionButton: {
    width: '46%',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryAction: { backgroundColor: '#0E6A5D' },
  secondaryAction: { backgroundColor: '#FFFFFF' },
  actionIcon: { fontSize: 34 },
  actionLabelPrimary: { fontSize: 16, color: '#FFFFFF', marginTop: 4, fontWeight: '700' },
  actionLabelSecondary: { fontSize: 16, color: '#0F3D36', marginTop: 4, fontWeight: '700' },
  reminderToastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 92,
    alignItems: 'center'
  },
  reminderToast: {
    backgroundColor: '#0E6A5D',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  reminderToastText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  bottomBarBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 92,
    backgroundColor: '#FFFFFF'
  },
  bottomBar: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  bottomTab: { alignItems: 'center', minWidth: 62, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  bottomTabActivePill: { backgroundColor: '#A7F0DF' },
  bottomTabIcon: { fontSize: 26, color: '#4A4A52' },
  bottomLabel: { marginTop: 2, fontSize: 12, color: '#5A5A5F' },
  bottomLabelActive: { fontWeight: '700', color: '#111827' }
});
