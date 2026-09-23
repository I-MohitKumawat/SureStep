/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step1AboutCaregiver.tsx
 * Caregiver Onboarding Step 1: Personal Details & Identity.
 */
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';

interface Step1Props {
  name: string;
  dob: string;
  gender: string;
  language: string;
  city: string;
  photoUri?: string;
  onUpdate: (fields: {
    name?: string;
    dob?: string;
    gender?: string;
    language?: string;
    city?: string;
    photoUri?: string;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
const PRIMARY_LANGUAGES = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Marathi', 'Bengali'];

export const Step1AboutCaregiver: React.FC<Step1Props> = ({
  name,
  dob,
  gender,
  language,
  city,
  photoUri,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState<Date>(
    dob ? new Date(dob) : new Date(1990, 0, 1)
  );

  const calculateAge = (dobString: string): number | null => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selected) {
      setDateValue(selected);
      const iso = selected.toISOString().split('T')[0];
      onUpdate({ dob: iso });
    }
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Needed',
        'Please allow access to photos to select a profile photo.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      onUpdate({ photoUri: result.assets[0].uri });
    }
  };

  const age = calculateAge(dob);
  const isComplete =
    name.trim().length > 0 &&
    dob.length > 0 &&
    gender.length > 0 &&
    city.trim().length > 0;

  return (
    <OnboardingLayout
      title="Professional Caregiver Profile"
      subtitle="Tell us about yourself. This information will appear on your professional profile."
      currentStep={1}
      totalSteps={9}
      iconName="person"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >
      {/* Profile Photo Picker */}
      <View style={s.photoSection}>
        <Pressable onPress={pickPhoto} style={s.photoButton}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={s.photoPreview} />
          ) : (
            <View style={s.photoPlaceholder}>
              <Ionicons name="camera-outline" size={28} color={C.primary} />
              <Text style={s.photoText}>Add Photo</Text>
            </View>
          )}
          <View style={s.photoBadge}>
            <Ionicons name="pencil" size={12} color="#FFFFFF" />
          </View>
        </Pressable>
        <Text style={s.photoHint}>A clear face photo helps families identify you</Text>
      </View>

      {/* Name Input */}
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Full Legal Name *</Text>
        <View style={s.inputContainer}>
          <Ionicons name="person-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="e.g., Priya Sharma"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={(t) => onUpdate({ name: t })}
            autoCapitalize="words"
          />
        </View>
      </View>

      {/* Date of Birth */}
      <View style={s.fieldGroup}>
        <View style={s.labelRow}>
          <Text style={s.fieldLabel}>Date of Birth *</Text>
          {age !== null && age >= 0 ? (
            <View style={s.ageBadge}>
              <Text style={s.ageBadgeText}>{age} years old</Text>
            </View>
          ) : null}
        </View>
        <Pressable
          style={s.datePickerBtn}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={18} color={C.primary} style={s.inputIcon} />
          <Text style={[s.dateText, !dob && s.placeholderText]}>
            {dob ? dob : 'Select date of birth'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date(new Date().getFullYear() - 18, 11, 31)}
            minimumDate={new Date(1940, 0, 1)}
            onChange={handleDateChange}
          />
        )}
      </View>

      {/* Gender Selection */}
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Gender *</Text>
        <View style={s.chipsRow}>
          {GENDER_OPTIONS.map((opt) => {
            const isSelected = gender === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => onUpdate({ gender: opt })}
                style={[s.chip, isSelected && s.chipSelected]}
              >
                <Text style={[s.chipText, isSelected && s.chipTextSelected]}>
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Primary Language */}
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Primary Working Language *</Text>
        <View style={s.chipsRow}>
          {PRIMARY_LANGUAGES.map((lang) => {
            const isSelected = language === lang;
            return (
              <Pressable
                key={lang}
                onPress={() => onUpdate({ language: lang })}
                style={[s.chip, isSelected && s.chipSelected]}
              >
                <Text style={[s.chipText, isSelected && s.chipTextSelected]}>
                  {lang}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Base City */}
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Base City / Locality *</Text>
        <View style={s.inputContainer}>
          <Ionicons name="location-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="e.g., Bengaluru (Indiranagar / Koramangala)"
            placeholderTextColor="#9CA3AF"
            value={city}
            onChangeText={(t) => onUpdate({ city: t })}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
};

const s = StyleSheet.create({
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoButton: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'visible',
  },
  photoPreview: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  photoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.primary,
    borderStyle: 'dashed',
  },
  photoText: {
    fontSize: 11,
    fontFamily: F.medium,
    color: C.primary,
    marginTop: 4,
  },
  photoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: C.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoHint: {
    fontSize: 12,
    fontFamily: F.regular,
    color: C.textSecondary,
    marginTop: 8,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: F.bold,
    color: C.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  ageBadge: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  ageBadgeText: {
    fontSize: 11,
    fontFamily: F.medium,
    color: C.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: F.regular,
    color: C.textPrimary,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    fontFamily: F.regular,
    color: C.textPrimary,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: F.medium,
    color: C.textSecondary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontFamily: F.bold,
  },
});
