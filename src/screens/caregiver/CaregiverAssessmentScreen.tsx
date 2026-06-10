import React, { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { CaregiverStackParams } from '../../types/navigation.types';
import { getLatestAssessment, saveAssessment, type AssessmentData } from '../../services/assessmentService';

type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverAssessmentScreen'>;

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke={C.textPrimary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TrashIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CaregiverAssessmentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patientId, patientName } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [existingVersion, setExistingVersion] = useState<number | null>(null);

  // ─── Step 1: Basics ────────────────────────────────────────────────────────
  const [preferredName, setPreferredName] = useState('');
  const [address, setAddress] = useState('');
  const [livingArrangement, setLivingArrangement] = useState('Living Alone');
  const [primaryLanguage, setPrimaryLanguage] = useState('English');

  // ─── Step 2: Emergency Contacts ───────────────────────────────────────────
  const [contacts, setContacts] = useState<Array<{ name: string; relationship: string; phone: string; priority: number }>>([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRel, setNewContactRel] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // ─── Step 3: Cognitive & Risk ─────────────────────────────────────────────
  const [memoryConcerns, setMemoryConcerns] = useState('None');
  const [orientationConcerns, setOrientationConcerns] = useState('Oriented');
  const [wanderingRisk, setWanderingRisk] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [confusionFrequency, setConfusionFrequency] = useState('Never');
  const [fallRisk, setFallRisk] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [medAdherenceRisk, setMedAdherenceRisk] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [emergencyRisk, setEmergencyRisk] = useState<'Low' | 'Medium' | 'High'>('Low');

  // ─── Step 4: Mobility & Support Needs ─────────────────────────────────────
  const [mobility, setMobility] = useState('Independent');
  const [techComfort, setTechComfort] = useState('Independent smartphone use');
  const [supportNeeds, setSupportNeeds] = useState({
    medication_reminders: false,
    meal_reminders: false,
    hydration_reminders: false,
    exercise_reminders: false,
    appointment_reminders: false,
    safety_monitoring: false,
  });

  // ─── Step 5: Observations & Notes ─────────────────────────────────────────
  const [observations, setObservations] = useState('');
  const [meetingSummary, setMeetingSummary] = useState('');
  const [recommendations, setRecommendations] = useState('');

  useEffect(() => {
    const loadAssessment = async () => {
      try {
        const data = await getLatestAssessment(patientId);
        if (data) {
          setExistingVersion(data.version ?? 1);
          setPreferredName(data.patient_basics?.preferred_name || '');
          setAddress(data.patient_basics?.address || '');
          setLivingArrangement(data.patient_basics?.living_arrangement || 'Living Alone');
          setPrimaryLanguage(data.patient_basics?.primary_language || 'English');
          setContacts(data.emergency_contacts || []);
          setMemoryConcerns(data.cognitive?.memory_concerns || 'None');
          setOrientationConcerns(data.cognitive?.orientation_concerns || 'Oriented');
          setWanderingRisk(data.risk?.wandering_risk || 'Low');
          setConfusionFrequency(data.cognitive?.confusion_frequency || 'Never');
          setFallRisk(data.risk?.fall_risk || 'Low');
          setMedAdherenceRisk(data.risk?.medication_adherence_risk || 'Low');
          setEmergencyRisk(data.risk?.emergency_risk || 'Low');
          setMobility(data.mobility || 'Independent');
          setTechComfort(data.tech_comfort || 'Independent smartphone use');
          setSupportNeeds({
            medication_reminders: !!data.support_needs?.medication_reminders,
            meal_reminders: !!data.support_needs?.meal_reminders,
            hydration_reminders: !!data.support_needs?.hydration_reminders,
            exercise_reminders: !!data.support_needs?.exercise_reminders,
            appointment_reminders: !!data.support_needs?.appointment_reminders,
            safety_monitoring: !!data.support_needs?.safety_monitoring,
          });
          setObservations(data.notes?.observations || '');
          setMeetingSummary(data.notes?.meeting_summary || '');
          setRecommendations(data.notes?.recommendations || '');
        } else {
          // prefill default name if first time
          setPreferredName(patientName);
        }
      } catch (err) {
        console.warn('Failed to load latest assessment:', err);
      } finally {
        setLoading(false);
      }
    };
    void loadAssessment();
  }, [patientId, patientName]);

  const addContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      Alert.alert('Required Fields', 'Please enter at least name and phone number for contact.');
      return;
    }
    const nextPriority = contacts.length + 1;
    setContacts(prev => [
      ...prev,
      {
        name: newContactName.trim(),
        relationship: newContactRel.trim() || 'Family',
        phone: newContactPhone.trim(),
        priority: nextPriority,
      },
    ]);
    setNewContactName('');
    setNewContactRel('');
    setNewContactPhone('');
  };

  const removeContact = (index: number) => {
    setContacts(prev => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, priority: i + 1 })));
  };

  const toggleNeed = (key: keyof typeof supportNeeds) => {
    setSupportNeeds(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const buildPayload = (status: 'DRAFT' | 'COMPLETED'): AssessmentData => {
    return {
      status,
      patient_basics: {
        preferred_name: preferredName.trim() || patientName,
        address: address.trim(),
        living_arrangement: livingArrangement,
        primary_language: primaryLanguage,
      },
      emergency_contacts: contacts,
      cognitive: {
        memory_concerns: memoryConcerns,
        orientation_concerns: orientationConcerns,
        wandering_risk: wanderingRisk,
        confusion_frequency: confusionFrequency,
      },
      risk: {
        fall_risk: fallRisk,
        wandering_risk: wanderingRisk,
        medication_adherence_risk: medAdherenceRisk,
        emergency_risk: emergencyRisk,
      },
      mobility,
      support_needs: supportNeeds,
      tech_comfort: techComfort,
      notes: {
        observations: observations.trim(),
        meeting_summary: meetingSummary.trim(),
        recommendations: recommendations.trim(),
      },
    };
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      const payload = buildPayload('DRAFT');
      await saveAssessment(patientId, payload);
      Alert.alert('Draft Saved', 'Your assessment draft has been updated successfully.');
      navigation.navigate('CaregiverPatientDetailScreen', { patientId, patientName, refresh: true });
    } catch (err) {
      console.warn('Save draft failed:', err);
      Alert.alert('Error', 'Failed to save draft. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFinal = async () => {
    // Basic completion validations
    if (!preferredName.trim()) {
      Alert.alert('Validation Error', 'Preferred name is required.');
      setStep(1);
      return;
    }
    if (!address.trim()) {
      Alert.alert('Validation Error', 'Patient address is required.');
      setStep(1);
      return;
    }
    if (contacts.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one emergency contact.');
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload('COMPLETED');
      await saveAssessment(patientId, payload);
      Alert.alert('Assessment Completed', 'The Patient Assessment has been submitted. A Care Plan was generated.');
      navigation.navigate('CaregiverPatientDetailScreen', { patientId, patientName, refresh: true });
    } catch (err: any) {
      console.warn('Submit assessment failed:', err);
      const msg = err.response?.data?.message || 'Failed to complete assessment. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={{ fontFamily: F.medium, fontSize: 15, color: C.textSecondary, marginTop: 12 }}>Loading latest assessment...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={15}>
          <BackIcon />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Patient Assessment</Text>
          <Text style={styles.headerSub}>
            {existingVersion ? `Editing Version ${existingVersion}` : `New Assessment`}
          </Text>
        </View>
        <Pressable onPress={handleSaveDraft} disabled={submitting}>
          <Text style={styles.draftBtnText}>Save Draft</Text>
        </Pressable>
      </View>

      {/* Step Indicator */}
      <View style={styles.indicatorContainer}>
        <View style={styles.indicatorTextRow}>
          <Text style={styles.indicatorStepNum}>STEP {step} OF 5</Text>
          <Text style={styles.indicatorStepTitle}>
            {step === 1 && 'Patient Basics'}
            {step === 2 && 'Emergency Contacts'}
            {step === 3 && 'Cognitive & Risk'}
            {step === 4 && 'Mobility & Reminders'}
            {step === 5 && 'Observations & Summary'}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${(step / 5) * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── STEP 1: PATIENT BASICS ───────────────────────────────────────── */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.sectionTitle}>Patient Basic Information</Text>

            <Text style={styles.label}>Preferred Name / Nickname</Text>
            <TextInput
              value={preferredName}
              onChangeText={setPreferredName}
              placeholder="e.g. Grandma Dorothy"
              placeholderTextColor={C.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>Living Address</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Full physical home address"
              placeholderTextColor={C.textMuted}
              style={[styles.input, styles.textArea]}
              multiline
            />

            <Text style={styles.label}>Living Arrangement</Text>
            <View style={styles.optionRow}>
              {['Living Alone', 'Living with Family', 'Assisted Living'].map(arrangement => {
                const isSel = livingArrangement === arrangement;
                return (
                  <Pressable
                    key={arrangement}
                    style={[styles.optionBtn, isSel && styles.optionBtnActive]}
                    onPress={() => setLivingArrangement(arrangement)}
                  >
                    <Text style={[styles.optionText, isSel && styles.optionTextActive]}>{arrangement}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Primary Language Spoken</Text>
            <View style={styles.optionRow}>
              {['English', 'Hindi', 'Spanish', 'Other'].map(lang => {
                const isSel = primaryLanguage === lang;
                return (
                  <Pressable
                    key={lang}
                    style={[styles.optionBtn, isSel && styles.optionBtnActive]}
                    onPress={() => setPrimaryLanguage(lang)}
                  >
                    <Text style={[styles.optionText, isSel && styles.optionTextActive]}>{lang}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── STEP 2: EMERGENCY CONTACTS ───────────────────────────────────── */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <Text style={styles.instructionsHelper}>Add primary emergency responders. These will receive urgent alerts.</Text>

            {contacts.map((c, idx) => (
              <View key={idx} style={styles.contactItemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactNameText}>{c.name} ({c.relationship})</Text>
                  <Text style={styles.contactPhoneText}>📞 {c.phone}</Text>
                  <Text style={styles.contactPriorityText}>Priority: {c.priority}</Text>
                </View>
                <Pressable onPress={() => removeContact(idx)} style={styles.deleteContactBtn}>
                  <TrashIcon />
                </Pressable>
              </View>
            ))}

            <View style={styles.addContactSection}>
              <Text style={styles.addContactTitle}>Add New Contact</Text>
              <TextInput
                value={newContactName}
                onChangeText={setNewContactName}
                placeholder="Full Name"
                placeholderTextColor={C.textMuted}
                style={styles.addContactInput}
              />
              <TextInput
                value={newContactRel}
                onChangeText={setNewContactRel}
                placeholder="Relationship (e.g., Son, Daughter)"
                placeholderTextColor={C.textMuted}
                style={styles.addContactInput}
              />
              <TextInput
                value={newContactPhone}
                onChangeText={setNewContactPhone}
                placeholder="Phone Number"
                placeholderTextColor={C.textMuted}
                style={styles.addContactInput}
                keyboardType="phone-pad"
              />
              <Pressable style={styles.addContactBtn} onPress={addContact}>
                <Text style={styles.addContactBtnText}>＋ Add to Contacts List</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ─── STEP 3: COGNITIVE & RISK ─────────────────────────────────────── */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.sectionTitle}>Cognitive Status & Safety Risks</Text>

            <Text style={styles.label}>Memory Concerns</Text>
            <View style={styles.optionRow}>
              {['None', 'Mild', 'Moderate', 'Severe'].map(level => {
                const isSel = memoryConcerns === level;
                return (
                  <Pressable key={level} style={[styles.optionBtn, isSel && styles.optionBtnActive]} onPress={() => setMemoryConcerns(level)}>
                    <Text style={[styles.optionText, isSel && styles.optionTextActive]}>{level}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Orientation Level</Text>
            <View style={styles.optionRow}>
              {['Oriented', 'Intermittent Confusion', 'Disoriented'].map(level => {
                const isSel = orientationConcerns === level;
                return (
                  <Pressable key={level} style={[styles.optionBtn, isSel && styles.optionBtnActive]} onPress={() => setOrientationConcerns(level)}>
                    <Text style={[styles.optionText, isSel && styles.optionTextActive]}>{level}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Confusion Frequency</Text>
            <View style={styles.optionRow}>
              {['Never', 'Occasionally', 'Frequently', 'Constantly'].map(freq => {
                const isSel = confusionFrequency === freq;
                return (
                  <Pressable key={freq} style={[styles.optionBtn, isSel && styles.optionBtnActive]} onPress={() => setConfusionFrequency(freq)}>
                    <Text style={[styles.optionText, isSel && styles.optionTextActive]}>{freq}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.divider} />

            <Text style={styles.label}>Fall Risk</Text>
            <View style={styles.optionRow}>
              {['Low', 'Medium', 'High'].map(risk => {
                const isSel = fallRisk === risk;
                return (
                  <Pressable key={risk} style={[styles.optionBtn, isSel && styles.optionBtnActive]} onPress={() => setFallRisk(risk as any)}>
                    <Text style={[styles.optionText, isSel && styles.optionTextActive]}>{risk}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Wandering Risk</Text>
            <View style={styles.optionRow}>
              {['Low', 'Medium', 'High'].map(risk => {
                const isSel = wanderingRisk === risk;
                return (
                  <Pressable key={risk} style={[styles.optionBtn, isSel && styles.optionBtnActive]} onPress={() => setWanderingRisk(risk as any)}>
                    <Text style={[styles.optionText, isSel && styles.optionTextActive]}>{risk}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Medication Adherence Risk</Text>
            <View style={styles.optionRow}>
              {['Low', 'Medium', 'High'].map(risk => {
                const isSel = medAdherenceRisk === risk;
                return (
                  <Pressable key={risk} style={[styles.optionBtn, isSel && styles.optionBtnActive]} onPress={() => setMedAdherenceRisk(risk as any)}>
                    <Text style={[styles.optionText, isSel && styles.optionTextActive]}>{risk}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Emergency Risk</Text>
            <View style={styles.optionRow}>
              {['Low', 'Medium', 'High'].map(risk => {
                const isSel = emergencyRisk === risk;
                return (
                  <Pressable key={risk} style={[styles.optionBtn, isSel && styles.optionBtnActive]} onPress={() => setEmergencyRisk(risk as any)}>
                    <Text style={[styles.optionText, isSel && styles.optionTextActive]}>{risk}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── STEP 4: MOBILITY & SUPPORT NEEDS ──────────────────────────────── */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.sectionTitle}>Mobility & Routine Support Needs</Text>

            <Text style={styles.label}>Mobility Tier</Text>
            <View style={styles.optionRow}>
              {['Independent', 'Assisted', 'Wheelchair', 'Bedridden'].map(tier => {
                const isSel = mobility === tier;
                return (
                  <Pressable key={tier} style={[styles.optionBtn, isSel && styles.optionBtnActive]} onPress={() => setMobility(tier)}>
                    <Text style={[styles.optionText, isSel && styles.optionTextActive]}>{tier}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Required Routine Reminders</Text>
            <View style={styles.checkboxList}>
              {[
                { key: 'medication_reminders', label: '💊 Medication Reminders' },
                { key: 'meal_reminders', label: '🍳 Meal / Nutrition Reminders' },
                { key: 'hydration_reminders', label: '💧 Hydration Reminders' },
                { key: 'exercise_reminders', label: '🚶 Exercise / Walk Reminders' },
                { key: 'appointment_reminders', label: '📅 Medical Appointment Reminders' },
                { key: 'safety_monitoring', label: '🗺️ Safe Geofence GPS Monitoring' },
              ].map(item => {
                const isChecked = supportNeeds[item.key as keyof typeof supportNeeds];
                return (
                  <Pressable
                    key={item.key}
                    style={[styles.checkboxRow, isChecked && styles.checkboxRowActive]}
                    onPress={() => toggleNeed(item.key as keyof typeof supportNeeds)}
                  >
                    <View style={[styles.checkboxSquare, isChecked && styles.checkboxSquareChecked]}>
                      {isChecked && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Smartphone & Tech Comfort</Text>
            <View style={styles.verticalOptionList}>
              {[
                'Independent smartphone use',
                'Requires assistance',
                'Unable to use independently',
              ].map(level => {
                const isSel = techComfort === level;
                return (
                  <Pressable
                    key={level}
                    style={[styles.verticalOptionBtn, isSel && styles.verticalOptionBtnActive]}
                    onPress={() => setTechComfort(level)}
                  >
                    <Text style={[styles.verticalOptionText, isSel && styles.verticalOptionTextActive]}>{level}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── STEP 5: OBSERVATIONS & SUMMARY ───────────────────────────────── */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.sectionTitle}>Observations & Initial Care Plan</Text>

            <Text style={styles.label}>Direct Observations during Meeting</Text>
            <TextInput
              value={observations}
              onChangeText={setObservations}
              placeholder="e.g. Patient was friendly, slightly forgetful about medication times. Appears physically steady."
              placeholderTextColor={C.textMuted}
              style={[styles.input, styles.textAreaLarge]}
              multiline
            />

            <Text style={styles.label}>Meeting Summary</Text>
            <TextInput
              value={meetingSummary}
              onChangeText={setMeetingSummary}
              placeholder="Summary of what was covered during the meeting..."
              placeholderTextColor={C.textMuted}
              style={[styles.input, styles.textAreaLarge]}
              multiline
            />

            <Text style={styles.label}>Initial Caregiver Recommendations</Text>
            <TextInput
              value={recommendations}
              onChangeText={setRecommendations}
              placeholder="Initial suggestions for routines, safety setups, or doctor updates..."
              placeholderTextColor={C.textMuted}
              style={[styles.input, styles.textAreaLarge]}
              multiline
            />
          </View>
        )}

        {/* Bottom Navigation Buttons */}
        <View style={styles.navButtonsRow}>
          {step > 1 ? (
            <Pressable style={styles.navBtnPrev} onPress={() => setStep(prev => prev - 1)}>
              <Text style={styles.navBtnPrevText}>Previous</Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {step < 5 ? (
            <Pressable style={styles.navBtnNext} onPress={() => setStep(prev => prev + 1)}>
              <Text style={styles.navBtnNextText}>Next</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmitFinal}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Complete & Generate Plan'}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F4F7F6', paddingHorizontal: 0, paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: { padding: 4 },
  headerTitleWrap: { alignItems: 'center', flex: 1 },
  headerTitle: { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary },
  headerSub: { fontFamily: F.bold, fontSize: 12, color: C.primary, marginTop: 1 },
  draftBtnText: { fontFamily: F.bold, fontSize: 14, color: C.primary, paddingHorizontal: 4 },

  // Step Indicators
  indicatorContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  indicatorTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  indicatorStepNum: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#71717A',
    letterSpacing: 1.0,
  },
  indicatorStepTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.textPrimary,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E4E4E7',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: C.primary,
  },

  // Steps UI
  stepContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: F.extraBold,
    fontSize: 18,
    color: C.textPrimary,
    marginBottom: 14,
  },
  instructionsHelper: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },

  label: { fontFamily: F.bold, fontSize: 13, color: C.textSecondary, marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textPrimary,
    marginBottom: 12,
  },
  textArea: {
    height: 64,
    textAlignVertical: 'top',
  },
  textAreaLarge: {
    height: 100,
    textAlignVertical: 'top',
  },

  divider: {
    height: 1.5,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },

  // Horizontal Options Button Selectors
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  optionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  optionBtnActive: {
    borderColor: C.primary,
    backgroundColor: '#E6F4EA',
  },
  optionText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#64748B',
  },
  optionTextActive: {
    color: C.primary,
  },

  // Contacts step specific styles
  contactItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  contactNameText: { fontFamily: F.bold, fontSize: 14, color: C.textPrimary },
  contactPhoneText: { fontFamily: F.medium, fontSize: 12, color: C.textSecondary, marginTop: 2 },
  contactPriorityText: { fontFamily: F.bold, fontSize: 11, color: C.primary, marginTop: 2 },
  deleteContactBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addContactSection: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  addContactTitle: { fontFamily: F.bold, fontSize: 13, color: C.textPrimary, marginBottom: 8 },
  addContactInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: F.regular,
    fontSize: 13,
    marginBottom: 8,
  },
  addContactBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addContactBtnText: { fontFamily: F.bold, fontSize: 12, color: C.primaryText },

  // Checkbox lists
  checkboxList: {
    gap: 8,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  checkboxRowActive: {
    borderColor: C.primary,
    backgroundColor: '#E6F4EA',
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxSquareChecked: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.textPrimary,
  },

  // Vertical Option lists
  verticalOptionList: {
    gap: 8,
    marginBottom: 12,
  },
  verticalOptionBtn: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  verticalOptionBtnActive: {
    borderColor: C.primary,
    backgroundColor: '#E6F4EA',
  },
  verticalOptionText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#64748B',
  },
  verticalOptionTextActive: {
    color: C.primary,
  },

  // Footer Navigation Buttons
  navButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  navBtnPrev: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  navBtnPrevText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
  },
  navBtnNext: {
    flex: 1,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  navBtnNextText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.primaryText,
  },
  submitBtn: {
    flex: 1.5,
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
