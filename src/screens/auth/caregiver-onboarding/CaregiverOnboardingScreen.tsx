/**
 * SureStep — src/screens/auth/caregiver-onboarding/CaregiverOnboardingScreen.tsx
 * Master orchestrator for the 9-stage Professional Caregiver Onboarding experience.
 */
import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../../context/AuthContext';
import { provisionUser } from '../../../services/authService';
import { updateMe, uploadProfilePhoto, updateCaregiverProfile } from '../../../services/userService';
import type { AuthStackParams } from '../../../types/navigation.types';
import type { CaregiverQualificationItem } from '../../../types/api.types';

import { Step1AboutCaregiver } from './Step1AboutCaregiver';
import { Step2ProfessionalRole } from './Step2ProfessionalRole';
import { Step3ExperienceSkills } from './Step3ExperienceSkills';
import { Step4Capabilities } from './Step4Capabilities';
import { Step5Qualifications } from './Step5Qualifications';
import { Step6Languages } from './Step6Languages';
import { Step7AvailabilityArea } from './Step7AvailabilityArea';
import { Step8PricingBio } from './Step8PricingBio';
import { Step9Review } from './Step9Review';

type Props = NativeStackScreenProps<AuthStackParams, 'CaregiverOnboardingScreen'>;

export interface CaregiverOnboardingState {
  name: string;
  dob: string;
  gender: string;
  language: string;
  city: string;
  photoUri?: string;
  professionalRole: string;
  yearsExperience: number | null;
  dementiaExperienceYears: number | null;
  hasDementiaTraining: boolean;
  careCapabilities: string[];
  specializations: string[];
  qualifications: CaregiverQualificationItem[];
  languagesSpoken: string[];
  availabilityTypes: string[];
  serviceCity: string;
  serviceRadiusKm: number | null;
  maxPatients: number | null;
  hourlyRate: string;
  dailyRate: string;
  bio: string;
  isDiscoverable: boolean;
}

export const CaregiverOnboardingScreen: React.FC<Props> = ({ route, navigation }) => {
  const { returnToStep } = route.params || {};
  const { firebaseUser, login, refreshUser } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(returnToStep || 1);
  const [returnToReview, setReturnToReview] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [state, setState] = useState<CaregiverOnboardingState>({
    name: '',
    dob: '',
    gender: '',
    language: 'English',
    city: '',
    photoUri: undefined,
    professionalRole: 'DEMENTIA_SPECIALIST',
    yearsExperience: null,
    dementiaExperienceYears: null,
    hasDementiaTraining: false,
    careCapabilities: [
      'hygiene_bathing',
      'mobility_transfers',
      'medication_prompts',
      'wandering_prevention',
      'cognitive_stimulation',
    ],
    specializations: ["Alzheimer's Disease"],
    qualifications: [],
    languagesSpoken: ['English', 'Hindi'],
    availabilityTypes: ['DAY_SHIFT', 'FULL_TIME'],
    serviceCity: '',
    serviceRadiusKm: null,
    maxPatients: null,
    hourlyRate: '',
    dailyRate: '',
    bio: '',
    isDiscoverable: true,
  });

  const updateState = (fields: Partial<CaregiverOnboardingState>) => {
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

      // 1. Provision account as CAREGIVER
      console.log('[CAREGIVER_ONBOARDING] Provisioning caregiver account');
      const provRes = await provisionUser({
        name: state.name.trim(),
        role: 'CAREGIVER',
        phone: phone || undefined,
        preferred_language: state.language === 'Hindi' ? 'hi' : 'en',
      });

      const provisionedUser = provRes.data?.data?.user;
      if (!provisionedUser?.id) {
        throw new Error('Caregiver account creation failed. Please try again.');
      }

      // 2. Upload profile photo if selected
      let remotePhotoUrl: string | undefined = undefined;
      if (state.photoUri) {
        try {
          remotePhotoUrl = await uploadProfilePhoto(state.photoUri);
        } catch (photoErr) {
          console.warn('[CAREGIVER_ONBOARDING] Photo upload non-fatal notice:', photoErr);
        }
      }

      // 3. Update core user fields
      await updateMe({
        name: state.name.trim(),
        date_of_birth: state.dob || undefined,
        gender: state.gender || undefined,
        city: state.city.trim() || undefined,
        preferred_language: state.language === 'Hindi' ? 'hi' : 'en',
        photo_url: remotePhotoUrl || undefined,
      });

      // 4. Update rich professional caregiver profile
      await updateCaregiverProfile({
        professional_role: state.professionalRole,
        years_of_experience: state.yearsExperience ?? 0,
        dementia_experience_years: state.dementiaExperienceYears ?? 0,
        has_dementia_training: state.hasDementiaTraining,
        care_capabilities: state.careCapabilities,
        specializations: state.specializations,
        qualifications: state.qualifications,
        languages_spoken: state.languagesSpoken,
        availability_types: state.availabilityTypes,
        service_city: state.serviceCity.trim() || state.city.trim() || null,
        service_radius_km: state.serviceRadiusKm ?? 10,
        max_patients: state.maxPatients ?? 1,
        hourly_rate: state.hourlyRate ? parseFloat(state.hourlyRate) : null,
        daily_rate: state.dailyRate ? parseFloat(state.dailyRate) : null,
        bio: state.bio.trim() || null,
        is_discoverable: state.isDiscoverable,
      });

      console.log('[CAREGIVER_ONBOARDING] Caregiver profile successfully updated');

      // 5. Authenticate session as CAREGIVER
      await login(
        {
          id: provisionedUser.id,
          phone: provisionedUser.phone || phone,
          name: state.name.trim(),
          role: 'CAREGIVER',
          photo_url: remotePhotoUrl || undefined,
        },
        undefined,
        'CAREGIVER'
      );

      // 6. Refresh user context — mounts CaregiverNavigator
      await refreshUser();
      console.log('[CAREGIVER_ONBOARDING] Onboarding successfully completed');
    } catch (err: any) {
      console.error('[CAREGIVER_ONBOARDING] Submission error:', err);
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to complete professional onboarding. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  switch (currentStep) {
    case 1:
      return (
        <Step1AboutCaregiver
          name={state.name}
          dob={state.dob}
          gender={state.gender}
          language={state.language}
          city={state.city}
          photoUri={state.photoUri}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 2:
      return (
        <Step2ProfessionalRole
          role={state.professionalRole}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 3:
      return (
        <Step3ExperienceSkills
          yearsExperience={state.yearsExperience}
          dementiaExperienceYears={state.dementiaExperienceYears}
          hasDementiaTraining={state.hasDementiaTraining}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 4:
      return (
        <Step4Capabilities
          careCapabilities={state.careCapabilities}
          specializations={state.specializations}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 5:
      return (
        <Step5Qualifications
          qualifications={state.qualifications}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 6:
      return (
        <Step6Languages
          languagesSpoken={state.languagesSpoken}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 7:
      return (
        <Step7AvailabilityArea
          availabilityTypes={state.availabilityTypes}
          serviceCity={state.serviceCity}
          serviceRadiusKm={state.serviceRadiusKm}
          maxPatients={state.maxPatients}
          baseCity={state.city}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 8:
      return (
        <Step8PricingBio
          hourlyRate={state.hourlyRate}
          dailyRate={state.dailyRate}
          bio={state.bio}
          isDiscoverable={state.isDiscoverable}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 9:
      return (
        <Step9Review
          data={state}
          onJumpToStep={handleJumpToStep}
          onSubmit={handleFinalSubmit}
          onBack={handleBack}
          submitting={submitting}
          submitError={submitError}
        />
      );
    default:
      return null;
  }
};
