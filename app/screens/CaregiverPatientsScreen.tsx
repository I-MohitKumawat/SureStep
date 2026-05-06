/**
 * CaregiverPatientsScreen.tsx
 *
 * Patient list sourced exclusively from Supabase:
 *  - patient_caregiver_links  → which patients belong to this caregiver
 *  - mock_users / patients    → patient names
 *  - tasks                    → real completion stats, last activity, alerts
 *
 * Realtime: re-fetches the full list whenever a new link INSERT fires.
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { supabase } from '../utils/supabaseClient';
import { subscribeToCaregiversLinks } from '../../backend/caregiverLinks';
import { useAuth } from '../../packages/core/auth/AuthContext';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import {
  IconDashboard,
  IconBell,
  IconSettings,
} from '../assets/icons/NavIcons';

type Props = NativeStackScreenProps<HomeStackParamList, 'CaregiverPatients'>;
type CaregiverTab = 'Home' | 'Alerts' | 'Settings';

type TabIconProps = { active: boolean };
const TAB_ICON_COMPONENTS: Record<CaregiverTab, React.FC<TabIconProps>> = {
  Home:     ({ active }) => <IconDashboard size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Alerts:   ({ active }) => <IconBell     size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Settings: ({ active }) => <IconSettings size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Patient = {
  id: string;
  name: string;
  completedTasks: number;
  totalTasks: number;
  lastActivity: string;
  statusLabel: 'On track' | 'Needs attention' | 'All done';
};

type AlertPriority = 'high' | 'medium' | 'low';
type PatientAlert = {
  id: string;
  patientId: string;
  patientName: string;
  message: string;
  priority: AlertPriority;
};

type RawTask = {
  id: string;
  patient_id: string;
  title: string;
  status: string;
  completed_at: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeLastActivity(tasks: RawTask[]): string {
  const times = tasks.filter((t) => t.completed_at).map((t) => new Date(t.completed_at!).getTime());
  if (times.length === 0) return 'No activity yet';
  const diffMin = Math.round((Date.now() - Math.max(...times)) / 60_000);
  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
}

function deriveStatusLabel(
  completed: number,
  total: number,
  hasMissed: boolean,
): Patient['statusLabel'] {
  if (hasMissed) return 'Needs attention';
  if (total > 0 && completed === total) return 'All done';
  return 'On track';
}

// ─── Status colours ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<Patient['statusLabel'], { bg: string; text: string; dot: string }> = {
  'On track':        { bg: C.primaryLight, text: C.safeText,  dot: C.primary  },
  'All done':        { bg: '#D1FAE5',       text: '#065F46',   dot: '#10B981'  },
  'Needs attention': { bg: '#FEE2E2',       text: '#991B1B',   dot: '#DC2626'  },
};

// ─── Patient Card ─────────────────────────────────────────────────────────────

const PatientCard = ({ patient, onPress }: { patient: Patient; onPress: () => void }) => {
  const statusStyle = STATUS_COLORS[patient.statusLabel];
  const progressPct = patient.totalTasks > 0 ? (patient.completedTasks / patient.totalTasks) * 100 : 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] }]}
      onPress={onPress}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarInitial}>{patient.name[0]?.toUpperCase()}</Text>
      </View>

      <View style={styles.cardCenter}>
        <View style={styles.nameRow}>
          <Text style={styles.patientName}>{patient.name}</Text>
        </View>
        <Text style={styles.lastActivity}>Last activity · {patient.lastActivity}</Text>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` as `${number}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{patient.completedTasks}/{patient.totalTasks} tasks done</Text>
      </View>

      <View style={styles.cardRight}>
        <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{patient.statusLabel}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export const CaregiverPatientsScreen: React.FC<Props> = ({ navigation }) => {
  const { auth } = useAuth();
  const caregiverPhone = auth.status === 'authenticated' ? auth.user.id : null;

  const [activeTab,   setActiveTab]   = useState<CaregiverTab>('Home');
  const [patients,    setPatients]    = useState<Patient[]>([]);
  const [rawTasks,    setRawTasks]    = useState<RawTask[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Data fetcher ────────────────────────────────────────────────────────────
  const loadPatients = useCallback(async (phone: string) => {
    // Only show spinner on first load — keep existing list visible during refreshes
    setPatients((prev) => { if (prev.length === 0) setLoading(true); return prev; });
    setError(null);

    try {
      // 1. Fetch linked patient phones
      const linksResult = await supabase
        .from('patient_caregiver_links')
        .select('patient_phone')
        .eq('caregiver_phone', phone);

      if (linksResult.error) { setError('Failed to load patients.'); setLoading(false); return; }
      if (!linksResult.data || linksResult.data.length === 0) {
        setPatients([]);
        setRawTasks([]);
        setLoading(false);
        return;
      }

      const patientPhones: string[] = linksResult.data.map(
        (l: { patient_phone: string }) => l.patient_phone,
      );

      // 2. Fetch names and tasks in parallel
      const nameMap = new Map<string, string>();
      const [patientsRes, usersRes, tasksRes] = await Promise.all([
        supabase.from('patients').select('id, name').in('id', patientPhones),
        supabase.from('mock_users').select('phone_number, full_name').in('phone_number', patientPhones),
        supabase
          .from('tasks')
          .select('id, patient_id, title, status, completed_at')
          .in('patient_id', patientPhones),
      ]);

      // patients table takes priority, then mock_users fills gaps
      if (patientsRes.data) {
        for (const p of patientsRes.data as { id: string; name: string }[]) {
          if (p.name) nameMap.set(p.id, p.name);
        }
      }
      if (usersRes.data) {
        for (const u of usersRes.data as { phone_number: string; full_name: string }[]) {
          if (!nameMap.has(u.phone_number) && u.full_name) nameMap.set(u.phone_number, u.full_name);
        }
      }

      const allTasks: RawTask[] = tasksRes.data ?? [];
      setRawTasks(allTasks);

      // 3. Build patient rows
      const built: Patient[] = patientPhones.map((p) => {
        const pts       = allTasks.filter((t) => t.patient_id === p);
        const completed = pts.filter((t) => t.status === 'done').length;
        const total     = pts.length;
        const hasMissed = pts.some((t) => t.status === 'missed');
        return {
          id:             p,
          name:           nameMap.get(p) ?? `Patient (${p.slice(-4)})`,
          completedTasks: completed,
          totalTasks:     total,
          lastActivity:   computeLastActivity(pts),
          statusLabel:    deriveStatusLabel(completed, total, hasMissed),
        };
      });

      setPatients(built);
    } catch (e) {
      console.error('[CaregiverPatients] loadPatients error:', e);
      setError('Failed to load patients. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial load ────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (caregiverPhone) void loadPatients(caregiverPhone);
  }, [caregiverPhone, loadPatients]);

  // ── Realtime subscription ───────────────────────────────────────────────────
  React.useEffect(() => {
    if (!caregiverPhone) return;
    return subscribeToCaregiversLinks(caregiverPhone, () => void loadPatients(caregiverPhone));
  }, [caregiverPhone, loadPatients]);

  // ── Derived: prioritised alerts from rawTasks ───────────────────────────────
  const prioritizedAlerts = useMemo(() => {
    const alerts: PatientAlert[] = [];
    const patientNameById = new Map(patients.map((p) => [p.id, p.name]));

    const missed = rawTasks.filter((t) => t.status === 'missed');
    const unsure = rawTasks.filter((t) => t.status === 'unsure');
    const done   = rawTasks.filter((t) => t.status === 'done');

    for (const t of missed) {
      alerts.push({
        id:          `missed-${t.id}`,
        patientId:   t.patient_id,
        patientName: patientNameById.get(t.patient_id) ?? 'Patient',
        message:     `Missed routine: ${t.title}`,
        priority:    'high',
      });
    }
    for (const t of unsure) {
      alerts.push({
        id:          `unsure-${t.id}`,
        patientId:   t.patient_id,
        patientName: patientNameById.get(t.patient_id) ?? 'Patient',
        message:     `Needs caregiver check: ${t.title}`,
        priority:    'medium',
      });
    }
    // One "all done" alert per patient if every task is complete
    for (const p of patients) {
      const pts = rawTasks.filter((t) => t.patient_id === p.id);
      if (pts.length > 0 && pts.every((t) => t.status === 'done')) {
        alerts.push({
          id:          `done-${p.id}`,
          patientId:   p.id,
          patientName: p.name,
          message:     'All routines completed',
          priority:    'low',
        });
      }
    }

    const rank: Record<AlertPriority, number> = { high: 0, medium: 1, low: 2 };
    return alerts.sort((a, b) => rank[a.priority] - rank[b.priority]);
  }, [rawTasks, patients]);

  // ── Derived: filtered patient list ─────────────────────────────────────────
  const filteredPatients = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return patients;
    return patients.filter(
      (p) => p.name.toLowerCase().includes(needle) || p.id.toLowerCase().includes(needle),
    );
  }, [patients, searchQuery]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>

      {/* ── Home tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'Home' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={[styles.overline, { fontSize: 20, fontWeight: '600' }]}>YOUR PATIENTS</Text>
          </View>

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search patient by name or phone"
            placeholderTextColor={C.textMuted}
            style={styles.searchInput}
          />

          <Text style={styles.sectionLabel}>TAP TO VIEW DASHBOARD</Text>

          {loading && (
            <View style={{ alignItems: 'center', paddingTop: 32 }}>
              <ActivityIndicator color={C.primary} />
            </View>
          )}
          {error && !loading && (
            <Text style={styles.stateNote}>{error}</Text>
          )}
          {!loading && !error && patients.length === 0 && (
            <Text style={styles.stateNote}>
              No patients yet. Ask your patient to confirm you as their caregiver.
            </Text>
          )}

          {filteredPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onPress={() =>
                navigation.navigate('CaregiverDashboard', {
                  patientPhone: patient.id,
                  patientName:  patient.name,
                })
              }
            />
          ))}
        </ScrollView>
      )}

      {/* ── Alerts tab ────────────────────────────────────────────────────── */}
      {activeTab === 'Alerts' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={[styles.overline, { fontSize: 20, fontWeight: '600' }]}>PRIORITY ALERTS</Text>
          </View>

          <Text style={styles.sectionLabel}>PRIORITY ALERTS</Text>

          {prioritizedAlerts.length === 0 ? (
            <Text style={styles.stateNote}>No active alerts right now.</Text>
          ) : prioritizedAlerts.map((alert) => (
            <Pressable
              key={alert.id}
              onPress={() =>
                navigation.navigate('CaregiverDashboard', {
                  patientPhone: alert.patientId,
                  patientName:  alert.patientName,
                })
              }
              style={[
                styles.alertRow,
                alert.priority === 'high'
                  ? styles.alertHigh
                  : alert.priority === 'medium'
                    ? styles.alertMedium
                    : styles.alertLow,
              ]}
            >
              <View style={styles.alertTextWrap}>
                <Text style={styles.alertPatient}>{alert.patientName}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
              </View>
              <View style={styles.alertRight}>
                <Text style={styles.alertPriority}>{alert.priority.toUpperCase()}</Text>
                <Pressable
                  onPress={() => void Linking.openURL('tel:')}
                  style={({ pressed }) => [styles.alertSosBtn, pressed && { opacity: 0.72 }]}
                >
                  <Text style={styles.alertSosText}>SOS</Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* ── Settings tab ──────────────────────────────────────────────────── */}
      {activeTab === 'Settings' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={[styles.overline, { fontSize: 20, fontWeight: '600' }]}>SETTINGS</Text>
          </View>

          {/* Profile card */}
          <View style={settingsStyles.profileCard}>
            <View style={settingsStyles.avatarWrap}>
              <Text style={settingsStyles.avatarInitial}>
                {caregiverPhone ? caregiverPhone.charAt(0) : 'C'}
              </Text>
            </View>
            <Text style={settingsStyles.profileTag}>CAREGIVER PROFILE</Text>
            <Text style={settingsStyles.profilePhone}>{caregiverPhone ?? '—'}</Text>
          </View>

          <View style={settingsStyles.divider} />

          {/* Read-only identity fields */}
          <Text style={settingsStyles.sectionHeading}>Account</Text>
          {([
            { label: 'Phone Number', value: caregiverPhone ?? '—', emoji: '📞' },
            { label: 'Role',         value: 'Caregiver',           emoji: '🧑‍⚕️' },
            { label: 'Account Type', value: 'Standard',            emoji: '📊' },
          ] as Array<{ label: string; value: string; emoji: string }>).map((row) => (
            <View key={row.label} style={settingsStyles.fieldRow}>
              <View style={settingsStyles.fieldEmojiWrap}>
                <Text style={settingsStyles.fieldEmoji}>{row.emoji}</Text>
              </View>
              <View style={settingsStyles.fieldTextWrap}>
                <Text style={settingsStyles.fieldLabel}>{row.label}</Text>
                <Text style={settingsStyles.fieldValue}>{row.value}</Text>
              </View>
            </View>
          ))}

          <View style={settingsStyles.divider} />

          {/* Preferences */}
          <Text style={settingsStyles.sectionHeading}>Preferences</Text>
          {([
            { label: 'Notifications', value: 'Enabled', emoji: '🔔' },
            { label: 'Language',      value: 'English', emoji: '🌐' },
            { label: 'App Version',   value: '1.0.0',   emoji: 'ℹ️'  },
          ] as Array<{ label: string; value: string; emoji: string }>).map((row) => (
            <View key={row.label} style={settingsStyles.fieldRow}>
              <View style={settingsStyles.fieldEmojiWrap}>
                <Text style={settingsStyles.fieldEmoji}>{row.emoji}</Text>
              </View>
              <View style={settingsStyles.fieldTextWrap}>
                <Text style={settingsStyles.fieldLabel}>{row.label}</Text>
                <Text style={settingsStyles.fieldValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}


      {/* ── Bottom Nav ──────────────────────────────────────────────────────── */}
      <View style={styles.bottomBarBand}>
        <View style={styles.bottomBar}>
          {(['Home', 'Alerts', 'Settings'] as CaregiverTab[]).map((tab) => {
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
                  {tab}{tab === 'Alerts' && prioritizedAlerts.length > 0 ? ` (${prioritizedAlerts.length})` : ''}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:        { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 96 },

  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  overline:     { fontFamily: F.bold, fontSize: 11, letterSpacing: 1.4, color: C.primary, marginBottom: 2 },
  sectionLabel: { fontFamily: F.bold, fontSize: 10, letterSpacing: 1.4, color: C.textMuted, marginBottom: 10 },
  stateNote:    { fontFamily: F.regular, color: C.textMuted, textAlign: 'center', marginTop: 32, fontSize: 14 },

  searchInput: {
    height: 46, borderRadius: 12,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, color: C.textPrimary,
    fontFamily: F.medium, fontSize: 14, marginBottom: 12,
  },

  // ── Patient card ────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.surface,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.primaryLight, borderWidth: 2, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarInitial:    { fontFamily: F.extraBold, fontSize: 20, color: C.primary },
  cardCenter:       { flex: 1 },
  nameRow:          { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 2 },
  patientName:      { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary },
  lastActivity:     { fontFamily: F.regular, fontSize: 11, color: C.textMuted, marginBottom: 8 },
  progressBarTrack: { height: 5, borderRadius: 999, backgroundColor: C.border, overflow: 'hidden', marginBottom: 4 },
  progressBarFill:  { height: '100%', borderRadius: 999, backgroundColor: C.primary },
  progressLabel:    { fontFamily: F.semiBold, fontSize: 11, color: C.textSecondary },
  cardRight:        { alignItems: 'flex-end', gap: 10, marginLeft: 8 },
  statusPill:       { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  statusDot:        { width: 6, height: 6, borderRadius: 3 },
  statusText:       { fontFamily: F.bold, fontSize: 10 },
  chevron:          { fontFamily: F.bold, fontSize: 22, color: C.textMuted, lineHeight: 24 },

  // ── Alerts ──────────────────────────────────────────────────────────────────
  alertRow: {
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 10, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  alertHigh:    { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  alertMedium:  { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  alertLow:     { backgroundColor: '#E5E7EB', borderColor: '#D1D5DB' },
  alertTextWrap:{ flex: 1, paddingRight: 10 },
  alertPatient: { fontFamily: F.bold, color: C.textPrimary, fontSize: 14, marginBottom: 2 },
  alertMessage: { fontFamily: F.regular, color: C.textSecondary, fontSize: 12 },
  alertRight:   { alignItems: 'flex-end', gap: 6 },
  alertPriority:{ fontFamily: F.bold, color: C.textPrimary, fontSize: 10, letterSpacing: 0.6 },
  alertSosBtn:  { backgroundColor: '#DC2626', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  alertSosText: { fontFamily: F.bold, color: '#FFFFFF', fontSize: 10, letterSpacing: 0.4 },

  // ── Bottom nav ──────────────────────────────────────────────────────────────
  bottomBarBand:     { position: 'absolute', left: 0, right: 0, bottom: 0, height: 76, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },
  bottomBar:         { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8 },
  bottomTab:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, position: 'relative' },
  bottomTabIconWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  bottomLabel:       { fontFamily: F.medium, fontSize: 10, color: C.textMuted, letterSpacing: 0.3 },
  bottomLabelActive: { fontFamily: F.bold, color: C.primary },
  activeIndicator:   { position: 'absolute', bottom: 0, width: 18, height: 2.5, borderRadius: 2, backgroundColor: C.primary },
});

const settingsStyles = StyleSheet.create({
  profileCard: {
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
    paddingVertical: 24, paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 2,
  },
  avatarWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.primaryLight, borderWidth: 2, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarInitial:  { fontFamily: F.extraBold, fontSize: 30, color: C.primary },
  profileTag:     { fontFamily: F.bold, fontSize: 11, letterSpacing: 1.4, color: C.primary, marginBottom: 4 },
  profilePhone:   { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary },

  divider:        { height: 1, backgroundColor: C.border, marginVertical: 14 },
  sectionHeading: { fontFamily: F.bold, fontSize: 12, letterSpacing: 1.2, color: C.textMuted, marginBottom: 8 },

  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 1,
  },
  fieldEmojiWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  fieldEmoji:    { fontSize: 18 },
  fieldTextWrap: { flex: 1 },
  fieldLabel:    { fontFamily: F.medium, fontSize: 11, color: C.textSecondary, letterSpacing: 0.4 },
  fieldValue:    { fontFamily: F.bold, fontSize: 15, color: C.textPrimary, marginTop: 1 },
});

