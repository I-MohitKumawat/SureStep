/**
 * SureStep — src/screens/patient/PatientPersonalDetailsScreen.tsx
 * Dedicated Patient Personal Details screen for viewing and updating the 9 authoritative fields:
 * 1. Name
 * 2. Date of Birth
 * 3. Gender
 * 4. Preferred Language
 * 5. City / Location
 * 6. Living Arrangement
 * 7. Assistance / Care Needs
 * 8. Safety Concerns
 * 9. Emergency Contact (Name, Phone, Relation)
 */
import React, { useCallback, useEffect, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useTheme } from '../../theme/ThemeContext';
import { F } from '../../theme/fonts';
import { useAuth } from '../../hooks/useAuth';
import { getPatientProfile, updatePatientProfile } from '../../services/userService';
import type { PatientStackParams } from '../../types/navigation.types';

type Props = NativeStackScreenProps<PatientStackParams, 'PatientPersonalDetailsScreen'>;

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam'];
const LIVING_OPTIONS = [
  { id: 'ALONE', label: 'Living Alone' },
  { id: 'WITH_SPOUSE', label: 'With Spouse / Partner' },
  { id: 'WITH_FAMILY', label: 'With Family / Children' },
  { id: 'WITH_CAREGIVER', label: 'With In-Home Caregiver' },
  { id: 'ASSISTED_LIVING', label: 'Assisted Living Facility' },
  { id: 'OTHER', label: 'Other Arrangement' },
];

const CARE_NEEDS_OPTIONS = [
  { id: 'medications', label: 'Medication Reminders' },
  { id: 'meals', label: 'Meal Tracking' },
  { id: 'hydration', label: 'Hydration Tracking' },
  { id: 'safety_navigation', label: 'Safe Navigation / Wandering' },
  { id: 'orientation', label: 'Orientation & Time' },
  { id: 'mobility', label: 'Mobility & Walking' },
];

const SAFETY_CONCERNS_OPTIONS = [
  { id: 'none', label: 'None / Low Risk' },
  { id: 'wandering', label: 'Wandering / Leaving Home' },
  { id: 'fall_risk', label: 'Fall Risk' },
  { id: 'disorientation_dusk', label: 'Disorientation at Dusk' },
  { id: 'forgetting_appliances', label: 'Stove / Appliance Safety' },
];

