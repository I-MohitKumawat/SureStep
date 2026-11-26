
/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step9Review.tsx
 * Caregiver Onboarding Step 9: Expandable profile review.
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

import {
  getLanguageDisplayName,
} from '../../../constants/languages';

import {
  CAPABILITY_OPTIONS,
  SHIFT_OPTIONS,
} from '../../../types/care.types';

import type {
  CaregiverOnboardingState,
} from './CaregiverOnboardingScreen';

interface Step9Props {
  data: CaregiverOnboardingState;

  onJumpToStep: (stepNumber: number) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  submitError?: string | null;
}

type IconName = keyof typeof Ionicons.glyphMap;

const ROLE_LABELS: Record<string, string> = {
  DEMENTIA_SPECIALIST: 'Dementia Care Specialist',
  GERIATRIC_CAREGIVER: 'Geriatric Caregiver',
  NURSE_CLINICAL: 'Nursing & Clinical Assistant',
  GENERAL_CAREGIVER: 'General Home Care Aide',
  PALLIATIVE_CARE: 'Palliative & End-of-Life Care',
  COMPANION: 'Companion Caregiver',
  OTHER: 'Other Care Professional',
};

const SPECIALIZATION_LABELS: Record<string, string> = {
  alzheimers: "Alzheimer's Disease",
  vascular_dementia: 'Vascular Dementia',
  lewy_body: 'Lewy Body Dementia',
  ftd: 'Frontotemporal Dementia (FTD)',
  mci: 'Mild Cognitive Impairment (MCI)',
  parkinsons: "Parkinson's Disease",
  post_stroke: 'Post-Stroke Recovery',
};

/* Formatting helpers */

const humanize = (value: string): string =>
  value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );

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

const formatYears = (
  value: number | null
): string => {
  if (value === null) {
    return 'Not specified';
  }

  return `${value} ${
    value === 1 ? 'year' : 'years'
  }`;
};

const formatCount = (
  count: number,
  singular: string,
  plural: string
): string =>
  `${count} ${
    count === 1 ? singular : plural
  }`;

const getCapabilityLabel = (
  id: string
): string =>
  CAPABILITY_OPTIONS.find(
    (item) => item.id === id
  )?.label || humanize(id);

const getShiftLabel = (
  id: string
): string =>
  SHIFT_OPTIONS.find(
    (item) => item.id === id
  )?.label || humanize(id);

const getSpecializationLabel = (
  id: string
): string =>
  SPECIALIZATION_LABELS[id] ||
  humanize(id);

const formatRate = (
  value: string,
  unit: string
): string => {
  const trimmed = value.trim();

  if (!trimmed) return 'Negotiable';

  if (
    !/^\d+(\.\d{1,2})?$/.test(trimmed) ||
    !Number.isFinite(Number(trimmed)) ||
    Number(trimmed) <= 0
  ) {
    return 'Invalid amount';
  }

  const formatted = Number(trimmed)
    .toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    });

  return `₹${formatted}/${unit}`;
};

/* Reusable detail row */

interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow: React.FC<
  DetailRowProps
