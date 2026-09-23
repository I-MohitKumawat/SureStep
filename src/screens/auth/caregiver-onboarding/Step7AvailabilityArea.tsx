/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step7AvailabilityArea.tsx
 * Caregiver Onboarding Step 7: Availability & Service Area.
 */
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { MultiSelectChips, ChipOption } from '../../../components/onboarding/MultiSelectChips';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';

interface Step7Props {
  availabilityTypes: string[];
  serviceCity: string;
  serviceRadiusKm: number | null;
  maxPatients: number | null;
  baseCity: string;
  onUpdate: (fields: {
    availabilityTypes?: string[];
    serviceCity?: string;
    serviceRadiusKm?: number | null;
    maxPatients?: number | null;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

const AVAILABILITY_OPTIONS: ChipOption[] = [
  { id: 'DAY_SHIFT', label: 'Day Shifts', icon: 'sunny-outline' },
  { id: 'EVENING_SHIFT', label: 'Evening Shifts', icon: 'partly-sunny-outline' },
  { id: 'OVERNIGHT', label: 'Overnight Care', icon: 'moon-outline' },
  { id: 'LIVE_IN', label: '24-Hour / Live-in', icon: 'home-outline' },
  { id: 'WEEKEND', label: 'Weekend Only', icon: 'calendar-outline' },
  { id: 'FULL_TIME', label: 'Full-time', icon: 'time-outline' },
  { id: 'PART_TIME', label: 'Part-time', icon: 'hourglass-outline' },
  { id: 'RESPITE', label: 'Respite / Relief Care', icon: 'heart-outline' },
  { id: 'ON_CALL', label: 'On-call Emergency', icon: 'call-outline' },
];

const RADIUS_PRESETS = [
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '15 km', value: 15 },
  { label: '25 km', value: 25 },
  { label: '40+ km', value: 40 },
];

const CAPACITY_PRESETS = [
  { label: '1 Patient', value: 1 },
  { label: '2 Patients', value: 2 },
  { label: '3 Patients', value: 3 },
  { label: '4 Patients', value: 4 },
  { label: '5+ Patients', value: 5 },
];

export const Step7AvailabilityArea: React.FC<Step7Props> = ({
  availabilityTypes,
  serviceCity,
  serviceRadiusKm,
  maxPatients,
  baseCity,
  onUpdate,
  onNext,
  onBack,
}) => {
  const toggleAvailability = (id: string) => {
    if (availabilityTypes.includes(id)) {
      onUpdate({ availabilityTypes: availabilityTypes.filter((a) => a !== id) });
    } else {
      onUpdate({ availabilityTypes: [...availabilityTypes, id] });
    }
  };

  const effectiveCity = serviceCity || baseCity;

  const isComplete =
    availabilityTypes.length > 0 &&
    serviceRadiusKm !== null &&
    serviceRadiusKm > 0 &&
    maxPatients !== null &&
    maxPatients > 0;

  return (
    <OnboardingLayout
      title="Availability & Working Area"
      subtitle="Define your work schedule, travel radius, and capacity. No defaults are assumed."
      currentStep={7}
      totalSteps={9}
      iconName="map-outline"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >
      {/* 1. Availability Shifts */}
      <View style={s.section}>
        <View style={s.titleRow}>
          <Text style={s.sectionTitle}>Working Shifts & Availability *</Text>
          <Text style={s.counter}>{availabilityTypes.length} selected</Text>
        </View>
        <Text style={s.sectionSubtitle}>Select all shift arrangements you accept:</Text>
        <MultiSelectChips
          options={AVAILABILITY_OPTIONS}
          selectedIds={availabilityTypes}
          onToggle={toggleAvailability}
        />
      </View>

      {/* 2. Service Operating Area */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Primary Operating Area / Neighborhoods</Text>
        <Text style={s.sectionSubtitle}>
          The specific neighborhoods or areas in your city where you provide care:
        </Text>
        <View style={s.inputContainer}>
          <Ionicons name="location-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder={`e.g., ${baseCity || 'Bengaluru'} - Central & South zones`}
            placeholderTextColor="#9CA3AF"
            value={serviceCity}
            onChangeText={(t) => onUpdate({ serviceCity: t })}
          />
        </View>
      </View>

      {/* 3. Service Radius (km) */}
      <View style={s.section}>
        <View style={s.titleRow}>
          <Text style={s.sectionTitle}>Travel Radius from Base *</Text>
          {serviceRadiusKm !== null ? (
            <View style={s.badge}>
              <Text style={s.badgeText}>{serviceRadiusKm} km</Text>
            </View>
          ) : null}
        </View>
        <Text style={s.sectionSubtitle}>
          How far are you willing to commute for patient care visits?
        </Text>
        <View style={s.presetsRow}>
          {RADIUS_PRESETS.map((p) => {
            const isSelected = serviceRadiusKm === p.value;
            return (
              <Pressable
                key={p.label}
                onPress={() => onUpdate({ serviceRadiusKm: p.value })}
                style={[s.presetChip, isSelected && s.presetChipSelected]}
              >
                <Text style={[s.presetChipText, isSelected && s.presetChipTextSelected]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 4. Maximum Patient Capacity */}
      <View style={s.section}>
        <View style={s.titleRow}>
          <Text style={s.sectionTitle}>Maximum Simultaneous Patients *</Text>
          {maxPatients !== null ? (
            <View style={s.badge}>
              <Text style={s.badgeText}>
                {maxPatients === 1 ? '1 active patient' : `${maxPatients} active patients`}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={s.sectionSubtitle}>
          To maintain quality and avoid burnout, what is your patient limit?
        </Text>
        <View style={s.presetsRow}>
          {CAPACITY_PRESETS.map((p) => {
            const isSelected = maxPatients === p.value;
            return (
              <Pressable
                key={p.label}
                onPress={() => onUpdate({ maxPatients: p.value })}
                style={[s.presetChip, isSelected && s.presetChipSelected]}
              >
                <Text style={[s.presetChipText, isSelected && s.presetChipTextSelected]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </OnboardingLayout>
  );
};

const s = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: F.bold,
    color: C.textPrimary,
  },
  counter: {
    fontSize: 12,
    fontFamily: F.medium,
    color: C.primary,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: F.regular,
    color: C.textSecondary,
    marginBottom: 10,
    lineHeight: 16,
  },
  badge: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: F.medium,
    color: C.primary,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  presetChipSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  presetChipText: {
    fontSize: 12,
    fontFamily: F.medium,
    color: C.textSecondary,
  },
  presetChipTextSelected: {
    color: '#FFFFFF',
    fontFamily: F.bold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: F.regular,
    color: C.textPrimary,
  },
});
