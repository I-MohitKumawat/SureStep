/**
 * SureStep — src/screens/auth/patient-onboarding/Step5Medications.tsx
 * Step 5: Regular medications toggle and structured medication list.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
      title={isSelf ? 'Daily Routine & Medications' : 'Daily Routine & Medications'}
      subtitle={
        isSelf
          ? 'SureStep can gently chime in so taking daily medication is effortless and timely.'
          : 'Set up friendly prompts with times of day and dosage for their daily routine.'
      }
      currentStep={5}
      iconName="medkit"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={isNextDisabled}
    >
      {/* Takes Medication Toggle */}
      <View style={s.toggleRow}>
        <TouchableOpacity
          onPress={() => onUpdate({ takesMedication: false, medications: [] })}
          activeOpacity={0.8}
          style={[s.toggleBtn, !takesMedication && s.toggleBtnSelected]}
        >
          <Ionicons
            name={!takesMedication ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={!takesMedication ? '#0E7A67' : '#9CA3AF'}
            style={{ marginRight: 8 }}
          />
          <Text style={[s.toggleBtnText, !takesMedication && s.toggleBtnTextSelected]}>
            No, None
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onUpdate({ takesMedication: true })}
          activeOpacity={0.8}
          style={[s.toggleBtn, takesMedication && s.toggleBtnSelected]}
        >
          <Ionicons
            name={takesMedication ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={takesMedication ? '#0E7A67' : '#9CA3AF'}
            style={{ marginRight: 8 }}
          />
          <Text style={[s.toggleBtnText, takesMedication && s.toggleBtnTextSelected]}>
            Yes, Takes Meds
          </Text>
        </TouchableOpacity>
      </View>

      {/* Medication List */}
      {takesMedication && (
        <View style={s.medsSection}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>
              Medication Schedule ({medications.length})
            </Text>
            <TouchableOpacity onPress={openAdd} style={s.addBtn} activeOpacity={0.88}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={s.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {medications.length === 0 ? (
            <View style={s.emptyBox}>
              <Ionicons name="bandage-outline" size={32} color="#D1D5DB" />
              <Text style={s.emptyTitle}>No medications added yet</Text>
              <Text style={s.emptySub}>
                Tap &quot;Add&quot; above to list names and dosage.
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
                        <Ionicons name="time-outline" size={12} color="#0E7A67" style={{ marginRight: 4 }} />
                        <Text style={s.timePillText}>{time}</Text>
                      </View>
                    ))}
                  </View>

                  {med.instructions ? (
                    <Text style={s.instructions}>{med.instructions}</Text>
                  ) : null}
                </View>

                <View style={s.medActions}>
                  <TouchableOpacity onPress={() => openEdit(med)} style={s.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
                    <Ionicons name="pencil" size={18} color="#0E7A67" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemove(med.id)} style={s.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={18} color={C.error} />
                  </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    paddingHorizontal: 12,
  },
  toggleBtnSelected: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0E7A67',
    borderWidth: 2,
  },
  toggleBtnText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#161E1C',
  },
  toggleBtnTextSelected: {
    fontFamily: F.bold,
    color: '#084C41',
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
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#161E1C',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0E7A67',
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
    borderColor: '#E5E0D8',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#52605D',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
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
    color: '#161E1C',
  },
  dosageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  dosageText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#52605D',
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
    backgroundColor: '#E6F4F1',
  },
  timePillText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#0A5D50',
  },
  instructions: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
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
