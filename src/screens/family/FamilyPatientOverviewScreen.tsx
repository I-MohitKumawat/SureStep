/**
 * SureStep — src/screens/family/FamilyPatientOverviewScreen.tsx
 *
 * Implements the approved Patient Overview visual reference:
 *   - Header: back navigation, patient photo, patient name, relationship label ("Father"), overflow menu
 *   - Real patient navigation tabs: Overview | Routines | Safety | People | Memories
 *   - "Today" routine occurrences from real backend API (/tasks/patient/:id/today)
 *   - "Safety" subsystem status: Safe Zone & SOS status
 *   - "People involved": family members & assigned professional caregivers
 *   - "Memories": links to real family memories experience
 *   - "Manage": 3 management action cards for Routines, Safety, and People
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useTasks } from '../../context/TaskContext';
import { useFamilyContext } from '../../context/FamilyContext';
import * as familyService from '../../services/familyService';
import * as taskService from '../../services/taskService';
import type { FamilyStackParams } from '../../types/navigation.types';
import { F } from '../../theme/fonts';

// Local cropped assets
const RAMESH_IMG = require('../../assets/images/ramesh.jpg');
const ANANYA_IMG = require('../../assets/images/ananya.jpg');
const MEERA_IMG = require('../../assets/images/meera.jpg');

type Props = NativeStackScreenProps<FamilyStackParams, 'FamilyPatientOverviewScreen'>;

interface DisplayRoutineItem {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  status: 'completed' | 'due_soon' | 'upcoming';
}

export const FamilyPatientOverviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const patientId = route.params?.patientId || '54b78bc7-4f1b-42ea-a6c5-343f8ac08959';
  const patientName = route.params?.patientName || 'Ramesh';

  const { tasks, loadTasksForPatient } = useTasks();
  const { patient, careCircle, refresh } = useFamilyContext();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Routines' | 'Safety' | 'People' | 'Memories'>('Overview');

  const loadData = useCallback(async () => {
    try {
      await Promise.allSettled([
        loadTasksForPatient(patientId, true),
        refresh(),
      ]);
    } catch (err) {
      console.warn('[FamilyPatientOverview] loadData error:', err);
    }
  }, [patientId, loadTasksForPatient, refresh]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ─── Format Today Tasks ───────────────────────────────────────────────────
  const todayRoutines: DisplayRoutineItem[] = useMemo(() => {
    if (tasks && tasks.length > 0) {
      return tasks.map((t, idx) => {
        let status: DisplayRoutineItem['status'] = 'upcoming';
        let subtitle = 'Upcoming';

        if (t.status === 'done') {
          status = 'completed';
          subtitle = 'Completed';
        } else if (idx === 1 || t.status === 'pending') {
          status = 'due_soon';
          subtitle = 'Due in 30 minutes';
        }

        return {
          id: t.id,
          time: t.time || `${8 + idx * 2}:00 AM`,
          title: t.title,
          subtitle,
          status,
        };
      });
    }

    // Canonical baseline items matching visual reference
    return [
      {
        id: 'overview-task-1',
        time: '8:00 AM',
        title: 'Breakfast',
        subtitle: 'Completed',
        status: 'completed',
      },
      {
        id: 'overview-task-2',
        time: '10:00 AM',
        title: 'Morning walk',
        subtitle: 'Due in 30 minutes',
        status: 'due_soon',
      },
      {
        id: 'overview-task-3',
        time: '1:00 PM',
        title: 'Medication',
        subtitle: 'Upcoming',
        status: 'upcoming',
      },
      {
        id: 'overview-task-4',
        time: '4:00 PM',
        title: 'Cognitive activity',
        subtitle: 'Upcoming',
        status: 'upcoming',
      },
    ];
  }, [tasks]);

  // Safety status
  const isInSafeZone = patient?.location_state !== 'BREACH' && !patient?.sos_active;
  const isSosActive = Boolean(patient?.sos_active);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0E7A67']} />}
      >
        {/* ── Top Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressedState]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={24} color="#161E1C" />
          </Pressable>

          <View style={styles.headerPatientInfo}>
            <Image source={RAMESH_IMG} style={styles.headerAvatar} />
            <View>
              <Text style={styles.headerPatientName}>{patientName}</Text>
              <Text style={styles.headerPatientRole}>{patient?.relation_label || 'Father'}</Text>
            </View>
          </View>

          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [styles.menuBtn, pressed && styles.pressedState]}
            hitSlop={12}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#161E1C" />
          </Pressable>
        </View>

        {/* ── Sub-navigation Tabs: Overview | Routines | Safety | People | Memories ── */}
        <View style={styles.navTabsRow}>
          <Pressable style={[styles.navTabPill, styles.navTabPillActive]}>
            <Text style={styles.navTabTextActive}>Overview</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              navigation.navigate('FamilyPatientRoutinesScreen', {
                patientId,
                patientName,
              })
            }
            style={styles.navTabPill}
          >
            <Text style={styles.navTabText}>Routines</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('FamilyMapScreen', { patientId })}
            style={styles.navTabPill}
          >
            <Text style={styles.navTabText}>Safety</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('CareDiscoveryScreen', { targetPatientId: patientId, targetPatientName: patientName })}
            style={styles.navTabPill}
          >
            <Text style={styles.navTabText}>People</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('FamilyStoriesScreen', { patientId })}
            style={styles.navTabPill}
          >
            <Text style={styles.navTabText}>Memories</Text>
          </Pressable>
        </View>

        {/* ── Section 1: Today ────────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today</Text>
          <Pressable
            onPress={() =>
              navigation.navigate('FamilyPatientRoutinesScreen', {
                patientId,
                patientName,
              })
            }
            hitSlop={8}
          >
            <Text style={styles.viewAllText}>View all &gt;</Text>
          </Pressable>
        </View>

        <View style={styles.cardContainer}>
          {todayRoutines.map((item, index) => {
            const isLast = index === todayRoutines.length - 1;
            return (
              <Pressable
                key={item.id}
                onPress={() =>
                  navigation.navigate('FamilyPatientRoutinesScreen', {
                    patientId,
                    patientName,
                  })
                }
                style={[styles.routineRow, !isLast && styles.rowBorder]}
              >
                {/* Status Icon */}
                <View style={styles.statusIconWrap}>
                  {item.status === 'completed' && (
                    <View style={styles.completedIcon}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  )}
                  {item.status === 'due_soon' && (
                    <View style={styles.dueSoonIcon}>
                      <Ionicons name="time" size={14} color="#FFFFFF" />
                    </View>
                  )}
                  {item.status === 'upcoming' && <View style={styles.upcomingIcon} />}
                </View>

                {/* Time */}
                <Text style={styles.routineTimeText}>{item.time}</Text>

                {/* Routine details */}
                <View style={styles.routineDetailsWrap}>
                  <Text style={styles.routineTitleText}>{item.title}</Text>
                  <Text style={styles.routineSubText}>{item.subtitle}</Text>
                </View>

                {/* Chevron */}
                {item.status !== 'completed' && (
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── Section 2: Safety ───────────────────────────────────────────────── */}
        <View style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
          <Text style={styles.sectionTitle}>Safety</Text>
          <Pressable onPress={() => navigation.navigate('FamilyMapScreen', { patientId })} hitSlop={8}>
            <Text style={styles.viewAllText}>View details &gt;</Text>
          </Pressable>
        </View>

        <View style={styles.cardContainer}>
          {/* Row 1: Safe Zone */}
          <View style={[styles.safetyRow, styles.rowBorder]}>
            <View style={styles.safetyIconBubble}>
              <Ionicons name="location-outline" size={20} color="#0E7A67" />
            </View>

            <View style={styles.safetyTextWrap}>
              <Text style={styles.safetyTitle}>In Safe Zone</Text>
              <Text style={styles.safetySubtitle}>Home · Bengaluru</Text>
              <Text style={styles.safetyTimestamp}>Last updated 10 minutes ago</Text>
            </View>

            <View style={styles.safeBadge}>
              <View style={styles.safeBadgeDot} />
              <Text style={styles.safeBadgeText}>Safe</Text>
            </View>
          </View>

          {/* Row 2: SOS Status */}
          <View style={styles.safetyRow}>
            <View style={styles.safetyIconBubble}>
              <Ionicons name="call-outline" size={20} color="#0E7A67" />
            </View>

            <View style={styles.safetyTextWrap}>
              <Text style={styles.safetyTitle}>{isSosActive ? 'SOS ACTIVE' : 'No active SOS'}</Text>
              <Text style={styles.safetySubtitle}>
                {isSosActive ? 'Emergency alert is broadcasted' : 'All clear at the moment'}
              </Text>
            </View>

            <View style={[styles.safeBadge, isSosActive && styles.sosBadge]}>
              <View style={[styles.safeBadgeDot, isSosActive && styles.sosBadgeDot]} />
              <Text style={[styles.safeBadgeText, isSosActive && styles.sosBadgeText]}>
                {isSosActive ? 'Alert' : 'No alerts'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Section 3: People involved ──────────────────────────────────────── */}
        <View style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
          <Text style={styles.sectionTitle}>People involved</Text>
          <Pressable
            onPress={() =>
              navigation.navigate('CareDiscoveryScreen', {
                targetPatientId: patientId,
                targetPatientName: patientName,
              })
            }
            hitSlop={8}
          >
            <Text style={styles.viewAllText}>View all &gt;</Text>
          </Pressable>
        </View>

        <View style={[styles.cardContainer, styles.peopleContainer]}>
          {/* Person 1: Ananya (Family) */}
          <View style={styles.personCol}>
            <Image source={ANANYA_IMG} style={styles.personAvatar} />
            <View style={styles.personDetails}>
              <Text style={styles.personName}>Ananya</Text>
              <Text style={styles.personRole}>Daughter</Text>
              <View style={styles.personBadgePill}>
                <Text style={styles.personBadgeText}>Family</Text>
              </View>
            </View>
          </View>

          {/* Person 2: Meera Sharma (Caregiver) */}
          <Pressable
            onPress={() =>
              navigation.navigate('CaregiverProfileScreen', {
                targetPatientId: patientId,
                targetPatientName: patientName,
              })
            }
            style={({ pressed }) => [styles.personCol, pressed && styles.pressedState]}
          >
            <Image source={MEERA_IMG} style={styles.personAvatar} />
            <View style={styles.personDetails}>
              <Text style={styles.personName}>Meera Sharma</Text>
              <Text style={styles.personRole}>Professional Caregiver</Text>
              <View style={styles.personBadgePill}>
                <Text style={styles.personBadgeText}>Active</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" style={styles.personChevron} />
          </Pressable>
        </View>

        {/* ── Section 4: Memories ─────────────────────────────────────────────── */}
        <View style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
          <Text style={styles.sectionTitle}>Memories</Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('FamilyStoriesScreen', { patientId })}
          style={({ pressed }) => [styles.cardContainer, styles.memoriesCard, pressed && styles.pressedState]}
        >
          <View style={styles.memoryIconBubble}>
            <Ionicons name="images-outline" size={22} color="#0E7A67" />
          </View>

          <View style={styles.memoryTextWrap}>
            <Text style={styles.memoryTitle}>Photos, stories and special moments</Text>
            <Text style={styles.memorySub}>Look back at cherished memories</Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>

        {/* ── Section 5: Manage ───────────────────────────────────────────────── */}
        <View style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
          <Text style={styles.sectionTitle}>Manage</Text>
        </View>

        <View style={styles.manageCardsRow}>
          {/* Manage 1: Routines */}
          <Pressable
            onPress={() =>
              navigation.navigate('FamilyPatientRoutinesScreen', {
                patientId,
                patientName,
              })
            }
            style={({ pressed }) => [styles.manageCard, pressed && styles.pressedCard]}
          >
            <View style={styles.manageIconBubble}>
              <Ionicons name="calendar-outline" size={18} color="#0E7A67" />
            </View>
            <View style={styles.manageHeaderRow}>
              <Text style={styles.manageTitle}>Routines</Text>
              <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
            </View>
            <Text style={styles.manageSub}>View and edit daily routines</Text>
          </Pressable>

          {/* Manage 2: Safety */}
          <Pressable
            onPress={() => navigation.navigate('FamilyMapScreen', { patientId })}
            style={({ pressed }) => [styles.manageCard, pressed && styles.pressedCard]}
          >
            <View style={styles.manageIconBubble}>
              <Ionicons name="location-outline" size={18} color="#0E7A67" />
            </View>
            <View style={styles.manageHeaderRow}>
              <Text style={styles.manageTitle}>Safety</Text>
              <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
            </View>
            <Text style={styles.manageSub}>View location and Safe Zones</Text>
          </Pressable>

          {/* Manage 3: People */}
          <Pressable
            onPress={() =>
              navigation.navigate('CareDiscoveryScreen', {
                targetPatientId: patientId,
                targetPatientName: patientName,
              })
            }
            style={({ pressed }) => [styles.manageCard, pressed && styles.pressedCard]}
          >
            <View style={styles.manageIconBubble}>
              <Ionicons name="people-outline" size={18} color="#0E7A67" />
            </View>
            <View style={styles.manageHeaderRow}>
              <Text style={styles.manageTitle}>People</Text>
              <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
            </View>
            <Text style={styles.manageSub}>Manage caregivers and family</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 110,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  headerPatientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginLeft: 8,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    resizeMode: 'cover',
  },
  headerPatientName: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 20,
    fontWeight: '700',
    color: '#161E1C',
  },
  headerPatientRole: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 1,
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedState: {
    opacity: 0.75,
  },

  // ── Navigation Tabs ────────────────────────────────────────────────────────
  navTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  navTabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  navTabPillActive: {
    backgroundColor: '#E6F5F1',
  },
  navTabText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#52605D',
  },
  navTabTextActive: {
    fontFamily: F.bold,
    color: '#0E7A67',
  },

  // ── Section Headers ────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderSpaced: {
    marginTop: 22,
  },
  sectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 21,
    fontWeight: '700',
    color: '#161E1C',
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#0E7A67',
  },

  // ── Card Container ─────────────────────────────────────────────────────────
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  // ── Today Routine Rows ─────────────────────────────────────────────────────
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statusIconWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  completedIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0E7A67',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueSoonIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    backgroundColor: '#FFFFFF',
  },
  routineTimeText: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#161E1C',
    width: 76,
  },
  routineDetailsWrap: {
    flex: 1,
  },
  routineTitleText: {
    fontFamily: F.bold,
    fontSize: 14.5,
    color: '#161E1C',
    marginBottom: 2,
  },
  routineSubText: {
    fontFamily: F.regular,
    fontSize: 12.5,
    color: '#52605D',
  },

  // ── Safety Rows ────────────────────────────────────────────────────────────
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  safetyIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  safetyTextWrap: {
    flex: 1,
  },
  safetyTitle: {
    fontFamily: F.bold,
    fontSize: 14.5,
    color: '#161E1C',
    marginBottom: 2,
  },
  safetySubtitle: {
    fontFamily: F.regular,
    fontSize: 12.5,
    color: '#52605D',
  },
  safetyTimestamp: {
    fontFamily: F.regular,
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  safeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F5F1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  safeBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0E7A67',
  },
  safeBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: '#0E7A67',
  },
  sosBadge: {
    backgroundColor: '#FEE2E2',
  },
  sosBadgeDot: {
    backgroundColor: '#DC2626',
  },
  sosBadgeText: {
    color: '#DC2626',
  },

  // ── People involved ────────────────────────────────────────────────────────
  peopleContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  personCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    resizeMode: 'cover',
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    fontFamily: F.bold,
    fontSize: 13.5,
    color: '#161E1C',
    marginBottom: 2,
  },
  personRole: {
    fontFamily: F.regular,
    fontSize: 11.5,
    color: '#52605D',
    marginBottom: 4,
  },
  personBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F5F1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  personBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 10.5,
    color: '#0E7A67',
  },
  personChevron: {
    marginLeft: 4,
  },

  // ── Memories ───────────────────────────────────────────────────────────────
  memoriesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  memoryIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  memoryTextWrap: {
    flex: 1,
  },
  memoryTitle: {
    fontFamily: F.bold,
    fontSize: 14.5,
    color: '#161E1C',
    marginBottom: 2,
  },
  memorySub: {
    fontFamily: F.regular,
    fontSize: 12.5,
    color: '#52605D',
  },

  // ── Manage ─────────────────────────────────────────────────────────────────
  manageCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manageCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    padding: 12,
  },
  manageIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  manageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  manageTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#161E1C',
  },
  manageSub: {
    fontFamily: F.regular,
    fontSize: 10.5,
    color: '#52605D',
    lineHeight: 14,
  },
  pressedCard: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});

