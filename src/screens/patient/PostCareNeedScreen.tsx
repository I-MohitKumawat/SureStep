import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useTheme } from '../../theme/ThemeContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { useAuth } from '../../hooks/useAuth';
import type { PatientStackParams } from '../../types/navigation.types';

type NavigationProp = NativeStackNavigationProp<PatientStackParams, 'PostCareNeedScreen'>;

const CARE_HELP_OPTIONS = [
  { id: 'daily_activities', label: 'Daily activities', icon: 'sunny-outline' },
  { id: 'personal_care', label: 'Personal care', icon: 'person-outline' },
  { id: 'mobility_support', label: 'Mobility support', icon: 'walk-outline' },
  { id: 'companionship', label: 'Companionship', icon: 'people-outline' },
  { id: 'medication_assistance', label: 'Medication assistance', icon: 'medkit-outline' },
] as const;

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const PostCareNeedScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { mode } = useTheme();
  const { user } = useAuth();
  const isDark = mode === 'dark';

  // Form State
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [preferredTime] = useState('9:00 AM – 12:00 PM');
  const [selectedHelp, setSelectedHelp] = useState<string[]>(['daily_activities', 'medication_assistance']);
  const [dementiaPreferred, setDementiaPreferred] = useState(true);
  const [minExperience] = useState('At least 2 years');
  const [location] = useState('Bengaluru');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleHelp = (id: string) => {
    setSelectedHelp((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  };

  const handlePostCareNeed = () => {
    if (selectedHelp.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one type of care help needed.');
      return;
    }

    setSubmitting(true);
    // Post care need to discovery workflow and route to responses
    setTimeout(() => {
      setSubmitting(false);
      navigation.navigate('CareNeedResponsesScreen' as any, {
        needId: 'req_auto_' + Date.now(),
        targetPatientId: user?.id,
        targetPatientName: user?.name,
      });
    }, 400);
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']} style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={22} color={isDark ? '#F5F7F6' : '#111827'} />
            <Text style={[styles.backText, { color: isDark ? '#F5F7F6' : '#111827' }]}>Back</Text>
          </Pressable>

          <Text style={styles.brandTitle}>SureStep</Text>

          {/* Persistent SOS Pill */}
          <View style={styles.sosPill}>
            <Ionicons name="call" size={14} color="#DC2626" style={{ marginRight: 4 }} />
            <Text style={styles.sosText}>SOS</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Title */}
          <View style={styles.titleSection}>
            <Text style={[styles.mainHeading, { color: isDark ? '#F5F7F6' : '#111827' }]}>
              What kind of help do you need?
            </Text>
          </View>

          {/* Section 1: Who needs care? */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="person-outline" size={20} color={C.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionLabel, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                Who needs care?
              </Text>
            </View>

            <View style={[styles.patientCard, { backgroundColor: isDark ? '#1C2422' : '#E6F4F1', borderColor: C.primary }]}>
              <Ionicons name="checkmark-circle" size={22} color={C.primary} style={{ marginRight: 10 }} />
              <View>
                <Text style={[styles.patientCardTitle, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                  For me
                </Text>
                <Text style={[styles.patientCardSubtitle, { color: isDark ? '#9EABA7' : '#52605D' }]}>
                  Self-managed Patient
                </Text>
              </View>
            </View>
          </View>

          {/* Section 2: When do you need help? */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="calendar-outline" size={20} color={C.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionLabel, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                When do you need help?
              </Text>
            </View>

            {/* Weekdays Row */}
            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <Pressable
                    key={day}
                    onPress={() => toggleDay(day)}
                    style={[
                      styles.dayChip,
                      isSelected && styles.dayChipSelected,
                      { backgroundColor: isSelected ? '#E6F4F1' : (isDark ? '#1C2422' : '#FFFFFF') },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        isSelected ? { color: C.primary, fontFamily: F.bold } : { color: isDark ? '#9EABA7' : '#52605D' },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Preferred Time Slot */}
            <View style={[styles.selectorCard, { backgroundColor: isDark ? '#1C2422' : '#FFFFFF' }]}>
              <View style={styles.selectorLeft}>
                <Ionicons name="time-outline" size={18} color={C.primary} style={{ marginRight: 8 }} />
                <View>
                  <Text style={[styles.selectorSub, { color: isDark ? '#9EABA7' : '#6B7280' }]}>
                    Preferred time
                  </Text>
                  <Text style={[styles.selectorVal, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                    {preferredTime}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-down" size={18} color={C.textMuted} />
            </View>
          </View>

          {/* Section 3: What help is needed? */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="list-outline" size={20} color={C.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionLabel, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                What help is needed?
              </Text>
            </View>

            <View style={styles.helpTilesWrap}>
              {CARE_HELP_OPTIONS.map((item) => {
                const isSelected = selectedHelp.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleHelp(item.id)}
                    style={[
                      styles.helpTile,
                      {
                        backgroundColor: isSelected ? '#E6F4F1' : (isDark ? '#1C2422' : '#FFFFFF'),
                        borderColor: isSelected ? C.primary : '#E5E0D8',
                      },
                    ]}
                  >
                    <View style={styles.helpTileLeft}>
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={isSelected ? C.primary : (isDark ? '#9EABA7' : '#52605D')}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={[
                          styles.helpTileLabel,
                          { color: isDark ? '#F5F7F6' : '#111827' },
                          isSelected && { fontFamily: F.bold, color: C.primary },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isSelected ? C.primary : C.textMuted}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Section 4: Experience */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="ribbon-outline" size={20} color={C.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionLabel, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                Experience
              </Text>
            </View>

            <View style={[styles.expCard, { backgroundColor: isDark ? '#1C2422' : '#FFFFFF' }]}>
              <Pressable
                onPress={() => setDementiaPreferred(!dementiaPreferred)}
                style={styles.expCheckboxRow}
              >
                <Ionicons
                  name={dementiaPreferred ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={dementiaPreferred ? C.primary : C.textMuted}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.expCheckboxText, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                  Dementia experience preferred
                </Text>
              </Pressable>

              <View style={styles.expDropdownPill}>
                <Text style={styles.expDropdownText}>{minExperience}</Text>
                <Ionicons name="chevron-down" size={16} color={C.primary} />
              </View>
            </View>
          </View>

          {/* Section 5: Location */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="location-outline" size={20} color={C.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionLabel, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                Location
              </Text>
            </View>

            <View style={[styles.locationCard, { backgroundColor: isDark ? '#1C2422' : '#FFFFFF' }]}>
              <View style={styles.locationLeft}>
                <Ionicons name="navigate-outline" size={18} color={C.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.locationText, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                  {location}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
            </View>
          </View>

          {/* Section 6: Additional Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="document-text-outline" size={20} color={C.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionLabel, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                Additional details
              </Text>
            </View>

            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: isDark ? '#1C2422' : '#FFFFFF',
                  color: isDark ? '#F5F7F6' : '#111827',
                  borderColor: '#E5E0D8',
                },
              ]}
              multiline
              numberOfLines={3}
              value={additionalDetails}
              onChangeText={setAdditionalDetails}
              placeholder="Anything else caregivers should know?"
              placeholderTextColor={isDark ? '#6B7A77' : '#9CA3AF'}
              maxLength={500}
            />
            <Text style={[styles.charCount, { color: isDark ? '#6B7A77' : '#9CA3AF' }]}>
              {additionalDetails.length}/500
            </Text>
          </View>

          {/* Bottom Action */}
          <Pressable
            onPress={handlePostCareNeed}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Post Care Need"
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
            ]}
          >
            <Text style={styles.submitBtnText}>
              {submitting ? 'Posting...' : 'Post Care Need →'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontFamily: F.medium,
    fontSize: 15,
  },
  brandTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: C.primary,
  },
  sosPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE8E7',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  sosText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#DC2626',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  mainHeading: {
    fontFamily: F.bold,
    fontSize: 26,
    lineHeight: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: F.bold,
    fontSize: 16,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  patientCardTitle: {
    fontFamily: F.bold,
    fontSize: 15,
  },
  patientCardSubtitle: {
    fontFamily: F.regular,
    fontSize: 12,
    marginTop: 1,
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  dayChipSelected: {
    borderColor: C.primary,
  },
  dayChipText: {
    fontSize: 12,
    fontFamily: F.medium,
  },
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorSub: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  selectorVal: {
    fontSize: 13,
    fontFamily: F.semiBold,
    marginTop: 1,
  },
  helpTilesWrap: {
    gap: 8,
  },
  helpTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  helpTileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpTileLabel: {
    fontFamily: F.medium,
    fontSize: 14,
  },
  expCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  expCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expCheckboxText: {
    fontFamily: F.medium,
    fontSize: 13,
  },
  expDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  expDropdownText: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: C.primary,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontFamily: F.semiBold,
    fontSize: 14,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontFamily: F.regular,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitBtnText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
