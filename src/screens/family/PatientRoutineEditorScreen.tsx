/**
 * SureStep — src/screens/family/PatientRoutineEditorScreen.tsx
 * Screen for creating or editing a routine definition for a patient.
 * Aligns with "Calm Morning Medication Routine UI.png".
 *
 * Calls:
 *   POST /patients/:patientId/routines
 *   PATCH /patients/:patientId/routines/:id
 *   DELETE /patients/:patientId/routines/:id
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FamilyStackParams } from '../../types/navigation.types';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import {
  createRoutineDefinition,
  updateRoutineDefinition,
  deleteRoutineDefinition,
  RoutineInstructionStep,
  RoutineDefinition,
} from '../../services/routineService';

type Props = NativeStackScreenProps<FamilyStackParams, 'PatientRoutineEditorScreen'>;

interface StepItem {
  id: string;
  step_order: number;
  title: string;
  description: string;
}

const CATEGORIES = [
  { key: 'MEDICATION', label: 'Medication', icon: 'medical-outline' as const },
  { key: 'MEAL', label: 'Meal', icon: 'restaurant-outline' as const },
  { key: 'ACTIVITY', label: 'Activity', icon: 'walk-outline' as const },
  { key: 'PERSONAL_CARE', label: 'Personal care', icon: 'sparkles-outline' as const },
  { key: 'HYGIENE', label: 'Hygiene', icon: 'water-outline' as const },
  { key: 'CUSTOM', label: 'Other', icon: 'ellipsis-horizontal-circle-outline' as const },
];

const RECURRENCE_OPTIONS = [
  { key: 'DAILY', label: 'Every day' },
  { key: 'WEEKDAYS', label: 'Weekdays (Mon-Fri)' },
  { key: 'WEEKENDS', label: 'Weekends (Sat-Sun)' },
  { key: 'CUSTOM', label: 'Custom' },
];

export const PatientRoutineEditorScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { patientId, patientName = 'Patient', mode, routine } = route.params;

  const existingRoutine = routine as RoutineDefinition | undefined;

  // Form state
  const [title, setTitle] = useState(existingRoutine?.title ?? '');
  const [category, setCategory] = useState<string>(existingRoutine?.category ?? 'MEDICATION');
  const [scheduledTime, setScheduledTime] = useState(existingRoutine?.scheduled_time ?? '08:00');
  const [recurrence, setRecurrence] = useState(existingRoutine?.recurrence_pattern ?? 'DAILY');
  const [notes, setNotes] = useState(existingRoutine?.notes ?? '');

  // Step instructions
  const [steps, setSteps] = useState<StepItem[]>(() => {
    if (existingRoutine?.instruction_steps && existingRoutine.instruction_steps.length > 0) {
      return existingRoutine.instruction_steps.map((s, idx) => ({
        id: `step-${idx}-${Date.now()}`,
        step_order: s.step_order || idx + 1,
        title: s.title || '',
        description: s.description || '',
      }));
    }
    return [
      { id: 'step-1', step_order: 1, title: '', description: '' },
    ];
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Add Step
  const handleAddStep = () => {
    const nextOrder = steps.length + 1;
    setSteps((prev) => [
      ...prev,
      { id: `step-${Date.now()}`, step_order: nextOrder, title: '', description: '' },
    ]);
  };

  // Remove Step
  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) {
      Alert.alert('Notice', 'Routines must have at least one instruction step.');
      return;
    }
    setSteps((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      return updated.map((item, idx) => ({ ...item, step_order: idx + 1 }));
    });
  };

  // Update step field
  const handleUpdateStep = (index: number, field: 'title' | 'description', value: string) => {
    setSteps((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Move step up / down
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    setSteps((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((item, idx) => ({ ...item, step_order: idx + 1 }));
    });
  };

  // Save handler
  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Required', 'Please enter a name for this routine.');
      return;
    }

    // Filter valid steps
    const validSteps: RoutineInstructionStep[] = steps
      .map((s, idx) => ({
        step_order: idx + 1,
        title: s.title.trim(),
        description: s.description.trim() || undefined,
      }))
      .filter((s) => s.title.length > 0);

    if (validSteps.length === 0) {
      Alert.alert('Required', 'Please provide at least one instruction step with a title.');
      return;
    }

    try {
      setSaving(true);
      if (mode === 'edit' && existingRoutine?.id) {
        await updateRoutineDefinition(patientId, existingRoutine.id, {
          title: trimmedTitle,
          category,
          scheduled_time: scheduledTime,
          recurrence_pattern: recurrence,
          instruction_steps: validSteps,
          notes: notes.trim() || undefined,
        });
        Alert.alert('Routine Updated', `${trimmedTitle} has been updated.`);
      } else {
        await createRoutineDefinition(patientId, {
          title: trimmedTitle,
          category,
          scheduled_time: scheduledTime,
          recurrence_pattern: recurrence,
          instruction_steps: validSteps,
          notes: notes.trim() || undefined,
        });
        Alert.alert('Routine Created', `${trimmedTitle} is now active.`);
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save routine. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const handleDelete = () => {
    if (!existingRoutine?.id) return;
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${existingRoutine.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteRoutineDefinition(patientId, existingRoutine.id);
              Alert.alert('Deleted', 'Routine has been removed.');
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete routine.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FAF8F5' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {mode === 'edit' ? 'Edit Routine' : 'New Routine'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            For {patientName}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.saveHeaderBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving || deleting}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#0E7A67" />
          ) : (
            <Text style={styles.saveHeaderText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 48 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Name Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Routine Name</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Morning Medication, Hydration"
            placeholderTextColor={C.textMuted}
          />
        </View>

        {/* Category Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                  onPress={() => setCategory(cat.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={cat.icon}
                    size={20}
                    color={isSelected ? '#0E7A67' : C.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      isSelected && styles.categoryLabelSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Schedule & Recurrence Row */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Scheduled Time</Text>
            <View style={styles.timeInputContainer}>
              <Ionicons name="time-outline" size={18} color={C.textSecondary} style={{ marginRight: 6 }} />
              <TextInput
                style={styles.timeInput}
                value={scheduledTime}
                onChangeText={setScheduledTime}
                placeholder="08:00"
                placeholderTextColor={C.textMuted}
                maxLength={5}
              />
            </View>
          </View>

          <View style={[styles.section, { flex: 1.3, marginLeft: 8 }]}>
            <Text style={styles.label}>Repeats</Text>
            <View style={styles.recurrenceWrap}>
              {RECURRENCE_OPTIONS.slice(0, 2).map((opt) => {
                const isSelected = recurrence === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.recurrencePill,
                      isSelected && styles.recurrencePillSelected,
                    ]}
                    onPress={() => setRecurrence(opt.key)}
                  >
                    <Text
                      style={[
                        styles.recurrencePillText,
                        isSelected && styles.recurrencePillTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Instruction Steps Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.label}>Instruction Steps</Text>
            <Text style={styles.stepCountNotice}>
              {steps.length} {steps.length === 1 ? 'step' : 'steps'}
            </Text>
          </View>

          {steps.map((step, idx) => (
            <View key={step.id} style={styles.stepCard}>
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepHeaderLabel}>Step {idx + 1}</Text>
                <View style={styles.stepActionsRow}>
                  {idx > 0 && (
                    <TouchableOpacity
                      onPress={() => handleMoveStep(idx, 'up')}
                      style={styles.stepIconBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="chevron-up" size={18} color={C.textSecondary} />
                    </TouchableOpacity>
                  )}
                  {idx < steps.length - 1 && (
                    <TouchableOpacity
                      onPress={() => handleMoveStep(idx, 'down')}
                      style={styles.stepIconBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="chevron-down" size={18} color={C.textSecondary} />
                    </TouchableOpacity>
                  )}
                  {steps.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveStep(idx)}
                      style={[styles.stepIconBtn, { marginLeft: 4 }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#C93B2B" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <TextInput
                style={styles.stepTitleInput}
                value={step.title}
                onChangeText={(val) => handleUpdateStep(idx, 'title', val)}
                placeholder="What should be done in this step?"
                placeholderTextColor={C.textMuted}
              />

              <TextInput
                style={styles.stepDescInput}
                value={step.description}
                onChangeText={(val) => handleUpdateStep(idx, 'description', val)}
                placeholder="Additional notes or directions (optional)"
                placeholderTextColor={C.textMuted}
                multiline
              />
            </View>
          ))}

          <TouchableOpacity
            style={styles.addStepBtn}
            onPress={handleAddStep}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color="#0E7A67" />
            <Text style={styles.addStepBtnText}>Add another step</Text>
          </TouchableOpacity>
        </View>

        {/* Additional Care Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Caregiver & Family Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Important medical notes, food pairings, or patient preferences..."
            placeholderTextColor={C.textMuted}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Primary Save Button */}
        <TouchableOpacity
          style={[styles.primarySaveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving || deleting}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.primarySaveBtnText}>
              {mode === 'edit' ? 'Update Routine' : 'Save Routine'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Delete Routine Action (Edit mode only) */}
        {mode === 'edit' && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            disabled={saving || deleting}
            activeOpacity={0.7}
          >
            {deleting ? (
              <ActivityIndicator color="#C93B2B" size="small" />
            ) : (
              <Text style={styles.deleteBtnText}>Delete this routine</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0D8',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#161E1C',
  },
  headerSubtitle: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 2,
  },
  saveHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveHeaderText: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#0E7A67',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#161E1C',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: F.regular,
    color: '#161E1C',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  categoryCardSelected: {
    borderColor: '#0E7A67',
    backgroundColor: '#EBF5F3',
  },
  categoryLabel: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#52605D',
  },
  categoryLabelSelected: {
    fontFamily: F.semiBold,
    color: '#0E7A67',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timeInput: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 15,
    color: '#161E1C',
  },
  recurrenceWrap: {
    gap: 6,
  },
  recurrencePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  recurrencePillSelected: {
    borderColor: '#0E7A67',
    backgroundColor: '#EBF5F3',
  },
  recurrencePillText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#52605D',
  },
  recurrencePillTextSelected: {
    color: '#0E7A67',
    fontFamily: F.semiBold,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepCountNotice: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0E7A67',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stepBadgeText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  stepHeaderLabel: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: '#161E1C',
    flex: 1,
  },
  stepActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIconBtn: {
    padding: 4,
  },
  stepTitleInput: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#161E1C',
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
    paddingVertical: 6,
    marginBottom: 6,
  },
  stepDescInput: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    minHeight: 36,
    paddingVertical: 4,
  },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0E7A67',
    borderStyle: 'dashed',
    backgroundColor: '#F5FAF9',
    gap: 6,
    marginTop: 4,
  },
  addStepBtnText: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#0E7A67',
  },
  notesInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  primarySaveBtn: {
    backgroundColor: '#0E7A67',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primarySaveBtnText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  deleteBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  deleteBtnText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#C93B2B',
  },
});
