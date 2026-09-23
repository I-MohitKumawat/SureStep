/**
 * SureStep — src/components/onboarding/MedicationModal.tsx
 * Modal to add or edit a medication item in onboarding Step 5.
 */
import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { PatientMedicationItem } from '../../types/api.types';

interface MedicationModalProps {
  visible: boolean;
  initialItem?: PatientMedicationItem | null;
  onSave: (item: PatientMedicationItem) => void;
  onCancel: () => void;
}

const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Bedtime'];

export const MedicationModal: React.FC<MedicationModalProps> = ({
  visible,
  initialItem,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [timesOfDay, setTimesOfDay] = useState<string[]>(['Morning']);
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name || '');
      setDosage(initialItem.dosage || '');
      setTimesOfDay(initialItem.times_of_day || ['Morning']);
      setInstructions(initialItem.instructions || '');
    } else {
      setName('');
      setDosage('');
      setTimesOfDay(['Morning']);
      setInstructions('');
    }
    setError(null);
  }, [initialItem, visible]);

  const toggleTime = (time: string) => {
    setTimesOfDay((prev) =>
      prev.includes(time)
        ? prev.length > 1
          ? prev.filter((t) => t !== time)
          : prev
        : [...prev, time]
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Medication name is required');
      return;
    }
    const id = initialItem?.id || `med_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    onSave({
      id,
      name: name.trim(),
      dosage: dosage.trim() || '1 dose',
      times_of_day: timesOfDay,
      instructions: instructions.trim() || undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={s.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={s.dismissArea} onPress={onCancel} />
        <View style={s.sheet}>
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>
              {initialItem ? 'Edit Medication' : 'Add Medication'}
            </Text>
            <Pressable onPress={onCancel} hitSlop={12}>
              <Ionicons name="close" size={24} color={C.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {error ? <Text style={s.errorText}>{error}</Text> : null}

            {/* Medication Name */}
            <Text style={s.label}>Medication Name *</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., Donepezil, Metformin"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError(null);
              }}
              autoFocus
            />

            {/* Dosage */}
            <Text style={s.label}>Dosage (Optional)</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., 5mg, 1 tablet, 2 drops"
              placeholderTextColor="#9CA3AF"
              value={dosage}
              onChangeText={setDosage}
            />

            {/* Times of Day */}
            <Text style={s.label}>When should it be taken?</Text>
            <View style={s.timesRow}>
              {TIME_OPTIONS.map((time) => {
                const selected = timesOfDay.includes(time);
                return (
                  <Pressable
                    key={time}
                    onPress={() => toggleTime(time)}
                    style={[s.timeChip, selected && s.timeChipSelected]}
                  >
                    <Text
                      style={[
                        s.timeChipText,
                        selected && s.timeChipTextSelected,
                      ]}
                    >
                      {time}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Special Instructions */}
            <Text style={s.label}>Special Instructions (Optional)</Text>
            <TextInput
              style={[s.input, s.inputMulti]}
              placeholder="e.g., Take after food with a glass of water"
              placeholderTextColor="#9CA3AF"
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
            />

            {/* Actions */}
            <View style={s.buttonRow}>
              <Pressable onPress={onCancel} style={s.cancelBtn}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={s.saveBtn}>
                <Text style={s.saveBtnText}>
                  {initialItem ? 'Update' : 'Add Medication'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: C.textPrimary,
  },
  errorText: {
    color: C.error,
    fontFamily: F.medium,
    fontSize: 13,
    marginBottom: 8,
  },
  label: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: F.regular,
    color: C.textPrimary,
    backgroundColor: '#F9FAFB',
  },
  inputMulti: {
    height: 80,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  timesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  timeChipSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  timeChipText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#374151',
  },
  timeChipTextSelected: {
    color: '#FFFFFF',
    fontFamily: F.bold,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
    marginBottom: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: C.textSecondary,
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
