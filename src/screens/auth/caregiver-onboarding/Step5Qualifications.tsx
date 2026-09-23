/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step5Qualifications.tsx
 * Caregiver Onboarding Step 5: Qualifications & Certifications (Self-Reported).
 */
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';
import type { CaregiverQualificationItem } from '../../../types/api.types';

interface Step5Props {
  qualifications: CaregiverQualificationItem[];
  onUpdate: (fields: { qualifications: CaregiverQualificationItem[] }) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step5Qualifications: React.FC<Step5Props> = ({
  qualifications,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [year, setYear] = useState('');
  const [description, setDescription] = useState('');

  const handleAddQualification = () => {
    if (!name.trim() || !issuer.trim()) return;

    const newQual: CaregiverQualificationItem = {
      id: `qual_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: name.trim(),
      issuer: issuer.trim(),
      year: year.trim() || undefined,
      description: description.trim() || undefined,
    };

    onUpdate({ qualifications: [...qualifications, newQual] });
    setName('');
    setIssuer('');
    setYear('');
    setDescription('');
    setModalVisible(false);
  };

  const handleRemoveQualification = (id: string) => {
    onUpdate({ qualifications: qualifications.filter((q) => q.id !== id) });
  };

  return (
    <OnboardingLayout
      title="Qualifications & Training"
      subtitle="Add any formal certifications, nursing diplomas, or care credentials. This is optional and self-reported."
      currentStep={5}
      totalSteps={9}
      iconName="school-outline"
      onBack={onBack}
      onNext={onNext}
      nextLabel={qualifications.length > 0 ? 'Continue' : 'Skip for Now'}
    >
      {/* Notice Banner */}
      <View style={s.noticeBanner}>
        <Ionicons name="information-circle-outline" size={20} color={C.primary} style={s.bannerIcon} />
        <Text style={s.bannerText}>
          Credentials are listed as self-reported on your profile. Document verification is optional and can be submitted anytime later.
        </Text>
      </View>

      {/* Added Qualifications List */}
      <View style={s.listContainer}>
        {qualifications.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIconCircle}>
              <Ionicons name="ribbon-outline" size={32} color={C.textSecondary} />
            </View>
            <Text style={s.emptyTitle}>No qualifications added yet</Text>
            <Text style={s.emptySub}>
              If you have care certificates or training diplomas, tap below to add them to your profile.
            </Text>
          </View>
        ) : (
          qualifications.map((q) => (
            <View key={q.id} style={s.qualCard}>
              <View style={s.qualIconCircle}>
                <Ionicons name="medal" size={20} color={C.primary} />
              </View>
              <View style={s.qualDetails}>
                <Text style={s.qualName}>{q.name}</Text>
                <Text style={s.qualIssuer}>{q.issuer}</Text>
                {q.year ? <Text style={s.qualYear}>Completed: {q.year}</Text> : null}
                {q.description ? (
                  <Text style={s.qualDesc} numberOfLines={2}>
                    {q.description}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => handleRemoveQualification(q.id)}
                style={s.deleteBtn}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </Pressable>
            </View>
          ))
        )}
      </View>

      {/* Add Button */}
      <Pressable onPress={() => setModalVisible(true)} style={s.addBtn}>
        <Ionicons name="add-circle-outline" size={20} color={C.primary} style={{ marginRight: 6 }} />
        <Text style={s.addBtnText}>+ Add Qualification / Certificate</Text>
      </Pressable>

      {/* Add Qualification Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Care Credential</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <View style={s.modalField}>
              <Text style={s.modalLabel}>Credential / Course Name *</Text>
              <TextInput
                style={s.modalInput}
                placeholder="e.g., Geriatric Care Assistant, GNM, BLS"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={s.modalField}>
              <Text style={s.modalLabel}>Issuing Institute / Organization *</Text>
              <TextInput
                style={s.modalInput}
                placeholder="e.g., Red Cross, Apollo Medskills, NISD"
                placeholderTextColor="#9CA3AF"
                value={issuer}
                onChangeText={setIssuer}
              />
            </View>

            <View style={s.modalField}>
              <Text style={s.modalLabel}>Year Completed</Text>
              <TextInput
                style={s.modalInput}
                placeholder="e.g., 2022"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={4}
                value={year}
                onChangeText={setYear}
              />
            </View>

            <View style={s.modalField}>
              <Text style={s.modalLabel}>Short Description (Optional)</Text>
              <TextInput
                style={[s.modalInput, s.modalTextArea]}
                placeholder="Key skills or clinical areas covered..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={s.modalActions}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={s.modalCancelBtn}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddQualification}
                disabled={!name.trim() || !issuer.trim()}
                style={[
                  s.modalSaveBtn,
                  (!name.trim() || !issuer.trim()) && s.modalSaveBtnDisabled,
                ]}
              >
                <Text style={s.modalSaveText}>Save Credential</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </OnboardingLayout>
  );
};

const s = StyleSheet.create({
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E6F4F1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  bannerIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: F.regular,
    color: '#065F46',
    lineHeight: 17,
  },
  listContainer: {
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: F.bold,
    color: C.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: F.regular,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  qualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  qualIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  qualDetails: {
    flex: 1,
  },
  qualName: {
    fontSize: 13,
    fontFamily: F.bold,
    color: C.textPrimary,
    marginBottom: 2,
  },
  qualIssuer: {
    fontSize: 12,
    fontFamily: F.medium,
    color: C.primary,
  },
  qualYear: {
    fontSize: 11,
    fontFamily: F.regular,
    color: C.textSecondary,
    marginTop: 2,
  },
  qualDesc: {
    fontSize: 11,
    fontFamily: F.regular,
    color: C.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: C.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
  },
  addBtnText: {
    fontSize: 13,
    fontFamily: F.bold,
    color: C.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: F.bold,
    color: C.textPrimary,
  },
  modalField: {
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 12,
    fontFamily: F.bold,
    color: C.textPrimary,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    fontFamily: F.regular,
    color: C.textPrimary,
  },
  modalTextArea: {
    height: 60,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontFamily: F.medium,
    color: C.textSecondary,
  },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: C.primary,
    alignItems: 'center',
  },
  modalSaveBtnDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    fontSize: 13,
    fontFamily: F.bold,
    color: '#FFFFFF',
  },
});