export const PatientPersonalDetailsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode } = useTheme();
  const { user, refreshUser } = useAuth();
  const isDark = mode === 'dark';

  const patientId = user?.id || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [language, setLanguage] = useState('English');
  const [city, setCity] = useState('');
  const [living, setLiving] = useState('');
  const [careNeeds, setCareNeeds] = useState<string[]>([]);
  const [safetyConcerns, setSafetyConcerns] = useState<string[]>([]);
  const [emergName, setEmergName] = useState('');
  const [emergPhone, setEmergPhone] = useState('');
  const [emergRel, setEmergRel] = useState('');

  const loadProfile = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getPatientProfile(patientId);
      const data = res?.data?.profile || res?.data?.data || res?.data || res;
      if (data) {
        setName(data.name || user?.name || '');
        setDob(data.date_of_birth ? String(data.date_of_birth).split('T')[0] : '');
        setGender(data.gender || '');
        setLanguage(data.preferred_language || user?.preferred_language || 'English');
        setCity(data.city || user?.city || '');
        setLiving(data.living_arrangement || '');
        setCareNeeds(Array.isArray(data.care_needs) ? data.care_needs : []);
        setSafetyConcerns(Array.isArray(data.safety_concerns) ? data.safety_concerns : []);
        setEmergName(data.emergency_contact_name || '');
        setEmergPhone(data.emergency_contact_phone || '');
        setEmergRel(data.emergency_contact_relation || '');
      }
    } catch (err) {
      console.warn('[PatientPersonalDetailsScreen] Load failed:', err);
      if (user) {
        setName(user.name || '');
        setLanguage(user.preferred_language || 'English');
        setCity(user.city || '');
        setDob(user.date_of_birth || '');
        setGender(user.gender || '');
      }
    } finally {
      setLoading(false);
    }
  }, [patientId, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const toggleCareNeed = (id: string) => {
    setCareNeeds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSafetyConcern = (id: string) => {
    if (id === 'none') {
      setSafetyConcerns(['none']);
      return;
    }
    const filtered = safetyConcerns.filter((c) => c !== 'none');
    setSafetyConcerns(
      filtered.includes(id) ? filtered.filter((c) => c !== id) : [...filtered, id]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }

    setSaving(true);
    try {
      await updatePatientProfile({
        name: name.trim(),
        date_of_birth: dob.trim() || undefined,
        gender: gender || undefined,
        preferred_language: language,
        city: city.trim() || undefined,
        living_arrangement: living || undefined,
        care_needs: careNeeds,
        safety_concerns: safetyConcerns,
        emergency_contact_name: emergName.trim() || undefined,
        emergency_contact_phone: emergPhone.trim() || undefined,
        emergency_contact_relation: emergRel.trim() || undefined,
      });

      await refreshUser();
      setIsEditing(false);
      Alert.alert('Saved', 'Your personal details have been updated.');
    } catch (err: any) {
      console.error('[PatientPersonalDetailsScreen] Save error:', err);
      Alert.alert('Save Error', err?.response?.data?.error?.message || 'Could not update details.');
    } finally {
      setSaving(false);
    }
  };

  const livingLabel = LIVING_OPTIONS.find((o) => o.id === living)?.label || living || 'Not specified';

  return (
    <ScreenContainer edges={['top', 'left', 'right']} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top, 8) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="chevron-back" size={26} color={isDark ? '#FFFFFF' : '#0E5A4A'} />
            </Pressable>

            <Text
              style={[
                styles.headerTitle,
                { color: isDark ? '#FFFFFF' : '#111827' },
              ]}
            >
              Personal Details
            </Text>

            <Pressable
              onPress={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              disabled={saving || loading}
              style={({ pressed }) => [
                styles.editBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#0E5A4A" />
              ) : (
                <Text style={styles.editBtnText}>
                  {isEditing ? 'Save' : 'Edit'}
                </Text>
              )}
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#0E5A4A" />
            </View>
          ) : (
            <View style={styles.body}>
              {/* Identity Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeader}>IDENTITY</Text>

                {/* Name */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Your name"
                      placeholderTextColor="#9CA3AF"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{name || '—'}</Text>
                  )}
                </View>

                <View style={styles.divider} />

                {/* Date of Birth */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Date of Birth</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={dob}
                      onChangeText={setDob}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9CA3AF"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{dob || '—'}</Text>
                  )}
                </View>

                <View style={styles.divider} />

                {/* Gender */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  {isEditing ? (
                    <View style={styles.chipWrap}>
                      {GENDER_OPTIONS.map((g) => (
                        <Pressable
                          key={g}
                          onPress={() => setGender(g)}
                          style={[
                            styles.chip,
                            gender === g && styles.chipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              gender === g && styles.chipTextActive,
                            ]}
                          >
                            {g}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.fieldValue}>{gender || '—'}</Text>
                  )}
                </View>

                <View style={styles.divider} />

                {/* Preferred Language */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Preferred Language</Text>
                  {isEditing ? (
                    <View style={styles.chipWrap}>
                      {LANGUAGE_OPTIONS.map((l) => (
                        <Pressable
                          key={l}
                          onPress={() => setLanguage(l)}
                          style={[
                            styles.chip,
                            language === l && styles.chipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              language === l && styles.chipTextActive,
                            ]}
                          >
                            {l}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.fieldValue}>{language || 'English'}</Text>
                  )}
                </View>

                <View style={styles.divider} />

                {/* City */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>City / Location</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={city}
                      onChangeText={setCity}
                      placeholder="e.g., Bengaluru"
                      placeholderTextColor="#9CA3AF"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{city || '—'}</Text>
                  )}
                </View>
              </View>

              {/* Living & Care Environment */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeader}>LIVING & CARE</Text>

                {/* Living Arrangement */}
                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>Living Arrangement</Text>
                  {isEditing ? (
                    <View style={[styles.chipWrap, { marginTop: 8 }]}>
                      {LIVING_OPTIONS.map((opt) => (
                        <Pressable
                          key={opt.id}
                          onPress={() => setLiving(opt.id)}
                          style={[
                            styles.chip,
                            living === opt.id && styles.chipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              living === opt.id && styles.chipTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.fieldValue, { marginTop: 4 }]}>{livingLabel}</Text>
                  )}
                </View>

                <View style={styles.divider} />

                {/* Assistance / Care Needs */}
                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>Assistance Needs</Text>
                  {isEditing ? (
                    <View style={[styles.chipWrap, { marginTop: 8 }]}>
                      {CARE_NEEDS_OPTIONS.map((opt) => {
                        const selected = careNeeds.includes(opt.id);
                        return (
                          <Pressable
                            key={opt.id}
                            onPress={() => toggleCareNeed(opt.id)}
                            style={[styles.chip, selected && styles.chipActive]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                selected && styles.chipTextActive,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={[styles.chipWrap, { marginTop: 8 }]}>
                      {careNeeds.length > 0 ? (
                        careNeeds.map((id) => {
                          const label = CARE_NEEDS_OPTIONS.find((o) => o.id === id)?.label || id;
                          return (
                            <View key={id} style={styles.readOnlyChip}>
                              <Text style={styles.readOnlyChipText}>{label}</Text>
                            </View>
                          );
                        })
                      ) : (
                        <Text style={styles.fieldValue}>None specified</Text>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.divider} />

                {/* Safety Concerns */}
                <View style={styles.fieldColumn}>
                  <Text style={styles.fieldLabel}>Safety & Wandering Information</Text>
                  {isEditing ? (
                    <View style={[styles.chipWrap, { marginTop: 8 }]}>
                      {SAFETY_CONCERNS_OPTIONS.map((opt) => {
                        const selected = safetyConcerns.includes(opt.id);
                        return (
                          <Pressable
                            key={opt.id}
                            onPress={() => toggleSafetyConcern(opt.id)}
                            style={[styles.chip, selected && styles.chipActive]}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                selected && styles.chipTextActive,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={[styles.chipWrap, { marginTop: 8 }]}>
                      {safetyConcerns.length > 0 ? (
                        safetyConcerns.map((id) => {
                          const label = SAFETY_CONCERNS_OPTIONS.find((o) => o.id === id)?.label || id;
                          return (
                            <View key={id} style={styles.readOnlyChip}>
                              <Text style={styles.readOnlyChipText}>{label}</Text>
                            </View>
                          );
                        })
                      ) : (
                        <Text style={styles.fieldValue}>None specified</Text>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {/* Emergency Contact */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeader}>PRIMARY EMERGENCY CONTACT</Text>

                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Contact Name</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={emergName}
                      onChangeText={setEmergName}
                      placeholder="e.g. Anita Sharma"
                      placeholderTextColor="#9CA3AF"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{emergName || '—'}</Text>
                  )}
                </View>

                <View style={styles.divider} />

                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Phone Number</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={emergPhone}
                      onChangeText={setEmergPhone}
                      placeholder="e.g. +91 9876543210"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{emergPhone || '—'}</Text>
                  )}
                </View>

                <View style={styles.divider} />

                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Relationship</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={emergRel}
                      onChangeText={setEmergRel}
                      placeholder="e.g. Daughter, Spouse"
                      placeholderTextColor="#9CA3AF"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{emergRel || '—'}</Text>
                  )}
                </View>
              </View>

              {isEditing && (
                <View style={styles.bottomSaveWrap}>
                  <Pressable
                    onPress={handleSave}
                    disabled={saving}
                    style={({ pressed }) => [
                      styles.primarySaveBtn,
                      pressed && { opacity: 0.9 },
                      saving && { opacity: 0.6 },
                    ]}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primarySaveText}>Save Changes</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  backBtn: {
    padding: 4,
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    flex: 1,
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#E6F4F1',
  },
  editBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#0E5A4A',
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 16,
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
  },
  sectionHeader: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#0E5A4A',
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  fieldColumn: {
    paddingVertical: 8,
  },
  fieldLabel: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#52605D',
  },
  fieldValue: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#111827',
  },
  input: {
    fontFamily: F.medium,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F7F6F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 160,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EAE6DF',
    marginVertical: 4,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0E5A4A',
  },
  chipText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#4B5563',
  },
  chipTextActive: {
    fontFamily: F.bold,
    color: '#0E5A4A',
  },
  readOnlyChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#F7F6F2',
    borderWidth: 1,
    borderColor: '#EAE6DF',
  },
  readOnlyChipText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#374151',
  },
  bottomSaveWrap: {
    marginTop: 8,
    marginBottom: 16,
  },
  primarySaveBtn: {
    backgroundColor: '#0E5A4A',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarySaveText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
