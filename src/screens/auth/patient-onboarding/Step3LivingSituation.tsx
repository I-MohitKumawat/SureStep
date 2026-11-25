
/**
 * SureStep — src/screens/auth/patient-onboarding/Step3LivingSituation.tsx
 * Step 3: Location / City and Living arrangement.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import type { OnboardingIntent } from '../../../types/navigation.types';

interface Step3Props {
  intent: OnboardingIntent;
  city: string;
  livingArrangement: string;
  onUpdate: (fields: {
    city?: string;
    livingArrangement?: string;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

const LIVING_ARRANGEMENTS = [
  {
    id: 'ALONE',
    title: 'Living independently',
    desc: 'Solo household',
    icon: 'home-outline' as const,
  },
  {
    id: 'WITH_SPOUSE',
    title: 'With spouse / partner',
    desc: 'Living together at home',
    icon: 'heart-outline' as const,
  },
  {
    id: 'WITH_FAMILY',
    title: 'With family / children',
    desc: 'Multi-generational household',
    icon: 'people-outline' as const,
  },
  {
    id: 'WITH_CAREGIVER',
    title: 'With in-home caregiver',
    desc: 'Assisted daily by a care aide',
    icon: 'medkit-outline' as const,
  },
  {
    id: 'ASSISTED_LIVING',
    title: 'Senior living community',
    desc: 'Residential assisted community',
    icon: 'business-outline' as const,
  },
  {
    id: 'OTHER',
    title: 'Other arrangement',
    desc: 'Custom living environment',
    icon: 'help-circle-outline' as const,
  },
];

export const Step3LivingSituation: React.FC<Step3Props> = ({
  intent,
  city,
  livingArrangement,
  onUpdate,
  onNext,
  onBack,
}) => {
  const isSelf = intent === 'RECEIVING_CARE';

  const [detecting, setDetecting] = useState(false);
  const [cityFocused, setCityFocused] = useState(false);

  const handleDetectLocation = async () => {
    setDetecting(true);

    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please allow location permission to auto-detect your city.'
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const reverse = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      const item = reverse?.[0];

      const cityName =
        item?.city ||
        item?.subregion ||
        item?.district ||
        item?.region ||
        '';

      if (cityName) {
        onUpdate({ city: cityName });
      } else {
        Alert.alert(
          'Location Notice',
          'Could not determine city name. Please type manually.'
        );
      }
    } catch (err) {
      console.warn('Location detection notice:', err);

      Alert.alert(
        'Location Notice',
        'Could not detect location. Please type your city.'
      );
    } finally {
      setDetecting(false);
    }
  };

  const isComplete =
    city.trim().length > 0 &&
    livingArrangement.length > 0;

  return (
    <OnboardingLayout
      title={
        isSelf
          ? 'Your Home & Living Setup'
          : 'Home & Living Setup'
      }
      currentStep={3}
      iconName="home-outline"
      backgroundVariant="mint"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >
      <View
        className="rounded-[20px] border border-care-border bg-white p-[16px]"
        style={{
          shadowColor: '#244A42',
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: 3 },
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* City / Area */}

        <Text className="mb-[6px] font-inter-semibold text-[13px] text-care-ink">
          City or area *
        </Text>

        <View className="flex-row items-center gap-[8px]">
          <View
            className={`min-h-[48px] flex-1 flex-row items-center gap-[10px] rounded-[12px] border bg-care-canvas px-[12px] ${
              cityFocused
                ? 'border-brand'
                : 'border-care-border'
            }`}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={cityFocused ? '#0E7A67' : '#52605D'}
            />

            <TextInput
              className="min-h-[48px] flex-1 font-inter-regular text-[14px] text-care-ink"
              accessibilityLabel="City or area"
              placeholder="Enter city or area"
              placeholderTextColor="#68766F"
              value={city}
              onChangeText={(text) => onUpdate({ city: text })}
              onFocus={() => setCityFocused(true)}
              onBlur={() => setCityFocused(false)}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>

          <Pressable
            onPress={handleDetectLocation}
            disabled={detecting}
            accessibilityRole="button"
            accessibilityLabel="Detect current location"
            accessibilityState={{
              disabled: detecting,
              busy: detecting,
            }}
            className={`h-[50px] w-[50px] items-center justify-center rounded-[12px] border border-care-border bg-brand-tint active:opacity-70 ${
              detecting ? 'opacity-60' : ''
            }`}
          >
            {detecting ? (
              <ActivityIndicator
                size="small"
                color="#0E7A67"
              />
            ) : (
              <Ionicons
                name="locate-outline"
                size={21}
                color="#0E7A67"
              />
            )}
          </Pressable>
        </View>

        <Text className="mt-[6px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
          {isSelf
            ? 'Enter your city or use your current location.'
            : 'Enter their city or use your current location if you are with them.'}
        </Text>

        {/* Divider */}

        <View className="my-[16px] h-px bg-care-border" />

        {/* Living Arrangement */}

        <Text className="mb-[4px] font-inter-semibold text-[13px] text-care-ink">
          Living arrangement *
        </Text>

        <Text className="mb-[12px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
          {isSelf
            ? 'Who do you currently live with?'
            : 'Who lives at home with them?'}
        </Text>

        <View
          className="gap-[8px]"
          accessibilityRole="radiogroup"
        >
          {LIVING_ARRANGEMENTS.map((arrangement) => {
            const selected =
              livingArrangement === arrangement.id;

            return (
              <Pressable
                key={arrangement.id}
                onPress={() =>
                  onUpdate({
                    livingArrangement: arrangement.id,
                  })
                }
                accessibilityRole="radio"
                accessibilityLabel={arrangement.title}
                accessibilityState={{ checked: selected }}
                className={`min-h-[64px] flex-row items-center gap-[10px] rounded-[12px] border px-[10px] py-[10px] active:opacity-70 ${
                  selected
                    ? 'border-brand bg-care-selected'
                    : 'border-care-border bg-white'
                }`}
              >
                {/* Arrangement Icon */}

                <View
                  className={`h-[36px] w-[36px] items-center justify-center rounded-[10px] ${
                    selected
                      ? 'bg-brand-tint'
                      : 'bg-care-canvas'
                  }`}
                >
                  <Ionicons
                    name={arrangement.icon}
                    size={19}
                    color={
                      selected ? '#0E7A67' : '#52605D'
                    }
                  />
                </View>

                {/* Arrangement Details */}

                <View className="flex-1">
                  <Text
                    className={`font-inter-medium text-[13px] ${
                      selected
                        ? 'text-brand-dark'
                        : 'text-care-ink'
                    }`}
                  >
                    {arrangement.title}
                  </Text>

                  <Text className="mt-[3px] font-inter-regular text-[11px] leading-[16px] text-care-muted">
                    {arrangement.desc}
                  </Text>
                </View>

                {/* Selection Indicator */}

                <View
                  className={`h-[20px] w-[20px] items-center justify-center rounded-full border ${
                    selected
                      ? 'border-brand bg-brand'
                      : 'border-care-border bg-white'
                  }`}
                >
                  {selected && (
                    <Ionicons
                      name="checkmark"
                      size={13}
                      color="#FFFFFF"
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </OnboardingLayout>
  );
};
