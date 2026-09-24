import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { DiscoveryFilterOptions } from '../../services/relationshipService';
import { CAPABILITY_OPTIONS, SHIFT_OPTIONS } from '../../types/care.types';

export interface FilterState {
  sortBy: 'newest' | 'experience' | 'price_asc' | 'price_desc' | 'rating';
  role?: string;
  city?: string;
  dementiaExperience: boolean;
  minExperienceYears?: number;
  maxHourlyRate?: number;
  capabilities: string[];
  specializations: string[];
  languages: string[];
  availability: string[];
}

export const DEFAULT_FILTERS: FilterState = {
  sortBy: 'newest',
  role: undefined,
  city: undefined,
  dementiaExperience: false,
  minExperienceYears: undefined,
  maxHourlyRate: undefined,
  capabilities: [],
  specializations: [],
  languages: [],
  availability: [],
};

const SORT_OPTIONS: Array<{ key: FilterState['sortBy']; label: string }> = [
  { key: 'newest', label: 'Newest' },
  { key: 'rating', label: 'Highest Rated' },
  { key: 'experience', label: 'Most Experienced' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
];

const ROLES = [
  'All',
  'Dementia Care Specialist',
  'Geriatric Caregiver',
  'Clinical Nurse',
  'General Aide',
  'Palliative Caregiver',
  'Companion Caregiver',
];

const EXP_PRESETS = [
  { label: 'Any', value: undefined },
  { label: '2+ yrs', value: 2 },
  { label: '5+ yrs', value: 5 },
  { label: '8+ yrs', value: 8 },
  { label: '10+ yrs', value: 10 },
];

const RATE_PRESETS = [
  { label: 'Any', value: undefined },
  { label: '₹300/hr', value: 300 },
  { label: '₹500/hr', value: 500 },
  { label: '₹800/hr', value: 800 },
  { label: '₹1,200/hr', value: 1200 },
];



const SPECIALIZATIONS = [
  "Alzheimer's Disease",
  'Vascular Dementia',
  'Lewy Body Dementia',
  'Frontotemporal Dementia',
  "Parkinson's Disease",
  'Post-Stroke Care',
  'Mild Cognitive Impairment',
];

const LANGUAGES = [
  'English',
  'Hindi',
  'Kannada',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Marathi',
  'Bengali',
];



interface Props {
  visible: boolean;
  filters: FilterState;
  onClose: () => void;
  onApply: (newFilters: FilterState) => void;
  onReset: () => void;
}

export const DiscoveryFilterModal: React.FC<Props> = ({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Sync with incoming filters when modal opens
  React.useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const toggleArrayItem = (field: 'capabilities' | 'specializations' | 'languages' | 'availability', item: string) => {
    setLocalFilters((prev) => {
      const current = prev[field];
      const next = current.includes(item)
        ? current.filter((x) => x !== item)
        : [...current, item];
      return { ...prev, [field]: next };
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTERS);
    onReset();
    onClose();
  };

  // Count active filters (excluding default sortBy)
  const activeCount =
    (localFilters.sortBy !== 'newest' ? 1 : 0) +
    (localFilters.role && localFilters.role !== 'All' ? 1 : 0) +
    (localFilters.city ? 1 : 0) +
    (localFilters.dementiaExperience ? 1 : 0) +
    (localFilters.minExperienceYears ? 1 : 0) +
    (localFilters.maxHourlyRate ? 1 : 0) +
    localFilters.capabilities.length +
    localFilters.specializations.length +
    localFilters.languages.length +
    localFilters.availability.length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Filter Caregivers</Text>
              {activeCount > 0 && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{activeCount}</Text>
                </View>
              )}
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={22} color={C.textPrimary} />
            </Pressable>
          </View>

          {/* Scrollable Filters */}
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Sort Order */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SORT BY</Text>
              <View style={styles.chipsRow}>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = localFilters.sortBy === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setLocalFilters((prev) => ({ ...prev, sortBy: opt.key }))}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Care Role */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CARE ROLE</Text>
              <View style={styles.chipsRow}>
                {ROLES.map((r) => {
                  const isSelected = (!localFilters.role && r === 'All') || localFilters.role === r;
                  return (
                    <Pressable
                      key={r}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          role: r === 'All' ? undefined : r,
                        }))
                      }
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {r}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* City / Neighborhood Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CITY / AREA</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="location-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Bangalore, South Mumbai"
                  placeholderTextColor={C.textMuted}
                  value={localFilters.city || ''}
                  onChangeText={(val) =>
                    setLocalFilters((prev) => ({ ...prev, city: val.trim() || undefined }))
                  }
                  autoCorrect={false}
                />
                {localFilters.city ? (
                  <Pressable
                    onPress={() => setLocalFilters((prev) => ({ ...prev, city: undefined }))}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={18} color={C.textMuted} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Dementia Focus Switch */}
            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={styles.switchTitle}>Dementia Training / Experience</Text>
                <Text style={styles.switchSub}>Only show caregivers specialized in cognitive care</Text>
              </View>
              <Switch
                value={localFilters.dementiaExperience}
                onValueChange={(val) =>
                  setLocalFilters((prev) => ({ ...prev, dementiaExperience: val }))
                }
                trackColor={{ false: '#CBD5E1', true: C.primaryLight }}
                thumbColor={localFilters.dementiaExperience ? C.primary : '#FFFFFF'}
              />
            </View>

            {/* Minimum Experience */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MINIMUM EXPERIENCE</Text>
              <View style={styles.chipsRow}>
                {EXP_PRESETS.map((preset) => {
                  const isSelected = localFilters.minExperienceYears === preset.value;
                  return (
                    <Pressable
                      key={preset.label}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          minExperienceYears: preset.value,
                        }))
                      }
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Maximum Hourly Rate */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MAX HOURLY RATE</Text>
              <View style={styles.chipsRow}>
                {RATE_PRESETS.map((preset) => {
                  const isSelected = localFilters.maxHourlyRate === preset.value;
                  return (
                    <Pressable
                      key={preset.label}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          maxHourlyRate: preset.value,
                        }))
                      }
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Care Capabilities */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CARE CAPABILITIES</Text>
              <View style={styles.chipsRow}>
                {CAPABILITY_OPTIONS.map((cap) => {
                  const isSelected = localFilters.capabilities.includes(cap.id);
                  return (
                    <Pressable
                      key={cap.id}
                      style={[styles.multiChip, isSelected && styles.multiChipSelected]}
                      onPress={() => toggleArrayItem('capabilities', cap.id)}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                      )}
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {cap.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Condition Specializations */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CONDITION SPECIALIZATIONS</Text>
              <View style={styles.chipsRow}>
                {SPECIALIZATIONS.map((spec) => {
                  const isSelected = localFilters.specializations.includes(spec);
                  return (
                    <Pressable
                      key={spec}
                      style={[styles.multiChip, isSelected && styles.multiChipSelected]}
                      onPress={() => toggleArrayItem('specializations', spec)}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                      )}
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {spec}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Languages */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>LANGUAGES SPOKEN</Text>
              <View style={styles.chipsRow}>
                {LANGUAGES.map((lang) => {
                  const isSelected = localFilters.languages.includes(lang);
                  return (
                    <Pressable
                      key={lang}
                      style={[styles.multiChip, isSelected && styles.multiChipSelected]}
                      onPress={() => toggleArrayItem('languages', lang)}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                      )}
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {lang}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Shifts / Availability */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>AVAILABLE SHIFTS</Text>
              <View style={styles.chipsRow}>
                {SHIFT_OPTIONS.map((shift) => {
                  const isSelected = localFilters.availability.includes(shift.id);
                  return (
                    <Pressable
                      key={shift.id}
                      style={[styles.multiChip, isSelected && styles.multiChipSelected]}
                      onPress={() => toggleArrayItem('availability', shift.id)}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                      )}
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {shift.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            <Pressable onPress={handleReset} style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>Clear All</Text>
            </Pressable>
            <Pressable onPress={handleApply} style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: C.textPrimary,
  },
  activeBadge: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 8,
  },
  activeBadgeText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  section: {
    marginTop: 18,
  },
  sectionLabel: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipSelected: {
    backgroundColor: '#0E7A67',
    borderColor: '#0E7A67',
  },
  chipText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#334155',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontFamily: F.bold,
  },
  multiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  multiChipSelected: {
    backgroundColor: '#0E7A67',
    borderColor: '#0E7A67',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  switchTitle: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: C.textPrimary,
  },
  switchSub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  resetBtn: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#64748B',
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
