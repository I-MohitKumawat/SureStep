
/**
 * SureStep — src/screens/auth/patient-onboarding/Step6CareNeeds.tsx
 * Step 6: Care and support preferences.
 */

import React from 'react';
import {
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import type { OnboardingIntent } from '../../../types/navigation.types';

interface Step6Props {
  intent: OnboardingIntent;
  careNeeds: string[];
  onUpdate: (fields: { careNeeds?: string[] }) => void;
  onNext: () => void;
  onBack: () => void;
}

const CARE_NEED_OPTIONS = [
  {
    id: 'medications',
    title: 'Medication reminders',
    icon: 'alarm-outline' as const,
  },
  {
    id: 'safety_navigation',
    title: 'Location safety',
    icon: 'navigate-outline' as const,
  },
  {
    id: 'daily_schedule',
    title: 'Daily routines',
    icon: 'calendar-outline' as const,
  },
  {
    id: 'sos_emergency',
    title: 'Emergency SOS',
    icon: 'shield-checkmark-outline' as const,
  },
  {
    id: 'memory_companionship',
    title: 'Memory activities',
    icon: 'sparkles-outline' as const,
  },
  {
    id: 'family_coordination',
    title: 'Family updates',
    icon: 'people-outline' as const,
  },
];

export const Step6CareNeeds: React.FC<Step6Props> = ({
  intent,
  careNeeds,
  onUpdate,
  onNext,
  onBack,
}) => {
  const isSelf = intent === 'RECEIVING_CARE';
  const { width, fontScale } = useWindowDimensions();

  const singleColumn = width < 340 || fontScale > 1.3;

  const toggleNeed = (id: string) => {
    onUpdate({
      careNeeds: careNeeds.includes(id)
        ? careNeeds.filter((need) => need !== id)
        : [...careNeeds, id],
    });
  };

  const rows = singleColumn
    ? CARE_NEED_OPTIONS.map((item) => [item])
    : [
        CARE_NEED_OPTIONS.slice(0, 2),
        CARE_NEED_OPTIONS.slice(2, 4),
        CARE_NEED_OPTIONS.slice(4, 6),
      ];

  return (
    <OnboardingLayout
      title={
        isSelf
          ? 'How can we help you?'
          : 'How can we support them?'
      }
      currentStep={6}
      iconName="heart-outline"
      backgroundVariant="mint"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={careNeeds.length === 0}
    >
      <View className="gap-[12px]">
        <Text className="font-inter-regular text-[13px] text-care-muted">
          Select all that apply.
        </Text>

        <View
          className="rounded-[20px] border border-care-border bg-white p-[12px]"
          style={{
            shadowColor: '#244A42',
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View className="gap-[8px]">
            {rows.map((row, index) => (
              <View
                key={index}
                className="flex-row items-stretch gap-[8px]"
              >
                {row.map((item) => {
                  const selected = careNeeds.includes(item.id);

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggleNeed(item.id)}
                      accessibilityRole="checkbox"
                      accessibilityLabel={item.title}
                      accessibilityState={{ checked: selected }}
                      className={`relative flex-1 rounded-[12px] border p-[12px] active:opacity-70 ${
                        singleColumn
                          ? 'min-h-[64px] flex-row items-center gap-[12px] pr-[36px]'
                          : 'min-h-[112px] items-center justify-center gap-[8px] pt-[24px]'
                      } ${
                        selected
                          ? 'border-brand bg-care-selected'
                          : 'border-care-border bg-care-canvas'
                      }`}
                    >
                      {/* Selection indicator */}
                      <View className="absolute right-[8px] top-[8px]">
                        <Ionicons
                          name={
                            selected
                              ? 'checkmark-circle'
                              : 'ellipse-outline'
                          }
                          size={18}
                          color={
                            selected ? '#0E7A67' : '#AAB8B2'
                          }
                        />
                      </View>

                      {/* Feature icon */}
                      <Ionicons
                        name={item.icon}
                        size={27}
                        color={
                          selected ? '#0E7A67' : '#52605D'
                        }
                      />

                      {/* Feature title */}
                      <Text
                        className={`font-inter-medium text-[13px] leading-[18px] ${
                          singleColumn
                            ? 'flex-1'
                            : 'text-center'
                        } ${
                          selected
                            ? 'text-brand-dark'
                            : 'text-care-ink'
                        }`}
                      >
                        {item.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    </OnboardingLayout>
  );
};
