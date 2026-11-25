
/**
 * SureStep — src/screens/auth/patient-onboarding/Step8EmergencyContact.tsx
 * Step 8: Optional emergency contact with custom confirmation modal.
 */

import React, { useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import type { OnboardingIntent } from '../../../types/navigation.types';

interface Step8Props {
  intent: OnboardingIntent;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  onUpdate: (fields: {
    emergencyContactName?: string;
    emergencyContactRelation?: string;
    emergencyContactPhone?: string;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

const RELATION_PRESETS = [
  'Spouse',
  'Son',
  'Daughter',
  'Sibling',
  'Grandchild',
  'Caregiver',
  'Friend',
  'Other',
];

export const Step8EmergencyContact: React.FC<Step8Props> = ({
  intent,
  emergencyContactName,
  emergencyContactRelation,
  emergencyContactPhone,
  onUpdate,
  onNext,
  onBack,
}) => {
  const isSelf = intent === 'RECEIVING_CARE';

  const [nameFocused, setNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);

  const phoneDigits = emergencyContactPhone.replace(/\D/g, '');

  const isPhoneValid =
    /^\+?[\d()\s-]+$/.test(emergencyContactPhone.trim()) &&
    phoneDigits.length >= 10 &&
    phoneDigits.length <= 15;

  const isComplete =
    emergencyContactName.trim().length > 0 &&
    emergencyContactRelation.trim().length > 0 &&
    isPhoneValid;

  const hasContactDetails =
    emergencyContactName.trim().length > 0 ||
    emergencyContactPhone.trim().length > 0 ||
    emergencyContactRelation.trim().length > 0;

  const relationRows = [
    RELATION_PRESETS.slice(0, 2),
    RELATION_PRESETS.slice(2, 4),
    RELATION_PRESETS.slice(4, 6),
    RELATION_PRESETS.slice(6, 8),
  ];

  /* Open confirmation popup */

  const handleSkip = () => {
    Keyboard.dismiss();
    setShowSkipModal(true);
  };

  /* Confirm skipping */

  const confirmSkip = () => {
    setShowSkipModal(false);

    // Clear incomplete contact information.
    onUpdate({
      emergencyContactName: '',
      emergencyContactRelation: '',
      emergencyContactPhone: '',
    });

    onNext();
  };

  /* Continue */

  const handleContinue = () => {
    Keyboard.dismiss();

    if (isComplete) {
      onNext();
      return;
    }

    // Incomplete or empty information requires confirmation.
    setShowSkipModal(true);
  };

  return (
    <OnboardingLayout
      title={
        isSelf
          ? 'Your emergency contact'
          : 'Emergency contact'
      }
      currentStep={8}
      iconName="call-outline"
      backgroundVariant="mint"
      onBack={onBack}
      onNext={handleContinue}
      isNextDisabled={false}
    >
      <View className="gap-[12px]">

        <Text className="font-inter-regular text-[13px] leading-[20px] text-care-muted">
          {isSelf
            ? 'Someone we can contact if you need help.'
            : 'Someone we can contact if they need help.'}
        </Text>

        {/* Main white card */}

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

          {/* Contact name */}

          <View className="mb-[6px] flex-row items-center justify-between">
            <Text className="font-inter-semibold text-[13px] text-care-ink">
              Contact name
            </Text>

            <Text className="font-inter-regular text-[12px] text-care-muted">
              Optional
            </Text>
          </View>

          <View
            className={`mb-[16px] min-h-[48px] flex-row items-center gap-[10px] rounded-[12px] border bg-care-canvas px-[12px] ${
              nameFocused
                ? 'border-brand'
                : 'border-care-border'
            }`}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color={nameFocused ? '#0E7A67' : '#52605D'}
            />

            <TextInput
              className="min-h-[48px] flex-1 font-inter-regular text-[14px] text-care-ink"
              accessibilityLabel="Emergency contact name"
              placeholder="Enter full name"
              placeholderTextColor="#68766F"
              value={emergencyContactName}
              onChangeText={(text) =>
                onUpdate({
                  emergencyContactName: text,
                })
              }
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Relationship */}

          <Text className="mb-[8px] font-inter-semibold text-[13px] text-care-ink">
            Relationship
          </Text>

          <View
            className="gap-[8px]"
            accessibilityRole="radiogroup"
          >
            {relationRows.map((row, index) => (
              <View
                key={index}
                className="flex-row gap-[8px]"
              >
                {row.map((relation) => {
                  const selected =
                    emergencyContactRelation === relation;

                  return (
                    <Pressable
                      key={relation}
                      onPress={() =>
                        onUpdate({
                          emergencyContactRelation: relation,
                        })
                      }
                      accessibilityRole="radio"
                      accessibilityState={{
                        checked: selected,
                      }}
                      className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-[5px] rounded-[12px] border px-[8px] py-[10px] active:opacity-70 ${
                        selected
                          ? 'border-brand bg-care-selected'
                          : 'border-care-border bg-white'
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
                        {relation}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Phone number */}

          <Text className="mb-[6px] mt-[16px] font-inter-semibold text-[13px] text-care-ink">
            Phone number
          </Text>

          <View
            className={`min-h-[48px] flex-row items-center gap-[10px] rounded-[12px] border bg-care-canvas px-[12px] ${
              phoneFocused
                ? 'border-brand'
                : 'border-care-border'
            }`}
          >
            <Ionicons
              name="call-outline"
              size={18}
              color={phoneFocused ? '#0E7A67' : '#52605D'}
            />

            <TextInput
              className="min-h-[48px] flex-1 font-inter-regular text-[14px] text-care-ink"
              accessibilityLabel="Emergency contact phone number"
              placeholder="+91 98765 43210"
              placeholderTextColor="#68766F"
              value={emergencyContactPhone}
              onChangeText={(text) =>
                onUpdate({
                  emergencyContactPhone: text.replace(
                    /[^0-9+()\s-]/g,
                    ''
                  ),
                })
              }
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => setPhoneFocused(false)}
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={24}
            />
          </View>

          {/* Phone validation */}

          {emergencyContactPhone.trim().length > 0 &&
            !phoneFocused &&
            !isPhoneValid && (
              <Text className="mt-[6px] font-inter-regular text-[12px] text-red-600">
                Enter a valid phone number.
              </Text>
            )}

        </View>

        {/* Add later */}

        <Pressable
          onPress={handleSkip}
          accessibilityRole="button"
          className="min-h-[44px] items-center justify-center active:opacity-70"
        >
          <Text className="font-inter-medium text-[13px] text-brand-dark">
            Add contact later
          </Text>
        </Pressable>

      </View>

      {/* Custom confirmation modal */}

      <Modal
        visible={showSkipModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowSkipModal(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-[24px]">

          {/* Dismiss by tapping outside */}

          <Pressable
            className="absolute inset-0"
            onPress={() => setShowSkipModal(false)}
            accessible={false}
          />

          {/* Popup card */}

          <View
            accessibilityViewIsModal
            className="max-h-[85%] w-full max-w-[380px] rounded-[24px] border border-care-border bg-white"
            style={{
              shadowColor: '#244A42',
              shadowOpacity: 0.18,
              shadowOffset: { width: 0, height: 8 },
              shadowRadius: 24,
              elevation: 10,
            }}
          >
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerClassName="p-[24px]"
            >

              {/* Close button */}

              <View className="items-end">
                <Pressable
                  onPress={() => setShowSkipModal(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close confirmation"
                  className="h-[44px] w-[44px] items-center justify-center rounded-full bg-care-canvas active:opacity-70"
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color="#52605D"
                  />
                </Pressable>
              </View>

              {/* Warning icon */}

              <View className="mb-[16px] items-center">
                <View className="h-[68px] w-[68px] items-center justify-center rounded-full bg-brand-tint">
                  <Ionicons
                    name="shield-outline"
                    size={32}
                    color="#0E7A67"
                  />
                </View>
              </View>

              {/* Title */}

              <Text
                accessibilityRole="header"
                className="text-center font-inter-semibold text-[20px] leading-[28px] text-care-ink"
              >
                Add contact later?
              </Text>

              {/* Warning message */}

              <Text className="mb-[12px] mt-[10px] text-center font-inter-regular text-[14px] leading-[22px] text-care-muted">
                Without an emergency contact, SureStep may
                not be able to reach someone you trust
                during an emergency.
              </Text>

              {/* Warn about discarding entered information */}

              {hasContactDetails && (
                <View className="mb-[12px] rounded-[12px] bg-care-canvas p-[12px]">
                  <Text className="text-center font-inter-regular text-[12px] leading-[18px] text-care-muted">
                    Entered contact details will be discarded
                    if you skip.
                  </Text>
                </View>
              )}

              {/* Primary action */}

              <Pressable
                onPress={() => setShowSkipModal(false)}
                accessibilityRole="button"
                className="mt-[8px] min-h-[50px] flex-row items-center justify-center gap-[8px] rounded-[12px] bg-brand px-[12px] py-[12px] active:opacity-80"
              >
                <Ionicons
                  name="person-add-outline"
                  size={19}
                  color="#FFFFFF"
                />

                <Text className="shrink text-center font-inter-semibold text-[14px] text-white">
                  Add emergency contact
                </Text>
              </Pressable>

              {/* Secondary action */}

              <Pressable
                onPress={confirmSkip}
                accessibilityRole="button"
                className="mt-[10px] min-h-[48px] items-center justify-center rounded-[12px] border border-care-border bg-white px-[12px] py-[10px] active:opacity-70"
              >
                <Text className="font-inter-medium text-[13px] text-care-muted">
                  Skip for now
                </Text>
              </Pressable>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </OnboardingLayout>
  );
};
