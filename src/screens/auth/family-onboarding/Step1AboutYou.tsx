
/**
 * SureStep — src/screens/auth/family-onboarding/Step1AboutYou.tsx
 * Family Onboarding Step 1: Personal information.
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
  CORE_SUPPORTED_LANGUAGES,
  getLanguageDisplayName,
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
  'Male',
  'Female',
  'Other',
  'Prefer not to say',
];

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

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [showLanguages, setShowLanguages] =
    useState(false);

  const [focusedField, setFocusedField] =
    useState<'name' | 'city' | null>(null);

  const [dateValue, setDateValue] = useState<Date>(
    dob
      ? new Date(`${dob}T12:00:00`)
      : new Date(1985, 0, 1)
  );

  /* Calculate age */

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

      const year = selected.getFullYear();

      const month = String(
        selected.getMonth() + 1
      ).padStart(2, '0');

      const day = String(
        selected.getDate()
      ).padStart(2, '0');

      onUpdate({
        dob: `${year}-${month}-${day}`,
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

  const age = calculateAge(dob);

  const isComplete =
    name.trim().length > 0 &&
    dob.length > 0 &&
    gender.length > 0 &&
    city.trim().length > 0;

  const formattedDate = dob
    ? new Date(`${dob}T12:00:00`)
        .toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
    : '';

  return (
    <OnboardingLayout
      title="About you"
      subtitle="A little about yourself."
      currentStep={1}
      totalSteps={5}
      iconName="person-outline"
      backgroundVariant="lavender"
      layoutVariant="minimal"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >

      <View
        className="rounded-[20px] border border-care-border bg-white p-[16px]"
        style={{
          shadowColor: '#54456B',
          shadowOpacity: 0.07,
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
              <View className="h-[56px] w-[56px] items-center justify-center rounded-full bg-[#ECE3F8]">
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color="#655481"
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

        {/* Full name */}

        <Text className="mb-[6px] font-inter-semibold text-[13px] text-care-ink">
          Full name *
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
                : '#52605D'
            }
          />

          <TextInput
            className="min-h-[48px] flex-1 font-inter-regular text-[14px] text-care-ink"
            accessibilityLabel="Full name"
            placeholder="Enter your name"
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
            color="#0E7A67"
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
              value={dateValue}
              mode="date"
              display={
                Platform.OS === 'ios'
                  ? 'spinner'
                  : 'default'
              }
              maximumDate={new Date()}
              minimumDate={new Date(1920, 0, 1)}
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

        {/* City */}

        <Text className="mb-[6px] mt-[16px] font-inter-semibold text-[13px] text-care-ink">
          City *
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
            color="#0E7A67"
          />

          <TextInput
            className="min-h-[48px] flex-1 font-inter-regular text-[14px] text-care-ink"
            accessibilityLabel="City"
            placeholder="Enter your city"
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

        {/* Preferred language */}

        <Text className="mb-[6px] mt-[16px] font-inter-semibold text-[13px] text-care-ink">
          Preferred language
        </Text>

        <Pressable
          onPress={() => {
            setShowDatePicker(false);
            setShowLanguages(
              (previous) => !previous
            );
          }}
          accessibilityRole="button"
          accessibilityLabel={`Preferred language, ${
            language || 'not selected'
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
            color="#0E7A67"
          />

          <Text className="flex-1 font-inter-medium text-[14px] text-care-ink">
            {language ? getLanguageDisplayName(language) : 'Select language'}
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
            {CORE_SUPPORTED_LANGUAGES.map(
              (item, index) => {
                const selected =
                  resolveLanguageCode(language) === item.code;

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
                      CORE_SUPPORTED_LANGUAGES.length - 1
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

      </View>

    </OnboardingLayout>
  );
};
