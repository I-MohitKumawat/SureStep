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
  TouchableOpacity,
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
                  <TouchableOpacity
                    key={time}
                    onPress={() => toggleTime(time)}
                    activeOpacity={0.7}
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
                  </TouchableOpacity>
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
              <TouchableOpacity onPress={onCancel} style={s.cancelBtn} activeOpacity={0.7}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={s.saveBtn} activeOpacity={0.88}>
                <Text style={s.saveBtnText}>
                  {initialItem ? 'Update' : 'Add Medication'}
                </Text>
              </TouchableOpacity>
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
    backgroundColor: '#FAF8F5',
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
    color: '#161E1C',
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
    color: '#161E1C',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: F.regular,
    color: '#161E1C',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
  },
  timeChipSelected: {
    backgroundColor: '#0E7A67',
    borderColor: '#0E7A67',
  },
  timeChipText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#161E1C',
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
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#52605D',
  },
  saveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#0E7A67',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E7A67',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
