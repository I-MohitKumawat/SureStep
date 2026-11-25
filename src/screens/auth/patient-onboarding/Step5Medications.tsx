
/**
 * SureStep — src/screens/auth/patient-onboarding/Step5Medications.tsx
 * Step 5: Optional medication setup.
 */

import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { MedicationModal } from '../../../components/onboarding/MedicationModal';
import { C } from '../../../theme/colors';
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

  const [editingItem, setEditingItem] =
    useState<PatientMedicationItem | null>(null);

  const handleSaveMedication = (
    item: PatientMedicationItem
  ) => {
    if (editingItem) {
      onUpdate({
        takesMedication: true,
        medications: medications.map((med) =>
          med.id === editingItem.id ? item : med
        ),
      });
    } else {
      onUpdate({
        takesMedication: true,
        medications: [...medications, item],
      });
    }

    setEditingItem(null);
    setModalVisible(false);
  };

  const handleRemove = (id: string) => {
    Alert.alert(
      'Remove medication?',
      'This medication will be removed from your schedule.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            onUpdate({
              medications: medications.filter(
                (med) => med.id !== id
              ),
            }),
        },
      ]
    );
  };

  const selectNoMedication = () => {
    if (medications.length > 0) {
      Alert.alert(
        'Remove medication schedule?',
        'Selecting No will remove the medications you have already added.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Confirm',
            style: 'destructive',
            onPress: () =>
              onUpdate({
                takesMedication: false,
                medications: [],
              }),
          },
        ]
      );

      return;
    }

    onUpdate({
      takesMedication: false,
      medications: [],
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

  const closeModal = () => {
    setEditingItem(null);
    setModalVisible(false);
  };

  const handleAddLater = () => {
    // Keep the Yes selection and any existing medications.
    // Medication details are not required for onboarding.
    onNext();
  };

  return (
    <OnboardingLayout
      title="Daily medications"
      currentStep={5}
      iconName="medkit-outline"
      backgroundVariant="mint"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={false}
    >
      <View className="gap-[12px]">

        <Text className="font-inter-regular text-[13px] leading-[20px] text-care-muted">
          {isSelf
            ? 'Set up gentle medication reminders whenever you’re ready.'
            : 'Set up gentle medication reminders for your loved one whenever you’re ready.'}
        </Text>

        {/* Main container */}

        <View
          className="rounded-[20px] border border-care-border bg-white p-[16px]"
          style={{
            shadowColor: '#244A42',
            shadowOpacity: 0.08,
            shadowOffset: {
              width: 0,
              height: 3,
            },
            shadowRadius: 8,
            elevation: 2,
          }}
        >

          {/* Medication question */}

          <Text className="mb-[10px] font-inter-semibold text-[14px] leading-[20px] text-care-ink">
            {isSelf
              ? 'Do you take regular medications?'
              : 'Do they take regular medications?'}
          </Text>

          <View
            className="flex-row gap-[8px]"
            accessibilityRole="radiogroup"
          >

            {/* Yes */}

            <Pressable
              onPress={() =>
                onUpdate({ takesMedication: true })
              }
              accessibilityRole="radio"
              accessibilityState={{
                checked: takesMedication,
              }}
              className={`min-h-[48px] flex-1 flex-row items-center justify-center gap-[8px] rounded-[12px] border px-[12px] py-[10px] active:opacity-70 ${
                takesMedication
                  ? 'border-brand bg-care-selected'
                  : 'border-care-border bg-white'
              }`}
            >
              <Ionicons
                name={
                  takesMedication
                    ? 'checkmark-circle'
                    : 'ellipse-outline'
                }
                size={19}
                color={
                  takesMedication
                    ? '#0E7A67'
                    : '#52605D'
                }
              />

              <Text
                className={`font-inter-medium text-[14px] ${
                  takesMedication
                    ? 'text-brand-dark'
                    : 'text-care-ink'
                }`}
              >
                Yes
              </Text>
            </Pressable>

            {/* No */}

            <Pressable
              onPress={selectNoMedication}
              accessibilityRole="radio"
              accessibilityState={{
                checked: !takesMedication,
              }}
              className={`min-h-[48px] flex-1 flex-row items-center justify-center gap-[8px] rounded-[12px] border px-[12px] py-[10px] active:opacity-70 ${
                !takesMedication
                  ? 'border-brand bg-care-selected'
                  : 'border-care-border bg-white'
              }`}
            >
              <Ionicons
                name={
                  !takesMedication
                    ? 'checkmark-circle'
                    : 'ellipse-outline'
                }
                size={19}
                color={
                  !takesMedication
                    ? '#0E7A67'
                    : '#52605D'
                }
              />

              <Text
                className={`font-inter-medium text-[14px] ${
                  !takesMedication
                    ? 'text-brand-dark'
                    : 'text-care-ink'
                }`}
              >
                No
              </Text>
            </Pressable>

          </View>

          {/* Conditional medication setup */}

          {takesMedication && (
            <>
              <View className="my-[16px] h-px bg-care-border" />

              <View className="mb-[10px] flex-row items-center justify-between gap-[8px]">
                <Text className="font-inter-semibold text-[13px] text-care-ink">
                  Medication schedule
                </Text>

                <Text className="font-inter-regular text-[12px] text-care-muted">
                  Optional
                </Text>
              </View>

              {/* Empty state */}

              {medications.length === 0 ? (
                <View className="rounded-[12px] border border-care-border bg-care-canvas p-[12px]">

                  <View className="flex-row items-center gap-[12px]">
                    <View className="h-[42px] w-[42px] items-center justify-center rounded-[12px] bg-brand-tint">
                      <Ionicons
                        name="medkit-outline"
                        size={21}
                        color="#0E7A67"
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="font-inter-medium text-[13px] text-care-ink">
                        No medications added
                      </Text>

                      <Text className="mt-[3px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
                        You can set these up later.
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={openAdd}
                    accessibilityRole="button"
                    accessibilityLabel="Add medication"
                    className="mt-[14px] min-h-[44px] flex-row items-center justify-center gap-[6px] rounded-[12px] border border-brand bg-white px-[12px] active:opacity-70"
                  >
                    <Ionicons
                      name="add"
                      size={19}
                      color="#0E7A67"
                    />

                    <Text className="font-inter-semibold text-[13px] text-brand">
                      Add medication
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View className="gap-[10px]">

                  {/* Saved medication entries */}

                  {medications.map((med) => (
                    <View
                      key={med.id}
                      className="rounded-[12px] border border-care-border bg-care-canvas p-[12px]"
                    >

                      <View className="flex-row items-start gap-[10px]">

                        <View className="h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-brand-tint">
                          <Ionicons
                            name="medkit-outline"
                            size={18}
                            color="#0E7A67"
                          />
                        </View>

                        <View className="flex-1">
                          <Text className="font-inter-semibold text-[14px] leading-[20px] text-care-ink">
                            {med.name}
                          </Text>

                          {med.dosage ? (
                            <Text className="mt-[3px] font-inter-regular text-[12px] text-care-muted">
                              {med.dosage}
                            </Text>
                          ) : null}
                        </View>

                        <Pressable
                          onPress={() => openEdit(med)}
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${med.name}`}
                          className="h-[44px] w-[36px] items-center justify-center rounded-[8px] active:opacity-60"
                        >
                          <Ionicons
                            name="pencil-outline"
                            size={17}
                            color="#0E7A67"
                          />
                        </Pressable>

                        <Pressable
                          onPress={() => handleRemove(med.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${med.name}`}
                          className="h-[44px] w-[36px] items-center justify-center rounded-[8px] active:opacity-60"
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={C.error}
                          />
                        </Pressable>
                      </View>

                      {/* Medication timings */}

                      {!!med.times_of_day?.length && (
                        <View className="mt-[10px] flex-row flex-wrap gap-[6px]">
                          {med.times_of_day.map(
                            (time, index) => (
                              <View
                                key={`${time}-${index}`}
                                className="flex-row items-center gap-[4px] rounded-[8px] bg-brand-tint px-[8px] py-[5px]"
                              >
                                <Ionicons
                                  name="time-outline"
                                  size={13}
                                  color="#0E7A67"
                                />

                                <Text className="font-inter-medium text-[11px] text-brand-dark">
                                  {time}
                                </Text>
                              </View>
                            )
                          )}
                        </View>
                      )}

                      {/* Medication instructions */}

                      {med.instructions ? (
                        <View className="mt-[10px] border-t border-care-border pt-[8px]">
                          <Text className="font-inter-regular text-[12px] leading-[18px] text-care-muted">
                            {med.instructions}
                          </Text>
                        </View>
                      ) : null}

                    </View>
                  ))}

                  {/* Add another medication */}

                  <Pressable
                    onPress={openAdd}
                    accessibilityRole="button"
                    className="min-h-[44px] flex-row items-center justify-center gap-[6px] rounded-[12px] border border-brand bg-white px-[12px] active:opacity-70"
                  >
                    <Ionicons
                      name="add"
                      size={19}
                      color="#0E7A67"
                    />

                    <Text className="font-inter-semibold text-[13px] text-brand">
                      Add another medication
                    </Text>
                  </Pressable>

                </View>
              )}
            </>
          )}
        </View>

        {/* Reassurance */}

        {takesMedication && (
          <View className="flex-row items-start gap-[8px] px-[4px]">
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#0E7A67"
            />

            <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-care-muted">
              You don't need to have all the medication
              details ready right now. You can continue
              without completing the schedule.
            </Text>
          </View>
        )}

        {/* Optional setup — always available when Yes is selected */}

        {takesMedication && (
          <Pressable
            onPress={handleAddLater}
            accessibilityRole="button"
            className="min-h-[44px] items-center justify-center active:opacity-70"
          >
            <Text className="font-inter-medium text-[13px] text-brand-dark">
              {medications.length > 0
                ? 'Add remaining medications later'
                : 'Add medications later'}
            </Text>
          </Pressable>
        )}

      </View>

      {/* Existing medication modal */}

      <MedicationModal
        visible={modalVisible}
        initialItem={editingItem}
        onSave={handleSaveMedication}
        onCancel={closeModal}
      />
    </OnboardingLayout>
  );
};
