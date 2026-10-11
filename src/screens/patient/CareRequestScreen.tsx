/**
 * SureStep — src/screens/patient/CareRequestScreen.tsx
 *
 * Care Request Submission Screen.
 * Implements the locked Care Request Final Domain Specification:
 *  - Recipient context (Self for Patient, selected Patient for Family)
 *  - Strict schedule invariant enforcement:
 *      * RECURRING: startDate, daysOfWeek, requestedShifts, endDate = null
 *      * DATE_RANGE: startDate, endDate (>= startDate), requestedShifts, daysOfWeek optional
 *      * ONE_TIME: startDate, requestedShifts, daysOfWeek = null, endDate = null
 *      * FLEXIBLE: startDate, endDate optional, daysOfWeek = null, requestedShifts nullable
 *  - Canonical capabilities (10)
 *  - Canonical shifts (9)
 *  - Proposed rate (HOURLY / DAILY in INR)
 *  - Care context notes (<= 1000 chars)
 *  - Review and submission with robust error handling
 */

import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { useFamilyContext } from '../../context/FamilyContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { PatientStackParams, FamilyStackParams } from '../../types/navigation.types';
import {
  SHIFT_OPTIONS,
  CAPABILITY_OPTIONS,
  type CanonicalShift,
  type CanonicalCapability,
  type CareRequestScheduleType,
  type CareRequestRateType,
  type CreateCareRequestPayload,
} from '../../types/care.types';
import { createCareRequest, type CareRequestError } from '../../services/careRequestService';

type Props =
  | NativeStackScreenProps<PatientStackParams, 'CareRequestScreen'>
  | NativeStackScreenProps<FamilyStackParams, 'CareRequestScreen'>;

const DAY_LABELS = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

