/**
 * SureStep — src/screens/auth/patient-onboarding/Step5Medications.tsx
 * Step 5: Regular medications toggle and structured medication list.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { MedicationModal } from '../../../components/onboarding/MedicationModal';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';
import type { PatientMedicationItem } from '../../../types/api.types';
import type { OnboardingIntent } from '../../../types/navigation.types';

interface Step5Props {
  intent: OnboardingIntent;
  takesMedication: boolean;
  medications: PatientMedicationItem[];
  onUpdate: (fields: {
    takesMedication?: boolean;
    medications?: PatientMedicationItem[];
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step5Medications: React.FC<Step5Props> = ({
  intent,
  takesMedication,
  medications,
  onUpdate,
  onNext,
  onBack,
}) => {
  const isSelf = intent === 'RECEIVING_CARE';
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PatientMedicationItem | null>(null);

  const handleSaveMedication = (item: PatientMedicationItem) => {
    if (editingItem) {
      onUpdate({
        medications: medications.map((m) => (m.id === item.id ? item : m)),
      });
    } else {
      onUpdate({
        medications: [...medications, item],
      });
    }
    setEditingItem(null);
    setModalVisible(false);
  };

  const handleRemove = (id: string) => {
    onUpdate({
      medications: medications.filter((m) => m.id !== id),
    });
  };

  const openAdd = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const openEdit = (item: PatientMedicationItem) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const isNextDisabled = takesMedication && medications.length === 0;

  return (
    <OnboardingLayout
      title={isSelf ? 'Do you take regular medication?' : 'Regular Medications'}
      subtitle={
        isSelf
          ? 'SureStep will chime in with friendly reminders so you never miss a dose.'
          : 'Set up medication reminders with times of day and dosage.'
      }
      currentStep={5}
      iconName="medkit"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={isNextDisabled}
    >
      {/* Takes Medication Toggle */}
      <View style={s.toggleRow}>
        <Pressable
          onPress={() => onUpdate({ takesMedication: false, medications: [] })}
          style={[s.toggleBtn, !takesMedication && s.toggleBtnSelected]}
        >
          <Ionicons
            name={!takesMedication ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={!takesMedication ? C.primary : '#9CA3AF'}
            style={{ marginRight: 8 }}
          />
          <Text style={[s.toggleBtnText, !takesMedication && s.toggleBtnTextSelected]}>
            No, None
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onUpdate({ takesMedication: true })}
          style={[s.toggleBtn, takesMedication && s.toggleBtnSelected]}
        >
          <Ionicons
            name={takesMedication ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={takesMedication ? C.primary : '#9CA3AF'}
            style={{ marginRight: 8 }}
          />
          <Text style={[s.toggleBtnText, takesMedication && s.toggleBtnTextSelected]}>
            Yes, Takes Meds
          </Text>
        </Pressable>
      </View>

      {/* Medication List */}
      {takesMedication && (
        <View style={s.medsSection}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>
              Medication Schedule ({medications.length})
            </Text>
            <Pressable onPress={openAdd} style={s.addBtn}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={s.addBtnText}>Add</Text>
            </Pressable>
          </View>

          {medications.length === 0 ? (
            <View style={s.emptyBox}>
              <Ionicons name="bandage-outline" size={32} color="#D1D5DB" />
              <Text style={s.emptyTitle}>No medications added yet</Text>
              <Text style={s.emptySub}>
                Tap &quot;Add Medication&quot; above to list names and dosage.
              </Text>
            </View>
          ) : (
            medications.map((med) => (
              <View key={med.id} style={s.medCard}>
                <View style={s.medInfo}>
                  <View style={s.nameRow}>
                    <Text style={s.medName}>{med.name}</Text>
                    <View style={s.dosageBadge}>
                      <Text style={s.dosageText}>{med.dosage}</Text>
                    </View>
                  </View>

                  <View style={s.timesRow}>
                    {med.times_of_day?.map((time) => (
                      <View key={time} style={s.timePill}>
                        <Ionicons name="time-outline" size={12} color={C.primary} style={{ marginRight: 4 }} />
                        <Text style={s.timePillText}>{time}</Text>
                      </View>
                    ))}
                  </View>

                  {med.instructions ? (
                    <Text style={s.instructions}>{med.instructions}</Text>
                  ) : null}
                </View>

                <View style={s.medActions}>
                  <Pressable onPress={() => openEdit(med)} style={s.actionBtn} hitSlop={8}>
                    <Ionicons name="pencil" size={18} color={C.primary} />
                  </Pressable>
                  <Pressable onPress={() => handleRemove(med.id)} style={s.actionBtn} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={C.error} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Medication Modal */}
      <MedicationModal
        visible={modalVisible}
        initialItem={editingItem}
        onSave={handleSaveMedication}
        onCancel={() => {
          setEditingItem(null);
          setModalVisible(false);
        }}
      />
    </OnboardingLayout>
  );
};

const s = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  toggleBtnSelected: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0E5A4A',
    borderWidth: 2,
  },
  toggleBtnText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#374151',
  },
  toggleBtnTextSelected: {
    fontFamily: F.bold,
    color: '#0E5A4A',
  },
  medsSection: {
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.primary,
    gap: 4,
  },
  addBtnText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
  },
  emptyTitle: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 10,
  },
  emptySub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  medInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  medName: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
  },
  dosageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  dosageText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#374151',
  },
  timesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#EAF7F4',
  },
  timePillText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.primary,
  },
  instructions: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  medActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 10,
  },
  actionBtn: {
    padding: 6,
  },
});
