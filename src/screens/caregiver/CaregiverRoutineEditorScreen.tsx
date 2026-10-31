import React, { useState, useMemo } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { Feather } from '@expo/vector-icons';
import { getCategoryIcon } from '../../components/shared/RoutineCapsule';
import type { CaregiverStackParams } from '../../types/navigation.types';
import {
  createRoutineDefinition,
  updateRoutineDefinition,
  normalizeRoutineCategory,
  type RoutineCategory,
} from '../../services/routineService';

type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverRoutineEditorScreen'>;

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke={C.textPrimary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TrashIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UpIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M5 15l7-7 7 7" stroke={C.textPrimary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DownIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M19 9l-7 7-7-7" stroke={C.textPrimary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CATEGORIES = [
  { label: 'Medication', icon: 'activity' },
  { label: 'Meal', icon: 'coffee' },
  { label: 'Exercise', icon: 'zap' },
  { label: 'Hygiene', icon: 'droplet' },
  { label: 'Appointment', icon: 'calendar' },
];
const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const CaregiverRoutineEditorScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patientId, patientName, mode } = route.params;
  const routine = mode === 'edit' ? route.params.routine : undefined;

  // ─── Form State ─────────────────────────────────────────────────────────────
  const [name, setName] = useState(mode === 'edit' && routine ? routine.title : '');
  const [category, setCategory] = useState(
    mode === 'edit' && routine ? routine.category || 'Medication' : 'Medication'
  );
  


  // Recurrence state (canonical schedule_pattern)
  const [recurrenceType, setRecurrenceType] = useState<'DAILY' | 'WEEKLY'>(
    mode === 'edit' && routine?.schedule_pattern?.frequency === 'WEEKLY' ? 'WEEKLY' : 'DAILY'
  );
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(
    mode === 'edit' && routine?.schedule_pattern?.daysOfWeek
      ? routine.schedule_pattern.daysOfWeek
      : [1, 2, 3, 4, 5]
  );

  // Scheduled times (canonical schedule_pattern.times; first value is the seed time)
  const [times, setTimes] = useState<string[]>(() => {
    if (mode !== 'edit' || !routine?.schedule_pattern) return [];
    const patternTimes = routine.schedule_pattern.times;
    if (Array.isArray(patternTimes) && patternTimes.length > 0) {
      return patternTimes.map((t: string) => t.slice(0, 5));
    }
    return routine.schedule_pattern.time ? [routine.schedule_pattern.time.slice(0, 5)] : [];
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerValue, setTimePickerValue] = useState(new Date());

  // Step-by-Step Custom Ordered Instructions State
  const [steps, setSteps] = useState<Array<{ text: string; photo_url?: string }>>(() => {
    if (mode === 'edit' && routine?.description) {
      try {
        const parsed = JSON.parse(routine.description);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) =>
            typeof item === 'string'
              ? { text: item }
              : { text: item.text ?? item.title ?? '', photo_url: item.photo_url }
          );
        }
      } catch {
        // Plain-text canonical description.
      }
      return [{ text: routine.description }];
    }
    return [{ text: '' }];
  });

  const [saving, setSaving] = useState(false);
  const screenTitle = mode === 'edit' ? 'Edit Routine Template' : 'Add Routine Template';

  // Toggle day selection for weekly recurrence
  const toggleDay = (dayIndex: number) => {
    setRecurrenceDays(prev => {
      if (prev.includes(dayIndex)) {
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== dayIndex);
      }
      return [...prev, dayIndex].sort();
    });
  };

  // Add a scheduled time using clock picker
  const handleTimeConfirm = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      const hours = String(selectedDate.getHours()).padStart(2, '0');
      const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      
      if (!times.includes(timeStr)) {
        setTimes(prev => [...prev, timeStr].sort());
      }
    }
  };

  // Remove a scheduled time
  const handleRemoveTime = (timeToRemove: string) => {
    setTimes(prev => prev.filter(t => t !== timeToRemove));
  };

  // Visual steps manipulations
  const handleAddStep = () => {
    setSteps(prev => [...prev, { text: '' }]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleStepTextChange = (text: string, index: number) => {
    setSteps(prev => prev.map((s, idx) => idx === index ? { ...s, text } : s));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    setSteps(prev => {
      const copy = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= copy.length) return prev;
      
      // Swap elements
      const temp = copy[index];
      copy[index] = copy[swapIndex];
      copy[swapIndex] = temp;
      return copy;
    });
  };

  const handlePickStepPhoto = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photos access to attach images to instruction steps.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      // aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const photoUri = result.assets[0].uri;
      setSteps(prev => prev.map((s, idx) => idx === index ? { ...s, photo_url: photoUri } : s));
    }
  };

  const handleRemoveStepPhoto = (index: number) => {
    setSteps(prev => prev.map((s, idx) => idx === index ? { ...s, photo_url: undefined } : s));
  };

  // Save the form
  const handleSave = async () => {
    const cleanTitle = name.trim();
    if (!cleanTitle) {
      Alert.alert('Required Field', 'Please enter a routine title.');
      return;
    }

    if (times.length === 0) {
      Alert.alert('Required Field', 'Please schedule at least one execution time.');
      return;
    }

    const activeSteps = steps.filter(s => s.text.trim() || s.photo_url);
    setSaving(true);

    const canonicalCategory: RoutineCategory = normalizeRoutineCategory(category);
    const description = activeSteps
      .map((step, index) => (step.photo_url ? `${index + 1}. ${step.text}` : step.text))
      .filter(Boolean)
      .join('\n');

    // Canonical routine definition payload. Multiple scheduled times are
    // preserved in schedule_pattern.times so occurrence materialization can
    // generate one occurrence per time.
    const payload = {
      title: cleanTitle,
      category: canonicalCategory,
      description: description || null,
      schedulePattern: {
        frequency: recurrenceType,
        time: times[0],
        times,
        ...(recurrenceType === 'WEEKLY' ? { daysOfWeek: recurrenceDays } : {}),
      },
    };

    try {
      if (mode === 'edit' && routine) {
        await updateRoutineDefinition(patientId, routine.id, payload);
        Alert.alert('Success', 'Routine definition updated successfully.');
      } else {
        await createRoutineDefinition(patientId, payload);
        Alert.alert('Success', 'New routine definition configured.');
      }
      navigation.navigate('CaregiverPatientDetailScreen', { patientId, patientName, refresh: true });
    } catch (err) {
      console.error('[CaregiverRoutineEditor] Save failed:', err);
      Alert.alert('Error', 'Failed to save routine definition. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={15}>
          <BackIcon />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{screenTitle}</Text>
          <Text style={styles.headerSub}>For {patientName}</Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Routine Title</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Breakfast & Medication"
            placeholderTextColor={C.textMuted}
            style={styles.input}
            autoCapitalize="sentences"
            returnKeyType="next"
          />
        </View>

        {/* Category Picker */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            value={category}
            onChangeText={setCategory}
            placeholder="Type or select a category"
            placeholderTextColor={C.textMuted}
            style={[styles.input, { marginBottom: 10 }]}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
            {CATEGORIES.map((cat) => {
              const active = category.toLowerCase() === cat.label.toLowerCase();
              return (
                <Pressable
                  key={cat.label}
                  style={[styles.categoryCard, active && styles.categoryCardActive]}
                  onPress={() => setCategory(cat.label)}
                >
                  <Feather 
                    name={cat.icon as any} 
                    size={22} 
                    color={active ? C.primary : C.textSecondary} 
                    style={{ marginBottom: 4 }} 
                  />
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{cat.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Recurrence Selection */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Schedule Recurrence</Text>
          <View style={styles.recurrenceTypeRow}>
            <Pressable
              style={[styles.recurrenceTypeBtn, recurrenceType === 'DAILY' && styles.recurrenceTypeBtnActive]}
              onPress={() => setRecurrenceType('DAILY')}
            >
              <Text style={[styles.recurrenceTypeLabel, recurrenceType === 'DAILY' && styles.recurrenceTypeLabelActive]}>Daily</Text>
            </Pressable>
            <Pressable
              style={[styles.recurrenceTypeBtn, recurrenceType === 'WEEKLY' && styles.recurrenceTypeBtnActive]}
              onPress={() => setRecurrenceType('WEEKLY')}
            >
              <Text style={[styles.recurrenceTypeLabel, recurrenceType === 'WEEKLY' && styles.recurrenceTypeLabelActive]}>Weekly</Text>
            </Pressable>
          </View>

          {recurrenceType === 'WEEKLY' && (
            <View style={styles.daysRow}>
              {DAYS_SHORT.map((day, idx) => {
                const active = recurrenceDays.includes(idx);
                return (
                  <Pressable
                    key={idx}
                    style={[styles.dayCircle, active && styles.dayCircleActive]}
                    onPress={() => toggleDay(idx)}
                  >
                    <Text style={[styles.dayText, active && styles.dayTextActive]}>{day}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Multiple Execution Times Selection */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Scheduled Execution Times</Text>
          <View style={styles.timeControlRow}>
            <Pressable
              style={styles.addTimeBtn}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.addTimeBtnText}>⏰ Add Scheduled Time</Text>
            </Pressable>
          </View>

          {times.length > 0 ? (
            <View style={styles.timesContainer}>
              {times.map((t) => (
                <View key={t} style={styles.timeTag}>
                  <Text style={styles.timeTagText}>⏰ {t}</Text>
                  <Pressable onPress={() => handleRemoveTime(t)} hitSlop={6} style={styles.removeTimeBtn}>
                    <TrashIcon />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noTimesText}>No execution times added yet.</Text>
          )}

          {showTimePicker && (
            <DateTimePicker
              value={timePickerValue}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              is24Hour={true}
              onChange={handleTimeConfirm}
            />
          )}
        </View>

        {/* Step by Step Visual Instructions */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Instruction Steps</Text>
          <Text style={styles.instructionsHelper}>
            Specify steps in custom order. Add photos for clarity (e.g. meds locations, pill appearance).
          </Text>

          {steps.map((step, idx) => (
            <View key={idx} style={styles.stepCard}>
              {/* Step Header / Controls */}
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberVal}>{idx + 1}</Text>
                </View>
                
                <View style={{ flex: 1 }} />
                
                <View style={styles.stepReorderGroup}>
                  {idx > 0 && (
                    <Pressable
                      style={styles.stepReorderBtn}
                      onPress={() => handleMoveStep(idx, 'up')}
                      hitSlop={6}
                    >
                      <UpIcon />
                    </Pressable>
                  )}
                  {idx < steps.length - 1 && (
                    <Pressable
                      style={styles.stepReorderBtn}
                      onPress={() => handleMoveStep(idx, 'down')}
                      hitSlop={6}
                    >
                      <DownIcon />
                    </Pressable>
                  )}
                </View>

                {steps.length > 1 && (
                  <Pressable
                    style={styles.stepDeleteBtn}
                    onPress={() => handleRemoveStep(idx)}
                    hitSlop={6}
                  >
                    <TrashIcon />
                  </Pressable>
                )}
              </View>

              {/* Step Text Area (Auto growing multiline text input) */}
              <TextInput
                value={step.text}
                onChangeText={(txt) => handleStepTextChange(txt, idx)}
                placeholder="e.g. Take 1 green capsule from the kitchen pillbox..."
                placeholderTextColor={C.textMuted}
                style={styles.stepTextInput}
                multiline={true}
                scrollEnabled={false}
              />

              {/* Step Reference Image */}
              {step.photo_url ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: step.photo_url }} style={styles.photoPreview} />
                  <Pressable
                    style={styles.removePhotoBtn}
                    onPress={() => handleRemoveStepPhoto(idx)}
                  >
                    <Text style={styles.removePhotoBtnText}>✕ Remove Photo</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={styles.addPhotoBtn}
                  onPress={() => handlePickStepPhoto(idx)}
                >
                  <Text style={styles.addPhotoBtnText}>📷 Add Reference Photo</Text>
                </Pressable>
              )}
            </View>
          ))}

          <Pressable style={styles.addStepBtn} onPress={handleAddStep}>
            <Text style={styles.addStepBtnText}>＋ Add Step</Text>
          </Pressable>
        </View>

        {/* Submit Save Button */}
        <Pressable
          style={({ pressed }) => [styles.saveBtn, (pressed || saving) && styles.saveBtnPressed]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Routine Template'}</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F4F7F6', paddingHorizontal: 0, paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: { padding: 4 },
  headerTitleWrap: { alignItems: 'center', flex: 1 },
  headerTitle: { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary },
  headerSub: { fontFamily: F.bold, fontSize: 12, color: C.primary, marginTop: 1 },
  headerRightPlaceholder: { width: 32 },

  // Form styles
  formSection: { marginBottom: 20 },
  label: { fontFamily: F.bold, fontSize: 13, color: C.textSecondary, marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: F.regular,
    fontSize: 15,
    color: C.textPrimary,
  },

  // Emoji styles
  emojiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  emojiDisplayCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiDisplayVal: {
    fontSize: 24,
  },
  emojiTextInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: F.medium,
    fontSize: 15,
    color: C.textPrimary,
  },
  emojiSuggestions: {
    gap: 8,
    paddingBottom: 4,
  },
  emojiSuggestionBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiSuggestionText: {
    fontSize: 18,
  },

  // Categories Horizontal Picker
  categoriesRow: { gap: 8, paddingBottom: 6 },
  categoryCard: {
    width: 86,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardActive: { borderColor: C.primary, backgroundColor: '#E6F4EA' },
  categoryEmoji: { fontSize: 22, marginBottom: 4 },
  categoryText: { fontFamily: F.bold, fontSize: 11, color: C.textMuted },
  categoryTextActive: { color: C.primary },

  // Recurrence
  recurrenceTypeRow: { flexDirection: 'row', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, overflow: 'hidden', backgroundColor: '#FFFFFF', marginBottom: 10 },
  recurrenceTypeBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  recurrenceTypeBtnActive: { backgroundColor: '#E2E8F0' },
  recurrenceTypeLabel: { fontFamily: F.bold, fontSize: 13, color: C.textMuted },
  recurrenceTypeLabelActive: { color: C.textPrimary },

  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  dayCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  dayCircleActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  dayText: { fontFamily: F.bold, fontSize: 13, color: C.textMuted },
  dayTextActive: { color: C.primary },

  // Execution Times
  timeControlRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  addTimeBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addTimeBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.textPrimary,
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 6,
  },
  timeTagText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.textPrimary,
  },
  removeTimeBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
  },
  noTimesText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
    fontStyle: 'italic',
  },

  // Steps UI
  instructionsHelper: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberVal: {
    fontFamily: F.extraBold,
    fontSize: 11,
    color: C.primaryText,
  },
  stepReorderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepReorderBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addPhotoBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  addPhotoBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.primary,
  },
  photoPreviewContainer: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
  },
  removePhotoBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removePhotoBtnText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  addStepBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#94A3B8',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  addStepBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#475569',
  },

  // Save Button
  saveBtn: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 12, shadowColor: C.primary, shadowOpacity: 0.26, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6 },
  saveBtnPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  saveBtnText: { fontFamily: F.bold, color: C.primaryText, fontSize: 16 },
});
