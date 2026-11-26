
/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step1AboutCaregiver.tsx
 * Caregiver Onboarding Step 1: Personal details.
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

import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';

import {
  SUPPORTED_LANGUAGES,
  resolveLanguageCode,
} from '../../../constants/languages';

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

const GENDER_OPTIONS = [
  'Female',
  'Male',
  'Non-binary',
  'Prefer not to say',
];

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const calculateAge = (
  dobString: string
): number | null => {
  if (!dobString) return null;

  const birthDate = new Date(
    `${dobString}T12:00:00`
  );

  if (isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() < birthDate.getDate()
    )
  ) {
    age--;
  }

  return age;
};

export const Step1AboutCaregiver: React.FC<
  Step1Props
> = ({
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

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [showLanguages, setShowLanguages] =
    useState(false);

  const [focusedField, setFocusedField] =
    useState<'name' | 'city' | null>(null);

  const [dateValue, setDateValue] =
    useState<Date>(
      dob
        ? new Date(`${dob}T12:00:00`)
        : new Date(1990, 0, 1)
    );

  /* Minimum caregiver age: 18 */

  const maximumDate = new Date();

  maximumDate.setFullYear(
    maximumDate.getFullYear() - 18
  );

  // Handle leap-year rollover conservatively.
  if (maximumDate.getMonth() !== new Date().getMonth()) {
    maximumDate.setDate(0);
  }

  const minimumDate = new Date(1940, 0, 1);

  const age = calculateAge(dob);

  const selectedLanguage =
    SUPPORTED_LANGUAGES.find(
      (item) =>
        Boolean(language) &&
        resolveLanguageCode(language) === item.code
    );

  const isComplete =
    name.trim().length > 0 &&
    dob.length > 0 &&
    age !== null &&
    age >= 18 &&
    dob >= formatLocalDate(minimumDate) &&
    dob <= formatLocalDate(maximumDate) &&
    GENDER_OPTIONS.includes(gender) &&
    Boolean(selectedLanguage) &&
    city.trim().length > 0;

  const formattedDate = dob
    ? new Date(`${dob}T12:00:00`)
        .toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
    : '';

  /* Date selection */

  const handleDateChange = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'set' && selected) {
      setDateValue(selected);

      onUpdate({
        dob: formatLocalDate(selected),
      });
    }
  };

  /* Profile photo */

  const pickPhoto = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please allow access to your photos.'
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });

      if (
        !result.canceled &&
        result.assets[0]?.uri
      ) {
        onUpdate({
          photoUri: result.assets[0].uri,
        });
      }
    } catch {
      Alert.alert(
        'Unable to select photo',
        'Please try again.'
      );
    }
  };

  return (
    <OnboardingLayout
      title="Your professional profile"
      subtitle="Start with your personal details."
      currentStep={1}
      totalSteps={9}
      iconName="person-outline"
      backgroundVariant="ocean"
      layoutVariant="minimal"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >

      {/* Main white container */}

      <View
        className="rounded-[20px] border border-care-border bg-white p-[16px]"
        style={{
          shadowColor: '#254D51',
          shadowOpacity: 0.08,
          shadowOffset: {
            width: 0,
            height: 3,
          },
          shadowRadius: 8,
          elevation: 2,
        }}
      >

        {/* Profile photo */}

        <Pressable
          onPress={pickPhoto}
          accessibilityRole="button"
          accessibilityLabel={
            photoUri
              ? 'Change profile photo'
              : 'Add optional profile photo'
          }
          className="mb-[16px] flex-row items-center gap-[12px] active:opacity-70"
        >

          <View className="relative h-[56px] w-[56px]">

            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                className="h-[56px] w-[56px] rounded-full"
              />
            ) : (
              <View className="h-[56px] w-[56px] items-center justify-center rounded-full bg-[#D2F1F1]">
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color="#256C78"
                />
              </View>
            )}

            <View className="absolute bottom-0 right-0 h-[20px] w-[20px] items-center justify-center rounded-full border-2 border-white bg-brand">
              <Ionicons
                name="pencil"
                size={10}
                color="#FFFFFF"
              />
            </View>

          </View>

          <View className="flex-1">
            <Text className="font-inter-semibold text-[14px] text-care-ink">
              {photoUri
                ? 'Change profile photo'
                : 'Add profile photo'}
            </Text>

            <Text className="mt-[3px] font-inter-regular text-[12px] text-care-muted">
              Optional
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={17}
            color="#52605D"
          />

        </Pressable>

        <View className="mb-[16px] h-px bg-care-border" />

        {/* Full legal name */}

        <Text className="mb-[6px] font-inter-semibold text-[13px] text-care-ink">
          Full legal name *
        </Text>

        <View
          className={`mb-[16px] min-h-[48px] flex-row items-center gap-[10px] rounded-[12px] border bg-care-canvas px-[12px] ${
            focusedField === 'name'
              ? 'border-brand'
              : 'border-care-border'
          }`}
        >
          <Ionicons
            name="person-outline"
            size={18}
            color={
              focusedField === 'name'
                ? '#0E7A67'
                : '#256C78'
            }
          />

          <TextInput
            className="min-h-[48px] flex-1 font-inter-regular text-[14px] text-care-ink"
            accessibilityLabel="Full legal name"
            placeholder="Enter your full name"
            placeholderTextColor="#68766F"
            value={name}
            onChangeText={(text) =>
              onUpdate({ name: text })
            }
            onFocus={() =>
              setFocusedField('name')
            }
            onBlur={() =>
              setFocusedField(null)
            }
            autoCapitalize="words"
            autoComplete="name"
            autoCorrect={false}
          />
        </View>

        {/* Date of birth */}

        <View className="mb-[6px] flex-row items-center justify-between gap-[8px]">

          <Text className="font-inter-semibold text-[13px] text-care-ink">
            Date of birth *
          </Text>

          {age !== null && age >= 0 && (
            <Text className="font-inter-medium text-[12px] text-brand-dark">
              {age} years old
            </Text>
          )}

        </View>

        <Pressable
          onPress={() => {
            setShowLanguages(false);
            setShowDatePicker(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Date of birth, ${
            formattedDate || 'not selected'
          }`}
          className="min-h-[48px] flex-row items-center gap-[10px] rounded-[12px] border border-care-border bg-care-canvas px-[12px] active:opacity-70"
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color="#256C78"
          />

          <Text
            className={`flex-1 font-inter-regular text-[14px] ${
              dob
                ? 'text-care-ink'
                : 'text-care-muted'
            }`}
          >
            {formattedDate ||
              'Select date of birth'}
          </Text>

          <Ionicons
            name="chevron-down"
            size={16}
            color="#52605D"
          />
        </Pressable>

        {showDatePicker && (
          <View>

            <DateTimePicker
              value={
                dateValue > maximumDate
                  ? maximumDate
                  : dateValue < minimumDate
                    ? minimumDate
                    : dateValue
              }
              mode="date"
              display={
                Platform.OS === 'ios'
                  ? 'spinner'
                  : 'default'
              }
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              onChange={handleDateChange}
            />

            {Platform.OS === 'ios' && (
              <Pressable
                onPress={() =>
                  setShowDatePicker(false)
                }
                accessibilityRole="button"
                className="min-h-[44px] items-end justify-center"
              >
                <Text className="font-inter-semibold text-brand">
                  Done
                </Text>
              </Pressable>
            )}

          </View>
        )}

        {age !== null && age < 18 && (
          <Text className="mt-[6px] font-inter-regular text-[12px] text-red-600">
            Caregivers must be at least 18 years old.
          </Text>
        )}

        {/* Gender */}

        <Text className="mb-[8px] mt-[16px] font-inter-semibold text-[13px] text-care-ink">
          Gender *
        </Text>

        <View
          className="gap-[8px]"
          accessibilityRole="radiogroup"
        >
          {[
            GENDER_OPTIONS.slice(0, 2),
            GENDER_OPTIONS.slice(2, 4),
          ].map((row, index) => (
            <View
              key={index}
              className="flex-row gap-[8px]"
            >
              {row.map((item) => {
                const selected = gender === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() =>
                      onUpdate({ gender: item })
                    }
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: selected,
                    }}
                    className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-[5px] rounded-[12px] border px-[8px] py-[10px] active:opacity-70 ${
                      selected
                        ? 'border-brand bg-care-selected'
                        : 'border-care-border bg-care-canvas'
                    }`}
                  >
                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="#0E7A67"
                      />
                    )}

                    <Text
                      className={`shrink text-center font-inter-medium text-[13px] ${
                        selected
                          ? 'text-brand-dark'
                          : 'text-care-ink'
                      }`}
                    >
                      {item}
                    </Text>

                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* Primary working language */}

        <Text className="mb-[6px] mt-[16px] font-inter-semibold text-[13px] text-care-ink">
          Primary working language *
        </Text>

        <Pressable
          onPress={() => {
            setShowDatePicker(false);

            setShowLanguages(
              (previous) => !previous
            );
          }}
          accessibilityRole="button"
          accessibilityLabel={`Primary working language, ${
            selectedLanguage?.name ||
            'not selected'
          }`}
          accessibilityState={{
            expanded: showLanguages,
          }}
          className={`min-h-[48px] flex-row items-center gap-[10px] rounded-[12px] border bg-care-canvas px-[12px] active:opacity-70 ${
            showLanguages
              ? 'border-brand'
              : 'border-care-border'
          }`}
        >

          <Ionicons
            name="language-outline"
            size={19}
            color="#256C78"
          />

          <Text
            className={`flex-1 font-inter-medium text-[14px] ${
              selectedLanguage
                ? 'text-care-ink'
                : 'text-care-muted'
            }`}
          >
            {selectedLanguage?.name ||
              'Select language'}
          </Text>

          <Ionicons
            name={
              showLanguages
                ? 'chevron-up'
                : 'chevron-down'
            }
            size={16}
            color="#52605D"
          />

        </Pressable>

        {/* Expandable language selector */}

        {showLanguages && (
          <View
            accessibilityRole="radiogroup"
            className="mt-[8px] overflow-hidden rounded-[12px] border border-care-border bg-white"
          >
            {SUPPORTED_LANGUAGES.map(
              (item, index) => {
                const selected =
                  selectedLanguage?.code === item.code;

                return (
                  <Pressable
                    key={item.code}
                    onPress={() => {
                      onUpdate({
                        language: item.code,
                      });

                      setShowLanguages(false);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: selected,
                    }}
                    className={`min-h-[46px] flex-row items-center justify-between px-[14px] py-[10px] active:opacity-70 ${
                      selected
                        ? 'bg-care-selected'
                        : 'bg-white'
                    } ${
                      index <
                      SUPPORTED_LANGUAGES.length - 1
                        ? 'border-b border-care-border'
                        : ''
                    }`}
                  >

                    <Text
                      className={`font-inter-medium text-[13px] ${
                        selected
                          ? 'text-brand-dark'
                          : 'text-care-ink'
                      }`}
                    >
                      {item.name}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={17}
                        color="#0E7A67"
                      />
                    )}

                  </Pressable>
                );
              }
            )}
          </View>
        )}

        {/* Base city */}

        <Text className="mb-[6px] mt-[16px] font-inter-semibold text-[13px] text-care-ink">
          Base city / locality *
        </Text>

        <View
          className={`min-h-[48px] flex-row items-center gap-[10px] rounded-[12px] border bg-care-canvas px-[12px] ${
            focusedField === 'city'
              ? 'border-brand'
              : 'border-care-border'
          }`}
        >
          <Ionicons
            name="location-outline"
            size={18}
            color="#256C78"
          />

          <TextInput
            className="min-h-[48px] flex-1 font-inter-regular text-[14px] text-care-ink"
            accessibilityLabel="Base city or locality"
            placeholder="Enter your city or locality"
            placeholderTextColor="#68766F"
            value={city}
            onChangeText={(text) =>
              onUpdate({ city: text })
            }
            onFocus={() =>
              setFocusedField('city')
            }
            onBlur={() =>
              setFocusedField(null)
            }
            autoCapitalize="words"
          />
        </View>

      </View>

    </OnboardingLayout>
  );
};
