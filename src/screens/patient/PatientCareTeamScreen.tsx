import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { useAuth } from '../../hooks/useAuth';
import { useCaregiver } from '../../hooks/useCaregiver';
import { formatDate } from '../../utils/dateUtils';
import {
  endCareRelationship,
  fetchCareRelationshipHistory,
  fetchPendingResignations,
  acceptCaregiverResignation,
  declineCaregiverResignation,
  type CareRelationshipEndReason,
  type CareRelationshipHistoryItem,
  type CaregiverResignationRecord,
  type CaregiverResignationReason,
} from '../../services/relationshipService';
import type { CaregiverListing } from './CaregiverSearchView';
import type { PatientStackParams } from '../../types/navigation.types';

type NavigationProp = NativeStackNavigationProp<PatientStackParams>;

const END_REASON_OPTIONS: { reason: CareRelationshipEndReason; label: string; desc: string }[] = [
  {
    reason: 'CARE_NO_LONGER_REQUIRED',
    label: 'Care No Longer Required',
    desc: 'Patient care needs have reduced or concluded',
  },
  {
    reason: 'FAMILY_TAKING_OVER',
    label: 'Family Taking Over Care',
    desc: 'Family members will handle daily care routines',
  },
  {
    reason: 'FOUND_DIFFERENT_CARE',
    label: 'Found Different Care Provider',
    desc: 'Transitioning to another caregiver or facility',
  },
  {
    reason: 'CAREGIVER_NOT_A_GOOD_FIT',
    label: 'Not a Good Fit',
    desc: 'Compatibility or care style mismatch',
  },
  {
    reason: 'SCHEDULE_CHANGED',
    label: 'Schedule Changed',
    desc: 'Timing, shift, or availability conflict',
  },
  {
    reason: 'CAREGIVER_REQUESTED_END',
    label: 'Caregiver Requested End',
    desc: 'Arrangement concluded at caregiver request',
  },
  {
    reason: 'OTHER',
    label: 'Other Reason',
    desc: 'Other circumstances (specify in notes below)',
  },
];

const RESIGNATION_REASON_LABELS: Record<CaregiverResignationReason, string> = {
  PERSONAL_CIRCUMSTANCES: 'Personal Circumstances',
  SCHEDULE_CONFLICT: 'Schedule Conflict',
  OUTSIDE_SERVICE_AREA: 'Outside Service Area',
  CARE_NEEDS_CHANGED: 'Care Needs Changed',
  CAPACITY_CONSTRAINT: 'Capacity Constraint',
  ROLE_NO_LONGER_SUITABLE: 'Role No Longer Suitable',
  OTHER: 'Other Reason',
};

