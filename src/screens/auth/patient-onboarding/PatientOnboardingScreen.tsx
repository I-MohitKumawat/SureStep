/**
 * SureStep — src/screens/auth/patient-onboarding/PatientOnboardingScreen.tsx
 * Master orchestrator for the 9-group adaptive Patient Onboarding experience.
 */
import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../../context/AuthContext';
import { provisionUser } from '../../../services/authService';
import { updateMe, updatePatientProfile, uploadProfilePhoto } from '../../../services/userService';
import type { AuthStackParams } from '../../../types/navigation.types';
import type { PatientMedicationItem } from '../../../types/api.types';

import { Step1AboutPatient } from './Step1AboutPatient';
import { Step2Communication } from './Step2Communication';
import { Step3LivingSituation } from './Step3LivingSituation';
import { Step4HealthStatus } from './Step4HealthStatus';
import { Step5Medications } from './Step5Medications';
import { Step6CareNeeds } from './Step6CareNeeds';
import { Step7SafetyConcerns } from './Step7SafetyConcerns';
import { Step8EmergencyContact } from './Step8EmergencyContact';
import { Step9Review } from './Step9Review';

type Props = NativeStackScreenProps<AuthStackParams, 'PatientOnboardingScreen'>;

export interface PatientOnboardingState {
  name: string;
  dob: string;
  gender: string;
  photoUri?: string;
  primaryLanguage: string;
  additionalLanguages: string[];
  communicationPreferences: string[];
  city: string;
  livingArrangement: string;
  diagnosisStatus: string;
  dementiaType: string;
  stage: string;
  otherConditions: string[];
  takesMedication: boolean;
  medications: PatientMedicationItem[];
  careNeeds: string[];
  safetyConcerns: string[];
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
}

