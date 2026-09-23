/**
 * SureStep — src/screens/auth/family-onboarding/FamilyOnboardingScreen.tsx
 * Master orchestrator for the 5-stage adaptive Family Onboarding experience.
 */
import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../../context/AuthContext';
import { provisionUser } from '../../../services/authService';
import { updateMe, uploadProfilePhoto } from '../../../services/userService';
import { updateFamilyProfile, redeemInviteCode } from '../../../services/familyService';
import type { AuthStackParams } from '../../../types/navigation.types';

import { Step1AboutYou } from './Step1AboutYou';
import { Step2Connection } from './Step2Connection';
import { Step3Involvement } from './Step3Involvement';
import { Step4CareCircle } from './Step4CareCircle';
import { Step5Review } from './Step5Review';

type Props = NativeStackScreenProps<AuthStackParams, 'FamilyOnboardingScreen'>;

export interface FamilyOnboardingState {
  name: string;
  dob: string;
  gender: string;
  language: string;
  city: string;
  photoUri?: string;
  relationLabel: string;
  proximity: string;
  involvementInterests: string[];
  hasInvite: boolean | null;
  inviteCode: string;
  verifiedPatientName?: string | null;
}

export const FamilyOnboardingScreen: React.FC<Props> = ({ route, navigation }) => {
  const { returnToStep } = route.params || {};
  const { firebaseUser, login, refreshUser } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(returnToStep || 1);
  const [returnToReview, setReturnToReview] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [state, setState] = useState<FamilyOnboardingState>({
    name: '',
    dob: '',
    gender: '',
    language: 'English',
    city: '',
    photoUri: undefined,
    relationLabel: '',
    proximity: '',
    involvementInterests: [
      'stay_connected',
      'appointments_routines',
      'emergency',
    ],
    hasInvite: null,
    inviteCode: '',
    verifiedPatientName: null,
  });

  const updateState = (fields: Partial<FamilyOnboardingState>) => {
    setState((prev) => ({ ...prev, ...fields }));
  };

  const handleNext = () => {
    if (returnToReview) {
      setCurrentStep(5);
      setReturnToReview(false);
      return;
    }
    if (currentStep < 5) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (returnToReview) {
      setCurrentStep(5);
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

      // 1. Provision account as FAMILY
      console.log('[FAMILY_ONBOARDING] Provisioning family account');
      const provRes = await provisionUser({
        name: state.name.trim(),
        role: 'FAMILY',
        phone: phone || undefined,
        preferred_language: state.language === 'Hindi' ? 'hi' : 'en',
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
          console.warn('[FAMILY_ONBOARDING] Photo upload non-fatal notice:', photoErr);
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

      // 4. Update rich family profile fields
      await updateFamilyProfile({
        relation_label: state.relationLabel.trim() || null,
        proximity: state.proximity || null,
        involvement_interests: state.involvementInterests,
        avatar_url: remotePhotoUrl || null,
      });

      console.log('[FAMILY_ONBOARDING] Family profile successfully saved');

      // 5. Authenticate session as FAMILY
      await login(
        {
          id: provisionedUser.id,
          phone: provisionedUser.phone || phone,
          name: state.name.trim(),
          role: 'FAMILY',
          photo_url: remotePhotoUrl || undefined,
        },
        undefined,
        'FAMILY'
      );

      // 6. If user provided a Care Circle invite code, submit join request
      if (state.hasInvite && state.inviteCode.trim()) {
        try {
          console.log('[FAMILY_ONBOARDING] Redeeming Care Circle invite code:', state.inviteCode.trim());
          await redeemInviteCode(state.inviteCode.trim());
          console.log('[FAMILY_ONBOARDING] Care Circle join request submitted successfully');
        } catch (inviteErr: any) {
          console.warn(
            '[FAMILY_ONBOARDING] Care Circle redemption non-fatal notice:',
            inviteErr?.response?.data?.message || inviteErr?.message
          );
        }
      }

      // 7. Refresh user context — mounts FamilyNavigator
      await refreshUser();
      console.log('[FAMILY_ONBOARDING] Onboarding successfully completed');
    } catch (err: any) {
      console.error('[FAMILY_ONBOARDING] Submission error:', err);
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
        <Step1AboutYou
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
        <Step2Connection
          relationLabel={state.relationLabel}
          proximity={state.proximity}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 3:
      return (
        <Step3Involvement
          involvementInterests={state.involvementInterests}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 4:
      return (
        <Step4CareCircle
          hasInvite={state.hasInvite}
          inviteCode={state.inviteCode}
          verifiedPatientName={state.verifiedPatientName}
          onUpdate={updateState}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    case 5:
    default:
      return (
        <Step5Review
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