export const PatientCareTeamScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const { user, careContext } = useAuth();
  const { caregivers, loading, reloadCaregivers } = useCaregiver();

  // Care History state
  const [careHistory, setCareHistory] = useState<CareRelationshipHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Caregiver Resignations state
  const [pendingResignations, setPendingResignations] = useState<CaregiverResignationRecord[]>([]);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [selectedResignationForReview, setSelectedResignationForReview] = useState<CaregiverResignationRecord | null>(null);
  const [selectedCaregiverForReview, setSelectedCaregiverForReview] = useState<CaregiverListing | null>(null);
  const [declineNotes, setDeclineNotes] = useState('');
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  const [submittingResignationAction, setSubmittingResignationAction] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // End Care Modal state
  const [isEndModalVisible, setIsEndModalVisible] = useState(false);
  const [selectedCaregiverForEnd, setSelectedCaregiverForEnd] = useState<CaregiverListing | null>(null);
  const [selectedReason, setSelectedReason] = useState<CareRelationshipEndReason>('CARE_NO_LONGER_REQUIRED');
  const [endNotes, setEndNotes] = useState('');
  const [submittingEnd, setSubmittingEnd] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);

  // Determine if patient is family-managed or self-created
  const onboardingSource = careContext?.profiles?.patientOnboardingSource;
  const isFamilyManaged = onboardingSource === 'FAMILY';

  const loadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const history = await fetchCareRelationshipHistory();
      setCareHistory(history);
    } catch (err) {
      console.warn('[PatientCareTeamScreen] Error loading care history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const loadPendingResignations = useCallback(async () => {
    try {
      const list = await fetchPendingResignations();
      setPendingResignations(list);
    } catch (err) {
      console.warn('[PatientCareTeamScreen] Error loading pending resignations:', err);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      void reloadCaregivers(true);
      void loadHistory();
      void loadPendingResignations();
    }
  }, [isFocused, reloadCaregivers, loadHistory, loadPendingResignations]);

  const onRefresh = useCallback(async () => {
    await Promise.all([
      reloadCaregivers(true),
      loadHistory(),
      loadPendingResignations(),
    ]);
  }, [reloadCaregivers, loadHistory, loadPendingResignations]);

  const handleOpenReviewModal = (resignation: CaregiverResignationRecord, caregiver?: CaregiverListing) => {
    setSelectedResignationForReview(resignation);
    setSelectedCaregiverForReview(caregiver || caregivers.find(c => c.id === resignation.caregiver_id) || null);
    setShowDeclineInput(false);
    setDeclineNotes('');
    setReviewError(null);
    setIsReviewModalVisible(true);
  };

  const handleCloseReviewModal = () => {
    if (submittingResignationAction) return;
    setIsReviewModalVisible(false);
    setSelectedResignationForReview(null);
    setSelectedCaregiverForReview(null);
    setShowDeclineInput(false);
    setDeclineNotes('');
    setReviewError(null);
  };

  const handleAcceptResignation = async () => {
    if (!selectedResignationForReview) return;
    try {
      setSubmittingResignationAction(true);
      setReviewError(null);
      await acceptCaregiverResignation(selectedResignationForReview.relationship_id);
      setIsReviewModalVisible(false);
      setSelectedResignationForReview(null);
      setSelectedCaregiverForReview(null);
      await Promise.all([
        reloadCaregivers(true),
        loadHistory(),
        loadPendingResignations(),
      ]);
      Alert.alert(
        'Care Relationship Ended',
        'You have accepted the caregiver\'s resignation. The relationship has ended, and caregiver access has been revoked.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('[PatientCareTeamScreen] Failed to accept resignation:', error);
      const msg = error?.response?.data?.message || 'Failed to accept resignation. Please try again.';
      setReviewError(msg);
    } finally {
      setSubmittingResignationAction(false);
    }
  };

  const handleDeclineResignation = async () => {
    if (!selectedResignationForReview) return;
    if (!showDeclineInput) {
      setShowDeclineInput(true);
      return;
    }
    try {
      setSubmittingResignationAction(true);
      await declineCaregiverResignation(
        selectedResignationForReview.relationship_id,
        declineNotes.trim() || undefined,
      );
      setIsReviewModalVisible(false);
      setSelectedResignationForReview(null);
      setSelectedCaregiverForReview(null);
      setShowDeclineInput(false);
      setDeclineNotes('');
      await loadPendingResignations();
      Alert.alert(
        'Resignation Declined',
        'The resignation request has been declined. The caregiver has been notified to continue scheduled care duties.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('[PatientCareTeamScreen] Failed to decline resignation:', error);
      const msg = error?.response?.data?.message || 'Failed to decline resignation. Please try again.';
      setReviewError(msg);
    } finally {
      setSubmittingResignationAction(false);
    }
  };

  const handleFindCare = () => {
    navigation.navigate('CareDiscoveryScreen');
  };

  const handleViewProfile = (caregiver: CaregiverListing) => {
    navigation.navigate('CaregiverProfileScreen', { caregiver });
  };

  const handleOpenEndModal = (caregiver: CaregiverListing) => {
    setSelectedCaregiverForEnd(caregiver);
    setSelectedReason('CARE_NO_LONGER_REQUIRED');
    setEndNotes('');
    setEndError(null);
    setIsEndModalVisible(true);
  };

  const handleCloseEndModal = () => {
    if (submittingEnd) return;
    setIsEndModalVisible(false);
    setSelectedCaregiverForEnd(null);
    setEndNotes('');
    setEndError(null);
  };

  const handleConfirmEndCare = async () => {
    if (!selectedCaregiverForEnd) return;
    const relId = selectedCaregiverForEnd.relationshipId || selectedCaregiverForEnd.relationship_id;
    if (!relId) {
      setEndError('Relationship identifier not found for this caregiver.');
      return;
    }

    try {
      setSubmittingEnd(true);
      setEndError(null);
      await endCareRelationship(relId, {
        reason: selectedReason,
        notes: endNotes.trim() || undefined,
      });

      setIsEndModalVisible(false);
      setSelectedCaregiverForEnd(null);
      setEndNotes('');
      // Reload both active caregivers and history
      await Promise.all([
        reloadCaregivers(true),
        loadHistory(),
      ]);
      Alert.alert(
        'Care Relationship Ended',
        'The care arrangement has been ended. Caregiver access to real-time care data and telemetry has been revoked.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('[PatientCareTeamScreen] Failed to end care:', error);
      const message = error?.response?.data?.message || 'Failed to end care relationship. Please try again.';
      setEndError(message);
    } finally {
      setSubmittingEnd(false);
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[C.primary]} tintColor={C.primary} />
        }
      >
        {/* -- Header --------------------------------------------------- */}
        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerOverline}>CARE TEAM</Text>
            <Text style={styles.headerTitle}>Your Care Team</Text>
          </View>
          {isFamilyManaged && (
            <View style={styles.familyManagedBadge}>
              <Ionicons name="people" size={13} color="#065F46" style={{ marginRight: 4 }} />
              <Text style={styles.familyManagedBadgeText}>Family Managed</Text>
            </View>
          )}
        </View>

        {/* Care Requests / Inquiries Banner */}
        <Pressable
          style={styles.inquiriesBanner}
          onPress={() => navigation.navigate('CareRequestsListScreen')}
        >
          <View style={styles.inquiriesBannerLeft}>
            <View style={styles.inquiriesIconWrap}>
              <Ionicons name="document-text-outline" size={20} color={C.primary} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.inquiriesTitle}>Care Inquiries & Proposals</Text>
              <Text style={styles.inquiriesSubtitle}>Track the status of your care requests</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.textSecondary} />
        </Pressable>

        {/* Pending Resignation Alert Banner */}
        {pendingResignations.length > 0 && (
          <View style={styles.resignationAlertBanner}>
            <View style={styles.resignationAlertLeft}>
              <View style={styles.resignationAlertIconWrap}>
                <Ionicons name="alert-circle" size={22} color="#B45309" />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.resignationAlertTitle}>
                  {pendingResignations.length === 1 ? 'Caregiver Resignation Request' : `${pendingResignations.length} Resignation Requests`}
                </Text>
                <Text style={styles.resignationAlertSubtitle}>
                  A caregiver has submitted a request to end care. Review the handover.
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.resignationAlertBtn, pressed && { opacity: 0.8 }]}
              onPress={() => handleOpenReviewModal(pendingResignations[0])}
            >
              <Text style={styles.resignationAlertBtnText}>Review</Text>
            </Pressable>
          </View>
        )}

        {/* -- Content States ------------------------------------------- */}
        {loading && caregivers.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>Loading your care team...</Text>
          </View>
        ) : caregivers.length === 0 ? (
          isFamilyManaged ? (
            /* STATE A: Family-Managed Patient, No Professional Caregiver */
            <View style={styles.emptyCard}>
              <View style={styles.iconCircleTeal}>
                <Ionicons name="people-circle-outline" size={40} color={C.primary} />
              </View>
              <Text style={styles.emptyTitle}>Your family is managing professional care for you.</Text>
              <Text style={styles.emptyDescription}>
                Family members can search, request, and coordinate professional caregivers on your behalf.
              </Text>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color={C.primary} style={{ marginTop: 1 }} />
                <Text style={styles.infoBoxText}>
                  No action is needed from you. Any connected caregivers arranged by your family will automatically appear here.
                </Text>
              </View>
            </View>
          ) : (
            /* STATE B: Self-Created Patient, No Professional Caregiver */
            <View style={styles.emptyCard}>
              <View style={styles.iconCircleTeal}>
                <Ionicons name="people-outline" size={38} color={C.primary} />
              </View>
              <Text style={styles.emptyTitle}>You don't have a professional caregiver yet.</Text>
              <Text style={styles.emptyDescription}>
                Connect with professional caregivers to assist with daily routines, health check-ins, and companion care.
              </Text>

              <Pressable
                onPress={handleFindCare}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Ionicons name="search" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Find Care</Text>
              </Pressable>
            </View>
          )
        ) : (
          /* STATE C: Patient with Connected Caregiver(s) */
          <View style={styles.teamContainer}>
            {isFamilyManaged ? (
              <View style={styles.subtleNoticeBanner}>
                <Ionicons name="heart" size={15} color={C.primary} style={{ marginRight: 6 }} />
                <Text style={styles.subtleNoticeText}>
                  Your professional care is actively coordinated by your family.
                </Text>
              </View>
            ) : (
              <View style={styles.teamHeaderRow}>
                <Text style={styles.sectionSubtitle}>
                  {caregivers.length === 1 ? '1 Connected Caregiver' : `${caregivers.length} Connected Caregivers`}
                </Text>
                <Pressable
                  onPress={handleFindCare}
                  style={({ pressed }) => [
                    styles.secondaryAddBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Ionicons name="add" size={16} color={C.primary} />
                  <Text style={styles.secondaryAddBtnText}>Find Care</Text>
                </Pressable>
              </View>
            )}

            {caregivers.map((cg) => {
              const roleTitle = cg.professional_role || cg.specialty || 'Professional Caregiver';
              const isPending = cg.status === 'PENDING';
              const matchingResignation = pendingResignations.find(
                (r) => r.caregiver_id === cg.id ||
                  (cg.relationshipId && r.relationship_id === cg.relationshipId) ||
                  (cg.relationship_id && r.relationship_id === cg.relationship_id)
              );

              return (
                <View key={cg.id} style={styles.caregiverCard}>
                  {matchingResignation && (
                    <View style={styles.resignationBadgeRow}>
                      <Ionicons name="time" size={13} color="#92400E" style={{ marginRight: 4 }} />
                      <Text style={styles.resignationBadgeText}>Caregiver Requested to End Care</Text>
                    </View>
                  )}
                  {isPending && !matchingResignation && (
                    <View style={styles.pendingBadgeRow}>
                      <Ionicons name="time-outline" size={13} color="#92400E" style={{ marginRight: 4 }} />
                      <Text style={styles.pendingBadgeText}>Request Pending Confirmation</Text>
                    </View>
                  )}

                  <View style={styles.caregiverHeaderRow}>
                    <View style={styles.avatarWrap}>
                      {cg.profile_photo_url ? (
                        <Image source={{ uri: cg.profile_photo_url }} style={styles.avatarImage} />
                      ) : (
                        <Ionicons name="person-circle" size={54} color={C.primary} />
                      )}
                    </View>

                    <View style={styles.caregiverMeta}>
                      <Text style={styles.caregiverName}>{cg.name}</Text>
                      <Text style={styles.caregiverRole}>{roleTitle}</Text>

                      <View style={styles.caregiverStatsRow}>
                        {cg.years_experience != null && (
                          <View style={styles.statPill}>
                            <Ionicons name="briefcase-outline" size={12} color={C.textSecondary} style={{ marginRight: 3 }} />
                            <Text style={styles.statPillText}>{cg.years_experience} yrs exp</Text>
                          </View>
                        )}
                        {cg.rating != null && cg.rating > 0 && (
                          <View style={styles.statPill}>
                            <Ionicons name="star" size={12} color="#F59E0B" style={{ marginRight: 3 }} />
                            <Text style={styles.statPillText}>{cg.rating.toFixed(1)}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {cg.bio ? (
                    <Text style={styles.caregiverBio} numberOfLines={2}>
                      {cg.bio}
                    </Text>
                  ) : null}

                  <View style={styles.cardActionsRow}>
                    {matchingResignation ? (
                      <Pressable
                        onPress={() => handleOpenReviewModal(matchingResignation, cg)}
                        style={({ pressed }) => [
                          styles.reviewResignationBtn,
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <Ionicons name="alert-circle-outline" size={15} color="#B45309" style={{ marginRight: 4 }} />
                        <Text style={styles.reviewResignationBtnText}>Review Request</Text>
                      </Pressable>
                    ) : (
                      !isPending && Boolean(cg.relationshipId || cg.relationship_id) && (
                        <Pressable
                          onPress={() => handleOpenEndModal(cg)}
                          style={({ pressed }) => [
                            styles.endCareBtn,
                            pressed && { opacity: 0.7 },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`End care with ${cg.name}`}
                        >
                          <Ionicons name="close-circle-outline" size={15} color="#DC2626" style={{ marginRight: 4 }} />
                          <Text style={styles.endCareBtnText}>End Care</Text>
                        </Pressable>
                      )
                    )}
                    <Pressable
                      onPress={() => handleViewProfile(cg)}
                      style={({ pressed }) => [
                        styles.viewProfileBtn,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Text style={styles.viewProfileBtnText}>View Profile</Text>
                      <Ionicons name="chevron-forward" size={16} color={C.primary} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* -- Care History Section ------------------------------------ */}
        {careHistory.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.historyHeaderRow}>
              <View style={styles.historyHeaderTitleWrap}>
                <Ionicons name="time-outline" size={18} color={C.textPrimary} style={{ marginRight: 6 }} />
                <Text style={styles.historySectionTitle}>Care History</Text>
              </View>
              <View style={styles.historyCountBadge}>
                <Text style={styles.historyCountBadgeText}>{careHistory.length}</Text>
              </View>
            </View>
            <Text style={styles.historySubtitle}>
              Past care relationships and ended arrangements
            </Text>

            <View style={styles.historyList}>
              {careHistory.map((item) => {
                const formattedDate = item.ended_at ? formatDate(item.ended_at) : 'Ended';
                const reasonLabel = item.end_reason
                  ? END_REASON_OPTIONS.find((o) => o.reason === item.end_reason)?.label || item.end_reason
                  : 'Relationship Ended';

                return (
                  <View key={item.relationship_id || item.id} style={styles.historyCard}>
                    <View style={styles.historyCardTop}>
                      <View style={styles.avatarWrapSmall}>
                        {item.photo_url ? (
                          <Image source={{ uri: item.photo_url }} style={styles.avatarSmall} />
                        ) : (
                          <Ionicons name="person-circle" size={44} color="#94A3B8" />
                        )}
                      </View>
                      <View style={styles.historyMeta}>
                        <View style={styles.historyNameRow}>
                          <Text style={styles.historyName}>{item.name}</Text>
                          <View style={styles.endedStatusPill}>
                            <Text style={styles.endedStatusText}>Ended</Text>
                          </View>
                        </View>
                        <Text style={styles.historyRole}>
                          {item.professional_role || 'Professional Caregiver'}
                        </Text>
                        <Text style={styles.historyEndedDate}>
                          Concluded on {formattedDate}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.historyReasonRow}>
                      <Text style={styles.historyReasonLabel}>Reason:</Text>
                      <View style={styles.reasonBadge}>
                        <Text style={styles.reasonBadgeText}>{reasonLabel}</Text>
                      </View>
                    </View>

                    {item.end_notes ? (
                      <View style={styles.historyNotesWrap}>
                        <Ionicons name="document-text-outline" size={13} color={C.textSecondary} style={{ marginTop: 2, marginRight: 6 }} />
                        <Text style={styles.historyNotesText} numberOfLines={3}>
                          "{item.end_notes}"
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* -- End Care Modal ------------------------------------------- */}
      <Modal
        visible={isEndModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseEndModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleCloseEndModal} />
          <View style={styles.modalSheet}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrapDestructive}>
                <Ionicons name="warning-outline" size={24} color="#DC2626" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalTitle}>End Care Relationship</Text>
                <Text style={styles.modalSubtitle}>
                  Ending care with {selectedCaregiverForEnd?.name}
                </Text>
              </View>
              <Pressable
                onPress={handleCloseEndModal}
                disabled={submittingEnd}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={C.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalWarningBox}>
                <Ionicons name="shield-outline" size={16} color="#B91C1C" style={{ marginTop: 2 }} />
                <Text style={styles.modalWarningText}>
                  Ending this relationship will immediately revoke {selectedCaregiverForEnd?.name}'s access to care plans, real-time routines, GPS tracking, and patient alerts. This action cannot be undone.
                </Text>
              </View>

              {endError && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorBoxText}>{endError}</Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>Select Reason for Ending Care</Text>
              <View style={styles.reasonRadioGroup}>
                {END_REASON_OPTIONS.map((opt) => {
                  const isSelected = selectedReason === opt.reason;
                  return (
                    <Pressable
                      key={opt.reason}
                      style={[
                        styles.reasonRadioItem,
                        isSelected && styles.reasonRadioItemSelected,
                      ]}
                      onPress={() => setSelectedReason(opt.reason)}
                      disabled={submittingEnd}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <View style={styles.reasonRadioTextWrap}>
                        <Text style={[styles.reasonRadioTitle, isSelected && styles.reasonRadioTitleSelected]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.reasonRadioDesc}>{opt.desc}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Additional Notes (Optional)</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Share details, handover notes, or feedback (max 500 characters)..."
                  placeholderTextColor={C.textMuted || '#94A3B8'}
                  value={endNotes}
                  onChangeText={(text) => {
                    if (text.length <= 500) {
                      setEndNotes(text);
                    }
                  }}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  editable={!submittingEnd}
                />
                <Text style={styles.charCountText}>{endNotes.length}/500</Text>
              </View>

              <View style={styles.modalActionsRow}>
                <Pressable
                  style={[styles.cancelBtn, submittingEnd && { opacity: 0.5 }]}
                  onPress={handleCloseEndModal}
                  disabled={submittingEnd}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[styles.confirmEndBtn, submittingEnd && { opacity: 0.6 }]}
                  onPress={handleConfirmEndCare}
                  disabled={submittingEnd}
                >
                  {submittingEnd ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.confirmEndBtnText}>Confirm End Care</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* -- Review Resignation Modal ------------------------------------------- */}
      <Modal
        visible={isReviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseReviewModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleCloseReviewModal} />
          <View style={styles.modalSheet}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrapDestructive, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="document-text-outline" size={24} color="#B45309" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalTitle}>Caregiver Resignation</Text>
                <Text style={styles.modalSubtitle}>
                  Request from {selectedCaregiverForReview?.name || 'Caregiver'}
                </Text>
              </View>
              <Pressable
                onPress={handleCloseReviewModal}
                disabled={submittingResignationAction}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={C.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[styles.modalWarningBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                <Ionicons name="information-circle-outline" size={16} color="#B45309" style={{ marginTop: 2 }} />
                <Text style={[styles.modalWarningText, { color: '#78350F' }]}>
                  The caregiver has requested to conclude this care arrangement. Accepting will end care and revoke their access to real-time data. You can decline if handover timing needs adjustment.
                </Text>
              </View>

              {reviewError && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.errorBoxText}>{reviewError}</Text>
                </View>
              )}

              {selectedResignationForReview && (
                <View style={styles.resignationDetailsCard}>
                  <Text style={styles.fieldLabel}>STATED REASON</Text>
                  <Text style={styles.resignationReasonValue}>
                    {RESIGNATION_REASON_LABELS[selectedResignationForReview.reason] || selectedResignationForReview.reason}
                  </Text>

                  {selectedResignationForReview.notes ? (
                    <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border }}>
                      <Text style={styles.fieldLabel}>CAREGIVER HANDOVER NOTES</Text>
                      <Text style={styles.resignationNotesText}>
                        "{selectedResignationForReview.notes}"
                      </Text>
                    </View>
                  ) : null}

                  <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border }}>
                    <Text style={styles.fieldLabel}>DATE SUBMITTED</Text>
                    <Text style={styles.resignationMetaText}>
                      {formatDate(selectedResignationForReview.requested_at)}
                    </Text>
                  </View>
                </View>
              )}

              {showDeclineInput && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.fieldLabel}>Decline Reason / Handover Message (Optional)</Text>
                  <View style={styles.textAreaContainer}>
                    <TextInput
                      style={styles.textArea}
                      placeholder="Explain why resigning cannot proceed yet (e.g. need handover period)..."
                      placeholderTextColor={C.textMuted || '#94A3B8'}
                      value={declineNotes}
                      onChangeText={setDeclineNotes}
                      multiline
                      numberOfLines={3}
                      maxLength={500}
                      editable={!submittingResignationAction}
                    />
                    <Text style={styles.charCountText}>{declineNotes.length}/500</Text>
                  </View>
                </View>
              )}

              <View style={[styles.modalActionsRow, { marginTop: 20 }]}>
                <Pressable
                  style={[
                    styles.declineResignationBtn,
                    submittingResignationAction && { opacity: 0.5 },
                  ]}
                  onPress={handleDeclineResignation}
                  disabled={submittingResignationAction}
                >
                  <Text style={styles.declineResignationBtnText}>
                    {showDeclineInput ? 'Confirm Decline' : 'Decline'}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.acceptResignationBtn,
                    submittingResignationAction && { opacity: 0.6 },
                  ]}
                  onPress={handleAcceptResignation}
                  disabled={submittingResignationAction}
                >
                  {submittingResignationAction ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.acceptResignationBtnText}>Accept End Care</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 96,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  headerOverline: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 24,
    color: C.textPrimary,
    marginTop: 2,
  },
  inquiriesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  inquiriesBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inquiriesIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inquiriesTitle: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: C.textPrimary,
  },
  inquiriesSubtitle: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  familyManagedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  familyManagedBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 11,
    color: '#065F46',
  },
  loadingContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    alignItems: 'center',
  },
  iconCircleTeal: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: C.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  emptyDescription: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  infoBoxText: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 12.5,
    color: '#166534',
    lineHeight: 18,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    shadowColor: C.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  teamContainer: {
    gap: 12,
  },
  subtleNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 4,
  },
  subtleNoticeText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#166534',
    flex: 1,
  },
  teamHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  sectionSubtitle: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: C.textSecondary,
  },
  secondaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  secondaryAddBtnText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.primary,
  },
  caregiverCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  pendingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  pendingBadgeText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#92400E',
  },
  caregiverHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  caregiverMeta: {
    flex: 1,
  },
  caregiverName: {
    fontFamily: F.bold,
    fontSize: 17,
    color: C.textPrimary,
  },
  caregiverRole: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 1,
  },
  caregiverStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statPillText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.textSecondary,
  },
  caregiverBio: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
    marginTop: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewProfileBtnText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.primary,
  },
  endCareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginRight: 'auto',
  },
  endCareBtnText: {
    fontFamily: F.semiBold,
    fontSize: 12.5,
    color: '#DC2626',
  },
  historySection: {
    marginTop: 24,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historySectionTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.textPrimary,
  },
  historyCountBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyCountBadgeText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.textSecondary,
  },
  historySubtitle: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 12,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  historyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  historyMeta: {
    flex: 1,
  },
  historyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyName: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
  },
  endedStatusPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  endedStatusText: {
    fontFamily: F.semiBold,
    fontSize: 11,
    color: '#64748B',
  },
  historyRole: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 1,
  },
  historyEndedDate: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  historyReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  historyReasonLabel: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textSecondary,
  },
  reasonBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reasonBadgeText: {
    fontFamily: F.medium,
    fontSize: 11.5,
    color: C.textPrimary,
  },
  historyNotesWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  historyNotesText: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 10,
    elevation: 10,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalIconWrapDestructive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: C.textPrimary,
  },
  modalSubtitle: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  modalWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  modalWarningText: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginBottom: 14,
  },
  errorBoxText: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 12.5,
    color: '#DC2626',
  },
  fieldLabel: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.textPrimary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonRadioGroup: {
    gap: 8,
    marginBottom: 16,
  },
  reasonRadioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  reasonRadioItemSelected: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#DC2626',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  reasonRadioTextWrap: {
    flex: 1,
  },
  reasonRadioTitle: {
    fontFamily: F.semiBold,
    fontSize: 13.5,
    color: C.textPrimary,
  },
  reasonRadioTitleSelected: {
    color: '#991B1B',
  },
  reasonRadioDesc: {
    fontFamily: F.regular,
    fontSize: 11.5,
    color: C.textSecondary,
    marginTop: 2,
  },
  textAreaContainer: {
    marginBottom: 20,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    minHeight: 80,
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textPrimary,
    textAlignVertical: 'top',
  },
  charCountText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: C.textSecondary,
  },
  confirmEndBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  confirmEndBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Resignation alert banner (top)
  resignationAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  resignationAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  resignationAlertIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resignationAlertTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#92400E',
  },
  resignationAlertSubtitle: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16,
  },
  resignationAlertBtn: {
    backgroundColor: '#B45309',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  resignationAlertBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Resignation badge row on caregiver card
  resignationBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  resignationBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: '#92400E',
  },

  // Review Resignation button on card
  reviewResignationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reviewResignationBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#92400E',
  },

  // Resignation review modal details
  resignationDetailsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginTop: 14,
  },
  resignationReasonValue: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
    marginTop: 2,
  },
  resignationNotesText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textPrimary,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 3,
  },
  resignationMetaText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  declineResignationBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineResignationBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.textSecondary,
  },
  acceptResignationBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  acceptResignationBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
