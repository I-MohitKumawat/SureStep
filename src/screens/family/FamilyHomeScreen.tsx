/**
 * SureStep — src/screens/family/FamilyHomeScreen.tsx
 * Visual source of truth: Family Care Dashboard.png
 *
 * Implements the 4-state Family Home:
 *   - State A: New Account (No Circle) -> Connection Hub
 *   - State B: Circle Exists, No Patient -> Circle Hub
 *   - State C: Active Patient Connected -> Attention items, Connected Patients, Quick actions
 *   - State D: Multiple Patients -> Scoped patient cards & switching
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useFamilyContext } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { listCircleSafetyAlerts, type SafetyAlert } from '../../services/safetyService';
import { fetchTodayOccurrences, type RoutineOccurrence } from '../../services/routineService';
import type { FamilyStackParams } from '../../types/navigation.types';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

type NavigationProp = NativeStackNavigationProp<FamilyStackParams>;

export const FamilyHomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const {
    activeCircle,
    patients,
    activePatient,
    isLoading,
    refresh,
    setActivePatientId,
  } = useFamilyContext();

  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [todayOccurrences, setTodayOccurrences] = useState<RoutineOccurrence[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!activeCircle && !activePatient) return;
    setLoadingData(true);
    try {
      const promises: Promise<any>[] = [];
      if (activeCircle) {
        promises.push(listCircleSafetyAlerts(activeCircle.id, 'TRIGGERED').catch(() => []));
      }
      if (activePatient) {
        promises.push(fetchTodayOccurrences(activePatient.id).catch(() => []));
      }

      const results = await Promise.all(promises);
      if (activeCircle && results[0]) {
        setAlerts(results[0] as SafetyAlert[]);
      }
      if (activePatient && results[1]) {
        setTodayOccurrences(results[1] as RoutineOccurrence[]);
      }
    } finally {
      setLoadingData(false);
    }
  }, [activeCircle, activePatient]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      void loadDashboardData();
    }, [refresh, loadDashboardData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    await loadDashboardData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.name ? user.name.split(' ')[0] : 'there';

  // Attention items computation
  const activeEmergencyAlert = alerts.find(
    (a) => a.status === 'TRIGGERED' && (a.alert_type === 'SOS_MANUAL' || a.alert_type === 'ZONE_BREACH')
  );

  const overdueRoutine = todayOccurrences.find((o) => o.status === 'OVERDUE');

  const hasAttentionItems = Boolean(activeEmergencyAlert || overdueRoutine);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {/* ─── Top Header Bar ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        {/* Profile Avatar -> navigates to Settings */}
        <Pressable
          onPress={() => navigation.navigate('FamilySettingsScreen')}
          style={styles.avatarButton}
          accessibilityLabel="Open settings"
        >
          {user?.photo_url ? (
            <Image source={{ uri: user.photo_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{userName[0]?.toUpperCase() || 'F'}</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.headerTextWrap}>
          <Text style={styles.appTitle}>SureStep</Text>
          <Text style={styles.greetingText}>
            {getGreeting()}, {userName}
          </Text>
        </View>

        {/* Notifications Icon with dot */}
        <Pressable
          onPress={() => navigation.navigate('NotificationHistoryScreen')}
          style={styles.bellButton}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={24} color="#161E1C" />
          {alerts.length > 0 && <View style={styles.notificationDot} />}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : !activeCircle ? (
          /* ─── State A: New Account (No Care Circle) ───────────────────────── */
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyHeroCard}>
              <View style={styles.emptyHeroIconWrap}>
                <Ionicons name="people" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.emptyHeroTitle}>Welcome to SureStep</Text>
              <Text style={styles.emptyHeroSubtitle}>
                Coordinate compassionate, connected care for your loved one. Get started by creating your family’s Care Circle.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.primaryHeroBtn, pressed && { opacity: 0.85 }]}
                onPress={() => navigation.navigate('CreateCareCircleScreen')}
              >
                <Text style={styles.primaryHeroBtnText}>Create a Care Circle</Text>
              </Pressable>
            </View>

            <View style={styles.emptySecondaryCard}>
              <Text style={styles.secondaryCardTitle}>Have an Invite Code?</Text>
              <Text style={styles.secondaryCardSubtitle}>
                If a family member has already created a Circle, enter your 6-digit code to join.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.outlineHeroBtn, pressed && { opacity: 0.7 }]}
                onPress={() => navigation.navigate('JoinCareCircleScreen')}
              >
                <Text style={styles.outlineHeroBtnText}>Join with Invite Code</Text>
              </Pressable>
            </View>
          </View>
        ) : patients.length === 0 ? (
          /* ─── State B: Circle Exists, No Patient Associated ───────────────── */
          <View style={styles.emptyStateContainer}>
            <View style={styles.circleInfoCard}>
              <View style={styles.circleBadgeRow}>
                <View style={styles.circleActiveDot} />
                <Text style={styles.circleBadgeText}>Care Circle Active</Text>
              </View>
              <Text style={styles.circleTitle}>{activeCircle.name}</Text>
              <Text style={styles.circleSubtitle}>
                Your Circle is ready. Connect a loved one to start viewing live telemetry, daily routines, and safety alerts.
              </Text>
              <View style={styles.circleActionRow}>
                <Pressable
                  style={styles.circleActionBtn}
                  onPress={() => navigation.navigate('CareCircleManageScreen', { circleId: activeCircle.id })}
                >
                  <Ionicons name="person-add-outline" size={18} color={C.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.circleActionBtnText}>Invite Family</Text>
                </Pressable>
                <Pressable
                  style={[styles.circleActionBtn, { backgroundColor: C.primary, borderColor: C.primary }]}
                  onPress={() => navigation.navigate('FamilyPeopleScreen')}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={[styles.circleActionBtnText, { color: '#FFFFFF' }]}>Connect Patient</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          /* ─── State C & D: Connected Patient(s) — Visual Match ────────────── */
          <>
            {/* Section 1: Needs your attention */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Needs your attention</Text>

              {activeEmergencyAlert ? (
                <Pressable
                  style={styles.alertCardRed}
                  onPress={() =>
                    navigation.navigate('AlertDetailScreen', {
                      alertId: activeEmergencyAlert.id,
                      circleId: activeCircle?.id,
                      patientId: activeEmergencyAlert.patient_id,
                    })
                  }
                >
                  <View style={styles.alertIconCircleRed}>
                    <Ionicons name="alert" size={20} color="#DC2626" />
                  </View>
                  <View style={styles.alertTextWrap}>
                    <Text style={styles.alertTitleRed}>
                      {activeEmergencyAlert.patient_name || 'Patient'} left the Safe Zone
                    </Text>
                    <Text style={styles.alertSubRed}>
                      {activeEmergencyAlert.zone_name
                        ? `Near ${activeEmergencyAlert.zone_name}`
                        : 'Outside registered safe boundary'}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#9CA3AF" />
                </Pressable>
              ) : null}

              {overdueRoutine ? (
                <Pressable
                  style={styles.attentionCard}
                  onPress={() =>
                    navigation.navigate('PatientRoutinesScreen', {
                      patientId: overdueRoutine.patient_id,
                      patientName: activePatient?.name,
                    })
                  }
                >
                  <View style={styles.attentionIconCircleTeal}>
                    <Ionicons name="calendar-outline" size={20} color="#0E7A67" />
                  </View>
                  <View style={styles.alertTextWrap}>
                    <Text style={styles.attentionTitle}>Routine pending</Text>
                    <Text style={styles.attentionSub}>
                      {activePatient?.name || 'Patient'} missed scheduled {overdueRoutine.title.toLowerCase()}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#9CA3AF" />
                </Pressable>
              ) : null}

              {!hasAttentionItems ? (
                <View style={styles.allClearCard}>
                  <View style={styles.allClearIconWrap}>
                    <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                  </View>
                  <View style={styles.alertTextWrap}>
                    <Text style={styles.allClearTitle}>Everything is on track</Text>
                    <Text style={styles.allClearSub}>
                      Routines and safety boundaries are normal right now.
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Section 2: People you care for */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>People you care for</Text>
                <Pressable
                  onPress={() => navigation.navigate('FamilyPeopleScreen')}
                  style={styles.viewAllBtn}
                >
                  <Text style={styles.viewAllText}>View all</Text>
                  <Feather name="chevron-right" size={16} color={C.primary} />
                </Pressable>
              </View>

              {patients.map((p) => {
                const isSelected = p.id === activePatient?.id;
                const statusLabel = p.safety_state === 'SAFE' ? 'At home' : 'Active';
                return (
                  <Pressable
                    key={p.id}
                    style={({ pressed }) => [
                      styles.patientCard,
                      pressed && { opacity: 0.9 },
                      isSelected && styles.patientCardActive,
                    ]}
                    onPress={() => {
                      setActivePatientId(p.id);
                      navigation.navigate('PatientOverviewScreen', {
                        patientId: p.id,
                        patientName: p.name,
                      });
                    }}
                  >
                    {p.photo_url ? (
                      <Image source={{ uri: p.photo_url }} style={styles.patientAvatar} />
                    ) : (
                      <View style={styles.patientAvatarFallback}>
                        <Text style={styles.patientInitial}>{p.name[0]?.toUpperCase()}</Text>
                      </View>
                    )}

                    <View style={styles.patientMeta}>
                      <Text style={styles.patientName}>{p.name}</Text>
                      <View style={styles.statusRow}>
                        <View style={styles.statusDotGreen} />
                        <Text style={styles.statusText}>{statusLabel}</Text>
                      </View>
                      <Text style={styles.patientSub}>
                        {todayOccurrences.length > 0
                          ? `${todayOccurrences.filter((t) => t.status === 'COMPLETED').length}/${todayOccurrences.length} routines completed`
                          : 'Care routines active'}
                      </Text>
                    </View>

                    <Feather name="chevron-right" size={20} color="#9CA3AF" />
                  </Pressable>
                );
              })}
            </View>

            {/* Section 3: Quick actions (2x2 Grid) */}
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Quick actions</Text>

              <View style={styles.quickActionsGrid}>
                {/* 1. View Patient */}
                <Pressable
                  style={styles.quickActionTile}
                  onPress={() => {
                    if (activePatient) {
                      navigation.navigate('PatientOverviewScreen', {
                        patientId: activePatient.id,
                        patientName: activePatient.name,
                      });
                    }
                  }}
                >
                  <View style={styles.quickActionIconWrap}>
                    <Ionicons name="person-outline" size={20} color="#0E7A67" />
                  </View>
                  <View style={styles.quickActionMeta}>
                    <Text style={styles.quickActionTitle}>View patient</Text>
                    <Text style={styles.quickActionSub}>Check details and routines</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#9CA3AF" />
                </Pressable>

                {/* 2. Manage Routines */}
                <Pressable
                  style={styles.quickActionTile}
                  onPress={() => {
                    if (activePatient) {
                      navigation.navigate('PatientRoutinesScreen', {
                        patientId: activePatient.id,
                        patientName: activePatient.name,
                      });
                    }
                  }}
                >
                  <View style={styles.quickActionIconWrap}>
                    <Ionicons name="calendar-outline" size={20} color="#0E7A67" />
                  </View>
                  <View style={styles.quickActionMeta}>
                    <Text style={styles.quickActionTitle}>Manage routines</Text>
                    <Text style={styles.quickActionSub}>View and edit daily routines</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#9CA3AF" />
                </Pressable>

                {/* 3. View Safety */}
                <Pressable
                  style={styles.quickActionTile}
                  onPress={() => {
                    if (activePatient) {
                      navigation.navigate('PatientSafetyScreen', {
                        patientId: activePatient.id,
                        patientName: activePatient.name,
                      });
                    }
                  }}
                >
                  <View style={styles.quickActionIconWrap}>
                    <Ionicons name="location-outline" size={20} color="#0E7A67" />
                  </View>
                  <View style={styles.quickActionMeta}>
                    <Text style={styles.quickActionTitle}>View safety</Text>
                    <Text style={styles.quickActionSub}>Check location and Safe Zones</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#9CA3AF" />
                </Pressable>

                {/* 4. Find Caregiver */}
                <Pressable
                  style={styles.quickActionTile}
                  onPress={() => {
                    navigation.navigate('CareDiscoveryScreen', {
                      targetPatientId: activePatient?.id,
                      targetPatientName: activePatient?.name,
                    });
                  }}
                >
                  <View style={styles.quickActionIconWrap}>
                    <Ionicons name="people-outline" size={20} color="#0E7A67" />
                  </View>
                  <View style={styles.quickActionMeta}>
                    <Text style={styles.quickActionTitle}>Find caregiver</Text>
                    <Text style={styles.quickActionSub}>Get help for your family member</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#9CA3AF" />
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

// ─── Styles matching Family Care Dashboard.png ─────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F5', // Approved warm off-white
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FAF8F5',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#E5E0D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#0E7A67',
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  appTitle: {
    fontFamily: F.extraBold,
    fontSize: 22,
    color: '#0E7A67', // Deep Botanical Teal
    letterSpacing: -0.3,
  },
  greetingText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  section: {
    marginTop: 24,
  },
  sectionHeading: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#161E1C',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#0E7A67',
    marginRight: 2,
  },

  // ─── Attention Cards ────────────────────────────────────────────────────────
  alertCardRed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  alertIconCircleRed: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitleRed: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#161E1C',
    marginBottom: 2,
  },
  alertSubRed: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
  },
  attentionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  attentionIconCircleTeal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  attentionTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#161E1C',
    marginBottom: 2,
  },
  attentionSub: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
  },
  allClearCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 16,
    padding: 16,
  },
  allClearIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  allClearTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#161E1C',
    marginBottom: 2,
  },
  allClearSub: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
  },

  // ─── Patient Card ───────────────────────────────────────────────────────────
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  patientCardActive: {
    borderColor: '#0E7A67',
  },
  patientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  patientAvatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  patientInitial: {
    fontFamily: F.bold,
    fontSize: 24,
    color: '#0E7A67',
  },
  patientMeta: {
    flex: 1,
  },
  patientName: {
    fontFamily: F.bold,
    fontSize: 17,
    color: '#161E1C',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  statusDotGreen: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#10B981',
  },
  patientSub: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
  },

  // ─── Quick Actions (2x2 Grid) ───────────────────────────────────────────────
  quickActionsGrid: {
    gap: 12,
  },
  quickActionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 16,
    padding: 14,
  },
  quickActionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  quickActionMeta: {
    flex: 1,
  },
  quickActionTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#161E1C',
  },
  quickActionSub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    marginTop: 1,
  },

  // ─── State A & B Empty States ──────────────────────────────────────────────
  emptyStateContainer: {
    paddingTop: 10,
    gap: 16,
  },
  emptyHeroCard: {
    backgroundColor: '#0E7A67',
    borderRadius: 20,
    padding: 24,
  },
  emptyHeroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyHeroTitle: {
    fontFamily: F.bold,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyHeroSubtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: 20,
  },
  primaryHeroBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryHeroBtnText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#0E7A67',
  },
  emptySecondaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 20,
    padding: 22,
  },
  secondaryCardTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: '#161E1C',
    marginBottom: 6,
  },
  secondaryCardSubtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#52605D',
    lineHeight: 20,
    marginBottom: 16,
  },
  outlineHeroBtn: {
    borderWidth: 1.5,
    borderColor: '#0E7A67',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineHeroBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#0E7A67',
  },
  circleInfoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 20,
    padding: 22,
  },
  circleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  circleActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  circleBadgeText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#10B981',
    textTransform: 'uppercase',
  },
  circleTitle: {
    fontFamily: F.bold,
    fontSize: 20,
    color: '#161E1C',
    marginBottom: 6,
  },
  circleSubtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#52605D',
    lineHeight: 20,
    marginBottom: 18,
  },
  circleActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  circleActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0E7A67',
    borderRadius: 12,
    paddingVertical: 12,
  },
  circleActionBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#0E7A67',
  },
});
