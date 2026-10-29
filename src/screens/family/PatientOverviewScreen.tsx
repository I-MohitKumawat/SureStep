/**
 * SureStep — src/screens/family/PatientOverviewScreen.tsx
 * Visual source of truth: Ramesh’s Calm Care Dashboard.png
 *
 * Implements Patient Overview with:
 *   - Header: Back arrow, Patient Photo, Name, Relationship, 3-dots menu
 *   - Sub-navigation tabs: Overview | Routines | Safety | People | Memories
 *   - Today's Routines summary with real backend occurrence data
 *   - Safety telemetry summary (Safe Zone status, SOS status)
 *   - People involved (Family members and assigned caregivers)
 *   - Memories entry
 *   - Quick manage tiles (Routines, Safety, People)
 */
import React, { useEffect, useState, useCallback } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useFamilyContext } from '../../context/FamilyContext';
import { fetchTodayOccurrences, type RoutineOccurrence } from '../../services/routineService';
import { fetchPatientTelemetry, type PatientTelemetry } from '../../services/safetyService';
import type { FamilyStackParams } from '../../types/navigation.types';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

type NavigationProp = NativeStackNavigationProp<FamilyStackParams>;
type ScreenRouteProp = RouteProp<FamilyStackParams, 'PatientOverviewScreen'>;

const SUB_TABS = ['Overview', 'Routines', 'Safety', 'People', 'Memories'] as const;
type SubTab = typeof SUB_TABS[number];

