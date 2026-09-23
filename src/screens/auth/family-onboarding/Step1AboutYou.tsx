/**
 * SureStep — src/screens/auth/family-onboarding/Step1AboutYou.tsx
 * Family Onboarding Step 1: Name, DOB, Gender, Language, City, and optional Photo.
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

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam'];

export const Step1AboutYou: React.FC<Step1Props> = ({
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
    dob ? new Date(dob) : new Date(1985, 0, 1)
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
      title="Let's get to know you"
      subtitle="Tell us a bit about yourself so your family and care circle can identify you."
      currentStep={1}
      totalSteps={5}
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
      </View>

      {/* Name Input */}
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Your Full Name *</Text>
        <View style={s.inputContainer}>
          <Ionicons name="person-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="e.g., Anita Kumawat"
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
            maximumDate={new Date()}
            minimumDate={new Date(1920, 0, 1)}
            onChange={handleDateChange}
          />
        )}
      </View>

      {/* Gender Selection */}
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Gender *</Text>
        <View style={s.pillsRow}>
          {GENDER_OPTIONS.map((g) => {
            const isSelected = gender === g;
            return (
              <Pressable
                key={g}
                onPress={() => onUpdate({ gender: g })}
                style={[s.pill, isSelected && s.pillSelected]}
              >
                <Text style={[s.pillText, isSelected && s.pillTextSelected]}>
                  {g}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* City / General Location */}
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>City or General Area *</Text>
        <View style={s.inputContainer}>
          <Ionicons name="location-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="e.g., Bengaluru, Mumbai, London"
            placeholderTextColor="#9CA3AF"
            value={city}
            onChangeText={(t) => onUpdate({ city: t })}
            autoCapitalize="words"
          />
        </View>
      </View>

      {/* Preferred Language */}
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Preferred Language</Text>
        <View style={s.pillsRow}>
          {LANGUAGE_OPTIONS.map((lang) => {
            const isSelected = language === lang;
            return (
              <Pressable
                key={lang}
                onPress={() => onUpdate({ language: lang })}
                style={[s.pill, isSelected && s.pillSelected]}
              >
                <Text style={[s.pillText, isSelected && s.pillTextSelected]}>
                  {lang}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </OnboardingLayout>
  );
};

const s = StyleSheet.create({
  photoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoButton: {
    position: 'relative',
  },
  photoPreview: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: C.primary,
  },
  photoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.primary,
    marginTop: 2,
  },
  photoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: C.textPrimary,
    marginBottom: 6,
  },
  ageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#E0F5F0',
  },
  ageBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 11,
    color: C.primaryDark,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 15,
    color: C.textPrimary,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
  },
  dateText: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 15,
    color: C.textPrimary,
  },
  placeholderText: {
    color: '#9CA3AF',
    fontFamily: F.regular,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  pillSelected: {
    backgroundColor: '#F0FBF8',
    borderColor: C.primary,
  },
  pillText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#374151',
  },
  pillTextSelected: {
    color: C.primaryDark,
    fontFamily: F.bold,
  },
});
