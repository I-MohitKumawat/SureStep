/**
 * SureStep — src/screens/auth/patient-onboarding/Step1AboutPatient.tsx
 * Step 1: Name, DOB, Gender, and optional Photo.
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
import type { OnboardingIntent } from '../../../types/navigation.types';

interface Step1Props {
  intent: OnboardingIntent;
  name: string;
  dob: string;
  gender: string;
  photoUri?: string;
  onUpdate: (fields: { name?: string; dob?: string; gender?: string; photoUri?: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export const Step1AboutPatient: React.FC<Step1Props> = ({
  intent,
  name,
  dob,
  gender,
  photoUri,
  onUpdate,
  onNext,
  onBack,
}) => {
  const isSelf = intent === 'RECEIVING_CARE';
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState<Date>(
    dob ? new Date(dob) : new Date(1955, 0, 1)
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
  const isComplete = name.trim().length > 0 && dob.length > 0 && gender.length > 0;

  return (
    <OnboardingLayout
      title={isSelf ? 'Tell us your name & details' : 'Tell us about the person receiving care'}
      subtitle={
        isSelf
          ? 'Let’s personalize your SureStep companion experience.'
          : 'We will configure reminders and care tailored to them.'
      }
      currentStep={1}
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
        <Text style={s.fieldLabel}>
          {isSelf ? 'Full Name *' : 'Their Full Name *'}
        </Text>
        <View style={s.inputContainer}>
          <Ionicons name="person-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder={isSelf ? 'Enter your full name' : 'Enter their full name'}
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
            minimumDate={new Date(1910, 0, 1)}
            onChange={handleDateChange}
          />
        )}
      </View>

      {/* Gender Selection */}
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Gender *</Text>
        <View style={s.genderRow}>
          {GENDER_OPTIONS.map((g) => {
            const isSelected = gender === g;
            return (
              <Pressable
                key={g}
                onPress={() => onUpdate({ gender: g })}
                style={[s.genderPill, isSelected && s.genderPillSelected]}
              >
                <Text style={[s.genderPillText, isSelected && s.genderPillTextSelected]}>
                  {g}
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
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  genderPillSelected: {
    backgroundColor: '#F0FBF8',
    borderColor: C.primary,
  },
  genderPillText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#374151',
  },
  genderPillTextSelected: {
    color: C.primaryDark,
    fontFamily: F.bold,
  },
});
