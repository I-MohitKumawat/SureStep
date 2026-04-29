/**
 * CaregiverPatientsScreen.tsx
 *
 * Patient list sourced exclusively from Supabase:
 *  - patient_caregiver_links  → which patients belong to this caregiver
 *  - mock_users               → patient names
 *  - tasks                    → real completion stats + last activity
 *
 * Realtime: re-fetches the full list whenever a new link INSERT fires.
 * No static PATIENTS[] array, no try/catch silent fallback.
 */
import React, { useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  IconActivity,
  IconProfile,
} from '../assets/icons/NavIcons';

type Props = NativeStackScreenProps<HomeStackParamList, 'CaregiverPatients'>;
type CaregiverTab = 'Home' | 'Alerts' | 'Manage' | 'Profile';

type TabIconProps = { active: boolean };
const TAB_ICON_COMPONENTS: Record<CaregiverTab, React.FC<TabIconProps>> = {
  Home:    ({ active }) => <IconDashboard size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Alerts:  ({ active }) => <IconBell     size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Manage:  ({ active }) => <IconActivity size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Profile: ({ active }) => <IconProfile  size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
};

// ─── Patient type ─────────────────────────────────────────────────────────────

type Patient = {
  id: string;
  name: string;
  completedTasks: number;
  totalTasks: number;
  lastActivity: string;
  statusLabel: 'On track' | 'Needs attention' | 'All done';
};

