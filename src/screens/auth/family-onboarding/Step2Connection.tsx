
/**
 * SureStep — src/screens/auth/family-onboarding/Step2Connection.tsx
 * Family Onboarding Step 2: Relationship and proximity.
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

interface Step2Props {
  relationLabel: string;
  proximity: string;

  onUpdate: (fields: {
    relationLabel?: string;
    proximity?: string;
  }) => void;

  onNext: () => void;
  onBack: () => void;
}

const RELATION_OPTIONS = [
  {
    id: 'Spouse or partner',
    title: 'Spouse or partner',
    icon: 'heart-outline' as const,
  },
  {
    id: 'Son or daughter',
    title: 'Son or daughter',
    icon: 'people-outline' as const,
  },
  {
    id: 'Parent',
    title: 'Parent',
    icon: 'home-outline' as const,
  },
  {
    id: 'Sibling',
    title: 'Sibling',
    icon: 'person-outline' as const,
  },
  {
    id: 'Grandchild',
    title: 'Grandchild',
    icon: 'sparkles-outline' as const,
  },
  {
    id: 'Other relative',
    title: 'Other relative',
    icon: 'git-network-outline' as const,
  },
  {
    id: 'Family friend',
    title: 'Family friend',
    icon: 'happy-outline' as const,
  },
  {
    id: 'Other',
    title: 'Other',
    icon: 'help-circle-outline' as const,
  },
];

const PROXIMITY_OPTIONS = [
  {
    id: 'TOGETHER',
    title: 'Live together',
    icon: 'home-outline' as const,
  },
  {
    id: 'NEARBY',
    title: 'Nearby',
    icon: 'navigate-outline' as const,
  },
  {
    id: 'DIFFERENT_CITY',
    title: 'Different city',
    icon: 'train-outline' as const,
  },
  {
    id: 'DIFFERENT_COUNTRY',
    title: 'Different country',
    icon: 'airplane-outline' as const,
  },
];

/* Convert options into responsive rows */

const createRows = <T,>(
  items: T[],
  columns: number
): T[][] => {
  const rows: T[][] = [];

  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }

  return rows;
};

export const Step2Connection: React.FC<Step2Props> = ({
  relationLabel,
  proximity,
  onUpdate,
  onNext,
  onBack,
}) => {
  const { width, fontScale } = useWindowDimensions();

  const singleColumn =
    width < 360 || fontScale > 1.3;

  const columns = singleColumn ? 1 : 2;

  const relationRows = createRows(
    RELATION_OPTIONS,
    columns
  );

  const proximityRows = createRows(
    PROXIMITY_OPTIONS,
    columns
  );

  const isComplete =
    RELATION_OPTIONS.some(
      (item) => item.id === relationLabel
    ) &&
    PROXIMITY_OPTIONS.some(
      (item) => item.id === proximity
    );

  return (
    <OnboardingLayout
      title="Your connection"
      subtitle="Tell us how you're connected."
      currentStep={2}
      totalSteps={5}
      iconName="people-outline"
      backgroundVariant="lavender"
      layoutVariant="minimal"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >

      {/* Main white container */}

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

        {/* Relationship */}

        <Text className="mb-[12px] font-inter-semibold text-[14px] text-care-ink">
          Your relationship *
        </Text>

        <View
          className="gap-[8px]"
          accessibilityRole="radiogroup"
        >
          {relationRows.map((row, index) => (
            <View
              key={index}
              className="flex-row items-stretch gap-[8px]"
            >
              {row.map((item) => {
                const selected =
                  relationLabel === item.id;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      onUpdate({
                        relationLabel: item.id,
                      })
                    }
                    accessibilityRole="radio"
                    accessibilityLabel={item.title}
                    accessibilityState={{
                      checked: selected,
                    }}
                    className={`min-h-[48px] flex-1 flex-row items-center gap-[8px] rounded-[12px] border px-[10px] py-[10px] active:opacity-70 ${
                      selected
                        ? 'border-brand bg-care-selected'
                        : 'border-care-border bg-care-canvas'
                    }`}
                  >
                    <Ionicons
                      name={item.icon}
                      size={19}
                      color={
                        selected
                          ? '#0E7A67'
                          : '#655481'
                      }
                    />

                    <Text
                      className={`flex-1 font-inter-medium text-[13px] leading-[18px] ${
                        selected
                          ? 'text-brand-dark'
                          : 'text-care-ink'
                      }`}
                    >
                      {item.title}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="#0E7A67"
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* Divider */}

        <View className="my-[18px] h-px bg-care-border" />

        {/* Physical proximity */}

        <Text className="mb-[12px] font-inter-semibold text-[14px] text-care-ink">
          How close do you live? *
        </Text>

        <View
          className="gap-[8px]"
          accessibilityRole="radiogroup"
        >
          {proximityRows.map((row, index) => (
            <View
              key={index}
              className="flex-row items-stretch gap-[8px]"
            >
              {row.map((item) => {
                const selected =
                  proximity === item.id;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      onUpdate({
                        proximity: item.id,
                      })
                    }
                    accessibilityRole="radio"
                    accessibilityLabel={item.title}
                    accessibilityState={{
                      checked: selected,
                    }}
                    className={`relative flex-1 rounded-[12px] border p-[12px] active:opacity-70 ${
                      singleColumn
                        ? 'min-h-[56px] flex-row items-center gap-[12px] pr-[36px]'
                        : 'min-h-[94px] items-center justify-center gap-[8px] pt-[24px]'
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
                        size={17}
                        color={
                          selected
                            ? '#0E7A67'
                            : '#AAB8B2'
                        }
                      />
                    </View>

                    {/* Proximity icon */}

                    <Ionicons
                      name={item.icon}
                      size={25}
                      color={
                        selected
                          ? '#0E7A67'
                          : '#655481'
                      }
                    />

                    {/* Proximity label */}

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
    </OnboardingLayout>
  );
};