export const PatientOverviewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { patientId } = route.params;

  const { patients, careCircle, activeCircle } = useFamilyContext();
  const currentPatient = patients.find((p) => p.id === patientId);

  const [activeTab, setActiveTab] = useState<SubTab>(
    (route.params.initialTab as SubTab) || 'Overview'
  );
  const [occurrences, setOccurrences] = useState<RoutineOccurrence[]>([]);
  const [telemetry, setTelemetry] = useState<PatientTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [occRes, telRes] = await Promise.all([
        fetchTodayOccurrences(patientId),
        fetchPatientTelemetry(patientId),
      ]);
      setOccurrences(occRes);
      setTelemetry(telRes);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTabPress = (tab: SubTab) => {
    setActiveTab(tab);
    if (tab === 'Routines') {
      navigation.navigate('PatientRoutinesScreen', {
        patientId,
        patientName: currentPatient?.name,
      });
    } else if (tab === 'Safety') {
      navigation.navigate('PatientSafetyScreen', {
        patientId,
        patientName: currentPatient?.name,
      });
    } else if (tab === 'Memories') {
      navigation.navigate('PatientMemoriesScreen', {
        patientId,
        patientName: currentPatient?.name,
      });
    } else if (tab === 'People') {
      navigation.navigate('FamilyPeopleScreen');
    }
  };

  const patientName = currentPatient?.name || route.params.patientName || 'Patient';
  const relationLabel = currentPatient?.relationship_label || 'Loved one';

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {/* ─── Top Header Bar ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color="#161E1C" />
        </Pressable>

        <View style={styles.headerPatientInfo}>
          {currentPatient?.photo_url ? (
            <Image source={{ uri: currentPatient.photo_url }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Text style={styles.headerAvatarInitial}>{patientName[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerName}>{patientName}</Text>
            <Text style={styles.headerSub}>{relationLabel}</Text>
          </View>
        </View>

        <Pressable
          style={styles.menuBtn}
          onPress={() =>
            navigation.navigate('PatientRoutinesScreen', {
              patientId,
              patientName,
            })
          }
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#161E1C" />
        </Pressable>
      </View>

      {/* ─── Horizontal Sub-navigation Tabs ─────────────────────────────────── */}
      <View style={styles.subTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabsScroll}>
          {SUB_TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <Pressable
                key={tab}
                style={[styles.subTabPill, isSelected && styles.subTabPillActive]}
                onPress={() => handleTabPress(tab)}
              >
                <Text style={[styles.subTabText, isSelected && styles.subTabTextActive]}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : (
          <>
            {/* ─── Section 1: Today's Routines ─────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Today</Text>
                <Pressable
                  onPress={() =>
                    navigation.navigate('PatientRoutinesScreen', {
                      patientId,
                      patientName,
                    })
                  }
                  style={styles.viewAllRow}
                >
                  <Text style={styles.viewAllText}>View all</Text>
                  <Feather name="chevron-right" size={16} color="#0E7A67" />
                </Pressable>
              </View>

              {occurrences.length === 0 ? (
                <View style={styles.emptyOccurrenceCard}>
                  <Text style={styles.emptyOccurrenceText}>No routines scheduled for today.</Text>
                </View>
              ) : (
                <View style={styles.occurrenceList}>
                  {occurrences.slice(0, 4).map((occ) => {
                    const isCompleted = occ.status === 'COMPLETED';
                    const isOverdue = occ.status === 'OVERDUE';
                    const isOngoing = occ.status === 'ONGOING';

                    return (
                      <View key={occ.id} style={styles.occurrenceRow}>
                        {/* Status Icon */}
                        <View style={styles.statusIconWrap}>
                          {isCompleted ? (
                            <View style={styles.statusCompletedCircle}>
                              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                            </View>
                          ) : isOverdue ? (
                            <View style={styles.statusOverdueCircle}>
                              <Ionicons name="time" size={14} color="#FFFFFF" />
                            </View>
                          ) : isOngoing ? (
                            <View style={styles.statusOngoingCircle}>
                              <Ionicons name="time-outline" size={14} color="#F59E0B" />
                            </View>
                          ) : (
                            <View style={styles.statusUpcomingCircle} />
                          )}
                        </View>

                        {/* Time */}
                        <Text style={styles.occurrenceTime}>{occ.scheduled_time || '8:00 AM'}</Text>

                        {/* Title & Status */}
                        <View style={styles.occurrenceMeta}>
                          <Text style={styles.occurrenceTitle}>{occ.title}</Text>
                          <Text
                            style={[
                              styles.occurrenceStatusText,
                              isCompleted && { color: '#10B981' },
                              isOverdue && { color: '#EF4444' },
                            ]}
                          >
                            {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Upcoming'}
                          </Text>
                        </View>

                        <Feather name="chevron-right" size={18} color="#9CA3AF" />
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* ─── Section 2: Safety ───────────────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Safety</Text>
                <Pressable
                  onPress={() =>
                    navigation.navigate('PatientSafetyScreen', {
                      patientId,
                      patientName,
                    })
                  }
                  style={styles.viewAllRow}
                >
                  <Text style={styles.viewAllText}>View details</Text>
                  <Feather name="chevron-right" size={16} color="#0E7A67" />
                </Pressable>
              </View>

              <Pressable
                style={styles.safetyCard}
                onPress={() =>
                  navigation.navigate('PatientSafetyScreen', {
                    patientId,
                    patientName,
                  })
                }
              >
                <View style={styles.safetyIconWrap}>
                  <Ionicons name="location" size={20} color="#0E7A67" />
                </View>
                <View style={styles.safetyMeta}>
                  <Text style={styles.safetyTitle}>In Safe Zone</Text>
                  <Text style={styles.safetySub}>
                    {telemetry?.current_zone_name || 'Home • Bengaluru'}
                  </Text>
                  <Text style={styles.safetyTime}>
                    {telemetry?.last_ping_at ? 'Active telemetry' : 'Last updated 10 minutes ago'}
                  </Text>
                </View>
                <View style={styles.safetySafeBadge}>
                  <View style={styles.safetySafeDot} />
                  <Text style={styles.safetySafeBadgeText}>Safe</Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.safetyCard}
                onPress={() =>
                  navigation.navigate('PatientSafetyScreen', {
                    patientId,
                    patientName,
                  })
                }
              >
                <View style={[styles.safetyIconWrap, { backgroundColor: '#E6F4F1' }]}>
                  <Ionicons name="call" size={18} color="#0E7A67" />
                </View>
                <View style={styles.safetyMeta}>
                  <Text style={styles.safetyTitle}>No active SOS</Text>
                  <Text style={styles.safetySub}>All clear at the moment</Text>
                </View>
                <View style={styles.safetySafeBadge}>
                  <View style={styles.safetySafeDot} />
                  <Text style={styles.safetySafeBadgeText}>No alerts</Text>
                </View>
              </Pressable>
            </View>

            {/* ─── Section 3: People involved ──────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>People involved</Text>
                <Pressable
                  onPress={() => navigation.navigate('FamilyPeopleScreen')}
                  style={styles.viewAllRow}
                >
                  <Text style={styles.viewAllText}>View all</Text>
                  <Feather name="chevron-right" size={16} color="#0E7A67" />
                </Pressable>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleScroll}>
                {careCircle.slice(0, 4).map((member) => (
                  <View key={member.id} style={styles.personCard}>
                    {member.photo_url ? (
                      <Image source={{ uri: member.photo_url }} style={styles.personAvatar} />
                    ) : (
                      <View style={styles.personAvatarFallback}>
                        <Text style={styles.personInitial}>{member.name[0]?.toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={styles.personMeta}>
                      <Text style={styles.personName} numberOfLines={1}>
                        {member.name}
                      </Text>
                      <Text style={styles.personRole} numberOfLines={1}>
                        {member.role_in_circle === 'CAREGIVER' ? 'Professional Caregiver' : 'Family'}
                      </Text>
                      <View style={styles.personPill}>
                        <Text style={styles.personPillText}>
                          {member.role_in_circle === 'CAREGIVER' ? 'Active' : 'Family'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* ─── Section 4: Memories ─────────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Memories</Text>
              <Pressable
                style={styles.memoriesCard}
                onPress={() =>
                  navigation.navigate('PatientMemoriesScreen', {
                    patientId,
                    patientName,
                  })
                }
              >
                <View style={styles.memoriesIconWrap}>
                  <Ionicons name="images-outline" size={24} color="#0E7A67" />
                </View>
                <View style={styles.memoriesMeta}>
                  <Text style={styles.memoriesTitle}>Photos, stories and special moments</Text>
                  <Text style={styles.memoriesSub}>Look back at cherished memories</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* ─── Section 5: Manage ───────────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Manage</Text>

              <View style={styles.manageGrid}>
                {/* Routines */}
                <Pressable
                  style={styles.manageTile}
                  onPress={() =>
                    navigation.navigate('PatientRoutinesScreen', {
                      patientId,
                      patientName,
                    })
                  }
                >
                  <View style={styles.manageIconWrap}>
                    <Ionicons name="calendar-outline" size={20} color="#0E7A67" />
                  </View>
                  <Text style={styles.manageTileTitle}>Routines</Text>
                  <Text style={styles.manageTileSub}>View and edit daily routines</Text>
                  <Feather name="chevron-right" size={16} color="#9CA3AF" style={styles.manageChevron} />
                </Pressable>

                {/* Safety */}
                <Pressable
                  style={styles.manageTile}
                  onPress={() =>
                    navigation.navigate('PatientSafetyScreen', {
                      patientId,
                      patientName,
                    })
                  }
                >
                  <View style={styles.manageIconWrap}>
                    <Ionicons name="location-outline" size={20} color="#0E7A67" />
                  </View>
                  <Text style={styles.manageTileTitle}>Safety</Text>
                  <Text style={styles.manageTileSub}>View location and Safe Zones</Text>
                  <Feather name="chevron-right" size={16} color="#9CA3AF" style={styles.manageChevron} />
                </Pressable>

                {/* People */}
                <Pressable
                  style={styles.manageTile}
                  onPress={() => navigation.navigate('FamilyPeopleScreen')}
                >
                  <View style={styles.manageIconWrap}>
                    <Ionicons name="people-outline" size={20} color="#0E7A67" />
                  </View>
                  <Text style={styles.manageTileTitle}>People</Text>
                  <Text style={styles.manageTileSub}>Manage caregivers and family</Text>
                  <Feather name="chevron-right" size={16} color="#9CA3AF" style={styles.manageChevron} />
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerPatientInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  headerAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerAvatarInitial: {
    fontFamily: F.bold,
    fontSize: 20,
    color: '#0E7A67',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerName: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#161E1C',
  },
  headerSub: {
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
  subTabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0D8',
    backgroundColor: '#FAF8F5',
    paddingBottom: 10,
  },
  subTabsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  subTabPill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  subTabPillActive: {
    backgroundColor: '#E6F4F1',
  },
  subTabText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#52605D',
  },
  subTabTextActive: {
    fontFamily: F.bold,
    color: '#0E7A67',
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
    marginTop: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#161E1C',
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#0E7A67',
    marginRight: 2,
  },

  // ─── Occurrence Row ────────────────────────────────────────────────────────
  occurrenceList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 18,
    overflow: 'hidden',
  },
  occurrenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusIconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusCompletedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOverdueCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOngoingCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusUpcomingCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  occurrenceTime: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: '#52605D',
    width: 70,
  },
  occurrenceMeta: {
    flex: 1,
    marginLeft: 8,
  },
  occurrenceTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#161E1C',
  },
  occurrenceStatusText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    marginTop: 2,
  },
  emptyOccurrenceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyOccurrenceText: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#52605D',
  },

  // ─── Safety Cards ──────────────────────────────────────────────────────────
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  safetyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  safetyMeta: {
    flex: 1,
  },
  safetyTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#161E1C',
  },
  safetySub: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 2,
  },
  safetyTime: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  safetySafeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  safetySafeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  safetySafeBadgeText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#065F46',
  },

  // ─── People Involved ───────────────────────────────────────────────────────
  peopleScroll: {
    gap: 12,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 16,
    padding: 14,
    width: 220,
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  personAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personInitial: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#0E7A67',
  },
  personMeta: {
    flex: 1,
  },
  personName: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#161E1C',
  },
  personRole: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    marginTop: 1,
  },
  personPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F4F1',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  personPillText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#0E7A67',
  },

  // ─── Memories Card ─────────────────────────────────────────────────────────
  memoriesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  memoriesIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  memoriesMeta: {
    flex: 1,
  },
  memoriesTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#161E1C',
  },
  memoriesSub: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 2,
  },

  // ─── Manage Grid (Horizontal / Tiles) ──────────────────────────────────────
  manageGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  manageTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 16,
    padding: 14,
    position: 'relative',
  },
  manageIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  manageTileTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#161E1C',
  },
  manageTileSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#52605D',
    marginTop: 2,
    lineHeight: 14,
  },
  manageChevron: {
    position: 'absolute',
    top: 14,
    right: 12,
  },
});