const STATUS_COLORS: Record<Patient['statusLabel'], { bg: string; text: string; dot: string }> = {
  'On track':        { bg: C.primaryLight, text: C.safeText,  dot: C.primary  },
  'All done':        { bg: '#D1FAE5',       text: '#065F46',   dot: '#10B981'  },
  'Needs attention': { bg: '#FEE2E2',       text: '#991B1B',   dot: '#DC2626'  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeLastActivity(tasks: Array<{ completed_at: string | null }>): string {
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

// ─── Patient card ─────────────────────────────────────────────────────────────

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

  const [activeTab, setActiveTab] = useState<CaregiverTab>('Home');
  const [patients,  setPatients]  = useState<Patient[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // ── Data fetcher ────────────────────────────────────────────────────────────
  const loadPatients = useCallback(async (phone: string) => {
    // Only show spinner on first load — keep existing list visible during refreshes
    setPatients((prev) => {
      if (prev.length === 0) setLoading(true);
      return prev;
    });
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
        setLoading(false);
        return;
      }

      const patientPhones: string[] = linksResult.data.map((l: { patient_phone: string }) => l.patient_phone);

      // 2. Fetch patient names from 'patients' table and 'mock_users' in parallel
      const nameMap = new Map<string, string>();

      const [patientsRes, usersRes, tasksRes] = await Promise.all([
        supabase.from('patients').select('id, name').in('id', patientPhones),
        supabase.from('mock_users').select('phone_number, full_name').in('phone_number', patientPhones),
        supabase.from('tasks').select('patient_id, status, completed_at').in('patient_id', patientPhones),
      ]);

      // patients table takes priority
      if (patientsRes.data) {
        for (const p of patientsRes.data as { id: string; name: string }[]) {
          if (p.name) nameMap.set(p.id, p.name);
        }
      }
      // fill gaps from mock_users
      if (usersRes.data) {
        for (const u of usersRes.data as { phone_number: string; full_name: string }[]) {
          if (!nameMap.has(u.phone_number) && u.full_name) nameMap.set(u.phone_number, u.full_name);
        }
      }

      const allTasks = tasksRes.data ?? [];

      // 3. Build patient rows
      const built: Patient[] = patientPhones.map((p) => {
        const pts       = allTasks.filter((t: { patient_id: string }) => t.patient_id === p);
        const completed = pts.filter((t: { status: string }) => t.status === 'done').length;
        const total     = pts.length;
        const hasMissed = pts.some((t: { status: string }) => t.status === 'missed');
        return {
          id:             p,
          name:           nameMap.get(p) ?? `Patient (${p.slice(-4)})`,
          completedTasks: completed,
          totalTasks:     total,
          lastActivity:   computeLastActivity(pts as Array<{ completed_at: string | null }>),
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

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {/* ── Tab Content ────────────────────────────────────────────────── */}
      {activeTab === 'Home' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={[styles.overline, { fontSize: 20, fontWeight: '600' }]}>YOUR PATIENTS</Text>
          </View>

          <Text style={styles.sectionLabel}>TAP TO VIEW DASHBOARD</Text>

          {loading && (
            <View style={{ alignItems: 'center', paddingTop: 32 }}>
              <ActivityIndicator color={C.primary} />
            </View>
          )}

          {error && !loading && (
            <Text style={{ fontFamily: F.regular, color: C.error, textAlign: 'center', marginTop: 24, fontSize: 14 }}>
              {error}
            </Text>
          )}

          {!loading && !error && patients.length === 0 && (
            <Text style={{ fontFamily: F.regular, color: C.textMuted, textAlign: 'center', marginTop: 32, fontSize: 14 }}>
              No patients yet. Ask your patient to confirm you as their caregiver.
            </Text>
          )}

          {patients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onPress={() => navigation.navigate('CaregiverDashboard', {
                patientPhone: patient.id,
                patientName:  patient.name,
              })}
            />
          ))}
        </ScrollView>

      ) : activeTab === 'Manage' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={[styles.overline, { fontSize: 20, fontWeight: '600' }]}>MANAGE ROUTINES</Text>
          </View>
          <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.textSecondary, marginBottom: 16, lineHeight: 20 }}>
            Select a patient from the Home tab first, then manage their routines from the patient dashboard.
          </Text>
          {patients.map((patient) => (
            <Pressable
              key={patient.id}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}
              onPress={() => navigation.navigate('CaregiverDashboard', {
                patientPhone: patient.id,
                patientName:  patient.name,
              })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>{patient.name[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.cardCenter}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <Text style={styles.lastActivity}>{patient.totalTasks} tasks assigned</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
          {patients.length === 0 && (
            <Text style={{ fontFamily: F.regular, color: C.textMuted, textAlign: 'center', marginTop: 24, fontSize: 14 }}>
              No patients linked yet.
            </Text>
          )}
        </ScrollView>

      ) : activeTab === 'Alerts' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={[styles.overline, { fontSize: 20, fontWeight: '600' }]}>ALERTS</Text>
          </View>
          <Text style={{ fontFamily: F.regular, color: C.textMuted, textAlign: 'center', marginTop: 32, fontSize: 14 }}>
            No alerts yet. You'll be notified when patients need attention.
          </Text>
        </ScrollView>

      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={[styles.overline, { fontSize: 20, fontWeight: '600' }]}>PROFILE</Text>
          </View>
          <Text style={{ fontFamily: F.regular, color: C.textSecondary, textAlign: 'center', marginTop: 32, fontSize: 14 }}>
            Profile settings coming soon.
          </Text>
        </ScrollView>
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
                onPress={() => setActiveTab(tab)}
                style={styles.bottomTab}
              >
                <View style={styles.bottomTabIconWrap}><IconComponent active={isActive} /></View>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:        { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 96 },

  headerRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  overline:   { fontFamily: F.bold, fontSize: 11, letterSpacing: 1.4, color: C.primary, marginBottom: 2 },
  sectionLabel: { fontFamily: F.bold, fontSize: 10, letterSpacing: 1.4, color: C.textMuted, marginBottom: 10 },

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
  avatarInitial: { fontFamily: F.extraBold, fontSize: 20, color: C.primary },

  cardCenter:   { flex: 1 },
  nameRow:      { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 2 },
  patientName:  { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary },
  lastActivity: { fontFamily: F.regular, fontSize: 11, color: C.textMuted, marginBottom: 8 },

  progressBarTrack: { height: 5, borderRadius: 999, backgroundColor: C.border, overflow: 'hidden', marginBottom: 4 },
  progressBarFill:  { height: '100%', borderRadius: 999, backgroundColor: C.primary },
  progressLabel:    { fontFamily: F.semiBold, fontSize: 11, color: C.textSecondary },

  cardRight: { alignItems: 'flex-end', gap: 10, marginLeft: 8 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: F.bold, fontSize: 10 },
  chevron:    { fontFamily: F.bold, fontSize: 22, color: C.textMuted, lineHeight: 24 },

  bottomBarBand: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 76, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },
  bottomBar:     { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8 },
  bottomTab:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, position: 'relative' },
  bottomTabIconWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  bottomLabel:       { fontFamily: F.medium, fontSize: 10, color: C.textMuted, letterSpacing: 0.3 },
  bottomLabelActive: { fontFamily: F.bold, color: C.primary },
  activeIndicator:   { position: 'absolute', bottom: 0, width: 18, height: 2.5, borderRadius: 2, backgroundColor: C.primary },
});
