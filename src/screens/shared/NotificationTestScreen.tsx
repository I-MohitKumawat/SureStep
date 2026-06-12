/**
 * SureStep — src/screens/shared/NotificationTestScreen.tsx
 *
 * Developer validation page for the notification, alarm, reminder, and
 * escalation system. Accessible from all role settings screens.
 *
 * Triggers:
 *   - Test notification (creates a real notification_log entry + WS event)
 *   - Test reminder (creates a reminder scheduled for now → triggers immediately)
 *   - Test alarm (local Expo notification in 5 seconds)
 *   - Test escalation (creates reminder backdated 30 min → triggers escalation)
 *
 * Real-time log panel shows all incoming socket events.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import {
  triggerTestNotification,
  triggerTestReminder,
  triggerTestEscalation,
  fetchActiveReminders,
  type ReminderLog,
} from '../../services/notificationService';
import { scheduleTestAlarm } from '../../services/localAlarmService';
import { getSocket } from '../../services/socketClient';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  checkExactAlarmPermission,
  checkBatteryOptimizationEnabled,
  openBatteryOptimizationSettings,
  openExactAlarmSettings,
} from '../../utils/deviceTelemetry';
import { C, patientC, caregiverC, familyC, SOS_RED } from '../../theme/colors';
import { F } from '../../theme/fonts';

interface SocketLogEntry {
  id: string;
  ts: string;
  event: string;
  data: string;
}

const MAX_LOG_ENTRIES = 30;

export const NotificationTestScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const role = user?.role ?? 'PATIENT';

  const accentColor =
    role === 'CAREGIVER' ? caregiverC.primary :
    role === 'FAMILY'    ? familyC.primary    :
    patientC.primary;

  const { checkNotificationPermissions, requestNotificationPermissions } = useNotifications();

  const [loading,         setLoading]         = useState<string | null>(null);
  const [socketLog,       setSocketLog]        = useState<SocketLogEntry[]>([]);
  const [activeReminders, setActiveReminders]  = useState<ReminderLog[]>([]);
  
  const [notifPermission, setNotifPermission] = useState<string>('unknown');
  const [alarmPermission, setAlarmPermission] = useState<boolean>(true);
  const [batteryOptimized, setBatteryOptimized] = useState<boolean>(false);
  const [scheduledCount,   setScheduledCount]   = useState<number>(0);
  
  const logIdRef = useRef(0);

  const refreshAllStatus = useCallback(async () => {
    try {
      const np = await checkNotificationPermissions();
      setNotifPermission(np);

      const ap = await checkExactAlarmPermission();
      setAlarmPermission(ap);

      const bo = await checkBatteryOptimizationEnabled();
      setBatteryOptimized(bo);

      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      setScheduledCount(scheduled.length);
    } catch (err) {
      console.warn('[Diagnostics] Failed to refresh statuses:', err);
    }
  }, [checkNotificationPermissions]);

  // ─── Load active reminders ────────────────────────────────────────────────

  const loadActiveReminders = useCallback(async () => {
    try {
      const reminders = await fetchActiveReminders(
        role === 'PATIENT' ? user?.id : undefined
      );
      setActiveReminders(reminders);
    } catch {
      setActiveReminders([]);
    }
  }, [user, role]);

  useEffect(() => { void loadActiveReminders(); }, [loadActiveReminders]);

  useEffect(() => {
    void refreshAllStatus();
  }, [refreshAllStatus]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refreshAllStatus();
        void loadActiveReminders();
      }
    });
    return () => sub.remove();
  }, [refreshAllStatus, loadActiveReminders]);

  // ─── Socket event logger ──────────────────────────────────────────────────

  const addLog = useCallback((event: string, data: any) => {
    const id = String(logIdRef.current++);
    const entry: SocketLogEntry = {
      id,
      ts:    new Date().toLocaleTimeString(),
      event,
      data:  typeof data === 'object' ? JSON.stringify(data).slice(0, 120) : String(data),
    };
    setSocketLog((prev) => [entry, ...prev].slice(0, MAX_LOG_ENTRIES));
  }, []);

  useEffect(() => {
    const EVENTS = [
      'notification:new',
      'reminder:active',
      'reminder:snoozed',
      'reminder:completed',
      'reminder:skipped',
      'reminder:missed',
      'alert:updated',
      'state:change',
    ];

    let cleanupFns: Array<() => void> = [];

    const subscribe = () => {
      const socket = getSocket();
      if (!socket) return false;

      for (const evt of EVENTS) {
        const handler = (data: any) => addLog(evt, data);
        socket.on(evt, handler);
        cleanupFns.push(() => socket.off(evt, handler));
      }
      return true;
    };

    if (!subscribe()) {
      const interval = setInterval(() => {
        if (subscribe()) clearInterval(interval);
      }, 500);
      cleanupFns.push(() => clearInterval(interval));
    }

    return () => cleanupFns.forEach((fn) => fn());
  }, [addLog]);



  // ─── Actions ──────────────────────────────────────────────────────────────

  const run = async (key: string, action: () => Promise<any>) => {
    setLoading(key);
    try {
      const result = await action();
      addLog(`[TEST] ${key}`, result ?? 'success');
    } catch (err: any) {
      addLog(`[ERROR] ${key}`, err?.message ?? 'failed');
      Alert.alert('Error', err?.message ?? 'Action failed');
    } finally {
      setLoading(null);
      void loadActiveReminders();
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const renderAction = (
    key: string,
    label: string,
    subtitle: string,
    iconName: keyof typeof Ionicons.glyphMap,
    color: string,
    onPress: () => void,
  ) => (
    <Pressable
      key={key}
      style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.88 }]}
      onPress={onPress}
      disabled={!!loading}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '18' }]}>
        {loading === key ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Ionicons name={iconName} size={22} color={color} />
        )}
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
    </Pressable>
  );

  return (
    <ScreenContainer edges={['top', 'bottom']} style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Notification Testing</Text>
          <Text style={styles.headerSubtitle}>Developer Validation Panel</Text>
        </View>
        <View style={[styles.devBadge, { backgroundColor: accentColor }]}>
          <Text style={styles.devBadgeText}>DEV</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Diagnostics & System Status */}
        <Text style={[styles.sectionTitle, { color: accentColor }]}>DIAGNOSTICS & SYSTEM STATUS</Text>
        <View style={styles.diagnosticsCard}>
          {/* Notification Permission Row */}
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Notification Permission</Text>
              <Text style={[
                styles.statusValue,
                { color: notifPermission === 'granted' ? '#10B981' : '#EF4444' }
              ]}>
                {notifPermission === 'granted' ? 'Granted' : 'Denied'}
              </Text>
            </View>
            {notifPermission !== 'granted' && (
              <Pressable
                style={[styles.statusBtn, { backgroundColor: accentColor }]}
                onPress={() => void requestNotificationPermissions().then(() => void refreshAllStatus())}
              >
                <Text style={styles.statusBtnText}>Enable</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.statusDivider} />

          {/* Alarm Permission Row */}
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Exact Alarm Permission</Text>
              <Text style={[
                styles.statusValue,
                { color: alarmPermission ? '#10B981' : '#F59E0B' }
              ]}>
                {alarmPermission ? 'Allowed' : 'Restricted'}
              </Text>
            </View>
            <Pressable
              style={[styles.statusBtn, { backgroundColor: '#7C3AED' }]}
              onPress={openExactAlarmSettings}
            >
              <Text style={styles.statusBtnText}>Manage</Text>
            </Pressable>
          </View>

          <View style={styles.statusDivider} />

          {/* Battery Optimization Row */}
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Battery Optimization</Text>
              <Text style={[
                styles.statusValue,
                { color: batteryOptimized ? '#F59E0B' : '#10B981' }
              ]}>
                {batteryOptimized ? 'Active (Optimized)' : 'Disabled (Unrestricted)'}
              </Text>
            </View>
            <Pressable
              style={[styles.statusBtn, { backgroundColor: '#F59E0B' }]}
              onPress={openBatteryOptimizationSettings}
            >
              <Text style={styles.statusBtnText}>Configure</Text>
            </Pressable>
          </View>

          <View style={styles.statusDivider} />

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statCount}>{scheduledCount}</Text>
              <Text style={styles.statLabel}>Scheduled Alarms</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statCount}>{activeReminders.length}</Text>
              <Text style={styles.statLabel}>Active Reminders</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <Text style={[styles.sectionTitle, { color: accentColor }]}>TRIGGER ACTIONS</Text>
        <View style={styles.actionsCard}>
          {renderAction(
            'notification',
            'Test Notification',
            'Creates a real notification log + WS event',
            'notifications',
            accentColor,
            () => run('notification', triggerTestNotification),
          )}
          <View style={styles.divider} />
          {renderAction(
            'reminder',
            'Test Reminder',
            'Schedules a reminder for now → overlay fires immediately',
            'alarm',
            '#F59E0B',
            () => run('reminder', triggerTestReminder),
          )}
          <View style={styles.divider} />
          {renderAction(
            'alarm',
            'Test Local Alarm',
            'Local Expo notification fires in 5 seconds',
            'alarm-outline',
            '#7C3AED',
            () => run('alarm', () => scheduleTestAlarm(5).then((id) => ({ scheduled: id }))),
          )}
          <View style={styles.divider} />
          {renderAction(
            'escalation',
            'Test Escalation',
            'Creates a backdated reminder to trigger escalation sweep',
            'warning',
            SOS_RED,
            () => run('escalation', triggerTestEscalation),
          )}
        </View>

        {/* Active reminders */}
        <Text style={[styles.sectionTitle, { color: accentColor }]}>ACTIVE REMINDERS</Text>
        <View style={styles.actionsCard}>
          {activeReminders.length === 0 ? (
            <View style={styles.emptyReminders}>
              <Ionicons name="checkmark-circle-outline" size={32} color={C.textMuted} />
              <Text style={styles.emptyText}>No active reminders</Text>
            </View>
          ) : (
            activeReminders.map((r, i) => (
              <View key={r.id}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.reminderRow}>
                  <View style={[
                    styles.reminderStateDot,
                    { backgroundColor: r.state === 'ACTIVE' ? '#F59E0B' : r.state === 'MISSED' ? SOS_RED : C.primary },
                  ]} />
                  <View style={styles.reminderText}>
                    <Text style={styles.reminderTitle}>{r.title}</Text>
                    <Text style={styles.reminderMeta}>
                      {r.state} · Level {r.escalation_level} · {new Date(r.scheduled_at).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Socket event log */}
        <View style={styles.logHeader}>
          <Text style={[styles.sectionTitle, { color: accentColor }]}>LIVE SOCKET LOG</Text>
          <Pressable onPress={() => setSocketLog([])} style={styles.clearBtn}>
            <Text style={[styles.clearBtnText, { color: accentColor }]}>Clear</Text>
          </Pressable>
        </View>
        <View style={styles.logCard}>
          {socketLog.length === 0 ? (
            <View style={styles.emptyReminders}>
              <Ionicons name="radio-outline" size={28} color={C.textMuted} />
              <Text style={styles.emptyText}>Waiting for socket events…</Text>
            </View>
          ) : (
            socketLog.map((entry) => (
              <View key={entry.id} style={styles.logEntry}>
                <View style={styles.logEntryHeader}>
                  <Text style={[styles.logEvent, { color: accentColor }]}>{entry.event}</Text>
                  <Text style={styles.logTs}>{entry.ts}</Text>
                </View>
                <Text style={styles.logData} numberOfLines={3}>{entry.data}</Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  backBtn:         { padding: 4 },
  headerText:      { flex: 1 },
  headerTitle:     { fontSize: 17, fontFamily: F.bold, color: C.textPrimary },
  headerSubtitle:  { fontSize: 11, fontFamily: F.regular, color: C.textSecondary },
  devBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  devBadgeText: { fontSize: 10, fontFamily: F.bold, color: '#FFFFFF' },
  scroll:        { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  sectionTitle:  { fontSize: 11, fontFamily: F.semiBold, letterSpacing: 0.9, textTransform: 'uppercase' },
  actionsCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  actionCard:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 14 },
  actionIcon:     { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionText:     { flex: 1 },
  actionLabel:    { fontSize: 15, fontFamily: F.semiBold, color: C.textPrimary },
  actionSubtitle: { fontSize: 12, fontFamily: F.regular, color: C.textSecondary, marginTop: 2 },
  divider:        { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  emptyReminders: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText:      { fontSize: 13, fontFamily: F.regular, color: C.textMuted },
  reminderRow:    { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  reminderStateDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  reminderText:   { flex: 1 },
  reminderTitle:  { fontSize: 14, fontFamily: F.medium, color: C.textPrimary },
  reminderMeta:   { fontSize: 11, fontFamily: F.regular, color: C.textSecondary, marginTop: 2 },
  logHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clearBtn:       { padding: 4 },
  clearBtnText:   { fontSize: 12, fontFamily: F.semiBold },
  logCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 12,
    minHeight: 120,
    gap: 8,
  },
  logEntry: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  logEntryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logEvent:       { fontSize: 12, fontFamily: F.bold },
  logTs:          { fontSize: 11, fontFamily: F.regular, color: '#64748B' },
  logData:        { fontSize: 11, fontFamily: F.regular, color: '#94A3B8' },
  diagnosticsCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statusInfo: {
    flex: 1,
    gap: 4,
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: F.semiBold,
    color: C.textPrimary,
  },
  statusValue: {
    fontSize: 13,
    fontFamily: F.medium,
  },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnText: {
    fontSize: 12,
    fontFamily: F.bold,
    color: '#FFFFFF',
  },
  statusDivider: {
    height: 1,
    backgroundColor: C.border,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statCount: {
    fontSize: 20,
    fontFamily: F.bold,
    color: C.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: F.regular,
    color: C.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: C.border,
  },
});
