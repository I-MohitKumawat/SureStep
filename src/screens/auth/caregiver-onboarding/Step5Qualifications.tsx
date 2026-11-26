
/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step5Qualifications.tsx
 * Caregiver Onboarding Step 5: Optional professional qualifications.
 */

import React, { useState } from 'react';

import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';

import type {
  CaregiverQualificationItem,
} from '../../../types/api.types';

interface Step5Props {
  qualifications: CaregiverQualificationItem[];

  onUpdate: (fields: {
    qualifications: CaregiverQualificationItem[];
  }) => void;

  onNext: () => void;
  onBack: () => void;
}

interface QualificationForm {
  name: string;
  issuer: string;
  year: string;
  description: string;
}

const EMPTY_FORM: QualificationForm = {
  name: '',
  issuer: '',
  year: '',
  description: '',
};

export const Step5Qualifications: React.FC<
  Step5Props
> = ({
  qualifications,
  onUpdate,
  onNext,
  onBack,
}) => {

  const [modalVisible, setModalVisible] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<QualificationForm>({
      ...EMPTY_FORM,
    });

  const [focusedField, setFocusedField] =
    useState<keyof QualificationForm | null>(
      null
    );

  const currentYear =
    new Date().getFullYear();

  /* Validation */

  const isYearValid =
    form.year.trim() === '' ||
    (
      /^\d{4}$/.test(form.year.trim()) &&
      Number(form.year) >= 1900 &&
      Number(form.year) <= currentYear
    );

  const canSave =
    form.name.trim().length > 0 &&
    form.issuer.trim().length > 0 &&
    isYearValid;

  /* Update form fields */

  const updateForm = (
    field: keyof QualificationForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* Open empty form */

  const handleAdd = () => {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });

    setFocusedField(null);
    setModalVisible(true);
  };

  /* Edit existing qualification */

  const handleEdit = (
    qualification: CaregiverQualificationItem
  ) => {
    setEditingId(qualification.id);

    setForm({
      name: qualification.name || '',
      issuer: qualification.issuer || '',
      year:
        qualification.year != null
          ? String(qualification.year)
          : '',
      description:
        qualification.description || '',
    });

    setFocusedField(null);
    setModalVisible(true);
  };

  /* Close modal */

  const closeModal = () => {
    Keyboard.dismiss();

    setModalVisible(false);
    setFocusedField(null);
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });
  };

  /* Save qualification */

  const handleSave = () => {
    if (!canSave) return;

    const qualification: CaregiverQualificationItem = {
      id:
        editingId ||
        `qual_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      name: form.name.trim(),

      issuer: form.issuer.trim(),

      year:
        form.year.trim() || undefined,

      description:
        form.description.trim() || undefined,
    };

    const updatedQualifications =
      editingId
        ? qualifications.map((item) =>
            item.id === editingId
              ? qualification
              : item
          )
        : [
            ...qualifications,
            qualification,
          ];

    onUpdate({
      qualifications: updatedQualifications,
    });

    closeModal();
  };

  /* Remove qualification */

  const handleRemove = (
    qualification: CaregiverQualificationItem
  ) => {
    Alert.alert(
      'Remove qualification?',
      `Remove "${qualification.name}" from your profile?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onUpdate({
              qualifications:
                qualifications.filter(
                  (item) =>
                    item.id !== qualification.id
                ),
            });
          },
        },
      ]
    );
  };

  /* Input styling */

  const inputClass = (
    field: keyof QualificationForm
  ) =>
    `min-h-[48px] rounded-[12px] border bg-care-canvas px-[12px] py-[10px] font-inter-regular text-[14px] text-care-ink ${
      field === 'year' && !isYearValid
        ? 'border-red-400'
        : focusedField === field
          ? 'border-brand'
          : 'border-care-border'
    }`;

  return (
    <OnboardingLayout
      title="Qualifications"
      subtitle="Add your professional credentials."
      currentStep={5}
      totalSteps={9}
      iconName="school-outline"
      backgroundVariant="ocean"
      layoutVariant="minimal"
      onBack={onBack}
      onNext={onNext}
      nextLabel={
        qualifications.length > 0
          ? 'Continue'
          : 'Skip for now'
      }
      isNextDisabled={false}
    >

      {/* Main white container */}

      <View
        className="rounded-[20px] border border-care-border bg-white p-[16px]"
        style={{
          shadowColor: '#254D51',
          shadowOpacity: 0.08,
          shadowOffset: {
            width: 0,
            height: 3,
          },
          shadowRadius: 8,
          elevation: 2,
        }}
      >

        {/* Section heading */}

        <View className="mb-[14px] flex-row items-center justify-between gap-[8px]">

          <Text className="flex-1 font-inter-semibold text-[14px] text-care-ink">
            Your credentials
          </Text>

          <Text className="font-inter-regular text-[12px] text-care-muted">
            {qualifications.length > 0
              ? `${qualifications.length} added`
              : 'Optional'}
          </Text>

        </View>

        {/* Empty state */}

        {qualifications.length === 0 ? (

          <View className="items-center px-[12px] py-[20px]">

            <View className="mb-[12px] h-[64px] w-[64px] items-center justify-center rounded-full bg-[#E1F2F4]">

              <Ionicons
                name="ribbon-outline"
                size={32}
                color="#256C78"
              />

            </View>

            <Text className="text-center font-inter-semibold text-[14px] text-care-ink">
              No qualifications added
            </Text>

            <Text className="mt-[5px] text-center font-inter-regular text-[12px] leading-[18px] text-care-muted">
              Add a certificate or qualification.
            </Text>

          </View>

        ) : (

          /* Saved qualifications */

          <View className="mb-[14px] gap-[10px]">

            {qualifications.map((item) => (

              <View
                key={item.id}
                className="rounded-[12px] border border-care-border bg-care-canvas p-[12px]"
              >

                <View className="flex-row items-start gap-[10px]">

                  {/* Qualification icon */}

                  <View className="h-[40px] w-[40px] items-center justify-center rounded-[10px] bg-[#E1F2F4]">

                    <Ionicons
                      name="medal-outline"
                      size={22}
                      color="#256C78"
                    />

                  </View>

                  {/* Qualification information */}

                  <View className="flex-1">

                    <Text className="font-inter-semibold text-[14px] leading-[20px] text-care-ink">
                      {item.name}
                    </Text>

                    <Text className="mt-[3px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
                      {item.issuer}
                      {item.year
                        ? ` · ${item.year}`
                        : ''}
                    </Text>

                    <Text className="mt-[6px] font-inter-medium text-[11px] text-[#256C78]">
                      Self-reported
                    </Text>

                  </View>

                </View>

                {!!item.description && (
                  <Text className="mt-[10px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
                    {item.description}
                  </Text>
                )}

                {/* Edit / remove actions */}

                <View className="mt-[10px] flex-row items-center justify-end gap-[8px] border-t border-care-border pt-[4px]">

                  <Pressable
                    onPress={() =>
                      handleEdit(item)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${item.name}`}
                    className="min-h-[44px] flex-row items-center justify-center gap-[5px] rounded-[8px] px-[10px] active:opacity-70"
                  >

                    <Ionicons
                      name="pencil-outline"
                      size={15}
                      color="#0E7A67"
                    />

                    <Text className="font-inter-medium text-[12px] text-brand-dark">
                      Edit
                    </Text>

                  </Pressable>

                  <Pressable
                    onPress={() =>
                      handleRemove(item)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.name}`}
                    className="min-h-[44px] flex-row items-center justify-center gap-[5px] rounded-[8px] px-[10px] active:opacity-70"
                  >

                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color="#DC2626"
                    />

                    <Text className="font-inter-medium text-[12px] text-red-600">
                      Remove
                    </Text>

                  </Pressable>

                </View>

              </View>

            ))}

          </View>
        )}

        {/* Add qualification button */}

        <Pressable
          onPress={handleAdd}
          accessibilityRole="button"
          accessibilityLabel="Add qualification"
          className="min-h-[48px] flex-row items-center justify-center gap-[8px] rounded-[12px] border border-dashed border-brand bg-care-selected px-[12px] py-[12px] active:opacity-70"
        >

          <Ionicons
            name="add-circle-outline"
            size={22}
            color="#0E7A67"
          />

          <Text className="font-inter-semibold text-[13px] text-brand-dark">
            Add qualification
          </Text>

        </Pressable>

        {/* Self-reported notice */}

        <View className="mt-[14px] flex-row items-start gap-[8px]">

          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#256C78"
          />

          <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-care-muted">
            Qualifications are self-reported,
            not verified.
          </Text>

        </View>

      </View>

      {/* Add / edit qualification modal */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >

        <KeyboardAvoidingView
          className="flex-1"
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >

          <View className="flex-1 justify-end bg-black/40">

            {/* Dismiss modal backdrop */}

            <Pressable
              className="absolute inset-0"
              onPress={closeModal}
              accessibilityRole="button"
              accessibilityLabel="Close qualification form"
            />

            {/* Bottom sheet */}

            <View
              accessibilityViewIsModal
              className="max-h-[92%] w-full max-w-[520px] self-center rounded-t-[28px] border border-care-border bg-white"
              style={{
                shadowColor: '#254D51',
                shadowOpacity: 0.18,
                shadowOffset: {
                  width: 0,
                  height: -4,
                },
                shadowRadius: 16,
                elevation: 12,
              }}
            >

              {/* Decorative handle */}

              <View className="items-center pt-[10px]">

                <View className="h-[4px] w-[36px] rounded-full bg-[#CDD8D5]" />

              </View>

              {/* Modal heading */}

              <View className="flex-row items-center gap-[12px] px-[20px] pb-[14px] pt-[16px]">

                <View className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-[#E1F2F4]">

                  <Ionicons
                    name="school-outline"
                    size={25}
                    color="#256C78"
                  />

                </View>

                <View className="flex-1">

                  <Text className="font-inter-bold text-[19px] leading-[25px] text-care-ink">
                    {editingId
                      ? 'Edit qualification'
                      : 'Add qualification'}
                  </Text>

                  <Text className="mt-[3px] font-inter-regular text-[12px] text-care-muted">
                    Self-reported credential
                  </Text>

                </View>

                <Pressable
                  onPress={closeModal}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  className="h-[44px] w-[44px] items-center justify-center rounded-full bg-care-canvas active:opacity-70"
                >

                  <Ionicons
                    name="close"
                    size={22}
                    color="#52605D"
                  />

                </Pressable>

              </View>

              <View className="h-px bg-care-border" />

              {/* Scrollable form */}

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="px-[20px] py-[18px]"
              >

                {/* Qualification name */}

                <Text className="mb-[6px] font-inter-semibold text-[13px] text-care-ink">
                  Qualification name *
                </Text>

                <TextInput
                  className={inputClass('name')}
                  accessibilityLabel="Qualification name"
                  placeholder="e.g. GNM, BLS, Dementia Care"
                  placeholderTextColor="#68766F"
                  value={form.name}
                  onChangeText={(value) =>
                    updateForm('name', value)
                  }
                  onFocus={() =>
                    setFocusedField('name')
                  }
                  onBlur={() =>
                    setFocusedField(null)
                  }
                  autoCapitalize="words"
                />

                {/* Issuing organization */}

                <Text className="mb-[6px] mt-[16px] font-inter-semibold text-[13px] text-care-ink">
                  Issuing organization *
                </Text>

                <TextInput
                  className={inputClass('issuer')}
                  accessibilityLabel="Issuing organization"
                  placeholder="Institute or organization"
                  placeholderTextColor="#68766F"
                  value={form.issuer}
                  onChangeText={(value) =>
                    updateForm('issuer', value)
                  }
                  onFocus={() =>
                    setFocusedField('issuer')
                  }
                  onBlur={() =>
                    setFocusedField(null)
                  }
                  autoCapitalize="words"
                />

                {/* Completion year */}

                <View className="mb-[6px] mt-[16px] flex-row items-center justify-between gap-[8px]">

                  <Text className="font-inter-semibold text-[13px] text-care-ink">
                    Year completed
                  </Text>

                  <Text className="font-inter-regular text-[12px] text-care-muted">
                    Optional
                  </Text>

                </View>

                <TextInput
                  className={inputClass('year')}
                  accessibilityLabel="Year completed"
                  placeholder={`e.g. ${currentYear - 2}`}
                  placeholderTextColor="#68766F"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={form.year}
                  onChangeText={(value) =>
                    updateForm(
                      'year',
                      value.replace(/[^0-9]/g, '')
                    )
                  }
                  onFocus={() =>
                    setFocusedField('year')
                  }
                  onBlur={() =>
                    setFocusedField(null)
                  }
                />

                {!isYearValid && (
                  <Text className="mt-[6px] font-inter-regular text-[12px] text-red-600">
                    Enter a year between 1900
                    and {currentYear}.
                  </Text>
                )}

                {/* Description */}

                <View className="mb-[6px] mt-[16px] flex-row items-center justify-between gap-[8px]">

                  <Text className="font-inter-semibold text-[13px] text-care-ink">
                    Description
                  </Text>

                  <Text className="font-inter-regular text-[12px] text-care-muted">
                    Optional
                  </Text>

                </View>

                <TextInput
                  className={`${inputClass('description')} min-h-[84px]`}
                  accessibilityLabel="Qualification description"
                  placeholder="Skills or training covered"
                  placeholderTextColor="#68766F"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={form.description}
                  onChangeText={(value) =>
                    updateForm(
                      'description',
                      value
                    )
                  }
                  onFocus={() =>
                    setFocusedField('description')
                  }
                  onBlur={() =>
                    setFocusedField(null)
                  }
                />

              </ScrollView>

              {/* Modal footer */}

              <SafeAreaView edges={['bottom']}>

                <View className="flex-row gap-[10px] border-t border-care-border px-[20px] py-[16px]">

                  <Pressable
                    onPress={closeModal}
                    accessibilityRole="button"
                    className="min-h-[48px] flex-1 items-center justify-center rounded-[12px] border border-care-border bg-care-canvas px-[12px] active:opacity-70"
                  >

                    <Text className="font-inter-medium text-[13px] text-care-muted">
                      Cancel
                    </Text>

                  </Pressable>

                  <Pressable
                    onPress={handleSave}
                    disabled={!canSave}
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: !canSave,
                    }}
                    className={`min-h-[48px] flex-[2] flex-row items-center justify-center gap-[6px] rounded-[12px] px-[12px] ${
                      canSave
                        ? 'bg-brand active:opacity-80'
                        : 'bg-[#E5E0D8]'
                    }`}
                  >

                    <Ionicons
                      name="checkmark"
                      size={17}
                      color={
                        canSave
                          ? '#FFFFFF'
                          : '#52605D'
                      }
                    />

                    <Text
                      className={`font-inter-semibold text-[13px] ${
                        canSave
                          ? 'text-white'
                          : 'text-care-muted'
                      }`}
                    >
                      {editingId
                        ? 'Save changes'
                        : 'Save qualification'}
                    </Text>

                  </Pressable>

                </View>

              </SafeAreaView>

            </View>

          </View>

        </KeyboardAvoidingView>

      </Modal>

    </OnboardingLayout>
  );
};
