import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { useUserProfile } from '../context/userProfileContext';
import { writeSharedProfile } from '../utils/sharedProfile';
import { supabase } from '../utils/supabaseClient';
import { seedNewPatientTasks } from '../utils/seedPatientTasks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';

type Props = NativeStackScreenProps<HomeStackParamList, 'ProfileSetup'>;

export default function ProfileSetup({ navigation, route }: Props) {
  const { role } = route.params;
  const { saveProfile } = useUserProfile();
  const [dobDate, setDobDate] = React.useState<Date | null>(null);
  const [showDobPicker, setShowDobPicker] = React.useState(false);
  const [formData, setFormData] = React.useState({ name: '', dob: '', gender: '', city: '' });
  const [language, setLanguage] = React.useState<'English' | 'Kannada' | 'Hindi' | 'Telugu' | 'Tamil'>('English');
  const [languageOpen, setLanguageOpen] = React.useState(false);
  const [genderOpen, setGenderOpen] = React.useState(false);
  const [showErrors, setShowErrors] = React.useState(false);

  const formatDob = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const onDobChange = (event: { type: string }, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDobPicker(false);
    if (event.type === 'dismissed' || !selectedDate) return;
    setDobDate(selectedDate);
    setFormData((prev) => ({ ...prev, dob: formatDob(selectedDate) }));
  };

  const handleSubmit = async () => {
    const requiredOk = role === 'patient'
      ? formData.name.trim()
      : (
          formData.name.trim() &&
          formData.dob.trim() &&
          formData.gender.trim() &&
          formData.city.trim() &&
          language.trim()
        );
    if (!requiredOk) { setShowErrors(true); return; }

    const draft = {
      fullName: formData.name.trim(),
      role,
      dob: formData.dob,
      gender: formData.gender,
      city: formData.city,
      language,
    };
    // Save into userProfileContext (AsyncStorage)
    await saveProfile(draft);
    // Also write to shared profile so caregiver can read patient name
    if (role === 'patient') {
      await writeSharedProfile({ fullName: draft.fullName, role: 'patient', batteryLevel: 85 });
    } else {
      await writeSharedProfile({ fullName: draft.fullName, role: 'caregiver' });
    }

    // Persist role + name to Supabase so returning logins skip onboarding.
    // Fail-soft: onboarding should still continue even if backend write fails.
    try {
      const phone = await AsyncStorage.getItem('current_phone');
      if (phone) {
        // Use otp='0000' as default for new users (they already logged in via 0000)
        await supabase.from('mock_users').upsert({
          phone_number: phone,
          otp: '0000',
          role,
          full_name: draft.fullName,
          dob: draft.dob || null,
          gender: draft.gender || null,
          city: draft.city || null,
          language: draft.language || 'English',
        });

        // If patient, seed their default tasks
        if (role === 'patient') {
          await seedNewPatientTasks(phone);
        }

        // If caregiver, also register in the search directory
        if (role === 'caregiver') {
          await supabase.from('caregivers').upsert({
            id: phone,
            name: draft.fullName,
            specialty: 'Family Caregiver',
            bio: '',
            availability: 'Flexible',
            location: formData.city,
          });
        }
      }
    } catch (err) {
      console.warn('Profile backend sync failed, continuing local onboarding:', err);
    }

    if (role === 'caregiver') navigation.navigate('CaregiverPatients');
    else navigation.navigate('PatientDashboard');
  };


  const nameInvalid     = showErrors && !formData.name.trim();
  const dobInvalid      = showErrors && !formData.dob.trim();
  const genderInvalid   = showErrors && !formData.gender.trim();
  const cityInvalid     = showErrors && !formData.city.trim();
  const languageInvalid = showErrors && !language.trim();

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Text style={styles.heading}>Set up your profile</Text>
        <Text style={styles.subheading}>
          {role === 'caregiver' ? 'Caregiver account' : 'Patient account'}
        </Text>

        {/* Name */}
        <Text style={styles.label}>Full Name <Text style={styles.star}>*</Text></Text>
        <TextInput
          style={[styles.input, nameInvalid && styles.inputError]}
          value={formData.name}
          placeholder="Enter your name"
          placeholderTextColor={C.textMuted}
          onChangeText={(v) => setFormData((p) => ({ ...p, name: v }))}
        />
        {nameInvalid && <Text style={styles.errorText}>Name is required.</Text>}

        {/* DOB */}
        <Text style={styles.label}>Date of Birth <Text style={styles.star}>*</Text></Text>
        <Pressable
          onPress={() => setShowDobPicker((p) => !p)}
          style={[styles.input, styles.selectorInput, dobInvalid && styles.inputError]}
        >
          <Text style={[styles.selectorText, !formData.dob && styles.selectorPlaceholder]}>
            {formData.dob || 'Select date of birth'}
          </Text>
          <Text style={styles.chevron}>{showDobPicker ? '▴' : '▾'}</Text>
        </Pressable>
        {dobInvalid && <Text style={styles.errorText}>Date of birth is required.</Text>}
        {showDobPicker && Platform.OS === 'ios' && (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={dobDate ?? new Date(1971, 5, 14)}
              mode="date" display="spinner"
              maximumDate={new Date()}
              onChange={onDobChange}
            />
          </View>
        )}
        {showDobPicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={dobDate ?? new Date(1971, 5, 14)}
            mode="date" display="default"
            maximumDate={new Date()}
            onChange={onDobChange}
          />
        )}

        {/* Gender */}
        <Text style={styles.label}>Gender <Text style={styles.star}>*</Text></Text>
        <Pressable
          onPress={() => setGenderOpen((p) => !p)}
          style={[styles.input, styles.selectorInput, genderInvalid && styles.inputError]}
        >
          <Text style={[styles.selectorText, !formData.gender && styles.selectorPlaceholder]}>
            {formData.gender || 'Select gender'}
          </Text>
          <Text style={styles.chevron}>{genderOpen ? '▴' : '▾'}</Text>
        </Pressable>
        {genderInvalid && <Text style={styles.errorText}>Gender is required.</Text>}
        {genderOpen && (
          <View style={styles.dropdown}>
            {(['Male', 'Female', 'Other'] as const).map((opt) => (
              <Pressable
                key={opt}
                onPress={() => { setFormData((p) => ({ ...p, gender: opt })); setGenderOpen(false); }}
                style={[styles.dropdownItem, formData.gender === opt && styles.dropdownItemSelected]}
              >
                <Text style={[styles.dropdownText, formData.gender === opt && styles.dropdownTextSelected]}>
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Language */}
        <Text style={styles.label}>Preferred Language <Text style={styles.star}>*</Text></Text>
        <Pressable
          onPress={() => setLanguageOpen((p) => !p)}
          style={[styles.input, styles.selectorInput, languageInvalid && styles.inputError]}
        >
          <Text style={styles.selectorText}>{language}</Text>
          <Text style={styles.chevron}>{languageOpen ? '▴' : '▾'}</Text>
        </Pressable>
        {languageOpen && (
          <View style={styles.dropdown}>
            {(['English', 'Kannada', 'Hindi', 'Telugu', 'Tamil'] as const).map((opt) => (
              <Pressable
                key={opt}
                onPress={() => { setLanguage(opt); setLanguageOpen(false); }}
                style={[styles.dropdownItem, language === opt && styles.dropdownItemSelected]}
              >
                <Text style={[styles.dropdownText, language === opt && styles.dropdownTextSelected]}>
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* City */}
        <Text style={styles.label}>City <Text style={styles.star}>*</Text></Text>
        <TextInput
          style={[styles.input, cityInvalid && styles.inputError]}
          value={formData.city}
          placeholder="Enter your city"
          placeholderTextColor={C.textMuted}
          onChangeText={(v) => setFormData((p) => ({ ...p, city: v }))}
        />
        {cityInvalid && <Text style={styles.errorText}>City is required.</Text>}

        <Pressable
          style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>Continue</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 32 },

  heading: { fontFamily: F.bold, fontSize: 26, color: C.textPrimary, marginBottom: 4 },
  subheading: { fontFamily: F.regular, fontSize: 14, color: C.textSecondary, marginBottom: 24 },

  label: { fontFamily: F.semiBold, fontSize: 13, color: C.textBody, marginBottom: 8, marginLeft: 2 },
  star:  { color: C.error },

  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 16,
    fontFamily: F.regular,
    fontSize: 16,
    color: C.textPrimary,
    marginBottom: 4,
  },
  inputError: { borderColor: C.error },
  selectorInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectorText:  { fontFamily: F.regular, fontSize: 16, color: C.textPrimary },
  selectorPlaceholder: { color: C.textMuted },
  chevron: { fontFamily: F.regular, fontSize: 14, color: C.textSecondary },

  pickerWrap: {
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: -2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  dropdown: {
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingVertical: 4,
    marginTop: -2,
    marginBottom: 8,
  },
  dropdownItem: { paddingVertical: 11, paddingHorizontal: 16 },
  dropdownItemSelected: { backgroundColor: C.primaryLight },
  dropdownText: { fontFamily: F.regular, fontSize: 15, color: C.textPrimary },
  dropdownTextSelected: { fontFamily: F.bold, color: C.primary },

  errorText: { fontFamily: F.regular, color: C.error, fontSize: 12, marginBottom: 8, marginLeft: 4 },

  submitButton: {
    marginTop: 20,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  submitText: { fontFamily: F.bold, fontSize: 17, color: C.primaryText },
});