> = ({
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

/* Reusable text label */

const DetailHeading: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <Text className="mb-[8px] font-inter-semibold text-[13px] leading-[19px] text-care-ink">
    {children}
  </Text>
);

/* Reusable selected items list */

interface SelectionListProps {
  items: string[];
  emptyText?: string;
  icon?: IconName;
}

const SelectionList: React.FC<
  SelectionListProps
> = ({
  items,
  emptyText = 'None selected',
  icon = 'checkmark-circle-outline',
}) => {

  if (items.length === 0) {
    return (
      <Text className="font-inter-regular text-[12px] leading-[18px] text-care-muted">
        {emptyText}
      </Text>
    );
  }

  return (
    <View className="gap-[10px]">

      {items.map((item, index) => (

        <View
          key={`${item}-${index}`}
          className="flex-row items-start gap-[8px]"
        >

          <Ionicons
            name={icon}
            size={18}
            color="#0E7A67"
          />

          <Text className="flex-1 font-inter-regular text-[13px] leading-[19px] text-care-ink">
            {item}
          </Text>

        </View>

      ))}

    </View>
  );
};

/* Reusable expandable section */

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

const ReviewSection: React.FC<
  ReviewSectionProps
> = ({
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

      {/* Expandable section button */}

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

        <View className="h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-[#E1F2F4]">

          <Ionicons
            name={icon}
            size={21}
            color="#256C78"
          />

        </View>

        {/* Section information */}

        <View className="flex-1">

          <Text className="font-inter-semibold text-[13px] leading-[19px] text-care-ink">
            {title}
          </Text>

          <Text
            numberOfLines={expanded ? undefined : 2}
            className="mt-[3px] font-inter-regular text-[12px] leading-[17px] text-care-muted"
          >
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

      {/* Edit button */}

      <Pressable
        onPress={onEdit}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${title}`}
        accessibilityState={{ disabled }}
        className={`min-h-[44px] flex-row items-center justify-center gap-[4px] rounded-[10px] bg-care-selected px-[10px] active:opacity-70 ${
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

    {/* Expanded details */}

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

/* Main caregiver review screen */

export const Step9Review: React.FC<
  Step9Props
> = ({
  data,
  onJumpToStep,
  onSubmit,
  onBack,
  submitting,
  submitError,
}) => {

  const [expandedSections, setExpandedSections] =
    useState<number[]>([]);

  /* Expand and collapse sections */

  const toggleSection = (
    stepNumber: number
  ) => {
    if (submitting) return;

    setExpandedSections((previous) =>
      previous.includes(stepNumber)
        ? previous.filter(
            (item) => item !== stepNumber
          )
        : [...previous, stepNumber]
    );
  };

  /* Edit onboarding information */

  const handleEdit = (
    stepNumber: number
  ) => {
    if (submitting) return;

    onJumpToStep(stepNumber);
  };

  const sectionProps = (
    stepNumber: number
  ) => ({
    expanded:
      expandedSections.includes(stepNumber),

    disabled: submitting,

    onToggle: () =>
      toggleSection(stepNumber),

    onEdit: () =>
      handleEdit(stepNumber),
  });

  /* Formatted profile values */

  const roleLabel =
    ROLE_LABELS[data.professionalRole] ||
    humanize(data.professionalRole) ||
    'Not selected';

  const languageLabel =
    data.language
      ? getLanguageDisplayName(data.language) ||
        data.language
      : 'Not selected';

  const totalExperience =
    formatYears(data.yearsExperience);

  const dementiaExperience =
    formatYears(data.dementiaExperienceYears);

  const serviceArea =
    data.serviceCity.trim() ||
    data.city.trim() ||
    'Not specified';

  const radiusLabel =
    data.serviceRadiusKm !== null
      ? `${data.serviceRadiusKm} km`
      : 'Not specified';

  const capacityLabel =
    data.maxPatients !== null
      ? formatCount(
          data.maxPatients,
          'patient',
          'patients'
        )
      : 'Not specified';

  const hourlyRateLabel =
    formatRate(data.hourlyRate, 'hr');

  const dailyRateLabel =
    formatRate(data.dailyRate, 'day');

  const visibilityLabel =
    data.isDiscoverable
      ? 'Discoverable profile'
      : 'Private profile';

  /* Summary values */

  const personalSummary =
    [data.name, data.city]
      .filter(Boolean)
      .join(' · ') || 'Not provided';

  const experienceSummary =
    `${totalExperience} total · ${
      data.dementiaExperienceYears === null
        ? 'Dementia experience not specified'
        : `${dementiaExperience} dementia care`
    }`;

  const capabilitySummary =
    `${formatCount(
      data.careCapabilities.length,
      'skill',
      'skills'
    )} · ${formatCount(
      data.specializations.length,
      'specialization',
      'specializations'
    )}`;

  const qualificationSummary =
    data.qualifications.length > 0
      ? `${formatCount(
          data.qualifications.length,
          'credential',
          'credentials'
        )} added`
      : 'None added · Optional';

  const languageSummary =
    data.languagesSpoken.length > 0
      ? data.languagesSpoken.join(', ')
      : 'None selected';

  const availabilitySummary =
    [serviceArea, radiusLabel]
      .filter(Boolean)
      .join(' · ');

  const pricingSummary =
    `${data.hourlyRate.trim()
      ? hourlyRateLabel
      : data.dailyRate.trim()
        ? dailyRateLabel
        : 'Negotiable rates'
    } · ${visibilityLabel}`;

  /* Submission */

  const handleSubmit = () => {
    if (submitting) return;

    onSubmit();
  };

  return (
    <OnboardingLayout
      title="You're almost ready!"
      subtitle="Review your professional profile."
      currentStep={9}
      totalSteps={9}
      iconName="checkmark-done-circle-outline"
      backgroundVariant="ocean"
      layoutVariant="minimal"
      onBack={() => {
        if (!submitting) onBack();
      }}
      onNext={handleSubmit}
      nextLabel="Complete profile"
      isNextLoading={submitting}
      isNextDisabled={submitting}
    >

      <View className="gap-[12px]">

        {/* Submission error banner */}

        {!!submitError && (
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            className="flex-row items-start gap-[10px] rounded-[12px] border border-red-200 bg-red-50 p-[12px]"
          >

            <Ionicons
              name="alert-circle-outline"
              size={22}
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

        {/* Main review container */}

        <View
          className="rounded-[20px] border border-care-border bg-white p-[12px]"
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

          {/* 1. Personal details */}

          <ReviewSection
            {...sectionProps(1)}
            title="Personal details"
            summary={personalSummary}
            icon="person-outline"
          >

            {!!data.photoUri && (
              <View className="mb-[12px] items-center">

                <Image
                  source={{
                    uri: data.photoUri,
                  }}
                  accessibilityLabel="Selected profile photo"
                  className="h-[72px] w-[72px] rounded-full"
                />

              </View>
            )}

            <DetailRow
              label="Full legal name"
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
              label="Base city"
              value={data.city}
            />

            <DetailRow
              label="Primary language"
              value={languageLabel}
            />

            <DetailRow
              label="Profile photo"
              value={
                data.photoUri
                  ? 'Selected'
                  : 'Not added'
              }
            />

          </ReviewSection>

          {/* 2. Professional role */}

          <ReviewSection
            {...sectionProps(2)}
            title="Professional role"
            summary={roleLabel}
            icon="briefcase-outline"
          >

            <DetailRow
              label="Primary role"
              value={roleLabel}
            />

          </ReviewSection>

          {/* 3. Experience and training */}

          <ReviewSection
            {...sectionProps(3)}
            title="Experience & training"
            summary={experienceSummary}
            icon="medal-outline"
          >

            <DetailRow
              label="Total experience"
              value={totalExperience}
            />

            <DetailRow
              label="Dementia experience"
              value={dementiaExperience}
            />

            <DetailRow
              label="Formal dementia training"
              value={
                data.hasDementiaTraining
                  ? 'Yes, self-reported'
                  : 'No'
              }
            />

            {data.yearsExperience !== null &&
              data.dementiaExperienceYears !== null &&
              data.dementiaExperienceYears >
                data.yearsExperience && (

                <View className="mt-[10px] flex-row items-start gap-[8px] rounded-[10px] bg-red-50 p-[10px]">

                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color="#DC2626"
                  />

                  <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-red-700">
                    Dementia experience cannot exceed
                    total caregiving experience.
                  </Text>

                </View>

              )}

          </ReviewSection>

          {/* 4. Care capabilities */}

          <ReviewSection
            {...sectionProps(4)}
            title="Care capabilities"
            summary={capabilitySummary}
            icon="fitness-outline"
          >

            <DetailHeading>
              Care skills
            </DetailHeading>

            <SelectionList
              items={
                data.careCapabilities.map(
                  getCapabilityLabel
                )
              }
            />

            <View className="my-[14px] h-px bg-care-border" />

            <DetailHeading>
              Specializations
            </DetailHeading>

            <SelectionList
              items={
                data.specializations.map(
                  getSpecializationLabel
                )
              }
              emptyText="No specializations selected."
              icon="ribbon-outline"
            />

          </ReviewSection>

          {/* 5. Qualifications */}

          <ReviewSection
            {...sectionProps(5)}
            title="Qualifications"
            summary={qualificationSummary}
            icon="school-outline"
          >

            {data.qualifications.length > 0 ? (

              <View className="gap-[10px]">

                {data.qualifications.map(
                  (qualification) => (

                    <View
                      key={qualification.id}
                      className="rounded-[12px] border border-care-border bg-white p-[12px]"
                    >

                      <View className="flex-row items-start gap-[10px]">

                        <View className="h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[#E1F2F4]">

                          <Ionicons
                            name="ribbon-outline"
                            size={21}
                            color="#256C78"
                          />

                        </View>

                        <View className="flex-1">

                          <Text className="font-inter-semibold text-[13px] leading-[19px] text-care-ink">
                            {qualification.name}
                          </Text>

                          <Text className="mt-[3px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
                            {qualification.issuer}
                            {qualification.year
                              ? ` · ${qualification.year}`
                              : ''}
                          </Text>

                          <Text className="mt-[5px] font-inter-medium text-[11px] text-[#256C78]">
                            Self-reported
                          </Text>

                        </View>

                      </View>

                      {!!qualification.description && (
                        <Text className="mt-[10px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
                          {qualification.description}
                        </Text>
                      )}

                    </View>

                  )
                )}

              </View>

            ) : (

              <Text className="font-inter-regular text-[13px] leading-[19px] text-care-muted">
                No qualifications added.
                This section is optional.
              </Text>

            )}

          </ReviewSection>

          {/* 6. Spoken languages */}

          <ReviewSection
            {...sectionProps(6)}
            title="Spoken languages"
            summary={languageSummary}
            icon="language-outline"
          >

            {data.languagesSpoken.length > 0 ? (

              <View className="flex-row flex-wrap gap-[8px]">

                {data.languagesSpoken.map(
                  (language, index) => (

                    <View
                      key={`${language}-${index}`}
                      className="max-w-full flex-row items-center gap-[6px] rounded-full border border-[#C6EBE2] bg-care-selected px-[10px] py-[8px]"
                    >

                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="#0E7A67"
                      />

                      <Text className="shrink font-inter-medium text-[12px] text-brand-dark">
                        {language}
                      </Text>

                    </View>

                  )
                )}

              </View>

            ) : (

              <Text className="font-inter-regular text-[13px] text-care-muted">
                No spoken languages selected.
              </Text>

            )}

          </ReviewSection>

          {/* 7. Availability and service area */}

          <ReviewSection
            {...sectionProps(7)}
            title="Availability & area"
            summary={availabilitySummary}
            icon="map-outline"
          >

            <DetailRow
              label="Service area"
              value={serviceArea}
            />

            <DetailRow
              label="Travel radius"
              value={radiusLabel}
            />

            <DetailRow
              label="Maximum patients"
              value={capacityLabel}
            />

            <View className="my-[14px] h-px bg-care-border" />

            <DetailHeading>
              Accepted shifts
            </DetailHeading>

            <SelectionList
              items={
                data.availabilityTypes.map(
                  getShiftLabel
                )
              }
              icon="time-outline"
            />

          </ReviewSection>

          {/* 8. Pricing, bio and visibility */}

          <ReviewSection
            {...sectionProps(8)}
            title="Pricing & visibility"
            summary={pricingSummary}
            icon="wallet-outline"
            showDivider={false}
          >

            <DetailRow
              label="Hourly rate"
              value={hourlyRateLabel}
            />

            <DetailRow
              label="Daily rate"
              value={dailyRateLabel}
            />

            <View className="my-[14px] h-px bg-care-border" />

            <DetailHeading>
              Professional bio
            </DetailHeading>

            <Text className="font-inter-regular text-[13px] leading-[20px] text-care-muted">
              {data.bio.trim() || 'Not added'}
            </Text>

            <View className="my-[14px] h-px bg-care-border" />

            <DetailHeading>
              Profile visibility
            </DetailHeading>

            <View
              className={`rounded-[12px] border p-[12px] ${
                data.isDiscoverable
                  ? 'border-[#C6EBE2] bg-care-selected'
                  : 'border-care-border bg-white'
              }`}
            >

              <View className="flex-row items-center gap-[10px]">

                <Ionicons
                  name={
                    data.isDiscoverable
                      ? 'globe-outline'
                      : 'lock-closed-outline'
                  }
                  size={23}
                  color={
                    data.isDiscoverable
                      ? '#0E7A67'
                      : '#256C78'
                  }
                />

                <Text className="flex-1 font-inter-semibold text-[13px] text-care-ink">
                  {visibilityLabel}
                </Text>

              </View>

              <Text className="mt-[8px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
                {data.isDiscoverable
                  ? 'Your profile is set to appear in caregiver directory searches.'
                  : 'Your profile is set to remain hidden from caregiver directory searches.'}
              </Text>

            </View>

          </ReviewSection>

        </View>

        {/* Self-reported profile notice */}

        <View className="flex-row items-start gap-[8px] px-[4px] py-[6px]">

          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color="#256C78"
          />

          <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-care-muted">
            Your professional details are self-reported.
            Directory visibility follows your selected
            preference.
          </Text>

        </View>

      </View>

    </OnboardingLayout>
  );
};
