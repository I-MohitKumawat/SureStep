import React, { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { supabase } from '../utils/supabaseClient';
import { useTasks } from '../context/taskContext';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import { IconDashboard, IconBell } from '../assets/icons/NavIcons';

type Props = NativeStackScreenProps<HomeStackParamList, 'CaregiverPatients'>;
type PatientsFooterTab = 'Home' | 'Alerts';

// ─── Static patient data ──────────────────────────────────────────────────────
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

const STATUS_COLORS: Record<Patient['statusLabel'], { bg: string; text: string; dot: string }> = {
  'On track':       { bg: C.primaryLight,  text: C.safeText,  dot: C.primary },
  'All done':       { bg: '#D1FAE5',        text: '#065F46',   dot: '#10B981' },
  'Needs attention':{ bg: '#FEE2E2',        text: '#991B1B',   dot: '#DC2626' },
};

// ─── Patient Card ─────────────────────────────────────────────────────────────
const PatientCard = ({
  patient,
  onPress,
}: {
  patient: Patient;
  onPress: () => void;
}) => {
  const statusStyle = STATUS_COLORS[patient.statusLabel];
  const progressPct = patient.totalTasks > 0
    ? (patient.completedTasks / patient.totalTasks) * 100
    : 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] }]}
      onPress={onPress}
    >
      {/* Left: avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarInitial}>{patient.name[0]?.toUpperCase()}</Text>
      </View>

      {/* Center: info */}
      <View style={styles.cardCenter}>
        <View style={styles.nameRow}>
          <Text style={styles.patientName}>{patient.name}</Text>
        </View>
        <Text style={styles.lastActivity}>Last activity · {patient.lastActivity}</Text>

        {/* Progress bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` as `${number}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          {patient.completedTasks}/{patient.totalTasks} tasks done
        </Text>
      </View>

      {/* Right: status pill + chevron */}
      <View style={styles.cardRight}>
        <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {patient.statusLabel}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const CaregiverPatientsScreen: React.FC<Props> = ({ navigation }) => {
  const { tasks } = useTasks();
  const [activeTab, setActiveTab] = useState<PatientsFooterTab>('Home');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [caregiverPhone, setCaregiverPhone] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fallbackPatientIdsFromTasks = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.patientId).filter(Boolean)));
  }, [tasks]);

  // Fetch caregiver phone once on mount
  React.useEffect(() => {
    AsyncStorage.getItem('current_phone').then((p) => { if (p) setCaregiverPhone(p); });
  }, []);

  // Fetch patients for this caregiver
  const loadPatients = useCallback(async (phone: string) => {
    try {
      const { data: links } = await supabase
        .from('patient_caregiver_links')
        .select('patient_phone')
        .eq('caregiver_phone', phone);

      const linkedIds = (links ?? []).map((l: any) => l.patient_phone).filter(Boolean);
      const mergedIds = Array.from(new Set([...linkedIds, ...fallbackPatientIdsFromTasks]));

      if (mergedIds.length === 0) {
        setPatients([]);
        return;
      }

      const { data: users } = await supabase
        .from('mock_users')
        .select('phone_number, full_name')
        .in('phone_number', mergedIds);

      const userNameByPhone = new Map<string, string>(
        (users ?? []).map((u: any) => [u.phone_number, u.full_name || 'Patient']),
      );

      setPatients(mergedIds.map((patientId) => ({
        id: patientId,
        name: userNameByPhone.get(patientId) || 'Patient',
        completedTasks: 0,
        totalTasks: 3,
        lastActivity: 'No activity yet',
        statusLabel: 'On track' as const,
      })));
    } catch (error) {
      console.warn('Failed to load caregiver patients, using local task fallback:', error);
      const fallbackIds = fallbackPatientIdsFromTasks;
      setPatients(fallbackIds.map((patientId) => ({
        id: patientId,
        name: 'Patient',
        completedTasks: 0,
        totalTasks: 3,
        lastActivity: 'No activity yet',
        statusLabel: 'On track' as const,
      })));
    }
  }, [fallbackPatientIdsFromTasks]);

  // Initial load when phone is known
  React.useEffect(() => {
    if (caregiverPhone) void loadPatients(caregiverPhone);
  }, [caregiverPhone, loadPatients]);

  // Realtime: instant update when a patient confirms THIS caregiver (filter-scoped)
  React.useEffect(() => {
    if (!caregiverPhone) return;

    // Create channel fresh — subscribe once, clean up on unmount
    const channel = supabase
      .channel(`caregiver_links_${caregiverPhone}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patient_caregiver_links',
          filter: `caregiver_phone=eq.${caregiverPhone}`,
        },
        () => void loadPatients(caregiverPhone),
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [caregiverPhone, loadPatients]);

  const patientsWithStats = useMemo(() => {
    return patients.map((patient) => {
      const patientTasks = tasks.filter((t) => t.patientId === patient.id);
      const completed = patientTasks.filter((t) => t.status === 'done').length;
      const missed = patientTasks.filter((t) => t.status === 'missed').length;
      const unsure = patientTasks.filter((t) => t.status === 'unsure').length;
      const total = patientTasks.length;

      const statusLabel: Patient['statusLabel'] =
        missed > 0 || unsure > 0
          ? 'Needs attention'
          : total > 0 && completed === total
            ? 'All done'
            : 'On track';

      return {
        ...patient,
        completedTasks: completed,
        totalTasks: total || patient.totalTasks,
        lastActivity: (() => {
          const completedTimes = patientTasks
            .filter((t) => t.completedAt)
            .map((t) => new Date(t.completedAt as string).getTime());
          if (completedTimes.length === 0) return 'No activity yet';
          const mins = Math.max(0, Math.round((Date.now() - Math.max(...completedTimes)) / 60000));
          if (mins < 1) return 'Just now';
          if (mins < 60) return `${mins} mins ago`;
          return `${Math.floor(mins / 60)} hr ago`;
        })(),
        statusLabel,
      };
    });
  }, [patients, tasks]);

  const prioritizedAlerts = useMemo(() => {
    const alerts: PatientAlert[] = [];
    for (const patient of patientsWithStats) {
      const patientTasks = tasks.filter((t) => t.patientId === patient.id);
      const missedTasks = patientTasks.filter((t) => t.status === 'missed');
      const unsureTasks = patientTasks.filter((t) => t.status === 'unsure');

      for (const task of missedTasks) {
        alerts.push({
          id: `missed-${task.id}`,
          patientId: patient.id,
          patientName: patient.name,
          message: `Missed routine: ${task.title}`,
          priority: 'high',
        });
      }
      for (const task of unsureTasks) {
        alerts.push({
          id: `unsure-${task.id}`,
          patientId: patient.id,
          patientName: patient.name,
          message: `Needs caregiver check: ${task.title}`,
          priority: 'medium',
        });
      }
      if (patientTasks.length > 0 && patientTasks.every((t) => t.status === 'done')) {
        alerts.push({
          id: `done-${patient.id}`,
          patientId: patient.id,
          patientName: patient.name,
          message: 'All routines completed',
          priority: 'low',
        });
      }
    }

    const rank: Record<AlertPriority, number> = { high: 0, medium: 1, low: 2 };
    return alerts.sort((a, b) => rank[a.priority] - rank[b.priority]);
  }, [patientsWithStats, tasks]);

  const filteredPatients = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return patientsWithStats;
    return patientsWithStats.filter((patient) => {
      return (
        patient.name.toLowerCase().includes(needle) ||
        patient.id.toLowerCase().includes(needle)
      );
    });
  }, [patientsWithStats, searchQuery]);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.overline, { fontSize: 20, fontWeight: '600' }]}>YOUR PATIENTS</Text>
          </View>
        </View>

        {activeTab === 'Home' ? (
          <>
            {/* ── Patient cards ───────────────────────────────────────────── */}
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search patient by name or phone"
              placeholderTextColor={C.textMuted}
              style={styles.searchInput}
            />
            <Text style={styles.sectionLabel}>TAP TO VIEW DASHBOARD</Text>
            {filteredPatients.length === 0 ? (
              <Text style={styles.emptyNote}>No patients yet. Ask patient to confirm caregiver.</Text>
            ) : filteredPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onPress={() => navigation.navigate('CaregiverDashboard', {
                  patientPhone: patient.id,
                  patientName: patient.name,
                })}
              />
            ))}
          </>
        ) : (
          <>
            {/* ── Prioritized alerts across patients ─────────────────────── */}
            <Text style={styles.sectionLabel}>PRIORITY ALERTS</Text>
            {prioritizedAlerts.length === 0 ? (
              <Text style={styles.emptyNote}>No active alerts right now.</Text>
            ) : prioritizedAlerts.map((alert) => (
              <Pressable
                key={alert.id}
                onPress={() =>
                  navigation.navigate('CaregiverDashboard', {
                    patientPhone: alert.patientId,
                    patientName: alert.patientName,
                    initialTab: 'Alerts',
                  })
                }
                style={[
                  styles.alertRow,
                  alert.priority === 'high' ? styles.alertHigh : alert.priority === 'medium' ? styles.alertMedium : styles.alertLow,
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
          </>
        )}
      </ScrollView>

      <View style={styles.footerBarBand}>
        <View style={styles.footerBar}>
          <Pressable style={styles.footerTab} onPress={() => setActiveTab('Home')}>
            <IconDashboard size={24} color={activeTab === 'Home' ? C.primary : C.textMuted} strokeWidth={activeTab === 'Home' ? 2.2 : 1.8} />
            <Text style={[styles.footerLabel, activeTab === 'Home' && styles.footerLabelActive]}>Home</Text>
            {activeTab === 'Home' ? <View style={styles.footerIndicator} /> : null}
          </Pressable>
          <Pressable style={styles.footerTab} onPress={() => setActiveTab('Alerts')}>
            <IconBell size={24} color={activeTab === 'Alerts' ? C.primary : C.textMuted} strokeWidth={activeTab === 'Alerts' ? 2.2 : 1.8} />
            <Text style={[styles.footerLabel, activeTab === 'Alerts' && styles.footerLabelActive]}>
              Alerts {prioritizedAlerts.length > 0 ? `(${prioritizedAlerts.length})` : ''}
            </Text>
            {activeTab === 'Alerts' ? <View style={styles.footerIndicator} /> : null}
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 94 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  overline:  { fontFamily: F.bold, fontSize: 11, letterSpacing: 1.4, color: C.primary, marginBottom: 2 },
  heading:   { fontFamily: F.extraBold, fontSize: 28, color: C.textPrimary },
  countBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.28, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 5,
  },
  countBadgeText: { fontFamily: F.extraBold, fontSize: 18, color: C.primaryText },

  // Summary strip
  summaryStrip: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 18, borderWidth: 1, borderColor: C.border,
    paddingVertical: 14, marginBottom: 22,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  summaryItem:   { alignItems: 'center', flex: 1 },
  summaryValue:  { fontFamily: F.extraBold, fontSize: 22, color: C.textPrimary },
  summaryLabel:  { fontFamily: F.medium, fontSize: 11, color: C.textSecondary, marginTop: 2 },
  summaryDivider:{ width: 1, height: 36, backgroundColor: C.borderMid },

  // Section label
  sectionLabel: { fontFamily: F.bold, fontSize: 10, letterSpacing: 1.4, color: C.textMuted, marginBottom: 10 },
  emptyNote: { fontFamily: F.regular, color: C.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 16, fontSize: 14 },
  searchInput: {
    height: 46,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    color: C.textPrimary,
    fontFamily: F.medium,
    fontSize: 14,
    marginBottom: 12,
  },

  // Alerts list
  alertRow: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertHigh: { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  alertMedium: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  alertLow: { backgroundColor: '#E5E7EB', borderColor: '#D1D5DB' },
  alertTextWrap: { flex: 1, paddingRight: 10 },
  alertPatient: { fontFamily: F.bold, color: C.textPrimary, fontSize: 14, marginBottom: 2 },
  alertMessage: { fontFamily: F.regular, color: C.textSecondary, fontSize: 12 },
  alertRight: { alignItems: 'flex-end', gap: 6 },
  alertPriority: { fontFamily: F.bold, color: C.textPrimary, fontSize: 10, letterSpacing: 0.6 },
  alertSosBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  alertSosText: { fontFamily: F.bold, color: '#FFFFFF', fontSize: 10, letterSpacing: 0.4 },

  // Patient card
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
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: { fontFamily: F.extraBold, fontSize: 20, color: C.primary },

  cardCenter: { flex: 1 },
  nameRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 2 },
  patientName:  { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary },
  relationship: { fontFamily: F.medium, fontSize: 12, color: C.textSecondary },
  lastActivity: { fontFamily: F.regular, fontSize: 11, color: C.textMuted, marginBottom: 8 },

  progressBarTrack: {
    height: 5, borderRadius: 999,
    backgroundColor: C.border, overflow: 'hidden', marginBottom: 4,
  },
  progressBarFill: { height: '100%', borderRadius: 999, backgroundColor: C.primary },
  progressLabel: { fontFamily: F.semiBold, fontSize: 11, color: C.textSecondary },

  cardRight: { alignItems: 'flex-end', gap: 10, marginLeft: 8 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: F.bold, fontSize: 10 },
  chevron:    { fontFamily: F.bold, fontSize: 22, color: C.textMuted, lineHeight: 24 },

  // Footer alerts nav
  footerBarBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 76,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  footerTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    gap: 2,
  },
  footerLabel: { fontFamily: F.medium, fontSize: 11, color: C.textMuted },
  footerLabelActive: { fontFamily: F.bold, color: C.primary },
  footerIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 18,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: C.primary,
  },
});
