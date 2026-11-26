
/**
 * SureStep — src/screens/auth/family-onboarding/Step5Review.tsx
 * Family Onboarding Step 5: Compact expandable review.
 */

import React, { useState } from 'react';
import {
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { getLanguageDisplayName } from '../../../constants/languages';

interface Step5Props {
  data: {
    name: string;
    dob: string;
    gender: string;
    language: string;
    city: string;
    photoUri?: string;
    relationLabel: string;
    proximity: string;
    involvementInterests: string[];
    hasInvite: boolean | null;
    inviteCode: string;
    verifiedPatientName?: string | null;
  };

  onJumpToStep: (stepNumber: number) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  submitError?: string | null;
}

type IconName = keyof typeof Ionicons.glyphMap;

const PROXIMITY_LABELS: Record<string, string> = {
  TOGETHER: 'Live together',
  NEARBY: 'Nearby',
  DIFFERENT_CITY: 'Different city',
  DIFFERENT_COUNTRY: 'Different country',
};

const INTEREST_LABELS: Record<string, string> = {
  stay_connected: 'Stay connected',
  appointments_routines: 'Appointments and routines',
  medication: 'Help with medication',
  safety_location: 'Safety and location',
  coordinate_care: 'Find and coordinate care',
  emergency: 'Emergency response',
  everyday_care: 'Everyday care',
};

/* Format date without UTC conversion */

const formatDate = (value: string): string => {
  if (!value) return 'Not provided';

  const date = new Date(`${value}T12:00:00`);

  if (isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/* Reusable detail row */

interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
}) => (
  <View className="flex-row items-start justify-between gap-[12px] py-[5px]">

    <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-care-muted">
      {label}
    </Text>

    <Text className="flex-1 text-right font-inter-medium text-[13px] leading-[19px] text-care-ink">
      {value || 'Not provided'}
    </Text>

  </View>
);

/* Reusable expandable review section */

interface ReviewSectionProps {
  title: string;
  summary: string;
  icon: IconName;
  expanded: boolean;
  disabled?: boolean;
  showDivider?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  children: React.ReactNode;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
  title,
  summary,
  icon,
  expanded,
  disabled = false,
  showDivider = true,
  onToggle,
  onEdit,
  children,
}) => (
  <View>

    {/* Section header */}

    <View className="min-h-[76px] flex-row items-center gap-[8px] py-[12px]">

      {/* Expandable section */}

      <Pressable
        onPress={onToggle}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${summary}`}
        accessibilityState={{
          expanded,
          disabled,
        }}
        className="min-h-[48px] flex-1 flex-row items-center gap-[10px] active:opacity-70"
      >

        {/* Section icon */}

        <View className="h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-[#F0EAF8]">
          <Ionicons
            name={icon}
            size={21}
            color="#655481"
          />
        </View>

        {/* Section title and summary */}

        <View className="flex-1">

          <Text className="font-inter-semibold text-[13px] leading-[19px] text-care-ink">
            {title}
          </Text>

          <Text className="mt-[3px] font-inter-regular text-[12px] leading-[17px] text-care-muted">
            {summary}
          </Text>

        </View>

        <Ionicons
          name={
            expanded
              ? 'chevron-up'
              : 'chevron-down'
          }
          size={15}
          color="#52605D"
        />

      </Pressable>

      {/* Direct edit button */}

      <Pressable
        onPress={onEdit}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${title}`}
        accessibilityState={{ disabled }}
        className={`min-h-[44px] flex-row items-center justify-center gap-[4px] rounded-[10px] bg-brand-tint px-[10px] active:opacity-70 ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        <Ionicons
          name="pencil-outline"
          size={13}
          color="#0E7A67"
        />

        <Text className="font-inter-semibold text-[12px] text-brand-dark">
          Edit
        </Text>

      </Pressable>

    </View>

    {/* Expanded content */}

    {expanded && (
      <View className="mb-[12px] rounded-[12px] border border-care-border bg-care-canvas p-[12px]">
        {children}
      </View>
    )}

    {showDivider && (
      <View className="h-px bg-care-border" />
    )}

  </View>
);

/* Main review screen */

export const Step5Review: React.FC<Step5Props> = ({
  data,
  onJumpToStep,
  onSubmit,
  onBack,
  submitting,
  submitError,
}) => {

  const [expandedSections, setExpandedSections] =
    useState<number[]>([]);

  /* Expand or collapse sections */

  const toggleSection = (step: number) => {
    setExpandedSections((previous) =>
      previous.includes(step)
        ? previous.filter((item) => item !== step)
        : [...previous, step]
    );
  };

  /* Edit previous step */

  const handleEdit = (step: number) => {
    if (submitting) return;

    onJumpToStep(step);
  };

  const sectionProps = (step: number) => ({
    expanded: expandedSections.includes(step),
    disabled: submitting,
    onToggle: () => toggleSection(step),
    onEdit: () => handleEdit(step),
  });

  /* Display values */

  const proximityLabel =
    PROXIMITY_LABELS[data.proximity] ||
    data.proximity ||
    'Not specified';

  const languageLabel = data.language
    ? getLanguageDisplayName(data.language) ||
      data.language
    : 'Not selected';

  const interestCount =
    data.involvementInterests.length;

  const hasInvitation =
    data.hasInvite === true &&
    Boolean(data.inviteCode.trim());

  const hasVerifiedInvite =
    hasInvitation &&
    Boolean(data.verifiedPatientName?.trim());

  const hasUnverifiedInvite =
    hasInvitation && !hasVerifiedInvite;

  /* Summary values */

  const personalSummary =
    [data.name, data.city]
      .filter(Boolean)
      .join(' · ') || 'Not provided';

  const connectionSummary =
    [
      data.relationLabel,
      data.proximity ? proximityLabel : '',
    ]
      .filter(Boolean)
      .join(' · ') || 'Not provided';

  const involvementSummary =
    interestCount === 0
      ? 'None selected'
      : `${interestCount} preference${
          interestCount === 1 ? '' : 's'
        } selected`;

  const circleSummary = hasVerifiedInvite
    ? `${data.verifiedPatientName}'s Care Circle`
    : hasUnverifiedInvite
      ? 'Invitation not verified'
      : 'Not connected yet';

  return (
    <OnboardingLayout
      title="You're almost ready!"
      subtitle="Review your details before finishing."
      currentStep={5}
      totalSteps={5}
      iconName="checkmark-done-circle-outline"
      backgroundVariant="lavender"
      layoutVariant="minimal"
      onBack={() => {
        if (!submitting) onBack();
      }}
      onNext={() => {
        if (!submitting && !hasUnverifiedInvite) {
          onSubmit();
        }
      }}
      nextLabel="Complete setup"
      isNextLoading={submitting}
      isNextDisabled={
        submitting || hasUnverifiedInvite
      }
    >

      <View className="gap-[12px]">

        {/* Submission error */}

        {!!submitError && (
          <View
            accessibilityRole="alert"
            className="flex-row items-start gap-[10px] rounded-[12px] border border-red-200 bg-red-50 p-[12px]"
          >
            <Ionicons
              name="alert-circle-outline"
              size={21}
              color="#DC2626"
            />

            <View className="flex-1">

              <Text className="font-inter-semibold text-[13px] text-red-700">
                Unable to complete setup
              </Text>

              <Text className="mt-[4px] font-inter-regular text-[12px] leading-[18px] text-red-700">
                {submitError}
              </Text>

            </View>
          </View>
        )}

        {/* Unverified invitation warning */}

        {hasUnverifiedInvite && (
          <View className="flex-row items-start gap-[10px] rounded-[12px] border border-[#EBDDBB] bg-[#FFF8E7] p-[12px]">

            <Ionicons
              name="information-circle-outline"
              size={21}
              color="#92651C"
            />

            <View className="flex-1">

              <Text className="font-inter-medium text-[13px] leading-[19px] text-[#78551A]">
                Verify your invitation or choose
                to connect later.
              </Text>

              <Pressable
                onPress={() => handleEdit(4)}
                disabled={submitting}
                accessibilityRole="button"
                className="min-h-[44px] justify-center"
              >
                <Text className="font-inter-semibold text-[13px] text-brand-dark">
                  Edit invitation
                </Text>
              </Pressable>

            </View>

          </View>
        )}

        {/* Main white review container */}

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

          {/* 1. About you */}

          <ReviewSection
            {...sectionProps(1)}
            title="About you"
            summary={personalSummary}
            icon="person-outline"
          >

            {!!data.photoUri && (
              <View className="mb-[12px] items-center">
                <Image
                  source={{ uri: data.photoUri }}
                  accessibilityLabel="Profile photo"
                  className="h-[64px] w-[64px] rounded-full"
                />
              </View>
            )}

            <DetailRow
              label="Full name"
              value={data.name}
            />

            <DetailRow
              label="Date of birth"
              value={formatDate(data.dob)}
            />

            <DetailRow
              label="Gender"
              value={data.gender}
            />

            <DetailRow
              label="City"
              value={data.city}
            />

            <DetailRow
              label="Language"
              value={languageLabel}
            />

          </ReviewSection>

          {/* 2. Your connection */}

          <ReviewSection
            {...sectionProps(2)}
            title="Your connection"
            summary={connectionSummary}
            icon="people-outline"
          >

            <DetailRow
              label="Relationship"
              value={data.relationLabel}
            />

            <DetailRow
              label="Proximity"
              value={proximityLabel}
            />

          </ReviewSection>

          {/* 3. Your involvement */}

          <ReviewSection
            {...sectionProps(3)}
            title="Your involvement"
            summary={involvementSummary}
            icon="heart-outline"
          >

            {interestCount > 0 ? (
              <View className="gap-[10px]">

                {data.involvementInterests.map(
                  (interest) => (
                    <View
                      key={interest}
                      className="flex-row items-start gap-[8px]"
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color="#0E7A67"
                      />

                      <Text className="flex-1 font-inter-regular text-[13px] leading-[19px] text-care-ink">
                        {INTEREST_LABELS[interest] ||
                          interest.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  )
                )}

              </View>
            ) : (
              <Text className="font-inter-regular text-[13px] leading-[19px] text-care-muted">
                No involvement preferences selected.
              </Text>
            )}

          </ReviewSection>

          {/* 4. Care Circle */}

          <ReviewSection
            {...sectionProps(4)}
            title="Care Circle"
            summary={circleSummary}
            icon="shield-checkmark-outline"
            showDivider={false}
          >

            {hasVerifiedInvite ? (
              <View>

                <DetailRow
                  label="Invitation code"
                  value={data.inviteCode}
                />

                <DetailRow
                  label="Connecting to"
                  value={data.verifiedPatientName || ''}
                />

                {/* Verified invitation status */}

                <View className="mt-[12px] flex-row items-center gap-[8px] rounded-[10px] bg-care-selected p-[10px]">

                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#0E7A67"
                  />

                  <Text className="flex-1 font-inter-medium text-[12px] text-brand-dark">
                    Invitation verified
                  </Text>

                </View>

                {/* Approval information */}

                <View className="mt-[10px] flex-row items-start gap-[8px]">

                  <Ionicons
                    name="time-outline"
                    size={18}
                    color="#655481"
                  />

                  <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-care-muted">
                    A join request will be submitted
                    when you complete setup.
                  </Text>

                </View>

              </View>
            ) : hasUnverifiedInvite ? (
              <View className="flex-row items-start gap-[8px]">

                <Ionicons
                  name="alert-circle-outline"
                  size={19}
                  color="#92651C"
                />

                <Text className="flex-1 font-inter-regular text-[13px] leading-[19px] text-care-muted">
                  Your invitation has not been verified.
                </Text>

              </View>
            ) : (
              <View className="flex-row items-start gap-[8px]">

                <Ionicons
                  name="information-circle-outline"
                  size={19}
                  color="#655481"
                />

                <Text className="flex-1 font-inter-regular text-[13px] leading-[19px] text-care-muted">
                  You can connect later from your dashboard.
                </Text>

              </View>
            )}

          </ReviewSection>

        </View>

        {/* Completion message */}

        <View className="flex-row items-center gap-[8px] px-[4px] py-[4px]">

          <Ionicons
            name="shield-checkmark-outline"
            size={19}
            color="#655481"
          />

          <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-care-muted">
            You're one step away from getting started.
          </Text>

        </View>

      </View>

    </OnboardingLayout>
  );
};
