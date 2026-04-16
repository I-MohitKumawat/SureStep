import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
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

// ─── Static patient data ──────────────────────────────────────────────────────
type Patient = {
  id: string;
  name: string;
  completedTasks: number;
  totalTasks: number;
  lastActivity: string;
  statusLabel: 'On track' | 'Needs attention' | 'All done';
};

const PATIENTS: Patient[] = [
  {
    id: 'p1',
    name: 'Srinivas',
    completedTasks: 2,
    totalTasks: 3,
    lastActivity: '18 mins ago',
    statusLabel: 'On track',
  },
  {
    id: 'p2',
    name: 'Kamala',
    completedTasks: 3,
    totalTasks: 3,
    lastActivity: '1 hr ago',
    statusLabel: 'All done',
  },
  {
    id: 'p3',
    name: 'Rajan',
    completedTasks: 0,
    totalTasks: 3,
    lastActivity: 'No activity yet',
    statusLabel: 'Needs attention',
  },
];

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
  const [activeTab, setActiveTab] = useState<CaregiverTab>('Home');

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.overline, { fontSize: 20, fontWeight: '600' }]}>YOUR PATIENTS</Text>
          </View>
        </View>

        {/* ── Patient cards ───────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>TAP TO VIEW DASHBOARD</Text>
        {PATIENTS.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onPress={() => navigation.navigate('CaregiverDashboard')}
          />
        ))}

      </ScrollView>

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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 96 },

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

  // Bottom nav
  bottomBarBand: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 76,
    backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
  },
  bottomBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8,
  },
  bottomTab: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 4, position: 'relative',
  },
  bottomTabIconWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  bottomLabel:       { fontFamily: F.medium, fontSize: 10, color: C.textMuted, letterSpacing: 0.3 },
  bottomLabelActive: { fontFamily: F.bold, color: C.primary },
  activeIndicator:   { position: 'absolute', bottom: 0, width: 18, height: 2.5, borderRadius: 2, backgroundColor: C.primary },
});
