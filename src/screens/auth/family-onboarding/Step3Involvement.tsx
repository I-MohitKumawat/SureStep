
/**
 * SureStep — src/screens/auth/family-onboarding/Step3Involvement.tsx
 * Family Onboarding Step 3: Participation preferences.
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

interface Step3Props {
  involvementInterests: string[];

  onUpdate: (fields: {
    involvementInterests?: string[];
  }) => void;

  onNext: () => void;
  onBack: () => void;
}

const INVOLVEMENT_OPTIONS = [
  {
    id: 'stay_connected',
    title: 'Stay connected',
    icon: 'chatbubbles-outline' as const,
  },
  {
    id: 'appointments_routines',
    title: 'Appointments & routines',
    icon: 'calendar-outline' as const,
  },
  {
    id: 'medication',
    title: 'Medication support',
    icon: 'medkit-outline' as const,
  },
  {
    id: 'safety_location',
    title: 'Safety & location',
    icon: 'navigate-outline' as const,
  },
  {
    id: 'coordinate_care',
    title: 'Coordinate care',
    icon: 'people-outline' as const,
  },
  {
    id: 'emergency',
    title: 'Emergency support',
    icon: 'alert-circle-outline' as const,
  },
  {
    id: 'everyday_care',
    title: 'Everyday care',
    icon: 'heart-outline' as const,
  },
];

export const Step3Involvement: React.FC<Step3Props> = ({
  involvementInterests,
  onUpdate,
  onNext,
  onBack,
}) => {
  const { width, fontScale } = useWindowDimensions();

  const singleColumn =
    width < 360 || fontScale > 1.3;

  const toggleInterest = (id: string) => {
    onUpdate({
      involvementInterests:
        involvementInterests.includes(id)
          ? involvementInterests.filter(
              (item) => item !== id
            )
          : [...involvementInterests, id],
    });
  };

  const isComplete =
    INVOLVEMENT_OPTIONS.some((item) =>
      involvementInterests.includes(item.id)
    );

  const rows = singleColumn
    ? INVOLVEMENT_OPTIONS.map((item) => [item])
    : [
        INVOLVEMENT_OPTIONS.slice(0, 2),
        INVOLVEMENT_OPTIONS.slice(2, 4),
        INVOLVEMENT_OPTIONS.slice(4, 6),
        INVOLVEMENT_OPTIONS.slice(6, 7),
      ];

  return (
    <OnboardingLayout
      title="How would you like to help?"
      subtitle="Select all that apply."
      currentStep={3}
      totalSteps={5}
      iconName="heart-outline"
      backgroundVariant="lavender"
      layoutVariant="minimal"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >
      <View className="gap-[12px]">

        {/* Main white container */}

        <View
          className="rounded-[20px] border border-care-border bg-white p-[12px]"
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
          <View className="gap-[8px]">
            {rows.map((row, index) => {
              const horizontal =
                singleColumn || row.length === 1;

              return (
                <View
                  key={index}
                  className="flex-row items-stretch gap-[8px]"
                >
                  {row.map((item) => {
                    const selected =
                      involvementInterests.includes(
                        item.id
                      );

                    return (
                      <Pressable
                        key={item.id}
                        onPress={() =>
                          toggleInterest(item.id)
                        }
                        accessibilityRole="checkbox"
                        accessibilityLabel={item.title}
                        accessibilityState={{
                          checked: selected,
                        }}
                        className={`relative flex-1 rounded-[12px] border p-[12px] active:opacity-70 ${
                          selected
                            ? 'border-brand bg-care-selected'
                            : 'border-care-border bg-care-canvas'
                        } ${
                          horizontal
                            ? 'min-h-[56px] flex-row items-center gap-[12px]'
                            : 'min-h-[104px] items-center justify-center gap-[8px] pt-[24px]'
                        }`}
                      >

                        {/* Grid selection indicator */}

                        {!horizontal && (
                          <View className="absolute right-[8px] top-[8px]">
                            <Ionicons
                              name={
                                selected
                                  ? 'checkmark-circle'
                                  : 'ellipse-outline'
                              }
                              size={18}
                              color={
                                selected
                                  ? '#0E7A67'
                                  : '#AAB8B2'
                              }
                            />
                          </View>
                        )}

                        {/* Feature icon */}

                        <Ionicons
                          name={item.icon}
                          size={26}
                          color={
                            selected
                              ? '#0E7A67'
                              : '#655481'
                          }
                        />

                        {/* Feature label */}

                        <Text
                          className={`font-inter-medium text-[13px] leading-[18px] ${
                            horizontal
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

                        {/* Horizontal selection indicator */}

                        {horizontal && (
                          <Ionicons
                            name={
                              selected
                                ? 'checkmark-circle'
                                : 'ellipse-outline'
                            }
                            size={20}
                            color={
                              selected
                                ? '#0E7A67'
                                : '#AAB8B2'
                            }
                          />
                        )}

                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>

        {/* Short permissions notice */}

        <View className="flex-row items-start gap-[8px] px-[4px] py-[4px]">
          <Ionicons
            name="information-circle-outline"
            size={19}
            color="#655481"
          />

          <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-care-muted">
            These are your preferences. Access is managed
            by the Care Circle owner.
          </Text>
        </View>

      </View>
    </OnboardingLayout>
  );
};
