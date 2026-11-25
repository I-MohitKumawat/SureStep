
/**
 * SureStep — src/screens/auth/patient-onboarding/Step7SafetyConcerns.tsx
 * Step 7: Safety concerns selection.
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

interface Step7Props {
  intent: OnboardingIntent;
  safetyConcerns: string[];
  onUpdate: (fields: { safetyConcerns?: string[] }) => void;
  onNext: () => void;
  onBack: () => void;
}

const SAFETY_OPTIONS = [
  {
    id: 'wandering',
    title: 'Getting lost',
    icon: 'navigate-outline' as const,
  },
  {
    id: 'falls',
    title: 'Risk of falling',
    icon: 'alert-circle-outline' as const,
  },
  {
    id: 'confusion',
    title: 'Confusion',
    icon: 'help-circle-outline' as const,
  },
  {
    id: 'night_restlessness',
    title: 'Night restlessness',
    icon: 'moon-outline' as const,
  },
  {
    id: 'phone_difficulty',
    title: 'Difficulty using a phone',
    icon: 'phone-portrait-outline' as const,
  },
  {
    id: 'forgetting_meals',
    title: 'Forgetting meals or water',
    icon: 'restaurant-outline' as const,
  },
];

export const Step7SafetyConcerns: React.FC<Step7Props> = ({
  intent,
  safetyConcerns,
  onUpdate,
  onNext,
  onBack,
}) => {
  const isSelf = intent === 'RECEIVING_CARE';

  const { width, fontScale } = useWindowDimensions();

  const singleColumn = width < 340 || fontScale > 1.3;

  const toggleConcern = (id: string) => {
    // None cannot coexist with other safety concerns.
    if (id === 'none') {
      onUpdate({ safetyConcerns: ['none'] });
      return;
    }

    const filtered = safetyConcerns.filter(
      (concern) => concern !== 'none'
    );

    onUpdate({
      safetyConcerns: filtered.includes(id)
        ? filtered.filter((concern) => concern !== id)
        : [...filtered, id],
    });
  };

  const rows = singleColumn
    ? SAFETY_OPTIONS.map((item) => [item])
    : [
        SAFETY_OPTIONS.slice(0, 2),
        SAFETY_OPTIONS.slice(2, 4),
        SAFETY_OPTIONS.slice(4, 6),
      ];

  const noConcerns = safetyConcerns.includes('none');

  return (
    <OnboardingLayout
      title="Safety & Peace of Mind"
      currentStep={7}
      iconName="shield-checkmark-outline"
      backgroundVariant="mint"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={safetyConcerns.length === 0}
    >
      <View className="gap-[12px]">
        <Text className="font-inter-regular text-[13px] leading-[20px] text-care-muted">
          {isSelf
            ? 'Select any concerns that apply to you.'
            : 'Select any concerns that apply to them.'}
        </Text>

        {/* Main white container */}

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
          {/* Safety selection grid */}

          <View className="gap-[8px]">
            {rows.map((row, index) => (
              <View
                key={index}
                className="flex-row items-stretch gap-[8px]"
              >
                {row.map((item) => {
                  const selected =
                    safetyConcerns.includes(item.id);

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggleConcern(item.id)}
                      accessibilityRole="checkbox"
                      accessibilityLabel={item.title}
                      accessibilityState={{
                        checked: selected,
                      }}
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
                            selected
                              ? '#0E7A67'
                              : '#AAB8B2'
                          }
                        />
                      </View>

                      {/* Safety icon */}

                      <Ionicons
                        name={item.icon}
                        size={27}
                        color={
                          selected
                            ? '#0E7A67'
                            : '#52605D'
                        }
                      />

                      {/* Safety label */}

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

          {/* Divider */}

          <View className="my-[14px] h-px bg-care-border" />

          {/* No safety concerns */}

          <Pressable
            onPress={() => toggleConcern('none')}
            accessibilityRole="checkbox"
            accessibilityLabel="No safety concerns"
            accessibilityState={{ checked: noConcerns }}
            className={`min-h-[56px] flex-row items-center gap-[12px] rounded-[12px] border px-[12px] py-[10px] active:opacity-70 ${
              noConcerns
                ? 'border-brand bg-care-selected'
                : 'border-care-border bg-care-canvas'
            }`}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={
                noConcerns ? '#0E7A67' : '#52605D'
              }
            />

            <Text
              className={`flex-1 font-inter-medium text-[13px] leading-[18px] ${
                noConcerns
                  ? 'text-brand-dark'
                  : 'text-care-ink'
              }`}
            >
              No safety concerns
            </Text>

            <Ionicons
              name={
                noConcerns
                  ? 'checkmark-circle'
                  : 'ellipse-outline'
              }
              size={20}
              color={
                noConcerns ? '#0E7A67' : '#AAB8B2'
              }
            />
          </Pressable>
        </View>
      </View>
    </OnboardingLayout>
  );
};