export const CareRequestScreen: React.FC<Props> = ({ route, navigation }) => {
  const { caregiver, targetPatientId, targetPatientName } = route.params;
  const { user } = useAuth();
  const { patient: familyPatient } = useFamilyContext();

  const isFamilyUser = user?.role === 'FAMILY';

  // Invariant: Patient identity resolution
  // For self-managed PATIENT role: explicitly use authenticated patient's ID.
  // For FAMILY role: require selected patient ID from validated route params or family context.
  // NEVER fallback to user.id when user is FAMILY.
  let resolvedPatientId: string | null = null;
  let resolvedPatientName: string = '';

  if (user?.role === 'PATIENT') {
    resolvedPatientId = user.id;
    resolvedPatientName = user.name || 'You';
  } else if (user?.role === 'FAMILY') {
    resolvedPatientId = targetPatientId || familyPatient?.id || null;
    resolvedPatientName = targetPatientName || familyPatient?.name || 'Patient';
  }

  // ── State ──────────────────────────────────────────────────────────────────
  const [scheduleType, setScheduleType] = useState<CareRequestScheduleType>('RECURRING');

  // Dates
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const nextMonthStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 31);
    return d.toISOString().split('T')[0];
  }, []);

  const [startDate, setStartDate] = useState<string>(tomorrowStr);
  const [endDate, setEndDate] = useState<string>(nextMonthStr);

  // Days of week (for RECURRING and DATE_RANGE)
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3, 5]);

  // Shifts
  const [selectedShifts, setSelectedShifts] = useState<CanonicalShift[]>(['DAY_SHIFT']);

  // Capabilities
  const [selectedCaps, setSelectedCaps] = useState<CanonicalCapability[]>(
    caregiver.careCapabilities && caregiver.careCapabilities.length > 0
      ? [caregiver.careCapabilities[0] as CanonicalCapability]
      : ['hygiene_bathing'],
  );

  // Rate
  const initialRate = caregiver.hourlyRateInr || 400;
  const [rateType, setRateType] = useState<CareRequestRateType>('HOURLY');
  const [rateAmount, setRateAmount] = useState<string>(String(initialRate));

  // Context Notes
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ── Handlers ───────────────────────────────────────────────────────────────

  const toggleDay = (dayNum: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum].sort(),
    );
  };

  const toggleShift = (shiftId: CanonicalShift) => {
    setSelectedShifts((prev) =>
      prev.includes(shiftId) ? prev.filter((s) => s !== shiftId) : [...prev, shiftId],
    );
  };

  const toggleCap = (capId: CanonicalCapability) => {
    setSelectedCaps((prev) =>
      prev.includes(capId) ? prev.filter((c) => c !== capId) : [...prev, capId],
    );
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      errors.startDate = 'Start date must be in YYYY-MM-DD format.';
    }

    if (scheduleType === 'DATE_RANGE') {
      if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        errors.endDate = 'End date is required for Date Range schedule.';
      } else if (endDate < startDate) {
        errors.endDate = 'End date cannot be earlier than start date.';
      }
    }

    if (scheduleType === 'RECURRING') {
      if (daysOfWeek.length === 0) {
        errors.daysOfWeek = 'Please select at least one day of the week.';
      }
      if (selectedShifts.length === 0) {
        errors.shifts = 'Please select at least one shift for recurring care.';
      }
    }

    if (scheduleType === 'DATE_RANGE' || scheduleType === 'ONE_TIME') {
      if (selectedShifts.length === 0) {
        errors.shifts = 'Please select at least one requested shift.';
      }
    }

    const parsedRate = parseFloat(rateAmount);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      errors.rate = 'Please enter a valid rate greater than 0.';
    }

    if (notes.length > 1000) {
      errors.notes = 'Context notes cannot exceed 1000 characters.';
    }

    if (!resolvedPatientId) {
      errors.patient = isFamilyUser
        ? 'A patient must be selected to request care on their behalf.'
        : 'Patient account details could not be resolved.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!resolvedPatientId) {
      Alert.alert(
        'Missing Patient Context',
        isFamilyUser
          ? 'A patient must be selected to request care on their behalf. Please select a patient first.'
          : 'Patient account details could not be found. Please sign in again.',
      );
      return;
    }

    if (!validate()) {
      Alert.alert('Validation Error', 'Please check the highlighted fields before submitting.');
      return;
    }

    // Build payload respecting strict schedule invariants
    const payload: CreateCareRequestPayload = {
      patientId: resolvedPatientId,
      caregiverId: caregiver.id,
      scheduleType,
      startDate,
      endDate: scheduleType === 'DATE_RANGE' || (scheduleType === 'FLEXIBLE' && endDate) ? endDate : null,
      daysOfWeek: scheduleType === 'RECURRING' || (scheduleType === 'DATE_RANGE' && daysOfWeek.length > 0) ? daysOfWeek : null,
      requestedShifts: scheduleType === 'FLEXIBLE' && selectedShifts.length === 0 ? null : selectedShifts,
      requestedCapabilities: selectedCaps,
      proposedRateType: rateType,
      proposedRateInr: parseFloat(rateAmount),
      careContextNotes: notes.trim() ? notes.trim() : null,
    };

    setSubmitting(true);
    try {
      const createdRequest = await createCareRequest(payload);
      Alert.alert(
        'Care Request Submitted',
        `Your care request has been sent to ${caregiver.name}. The caregiver has up to 72 hours to respond.\n\nYou will be notified as soon as they reply.`,
        [
          {
            text: 'View Request',
            onPress: () => {
              (navigation as any).navigate('CareRequestDetailScreen', {
                requestId: createdRequest.id,
              });
            },
          },
        ],
      );
    } catch (err: any) {
      const error = err as CareRequestError;
      console.warn('[CareRequestScreen] Submission failed:', error);

      let title = 'Unable to Submit Request';
      let msg = error.message;

      if (error.code === 'DUPLICATE_REQUEST_PENDING') {
        title = 'Pending Request Exists';
        msg = `You already have an active pending care request with ${caregiver.name}. Please wait for their response or manage your existing request.`;
      } else if (error.code === 'ACTIVE_RELATIONSHIP_EXISTS') {
        title = 'Already Connected';
        msg = `${caregiver.name} is already part of your active care team.`;
      } else if (error.code === 'DISCOVERY_MANAGED_BY_FAMILY') {
        title = 'Managed by Family';
        msg = 'Your care discovery and requests are coordinated by your family circle members.';
      } else if (error.statusCode === 409 && error.code === 'CAREGIVER_CAPACITY_EXCEEDED') {
        title = 'Caregiver Capacity Full';
        msg = `${caregiver.name} is currently managing their maximum patient capacity and cannot accept new requests at this time.`;
      }

      Alert.alert(title, msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {/* Top Header */}
      <View style={styles.headerNav}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.headerTitle}>Care Proposal</Text>
          <Text style={styles.headerSub}>With {caregiver.name}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* SECTION A: CARE RECIPIENT */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="person-circle-outline" size={20} color={C.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Care Recipient</Text>
            </View>

            <View style={styles.recipientBox}>
              <View style={styles.recipientAvatarCircle}>
                <Ionicons name="person" size={20} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recipientName}>{resolvedPatientName || (isFamilyUser ? 'No Patient Selected' : 'You')}</Text>
                <Text style={styles.recipientContext}>
                  {isFamilyUser
                    ? (resolvedPatientId
                        ? `Care arranged on behalf of patient by ${user?.name || 'Family'}`
                        : 'No linked patient selected. Please select a patient before requesting care.')
                    : 'Requesting personal care assistance (Self)'}
                </Text>
              </View>
            </View>

            {!resolvedPatientId && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={styles.errorBannerText}>
                  {isFamilyUser
                    ? 'A patient must be selected to request care on their behalf. Please navigate from your linked patient dashboard.'
                    : 'Unable to resolve your patient profile. Please sign in again.'}
                </Text>
              </View>
            )}

            <View style={styles.privacyNoteBox}>
              <Ionicons name="shield-outline" size={14} color="#059669" style={{ marginRight: 6, marginTop: 1 }} />
              <Text style={styles.privacyNoteText}>
                Full legal name and phone contact remain private and are revealed only upon mutual care confirmation.
              </Text>
            </View>
          </View>

          {/* SECTION B: SCHEDULE */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="calendar-outline" size={20} color={C.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Schedule Terms</Text>
            </View>

            {/* Schedule Type Selector */}
            <Text style={styles.inputLabel}>Schedule Type</Text>
            <View style={styles.segmentedRow}>
              {[
                { type: 'RECURRING' as const, label: 'Weekly' },
                { type: 'DATE_RANGE' as const, label: 'Date Range' },
                { type: 'ONE_TIME' as const, label: 'One-Time' },
                { type: 'FLEXIBLE' as const, label: 'Flexible' },
              ].map((s) => (
                <Pressable
                  key={s.type}
                  style={[
                    styles.segmentBtn,
                    scheduleType === s.type && styles.segmentBtnActive,
                  ]}
                  onPress={() => setScheduleType(s.type)}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      scheduleType === s.type && styles.segmentBtnTextActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Dates */}
            <View style={styles.dateInputsRow}>
              <View style={{ flex: 1, marginRight: scheduleType === 'DATE_RANGE' || scheduleType === 'FLEXIBLE' ? 8 : 0 }}>
                <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD) *</Text>
                <TextInput
                  style={[styles.textInput, formErrors.startDate && styles.textInputError]}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="2026-10-01"
                  placeholderTextColor={C.textMuted}
                />
                {formErrors.startDate && <Text style={styles.errorSubText}>{formErrors.startDate}</Text>}
              </View>

              {(scheduleType === 'DATE_RANGE' || scheduleType === 'FLEXIBLE') && (
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>
                    {scheduleType === 'DATE_RANGE' ? 'End Date *' : 'End Date (Optional)'}
                  </Text>
                  <TextInput
                    style={[styles.textInput, formErrors.endDate && styles.textInputError]}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="2026-10-31"
                    placeholderTextColor={C.textMuted}
                  />
                  {formErrors.endDate && <Text style={styles.errorSubText}>{formErrors.endDate}</Text>}
                </View>
              )}
            </View>

            {/* Days of Week (for RECURRING or DATE_RANGE) */}
            {(scheduleType === 'RECURRING' || scheduleType === 'DATE_RANGE') && (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.inputLabel}>
                  {scheduleType === 'RECURRING' ? 'Days of Week *' : 'Days of Week (Optional)'}
                </Text>
                <View style={styles.daysRow}>
                  {DAY_LABELS.map((d) => {
                    const isSelected = daysOfWeek.includes(d.day);
                    return (
                      <Pressable
                        key={d.day}
                        style={[styles.dayChip, isSelected && styles.dayChipActive]}
                        onPress={() => toggleDay(d.day)}
                      >
                        <Text style={[styles.dayChipText, isSelected && styles.dayChipTextActive]}>
                          {d.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {formErrors.daysOfWeek && <Text style={styles.errorSubText}>{formErrors.daysOfWeek}</Text>}
              </View>
            )}

            {/* Requested Shifts */}
            <View style={{ marginTop: 14 }}>
              <Text style={styles.inputLabel}>
                {scheduleType === 'FLEXIBLE' ? 'Requested Shifts (Optional)' : 'Requested Shifts *'}
              </Text>
              <View style={styles.chipsWrap}>
                {SHIFT_OPTIONS.map((shift) => {
                  const isSelected = selectedShifts.includes(shift.id);
                  return (
                    <Pressable
                      key={shift.id}
                      style={[styles.shiftChip, isSelected && styles.shiftChipActive]}
                      onPress={() => toggleShift(shift.id)}
                    >
                      <Ionicons
                        name={shift.icon}
                        size={14}
                        color={isSelected ? '#FFFFFF' : C.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.shiftChipText, isSelected && styles.shiftChipTextActive]}>
                        {shift.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {formErrors.shifts && <Text style={styles.errorSubText}>{formErrors.shifts}</Text>}
            </View>
          </View>

          {/* SECTION C: CARE NEEDS */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="medkit-outline" size={20} color={C.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Care Needs & Assistance</Text>
            </View>
            <Text style={styles.cardSub}>Select the duties required for this arrangement:</Text>

            <View style={styles.chipsWrap}>
              {CAPABILITY_OPTIONS.map((cap) => {
                const isSelected = selectedCaps.includes(cap.id);
                return (
                  <Pressable
                    key={cap.id}
                    style={[styles.capChip, isSelected && styles.capChipActive]}
                    onPress={() => toggleCap(cap.id)}
                  >
                    <Ionicons
                      name={cap.icon}
                      size={14}
                      color={isSelected ? '#FFFFFF' : C.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.capChipText, isSelected && styles.capChipTextActive]}>
                      {cap.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* SECTION D: RATE PROPOSAL */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="cash-outline" size={20} color={C.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Proposed Rate</Text>
            </View>

            <View style={styles.rateTypeRow}>
              <Pressable
                style={[styles.rateTypeBtn, rateType === 'HOURLY' && styles.rateTypeBtnActive]}
                onPress={() => setRateType('HOURLY')}
              >
                <Text style={[styles.rateTypeBtnText, rateType === 'HOURLY' && styles.rateTypeBtnTextActive]}>
                  Hourly Rate
                </Text>
              </Pressable>
              <Pressable
                style={[styles.rateTypeBtn, rateType === 'DAILY' && styles.rateTypeBtnActive]}
                onPress={() => setRateType('DAILY')}
              >
                <Text style={[styles.rateTypeBtnText, rateType === 'DAILY' && styles.rateTypeBtnTextActive]}>
                  Daily Rate
                </Text>
              </Pressable>
            </View>

            <View style={styles.rateInputRow}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={[styles.rateInput, formErrors.rate && styles.textInputError]}
                keyboardType="numeric"
                value={rateAmount}
                onChangeText={setRateAmount}
                placeholder="400"
                placeholderTextColor={C.textMuted}
              />
              <Text style={styles.rateUnitSuffix}>{rateType === 'HOURLY' ? '/ hour' : '/ day'}</Text>
            </View>
            {formErrors.rate && <Text style={styles.errorSubText}>{formErrors.rate}</Text>}
          </View>

          {/* SECTION E: CONTEXT NOTES */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="document-text-outline" size={20} color={C.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Care Context & Notes</Text>
            </View>
            <Text style={styles.cardSub}>
              Share key routine details, communication preferences, or safety considerations:
            </Text>

            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={4}
              maxLength={1000}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Needs gentle verbal prompts for breakfast, prefers afternoon walks in quiet areas, sundowning reassurance..."
              placeholderTextColor={C.textMuted}
            />
            <View style={styles.notesCounterWrap}>
              <Text style={styles.notesCounterText}>{notes.length} / 1000</Text>
            </View>
          </View>

          {/* SECTION F: REVIEW & SUBMIT */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Proposal Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Caregiver:</Text>
              <Text style={styles.summaryVal}>{caregiver.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Recipient:</Text>
              <Text style={styles.summaryVal}>{resolvedPatientName || (isFamilyUser ? 'Patient' : 'You')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Schedule:</Text>
              <Text style={styles.summaryVal}>
                {scheduleType === 'RECURRING'
                  ? 'Weekly recurring'
                  : scheduleType === 'DATE_RANGE'
                  ? `${startDate} to ${endDate}`
                  : scheduleType === 'ONE_TIME'
                  ? `One-time on ${startDate}`
                  : 'Flexible'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Proposed Rate:</Text>
              <Text style={styles.summaryVal}>
                ₹{rateAmount} {rateType === 'HOURLY' ? '/ hr' : '/ day'}
              </Text>
            </View>

            <View style={styles.expiryNotice}>
              <Ionicons name="time-outline" size={14} color="#B45309" style={{ marginRight: 6 }} />
              <Text style={styles.expiryNoticeText}>
                72-Hour Response Window: Proposal automatically expires if unconfirmed.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.submitBtnPressed,
                (submitting || !resolvedPatientId) && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={submitting || !resolvedPatientId}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Submit Care Request</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F8FAFC',
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
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
  },
  cardSub: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 12,
  },
  recipientBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  recipientAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  recipientName: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: C.textPrimary,
  },
  recipientContext: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  privacyNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
  },
  privacyNoteText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#065F46',
    flex: 1,
    lineHeight: 16,
  },
  inputLabel: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textPrimary,
    marginBottom: 6,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtnText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textSecondary,
  },
  segmentBtnTextActive: {
    fontFamily: F.bold,
    color: C.primary,
  },
  dateInputsRow: {
    flexDirection: 'row',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: F.regular,
    color: C.textPrimary,
  },
  textInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorSubText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  dayChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  dayChipText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textSecondary,
  },
  dayChipTextActive: {
    color: '#FFFFFF',
    fontFamily: F.bold,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shiftChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  shiftChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  shiftChipText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textPrimary,
  },
  shiftChipTextActive: {
    color: '#FFFFFF',
    fontFamily: F.bold,
  },
  capChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  capChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  capChipText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textPrimary,
  },
  capChipTextActive: {
    color: '#FFFFFF',
    fontFamily: F.bold,
  },
  rateTypeRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 10,
  },
  rateTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  rateTypeBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: C.primary,
  },
  rateTypeBtnText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textSecondary,
  },
  rateTypeBtnTextActive: {
    color: C.primary,
    fontFamily: F.bold,
  },
  rateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  currencyPrefix: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.textPrimary,
    marginRight: 6,
  },
  rateInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: F.semiBold,
    color: C.textPrimary,
  },
  rateUnitSuffix: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
    marginLeft: 6,
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    fontFamily: F.regular,
    color: C.textPrimary,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  notesCounterWrap: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  notesCounterText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textMuted,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
  },
  summaryVal: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.textPrimary,
  },
  expiryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    marginTop: 14,
    marginBottom: 16,
  },
  expiryNoticeText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#92400E',
    flex: 1,
  },
  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnPressed: {
    backgroundColor: C.primaryDark,
  },
  submitBtnText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 6,
    padding: 10,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 12,
    color: '#B91C1C',
  },
});