export const PatientOnboardingScreen: React.FC<Props> = ({ route, navigation }) => {
  const { intent = 'RECEIVING_CARE', returnToStep } = route.params || {};
  const { firebaseUser, login, refreshUser } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(returnToStep || 1);
  const [returnToReview, setReturnToReview] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [state, setState] = useState<PatientOnboardingState>({
    name: '',
    dob: '',
    gender: '',
    photoUri: undefined,
    primaryLanguage: 'English',
    additionalLanguages: [],
    communicationPreferences: ['simple_text'],
    city: '',
    livingArrangement: '',
    diagnosisStatus: '',
    dementiaType: '',
    stage: '',
    otherConditions: [],
    takesMedication: false,
    medications: [],
    careNeeds: ['medications', 'safety_navigation'],
    safetyConcerns: ['none'],
    emergencyContactName: '',
    emergencyContactRelation: 'Spouse',
    emergencyContactPhone: '',
  });

  const updateState = (fields: Partial<PatientOnboardingState>) => {
    setState((prev) => ({ ...prev, ...fields }));
  };

  const handleNext = () => {
    if (returnToReview) {
      setCurrentStep(9);
      setReturnToReview(false);
      return;
    }
    if (currentStep < 9) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (returnToReview) {
      setCurrentStep(9);
      setReturnToReview(false);
      return;
    }
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    } else {
      navigation.navigate('RoleSelectionScreen');
    }
  };

  const handleJumpToStep = (stepNumber: number) => {
    setReturnToReview(true);
    setCurrentStep(stepNumber);
  };

  const handleFinalSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const phone = firebaseUser?.phoneNumber || '';

      // 1. Provision account as PATIENT
      console.log('[PATIENT_ONBOARDING] Provisioning patient account, intent:', intent);
      const provRes = await provisionUser({
        name: state.name.trim(),
        role: 'PATIENT',
        phone: phone || undefined,
        preferred_language: state.primaryLanguage === 'Hindi' ? 'hi' : 'en',
      });

      const provisionedUser = provRes.data?.data?.user;
      if (!provisionedUser?.id) {
        throw new Error('Account creation failed. Please try again.');
      }

      // 2. Upload profile photo if provided
      let remotePhotoUrl: string | undefined = undefined;
      if (state.photoUri) {
        try {
          remotePhotoUrl = await uploadProfilePhoto(state.photoUri);
        } catch (photoErr) {
          console.warn('[PATIENT_ONBOARDING] Photo upload non-fatal notice:', photoErr);
        }
      }

      // 3. Update core user fields
      await updateMe({
        name: state.name.trim(),
        date_of_birth: state.dob || undefined,
        gender: state.gender || undefined,
        city: state.city.trim() || undefined,
        preferred_language: state.primaryLanguage === 'Hindi' ? 'hi' : 'en',
        photo_url: remotePhotoUrl || undefined,
      });

      // 4. Update rich patient profile fields
      const diagnosisValue =
        state.diagnosisStatus === 'NO_DEMENTIA'
          ? null
          : state.dementiaType || state.diagnosisStatus || null;

      await updatePatientProfile({
        emergency_contact_name: state.emergencyContactName.trim() || null,
        emergency_contact_phone: state.emergencyContactPhone.trim() || null,
        emergency_contact_relation: state.emergencyContactRelation.trim() || null,
        diagnosis: diagnosisValue,
        diagnosis_date: null,
        severity_level: state.stage || null,
        living_arrangement: state.livingArrangement || null,
        care_needs: state.careNeeds,
        safety_concerns: state.safetyConcerns,
        communication_preferences: state.communicationPreferences,
        other_conditions: state.otherConditions,
        onboarding_source: intent === 'RECEIVING_CARE' ? 'SELF' : 'FAMILY',
        medications: state.medications,
        known_triggers: [],
        comfort_items: [],
        favourite_songs: [],
      });

      console.log('[PATIENT_ONBOARDING] Patient profile successfully saved');

      // 5. Authenticate session as PATIENT
      await login(
        {
          id: provisionedUser.id,
          phone: provisionedUser.phone || phone,
          name: state.name.trim(),
          role: 'PATIENT',
          photo_url: remotePhotoUrl || undefined,
        },
        undefined,
        'PATIENT'
      );

      // 6. Refresh user context — mounts PatientNavigator
      await refreshUser();
      console.log('[PATIENT_ONBOARDING] Onboarding successfully completed');
    } catch (err: any) {
      console.error('[PATIENT_ONBOARDING] Submission error:', err);
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to complete onboarding. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  switch (currentStep) {
    case 1:
      return (
        <Step1AboutPatient
          intent={intent}
          name={state.name}
          dob={state.dob}
          gender={state.gender}
          photoUri={state.photoUri}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 2:
      return (
        <Step2Communication
          intent={intent}
          primaryLanguage={state.primaryLanguage}
          additionalLanguages={state.additionalLanguages}
          communicationPreferences={state.communicationPreferences}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 3:
      return (
        <Step3LivingSituation
          intent={intent}
          city={state.city}
          livingArrangement={state.livingArrangement}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 4:
      return (
        <Step4HealthStatus
          intent={intent}
          diagnosisStatus={state.diagnosisStatus}
          dementiaType={state.dementiaType}
          stage={state.stage}
          otherConditions={state.otherConditions}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 5:
      return (
        <Step5Medications
          intent={intent}
          takesMedication={state.takesMedication}
          medications={state.medications}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 6:
      return (
        <Step6CareNeeds
          intent={intent}
          careNeeds={state.careNeeds}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 7:
      return (
        <Step7SafetyConcerns
          intent={intent}
          safetyConcerns={state.safetyConcerns}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 8:
      return (
        <Step8EmergencyContact
          intent={intent}
          emergencyContactName={state.emergencyContactName}
          emergencyContactRelation={state.emergencyContactRelation}
          emergencyContactPhone={state.emergencyContactPhone}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 9:
    default:
      return (
        <Step9Review
          intent={intent}
          data={state}
          onJumpToStep={handleJumpToStep}
          onSubmit={handleFinalSubmit}
          onBack={handleBack}
          submitting={submitting}
          submitError={submitError}
        />
      );
  }
};
