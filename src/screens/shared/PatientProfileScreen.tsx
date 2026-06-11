import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { getPatientProfile } from '../../services/userService';
import { getLatestAssessment, getAssessmentHistory, type AssessmentData } from '../../services/assessmentService';
import { getCarePlan, type CarePlanData } from '../../services/carePlanService';
import { getCareCircleForPatient } from '../../services/familyService';

export const PatientProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();

  // Resolve patientId from route params or current authenticated patient user
  const routePatientId = route.params?.patientId;
  const patientId = routePatientId || user?.id;

  const userRole = user?.role || 'PATIENT';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // States for data
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [latestAssessment, setLatestAssessment] = useState<AssessmentData | null>(null);
  const [carePlan, setCarePlan] = useState<CarePlanData | null>(null);
  const [careCircle, setCareCircle] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // Modal for historical assessment details
  const [selectedHistoryAssessment, setSelectedHistoryAssessment] = useState<AssessmentData | null>(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    if (!isSilent) setLoading(true);

    try {
      // 1. Fetch patient user profile
      const profileRes = await getPatientProfile(patientId).catch(() => null);
      if (profileRes?.data) {
        setPatientProfile(profileRes.data.data || profileRes.data);
      }

      // 2. Fetch latest assessment
      const assessment = await getLatestAssessment(patientId).catch(() => null);
      setLatestAssessment(assessment);

      // 3. Fetch care circle
      const circleRes = await getCareCircleForPatient(patientId).catch(() => null);
      if (circleRes?.data?.data?.members) {
        setCareCircle(circleRes.data.data.members);
      }

      // If role is CAREGIVER or FAMILY, fetch care plan and history
      if (userRole === 'CAREGIVER' || userRole === 'FAMILY') {
        const plan = await getCarePlan(patientId).catch(() => null);
        setCarePlan(plan);

        const hist = await getAssessmentHistory(patientId).catch(() => []);
        setHistory(hist);
      }
    } catch (err) {
      console.warn('[PatientProfileScreen] Error fetching patient profile data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId, userRole]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const handleHistoryItemPress = async (assessmentId: string) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/assessments/${assessmentId}`);
      const assessment = res.data.data?.assessment || res.data?.assessment;
      if (assessment) {
        setSelectedHistoryAssessment(assessment);
        setHistoryModalVisible(true);
      } else {
        Alert.alert('Error', 'Assessment details not found.');
      }
    } catch (err) {
      console.warn('Failed to fetch historical assessment details:', err);
      Alert.alert('Error', 'Failed to load assessment details.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !refreshing && !historyModalVisible) {
    return (
      <ScreenContainer style={styles.centerContainer}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Loading Patient Profile...</Text>
      </ScreenContainer>
    );
  }

  // Determine displayed fields. Fallback values are set dynamically from profile or assessment
  const displayName = patientProfile?.name || latestAssessment?.patient_basics?.preferred_name || 'Patient';
  const displayDob = patientProfile?.date_of_birth || '—';
  const displayGender = patientProfile?.gender || '—';
  const displayCity = patientProfile?.city || '—';
  const displayLanguage = patientProfile?.preferred_language || latestAssessment?.patient_basics?.primary_language || 'English';
  const displayAddress = latestAssessment?.patient_basics?.address || '—';
  const displayLiving = latestAssessment?.patient_basics?.living_arrangement || '—';
  const displayMobility = latestAssessment?.mobility || '—';
  const displayTech = latestAssessment?.tech_comfort || '—';

  // Fallback emergency contacts
  const emergencyContacts = latestAssessment?.emergency_contacts || (patientProfile?.emergency_contact_name ? [{
    name: patientProfile.emergency_contact_name,
    relationship: 'Emergency Contact',
    phone: patientProfile.emergency_contact_phone || '—',
    priority: 1,
  }] : []);

  // Filter care circle members into Caregivers and Family Members
  const caregivers = careCircle.filter(m => m.relationship_type === 'CAREGIVER');
  const familyMembers = careCircle.filter(m => m.relationship_type !== 'CAREGIVER');

  const getRiskColor = (level?: 'Low' | 'Medium' | 'High') => {
    if (level === 'High') return { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' };
    if (level === 'Medium') return { bg: '#FFEDD5', border: '#FDBA74', text: '#C2410C' };
    return { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46' };
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Patient Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[C.primary]} />
        }
      >
        {/* Patient Hero Details */}
        <View style={styles.heroCard}>
          {patientProfile?.photo_url ? (
            <Image source={{ uri: patientProfile.photo_url }} style={styles.heroAvatar} />
          ) : (
            <View style={styles.heroAvatarPlaceholder}>
              <Text style={styles.heroAvatarText}>{displayName[0]?.toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.heroName}>{displayName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Patient</Text>
          </View>
        </View>

        {/* 1. Patient Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="user" size={18} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.grid}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Date of Birth</Text>
                <Text style={styles.gridValue}>{formatDate(displayDob)}</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Gender</Text>
                <Text style={styles.gridValue}>{displayGender}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.grid}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Language</Text>
                <Text style={styles.gridValue}>{displayLanguage}</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>City</Text>
                <Text style={styles.gridValue}>{displayCity}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.gridLabel}>Living Arrangement</Text>
              <Text style={styles.gridValue}>{displayLiving}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.gridLabel}>Home Address</Text>
              <Text style={styles.gridValue}>{displayAddress}</Text>
            </View>
            {userRole !== 'PATIENT' && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.gridLabel}>Mobility Status</Text>
                  <Text style={styles.gridValue}>{displayMobility}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.gridLabel}>Technology Comfort</Text>
                  <Text style={styles.gridValue}>{displayTech}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* 2. Emergency Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="phone-call" size={18} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          </View>
          {emergencyContacts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No emergency contacts added yet.</Text>
            </View>
          ) : (
            emergencyContacts.map((c, index) => (
              <View key={index} style={[styles.card, styles.contactCard]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.contactHeader}>
                    <Text style={styles.contactName}>{c.name}</Text>
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityBadgeText}>PRIORITY {c.priority}</Text>
                    </View>
                  </View>
                  <Text style={styles.contactRel}>{c.relationship}</Text>
                  <Text style={styles.contactPhone}>📞 {c.phone}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 3. Care Circle Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="users" size={18} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Care Circle</Text>
          </View>
          <View style={styles.card}>
            {/* Caregivers */}
            <Text style={styles.subLabel}>Caregivers</Text>
            {caregivers.length === 0 ? (
              <Text style={styles.emptySubText}>No caregiver assigned yet.</Text>
            ) : (
              caregivers.map((cg, index) => (
                <View key={index} style={styles.circleMemberRow}>
                  {cg.photo_url ? (
                    <Image source={{ uri: cg.photo_url }} style={styles.memberAvatar} />
                  ) : (
                    <View style={styles.memberAvatarPlaceholder}>
                      <Text style={styles.memberAvatarText}>{cg.name[0]?.toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.memberName}>{cg.name}</Text>
                    <Text style={styles.memberRel}>Primary Caregiver</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Active</Text>
                  </View>
                </View>
              ))
            )}

            <View style={[styles.divider, { marginVertical: 12 }]} />

            {/* Family */}
            <Text style={styles.subLabel}>Family Members</Text>
            {familyMembers.length === 0 ? (
              <Text style={styles.emptySubText}>No family members linked yet.</Text>
            ) : (
              familyMembers.map((fm, index) => (
                <View key={index} style={styles.circleMemberRow}>
                  {fm.photo_url ? (
                    <Image source={{ uri: fm.photo_url }} style={styles.memberAvatar} />
                  ) : (
                    <View style={styles.memberAvatarPlaceholder}>
                      <Text style={styles.memberAvatarText}>{fm.name[0]?.toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.memberName}>{fm.name}</Text>
                    <Text style={styles.memberRel}>{fm.relation_label || 'Family Member'}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#1E40AF' }]}>Linked</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* ROLE SENSITIVE SECTIONS (Only for Caregiver and Family) */}
        {userRole !== 'PATIENT' && (
          <>
            {/* 4. Risk Profile */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="shield" size={18} color={C.primary} style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>Risk Profile</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.riskGrid}>
                  {[
                    { label: 'Fall Risk', val: carePlan?.risk_profile?.fall_risk || latestAssessment?.risk?.fall_risk || 'Low' },
                    { label: 'Wandering', val: carePlan?.risk_profile?.wandering_risk || latestAssessment?.risk?.wandering_risk || 'Low' },
                    { label: 'Medication', val: carePlan?.risk_profile?.medication_adherence_risk || latestAssessment?.risk?.medication_adherence_risk || 'Low' },
                    { label: 'Emergency', val: carePlan?.risk_profile?.emergency_risk || latestAssessment?.risk?.emergency_risk || 'Low' },
                  ].map((r, i) => {
                    const colors = getRiskColor(r.val as any);
                    return (
                      <View key={i} style={[styles.riskItem, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                        <Text style={styles.riskLabel}>{r.label}</Text>
                        <Text style={[styles.riskVal, { color: colors.text }]}>{r.val}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* 5. Care Plan & Goals */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="activity" size={18} color={C.primary} style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>Care Plan & Goals</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.subLabel}>Care Goals</Text>
                <Text style={styles.carePlanText}>{carePlan?.care_goals || 'No custom care plan goals created yet.'}</Text>

                <View style={[styles.divider, { marginVertical: 12 }]} />

                <Text style={styles.subLabel}>Monitoring Requirements</Text>
                <Text style={styles.carePlanText}>{carePlan?.monitoring_requirements || 'GPS tracking active.'}</Text>
              </View>
            </View>

            {/* 6. Cognitive & Safety Assessment Details */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="clipboard" size={18} color={C.primary} style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>Assessment Details</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.subLabel}>Cognitive Status</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.gridLabel}>Memory Concerns</Text>
                  <Text style={styles.gridValue}>{latestAssessment?.cognitive?.memory_concerns || 'None'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.gridLabel}>Orientation concerns</Text>
                  <Text style={styles.gridValue}>{latestAssessment?.cognitive?.orientation_concerns || 'Oriented'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.gridLabel}>Confusion Frequency</Text>
                  <Text style={styles.gridValue}>{latestAssessment?.cognitive?.confusion_frequency || 'Never'}</Text>
                </View>

                <View style={[styles.divider, { marginVertical: 12 }]} />

                <Text style={styles.subLabel}>Required Reminders</Text>
                <View style={styles.remindersList}>
                  {latestAssessment?.support_needs &&
                    Object.entries(latestAssessment.support_needs)
                      .filter(([_, val]) => !!val)
                      .map(([key, _]) => (
                        <View key={key} style={styles.reminderItem}>
                          <Feather name="check" size={14} color={C.primary} style={{ marginRight: 6 }} />
                          <Text style={styles.reminderText}>
                            {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </Text>
                        </View>
                      ))}
                  {(!latestAssessment?.support_needs ||
                    Object.values(latestAssessment.support_needs).every(v => !v)) && (
                    <Text style={styles.emptySubText}>No reminders required.</Text>
                  )}
                </View>

                {/* Direct Observations (only fully accessible if caregiver) */}
                {latestAssessment?.notes?.observations && (
                  <>
                    <View style={[styles.divider, { marginVertical: 12 }]} />
                    <Text style={styles.subLabel}>Direct Observations</Text>
                    <Text style={styles.carePlanText}>{latestAssessment.notes.observations}</Text>
                  </>
                )}

                {/* Recommendations */}
                {latestAssessment?.notes?.recommendations && (
                  <>
                    <View style={[styles.divider, { marginVertical: 12 }]} />
                    <Text style={styles.subLabel}>Recommendations</Text>
                    <Text style={styles.carePlanText}>{latestAssessment.notes.recommendations}</Text>
                  </>
                )}
              </View>
            </View>

            {/* 7. Assessment History */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="list" size={18} color={C.primary} style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>Assessment History</Text>
              </View>
              {history.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No assessment history recorded.</Text>
                </View>
              ) : (
                <View style={styles.card}>
                  {history.map((hist, index) => (
                    <View key={hist.id}>
                      {index > 0 && <View style={[styles.divider, { marginVertical: 10 }]} />}
                      <Pressable
                        onPress={() => handleHistoryItemPress(hist.id)}
                        style={({ pressed }) => [styles.historyRow, pressed && { opacity: 0.7 }]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyTitle}>Version {hist.version || 1}</Text>
                          <Text style={styles.historyDate}>Completed: {formatDate(hist.created_at)}</Text>
                        </View>
                        <View style={styles.historyBadge}>
                          <Text style={styles.historyBadgeText}>{hist.status}</Text>
                        </View>
                        <Feather name="chevron-right" size={16} color={C.textMuted} style={{ marginLeft: 8 }} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* 8. Caregiver Specific Action Buttons */}
        {userRole === 'CAREGIVER' && (
          <View style={styles.actionsContainer}>
            <Pressable
              style={({ pressed }) => [styles.primaryActionBtn, pressed && { opacity: 0.88 }]}
              onPress={() => navigation.navigate('CaregiverAssessmentScreen', { patientId, patientName: displayName })}
            >
              <Feather name="edit" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionText}>Update Assessment Wizard</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryActionBtn, pressed && { opacity: 0.88 }]}
              onPress={() => navigation.navigate('CaregiverCareCircleScreen', { patientId, patientName: displayName })}
            >
              <Feather name="users" size={16} color={C.textPrimary} style={{ marginRight: 8 }} />
              <Text style={styles.secondaryActionText}>Manage Care Circle & Invites</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Assessment History Details Modal */}
      <Modal
        visible={historyModalVisible}
        animationType="slide"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <ScreenContainer edges={['top', 'bottom']} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assessment Version {selectedHistoryAssessment?.version}</Text>
            <Pressable onPress={() => setHistoryModalVisible(false)} style={styles.closeBtn}>
              <Feather name="x" size={24} color={C.textPrimary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {selectedHistoryAssessment && (
              <>
                <View style={styles.section}>
                  <Text style={styles.subLabel}>Basic Information</Text>
                  <View style={styles.card}>
                    <Text style={styles.modalItem}>Preferred Name: {selectedHistoryAssessment.patient_basics?.preferred_name}</Text>
                    <Text style={styles.modalItem}>Address: {selectedHistoryAssessment.patient_basics?.address}</Text>
                    <Text style={styles.modalItem}>Living Arrangement: {selectedHistoryAssessment.patient_basics?.living_arrangement}</Text>
                    <Text style={styles.modalItem}>Language: {selectedHistoryAssessment.patient_basics?.primary_language}</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.subLabel}>Emergency Contacts</Text>
                  {selectedHistoryAssessment.emergency_contacts?.map((c, i) => (
                    <View key={i} style={[styles.card, { marginBottom: 8 }]}>
                      <Text style={styles.contactName}>{c.name} ({c.relationship})</Text>
                      <Text style={styles.contactPhone}>📞 {c.phone} (Priority {c.priority})</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={styles.subLabel}>Cognitive Assessment</Text>
                  <View style={styles.card}>
                    <Text style={styles.modalItem}>Memory Concerns: {selectedHistoryAssessment.cognitive?.memory_concerns}</Text>
                    <Text style={styles.modalItem}>Orientation: {selectedHistoryAssessment.cognitive?.orientation_concerns}</Text>
                    <Text style={styles.modalItem}>Confusion Frequency: {selectedHistoryAssessment.cognitive?.confusion_frequency}</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.subLabel}>Risk Ratings</Text>
                  <View style={styles.card}>
                    <Text style={styles.modalItem}>Fall Risk: {selectedHistoryAssessment.risk?.fall_risk}</Text>
                    <Text style={styles.modalItem}>Wandering Risk: {selectedHistoryAssessment.risk?.wandering_risk}</Text>
                    <Text style={styles.modalItem}>Medication Adherence Risk: {selectedHistoryAssessment.risk?.medication_adherence_risk}</Text>
                    <Text style={styles.modalItem}>Emergency Risk: {selectedHistoryAssessment.risk?.emergency_risk}</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.subLabel}>Mobility & Tech Comfort</Text>
                  <View style={styles.card}>
                    <Text style={styles.modalItem}>Mobility Tier: {selectedHistoryAssessment.mobility}</Text>
                    <Text style={styles.modalItem}>Tech Comfort: {selectedHistoryAssessment.tech_comfort}</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.subLabel}>Observations & Recommendations</Text>
                  <View style={styles.card}>
                    <Text style={styles.subLabel}>Observations</Text>
                    <Text style={styles.carePlanText}>{selectedHistoryAssessment.notes?.observations || '—'}</Text>
                    <View style={[styles.divider, { marginVertical: 10 }]} />
                    <Text style={styles.subLabel}>Recommendations</Text>
                    <Text style={styles.carePlanText}>{selectedHistoryAssessment.notes?.recommendations || '—'}</Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F6',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: F.medium,
    fontSize: 15,
    color: C.textSecondary,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: F.bold,
    color: C.textPrimary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
  },
  heroAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: C.primaryLight,
  },
  heroAvatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  heroAvatarText: {
    fontSize: 36,
    fontFamily: F.bold,
    color: C.primary,
  },
  heroName: {
    fontSize: 22,
    fontFamily: F.extraBold,
    color: C.textPrimary,
    marginTop: 12,
  },
  roleBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  roleBadgeText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.primary,
    letterSpacing: 0.5,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: F.bold,
    color: C.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  gridValue: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subLabel: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.primary,
    marginBottom: 6,
  },
  emptySubText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textMuted,
    fontStyle: 'italic',
  },
  contactCard: {
    marginBottom: 10,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 15,
    fontFamily: F.bold,
    color: C.textPrimary,
  },
  priorityBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontFamily: F.bold,
    fontSize: 9,
    color: '#D97706',
  },
  contactRel: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 4,
  },
  contactPhone: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.primary,
  },
  circleMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  memberAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.primary,
  },
  memberName: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.textPrimary,
  },
  memberRel: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#065F46',
  },
  riskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  riskItem: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  riskLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#374151',
    marginBottom: 2,
  },
  riskVal: {
    fontFamily: F.extraBold,
    fontSize: 15,
  },
  carePlanText: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textPrimary,
    lineHeight: 20,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
  },
  remindersList: {
    gap: 6,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textPrimary,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.textPrimary,
  },
  historyDate: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  historyBadge: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.primary,
  },
  actionsContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  primaryActionBtn: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryActionText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  secondaryActionText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.textPrimary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F4F7F6',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: F.bold,
    color: C.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingBottom: 40,
  },
  modalItem: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textPrimary,
    marginVertical: 4,
  },
});
