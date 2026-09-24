/**
 * SureStep — src/screens/shared/CareRequestDetailScreen.tsx
 *
 * Detailed View & Decision Surface for Care Requests.
 * Supports:
 *  - Requester (Patient/Family) view: track status, view caregiver details, withdraw pending request
 *  - Caregiver view: privacy-safe triage pre-acceptance (firstName, approxAge, city),
 *    Accept / Decline actions, full disclosure post-acceptance.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type {
  CareRequest,
  CaregiverDeclineReason,
  RequesterWithdrawReason,
} from '../../types/care.types';
import {
  DECLINE_REASON_OPTIONS,
  WITHDRAW_REASON_OPTIONS,
  SHIFT_OPTIONS,
  CAPABILITY_OPTIONS,
} from '../../types/care.types';
import {
  getCareRequestById,
  acceptCareRequest,
  declineCareRequest,
  withdrawCareRequest,
  type CareRequestError,
} from '../../services/careRequestService';

type Props = NativeStackScreenProps<any, 'CareRequestDetailScreen'>;

const DAY_LABELS: Array<{ day: number; label: string }> = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

export const CareRequestDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { requestId, isCaregiverViewer: paramIsCg, onUpdated } = route.params || {};
  const { user } = useAuth();

  const isCaregiverViewer = paramIsCg !== undefined ? paramIsCg : user?.role === 'CAREGIVER';

  const [request, setRequest] = useState<CareRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Decline Modal State (Caregiver)
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [selectedDeclineReason, setSelectedDeclineReason] =
    useState<CaregiverDeclineReason>('SCHEDULE_CONFLICT');
  const [declineNotes, setDeclineNotes] = useState('');

  // Withdraw Modal State (Requester)
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [selectedWithdrawReason, setSelectedWithdrawReason] =
    useState<RequesterWithdrawReason>('FOUND_ALTERNATIVE_CARE');
  const [withdrawNotes, setWithdrawNotes] = useState('');

  // Load Request Details
  const loadDetail = useCallback(async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      setError(null);
      const req = await getCareRequestById(requestId);
      setRequest(req);
    } catch (err: any) {
      console.warn('[CareRequestDetailScreen] Failed to load request:', err);
      setError(err?.message || 'Unable to load care request details');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  // ── Action Handlers ────────────────────────────────────────────────────────

  const handleAccept = async () => {
    if (!request) return;

    Alert.alert(
      'Accept Care Proposal',
      `Accept this care proposal for ${request.patient?.firstName || 'this patient'}?\n\nThis will establish an active Care Relationship and unlock contact details.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Accept',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await acceptCareRequest(request.id);
              setRequest(res.request);
              if (onUpdated) onUpdated();
              Alert.alert(
                'Care Proposal Accepted',
                'You are now connected with the care recipient in your active Care Team.',
              );
            } catch (err: any) {
              const error = err as CareRequestError;
              console.warn('[CareRequestDetailScreen] Accept failed:', error);
              Alert.alert('Unable to Accept', error.message || 'Failed to accept care request.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleConfirmDecline = async () => {
    if (!request) return;
    setDeclineModalVisible(false);
    setActionLoading(true);

    try {
      const res = await declineCareRequest(request.id, {
        declineReason: selectedDeclineReason,
        responseNotes: declineNotes.trim() ? declineNotes.trim() : null,
      });
      setRequest(res.request);
      if (onUpdated) onUpdated();
      Alert.alert('Care Request Declined', 'The requester has been notified.');
    } catch (err: any) {
      const error = err as CareRequestError;
      console.warn('[CareRequestDetailScreen] Decline failed:', error);
      Alert.alert('Unable to Decline', error.message || 'Failed to decline care request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (!request) return;
    setWithdrawModalVisible(false);
    setActionLoading(true);

    try {
      const res = await withdrawCareRequest(request.id, {
        withdrawReason: selectedWithdrawReason,
        responseNotes: withdrawNotes.trim() ? withdrawNotes.trim() : null,
      });
      setRequest(res.request);
      if (onUpdated) onUpdated();
      Alert.alert('Care Request Withdrawn', 'The care inquiry has been cancelled.');
    } catch (err: any) {
      const error = err as CareRequestError;
      console.warn('[CareRequestDetailScreen] Withdraw failed:', error);
      Alert.alert('Unable to Withdraw', error.message || 'Failed to withdraw care request.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Loading care proposal...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !request) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
        <View style={styles.headerNav}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Care Proposal</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={44} color="#EF4444" />
          <Text style={styles.errorTitle}>Proposal Unavailable</Text>
          <Text style={styles.errorSubtitle}>{error || 'Request not found'}</Text>
          <Pressable style={styles.retryBtn} onPress={loadDetail}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const isPending = request.status === 'PENDING';
  const isAccepted = request.status === 'ACCEPTED';
  const isDeclined = request.status === 'DECLINED';
  const isWithdrawn = request.status === 'WITHDRAWN';
  const isExpired = request.status === 'EXPIRED';

  // Format shift labels
  const shiftLabels = (request.requestedShifts || [])
    .map((s) => SHIFT_OPTIONS.find((opt) => opt.id === s)?.label || s)
    .join(', ');

  // Format capability labels
  const capLabels = (request.requestedCapabilities || []).map(
    (c) => CAPABILITY_OPTIONS.find((opt) => opt.id === c)?.label || c,
  );

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {/* Top Header */}
      <View style={styles.headerNav}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.headerTitle}>Care Proposal Detail</Text>
          <Text style={styles.headerSub}>ID: {request.id.slice(0, 8)}...</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View
          style={[
            styles.statusBanner,
            isPending && styles.statusBannerPending,
            isAccepted && styles.statusBannerAccepted,
            isDeclined && styles.statusBannerDeclined,
            isWithdrawn && styles.statusBannerWithdrawn,
            isExpired && styles.statusBannerExpired,
          ]}
        >
          <Ionicons
            name={
              isPending
                ? 'hourglass-outline'
                : isAccepted
                ? 'checkmark-circle'
                : isDeclined
                ? 'close-circle'
                : isWithdrawn
                ? 'remove-circle-outline'
                : 'alert-circle'
            }
            size={20}
            color={
              isPending
                ? '#92400E'
                : isAccepted
                ? '#065F46'
                : isDeclined
                ? '#991B1B'
                : isWithdrawn
                ? '#334155'
                : '#475569'
            }
            style={{ marginRight: 8 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.statusBannerTitle,
                isPending && { color: '#92400E' },
                isAccepted && { color: '#065F46' },
                isDeclined && { color: '#991B1B' },
                isWithdrawn && { color: '#334155' },
                isExpired && { color: '#475569' },
              ]}
            >
              {isPending
                ? 'Proposal Pending Response'
                : isAccepted
                ? 'Care Proposal Accepted'
                : isDeclined
                ? 'Proposal Declined'
                : isWithdrawn
                ? 'Proposal Withdrawn'
                : 'Proposal Expired'}
            </Text>
            <Text style={styles.statusBannerSub}>
              {isPending
                ? 'Awaiting response within the 72-hour window.'
                : isAccepted
                ? 'Care relationship active in Care Team.'
                : isDeclined
                ? `Reason: ${request.declineReason?.replace(/_/g, ' ') || 'None provided'}`
                : isWithdrawn
                ? `Reason: ${request.withdrawReason?.replace(/_/g, ' ') || 'None provided'}`
                : 'Request expired without a response.'}
            </Text>
          </View>
        </View>

        {/* SECTION 1: PARTY CONTEXT */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {isCaregiverViewer ? 'Care Recipient' : 'Care Provider'}
          </Text>

          {isCaregiverViewer ? (
            /* Recipient (Triage Privacy Protected) */
            <View style={styles.partyRow}>
              <View style={styles.partyAvatarFallback}>
                <Ionicons name="person" size={24} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.partyName}>
                  {isAccepted && request.patient?.fullName
                    ? request.patient.fullName
                    : request.patient?.firstName || 'Patient'}
                </Text>
                <Text style={styles.partySub}>
                  {request.patient?.approximateAge != null
                    ? `Approx. ${request.patient.approximateAge} years old`
                    : 'Age not specified'}
                  {request.patient?.city ? ` · ${request.patient.city}` : ''}
                </Text>
                {isAccepted && request.patient?.phone && (
                  <View style={styles.unlockedContactRow}>
                    <Ionicons name="call" size={14} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={styles.unlockedContactText}>{request.patient.phone}</Text>
                  </View>
                )}
                {!isAccepted && (
                  <Text style={styles.privateInfoTag}>
                    Full legal name & phone contact private until acceptance
                  </Text>
                )}
              </View>
            </View>
          ) : (
            /* Caregiver View */
            <View style={styles.partyRow}>
              {request.caregiver?.photoUrl ? (
                <Image source={{ uri: request.caregiver.photoUrl }} style={styles.partyAvatar} />
              ) : (
                <View style={styles.partyAvatarFallback}>
                  <Ionicons name="person" size={24} color={C.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.partyName}>{request.caregiver?.name || 'Caregiver'}</Text>
                <Text style={styles.partySub}>
                  {request.caregiver?.professionalRole || 'Professional Caregiver'}
                  {request.caregiver?.city ? ` · ${request.caregiver.city}` : ''}
                </Text>
                {isAccepted && request.caregiver?.phone && (
                  <View style={styles.unlockedContactRow}>
                    <Ionicons name="call" size={14} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={styles.unlockedContactText}>{request.caregiver.phone}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Requester context if requested by family */}
          {request.requester && (
            <View style={styles.requesterContextBox}>
              <Text style={styles.requesterContextLabel}>Initiated by:</Text>
              <Text style={styles.requesterContextVal}>
                {request.requester.name} ({request.requester.relationshipType || 'Family'})
              </Text>
            </View>
          )}
        </View>

        {/* SECTION 2: SCHEDULE & TIMING */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Proposed Schedule</Text>

          <View style={styles.termRow}>
            <Text style={styles.termLabel}>Schedule Type</Text>
            <Text style={styles.termValue}>{request.scheduleType.replace(/_/g, ' ')}</Text>
          </View>

          <View style={styles.termRow}>
            <Text style={styles.termLabel}>Start Date</Text>
            <Text style={styles.termValue}>{request.startDate}</Text>
          </View>

          {request.endDate && (
            <View style={styles.termRow}>
              <Text style={styles.termLabel}>End Date</Text>
              <Text style={styles.termValue}>{request.endDate}</Text>
            </View>
          )}

          {request.daysOfWeek && request.daysOfWeek.length > 0 && (
            <View style={styles.termRow}>
              <Text style={styles.termLabel}>Days</Text>
              <Text style={styles.termValue}>
                {request.daysOfWeek
                  .map((d) => DAY_LABELS.find((dl) => dl.day === d)?.label || d)
                  .join(', ')}
              </Text>
            </View>
          )}

          {shiftLabels ? (
            <View style={styles.termRow}>
              <Text style={styles.termLabel}>Requested Shifts</Text>
              <Text style={[styles.termValue, { flex: 1, textAlign: 'right' }]}>{shiftLabels}</Text>
            </View>
          ) : null}
        </View>

        {/* SECTION 3: RATE PROPOSAL */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Proposed Compensation</Text>
          <View style={styles.termRow}>
            <Text style={styles.termLabel}>Rate Structure</Text>
            <Text style={styles.termValue}>{request.proposedRateType} Rate</Text>
          </View>
          <View style={styles.termRow}>
            <Text style={styles.termLabel}>Offered Amount</Text>
            <Text style={styles.rateHighlight}>
              ₹{request.proposedRateInr} {request.proposedRateType === 'HOURLY' ? '/ hour' : '/ day'}
            </Text>
          </View>
        </View>

        {/* SECTION 4: CARE NEEDS / CAPABILITIES */}
        {capLabels.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Requested Care Duties</Text>
            <View style={styles.capsGrid}>
              {capLabels.map((lbl, idx) => (
                <View key={idx} style={styles.capBadge}>
                  <Ionicons name="checkmark" size={14} color={C.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.capBadgeText}>{lbl}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* SECTION 5: CONTEXT & NOTES */}
        {request.careContextNotes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Requester Care Notes</Text>
            <Text style={styles.notesText}>{request.careContextNotes}</Text>
          </View>
        )}

        {/* SECTION 6: DECISION NOTES (If responded) */}
        {request.responseNotes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Response Notes</Text>
            <Text style={styles.notesText}>{request.responseNotes}</Text>
          </View>
        )}

        {/* Spacer for bottom action bar */}
        {isPending && <View style={{ height: 100 }} />}
      </ScrollView>

      {/* FLOATING ACTION BAR FOR PENDING STATE */}
      {isPending && (
        <View style={styles.actionBar}>
          {isCaregiverViewer ? (
            /* Caregiver Actions: Accept & Decline */
            <View style={styles.cgActionRow}>
              <Pressable
                style={[styles.declineBtn, actionLoading && { opacity: 0.6 }]}
                onPress={() => setDeclineModalVisible(true)}
                disabled={actionLoading}
              >
                <Text style={styles.declineBtnText}>Decline</Text>
              </Pressable>

              <Pressable
                style={[styles.acceptBtn, actionLoading && { opacity: 0.6 }]}
                onPress={handleAccept}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.acceptBtnText}>Accept Proposal</Text>
                )}
              </Pressable>
            </View>
          ) : (
            /* Requester Action: Withdraw */
            <Pressable
              style={[styles.withdrawBtn, actionLoading && { opacity: 0.6 }]}
              onPress={() => setWithdrawModalVisible(true)}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.withdrawBtnText}>Withdraw Request</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      )}

      {/* CAREGIVER DECLINE MODAL */}
      <Modal visible={declineModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Decline Care Proposal</Text>
              <Pressable onPress={() => setDeclineModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={C.textMuted} />
              </Pressable>
            </View>

            <Text style={styles.modalSub}>
              Please select the primary reason why you cannot accept this care proposal:
            </Text>

            <ScrollView style={{ maxHeight: 260 }}>
              {DECLINE_REASON_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.id}
                  style={[
                    styles.reasonOption,
                    selectedDeclineReason === opt.id && styles.reasonOptionActive,
                  ]}
                  onPress={() => setSelectedDeclineReason(opt.id)}
                >
                  <Ionicons
                    name={
                      selectedDeclineReason === opt.id
                        ? 'radio-button-on'
                        : 'radio-button-off'
                    }
                    size={18}
                    color={selectedDeclineReason === opt.id ? C.primary : C.textMuted}
                    style={{ marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reasonLabel}>{opt.label}</Text>
                    <Text style={styles.reasonDesc}>{opt.description}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Optional Note for Requester</Text>
            <TextInput
              style={styles.modalTextInput}
              multiline
              maxLength={500}
              value={declineNotes}
              onChangeText={setDeclineNotes}
              placeholder="Provide context or suggest alternatives..."
              placeholderTextColor={C.textMuted}
            />

            <View style={styles.modalButtonsRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setDeclineModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmDeclineBtn} onPress={handleConfirmDecline}>
                <Text style={styles.modalConfirmDeclineText}>Confirm Decline</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* REQUESTER WITHDRAW MODAL */}
      <Modal visible={withdrawModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Care Request</Text>
              <Pressable onPress={() => setWithdrawModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={C.textMuted} />
              </Pressable>
            </View>

            <Text style={styles.modalSub}>
              Please select the reason for withdrawing this request:
            </Text>

            <ScrollView style={{ maxHeight: 260 }}>
              {WITHDRAW_REASON_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.id}
                  style={[
                    styles.reasonOption,
                    selectedWithdrawReason === opt.id && styles.reasonOptionActive,
                  ]}
                  onPress={() => setSelectedWithdrawReason(opt.id)}
                >
                  <Ionicons
                    name={
                      selectedWithdrawReason === opt.id
                        ? 'radio-button-on'
                        : 'radio-button-off'
                    }
                    size={18}
                    color={selectedWithdrawReason === opt.id ? C.primary : C.textMuted}
                    style={{ marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reasonLabel}>{opt.label}</Text>
                    <Text style={styles.reasonDesc}>{opt.description}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Optional Note</Text>
            <TextInput
              style={styles.modalTextInput}
              multiline
              maxLength={500}
              value={withdrawNotes}
              onChangeText={setWithdrawNotes}
              placeholder="Add optional withdrawal comments..."
              placeholderTextColor={C.textMuted}
            />

            <View style={styles.modalButtonsRow}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setWithdrawModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmWithdrawBtn} onPress={handleConfirmWithdraw}>
                <Text style={styles.modalConfirmWithdrawText}>Withdraw Request</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 12,
  },
  errorTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: '#EF4444',
    marginTop: 12,
  },
  errorSubtitle: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  retryBtnText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.textPrimary,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.textPrimary,
  },
  headerSub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
  },
  scrollContent: {
    padding: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  statusBannerPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  statusBannerAccepted: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  statusBannerDeclined: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  statusBannerWithdrawn: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  statusBannerExpired: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  statusBannerTitle: {
    fontFamily: F.bold,
    fontSize: 14,
  },
  statusBannerSub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
    marginBottom: 12,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  partyAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  partyName: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
  },
  partySub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  unlockedContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  unlockedContactText: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: '#065F46',
  },
  privateInfoTag: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#059669',
    marginTop: 4,
  },
  requesterContextBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requesterContextLabel: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
  },
  requesterContextVal: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textSecondary,
  },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  termLabel: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
  },
  termValue: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.textPrimary,
  },
  rateHighlight: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.primary,
  },
  capsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  capBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  capBadgeText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.primary,
  },
  notesText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textPrimary,
    lineHeight: 18,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  cgActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  declineBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#EF4444',
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  withdrawBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#64748B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.textPrimary,
  },
  modalSub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    marginBottom: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  reasonOptionActive: {
    borderColor: C.primary,
    backgroundColor: '#EFF6FF',
  },
  reasonLabel: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.textPrimary,
  },
  reasonDesc: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textSecondary,
    marginTop: 1,
  },
  inputLabel: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textPrimary,
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    fontFamily: F.regular,
    color: C.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.textSecondary,
  },
  modalConfirmDeclineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  modalConfirmDeclineText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  modalConfirmWithdrawBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#64748B',
    alignItems: 'center',
  },
  modalConfirmWithdrawText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
