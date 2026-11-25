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
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
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
    dob ? new Date(`${dob}T12:00:00`) : new Date(1955, 0, 1)
  );

  const calculateAge = (dobString: string): number | null => {
    if (!dobString) return null;
    const birthDate = new Date(`${dobString}T12:00:00`);
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
      const iso = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`;
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

  const [nameFocused, setNameFocused] = useState(false);
  const age = calculateAge(dob);
  const isComplete = name.trim().length > 0 && dob.length > 0 && gender.length > 0;

  return (
    <OnboardingLayout
      title={isSelf ? 'Let’s get to know you' : 'About your loved one'}
      currentStep={1}
      iconName="person-outline"
      backgroundVariant="mint"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >
      <View className="rounded-[20px] border border-care-border bg-white p-[16px]"
        style={{ shadowColor: '#244A42', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 2 }}>
        <Pressable onPress={pickPhoto} accessibilityRole="button"
          accessibilityLabel={photoUri ? 'Change profile photo' : 'Add optional profile photo'}
          className="mb-[16px] flex-row items-center gap-[12px] active:opacity-70">
          <View className="relative h-[56px] w-[56px]">
            {photoUri ? (
              <Image source={{ uri: photoUri }} className="h-[56px] w-[56px] rounded-full" />
            ) : (
              <View className="h-[56px] w-[56px] items-center justify-center rounded-full bg-brand-tint">
                <Ionicons name="camera-outline" size={23} color="#0E7A67" />
              </View>
            )}
            <View className="absolute bottom-0 right-0 h-[20px] w-[20px] items-center justify-center rounded-full border-2 border-white bg-brand">
              <Ionicons name="pencil" size={10} color="white" />
            </View>
          </View>
          <View className="flex-1">
            <Text className="font-inter-semibold text-[14px] text-care-ink">{photoUri ? 'Change photo' : 'Add profile photo'}</Text>
            <Text className="mt-[3px] font-inter-regular text-[12px] text-care-muted">Optional</Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color="#52605D" />
        </Pressable>

        <View className="mb-[14px] h-px bg-care-border" />

        <Text className="mb-[6px] font-inter-semibold text-[13px] text-care-ink">{isSelf ? 'Full name *' : 'Their full name *'}</Text>
        <View className={`mb-[14px] min-h-[48px] flex-row items-center gap-[10px] rounded-[12px] border bg-care-canvas px-[12px] ${nameFocused ? 'border-brand' : 'border-care-border'}`}>
          <Ionicons name="person-outline" size={18} color="#52605D" />
          <TextInput
            className="min-h-[48px] flex-1 font-inter-regular text-[14px] text-care-ink"
            accessibilityLabel="Full name"
            placeholder={isSelf ? 'Enter your full name' : 'Enter their full name'}
            placeholderTextColor="#68766F"
            value={name}
            onChangeText={(t) => onUpdate({ name: t })}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            autoCapitalize="words"
          />
        </View>

        <View className="mb-[6px] flex-row items-center justify-between gap-[8px]">
          <Text className="font-inter-semibold text-[13px] text-care-ink">Date of birth *</Text>
          {age !== null && age >= 0 && (
            <Text className="font-inter-medium text-[12px] text-brand-dark">{age} years old</Text>
          )}
        </View>
        <Pressable onPress={() => setShowDatePicker(true)} accessibilityRole="button"
          accessibilityLabel={`Date of birth, ${dob || 'not selected'}`}
          className="min-h-[48px] flex-row items-center gap-[10px] rounded-[12px] border border-care-border bg-care-canvas px-[12px] active:opacity-70">
          <Ionicons name="calendar-outline" size={18} color="#0E7A67" />
          <Text className={`flex-1 font-inter-regular text-[14px] ${dob ? 'text-care-ink' : 'text-care-muted'}`}>
            {dob ? new Date(`${dob}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select date of birth'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#52605D" />
        </Pressable>
        {showDatePicker && (
          <View>
            <DateTimePicker value={dateValue} mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()} minimumDate={new Date(1910, 0, 1)}
              onChange={handleDateChange} />
            {Platform.OS === 'ios' && (
              <Pressable onPress={() => setShowDatePicker(false)} accessibilityRole="button" className="min-h-[44px] items-end justify-center">
                <Text className="font-inter-semibold text-brand">Done</Text>
              </Pressable>
            )}
          </View>
        )}

        <Text className="mb-[8px] mt-[14px] font-inter-semibold text-[13px] text-care-ink">Gender *</Text>
        <View className="gap-[8px]" accessibilityRole="radiogroup">
          {[GENDER_OPTIONS.slice(0, 2), GENDER_OPTIONS.slice(2)].map((row, index) => (
            <View key={index} className="flex-row gap-[8px]">
              {row.map((g) => {
                const selected = gender === g;
                return (
                  <Pressable key={g} onPress={() => onUpdate({ gender: g })}
                    accessibilityRole="radio" accessibilityState={{ checked: selected }}
                    className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-[5px] rounded-[12px] border px-[6px] py-[8px] active:opacity-70 ${selected ? 'border-brand bg-care-selected' : 'border-care-border bg-white'}`}>
                    {selected && <Ionicons name="checkmark" size={14} color="#0E7A67" />}
                    <Text className={`shrink text-center font-inter-medium text-[13px] ${selected ? 'text-brand-dark' : 'text-care-ink'}`}>{g}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </OnboardingLayout>
  );
};
