
/**
 * SureStep — src/screens/auth/family-onboarding/FamilyOnboardingScreen.tsx
 * Master orchestrator for the 5-stage Family Onboarding experience.
 */

import React, {
  useState,
  useCallback,
} from 'react';

import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { useAuth } from '../../../context/AuthContext';

import {
  provisionUser,
} from '../../../services/authService';

import {
  updateMe,
  uploadProfilePhoto,
} from '../../../services/userService';

import {
  updateFamilyProfile,
  redeemInviteCode,
} from '../../../services/familyService';

import type {
  AuthStackParams,
} from '../../../types/navigation.types';
import { DEFAULT_LANGUAGE_CODE, resolveLanguageCode } from '../../../constants/languages';

import { Step1AboutYou } from './Step1AboutYou';
import { Step2Connection } from './Step2Connection';
import { Step3Involvement } from './Step3Involvement';
import { Step4CareCircle } from './Step4CareCircle';
import { Step5Review } from './Step5Review';

type Props = NativeStackScreenProps<
  AuthStackParams,
  'FamilyOnboardingScreen'
>;

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

export const FamilyOnboardingScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const { returnToStep } = route.params || {};

  const {
    firebaseUser,
    login,
    refreshUser,
  } = useAuth();

  const [currentStep, setCurrentStep] =
    useState<number>(returnToStep || 1);

  const [returnToReview, setReturnToReview] =
    useState<boolean>(false);

  const [submitting, setSubmitting] =
    useState<boolean>(false);

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  const [state, setState] =
    useState<FamilyOnboardingState>({
      name: '',
      dob: '',
      gender: '',
      language: DEFAULT_LANGUAGE_CODE,
      city: '',
      photoUri: undefined,
      relationLabel: '',
      proximity: '',
      involvementInterests: [],
      hasInvite: null,
      inviteCode: '',
      verifiedPatientName: null,
    });

  /* Update onboarding state */

  const updateState = (
    fields: Partial<FamilyOnboardingState>
  ) => {
    setState((previous) => ({
      ...previous,
      ...fields,
    }));
  };

  /* Next step */

  const handleNext = () => {
    if (submitting) return;

    if (returnToReview) {
      setCurrentStep(5);
      setReturnToReview(false);
      return;
    }

    if (currentStep < 5) {
      setCurrentStep((step) =>
        Math.min(5, step + 1)
      );
    }
  };

  /* Previous step */

  const handleBack = useCallback(() => {
    if (submitting) return;

    // Return to review when editing.
    if (returnToReview) {
      setCurrentStep(5);
      setReturnToReview(false);
      return;
    }

    // Go to previous onboarding step.
    if (currentStep > 1) {
      setCurrentStep((step) =>
        Math.max(1, step - 1)
      );

      return;
    }

    // Return to the existing Role Selection route.
    const stack = navigation.getState();

    const previousRoute =
      stack.routes[stack.index - 1];

    if (
      previousRoute?.name === 'RoleSelectionScreen'
    ) {
      navigation.goBack();
      return;
    }

    // Handle resumed onboarding or an unexpected stack.
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'RoleSelectionScreen',
        },
      ],
    });
  }, [
    currentStep,
    returnToReview,
    submitting,
    navigation,
  ]);

  /* Android hardware back */

  useFocusEffect(
    useCallback(() => {
      const subscription =
        BackHandler.addEventListener(
          'hardwareBackPress',
          () => {
            handleBack();
            return true;
          }
        );

      return () => {
        subscription.remove();
      };
    }, [handleBack])
  );

  /* Edit from review */

  const handleJumpToStep = (
    stepNumber: number
  ) => {
    if (submitting) return;

    setReturnToReview(true);

    setCurrentStep(
      Math.min(4, Math.max(1, stepNumber))
    );
  };

  /* Final submission */

  const handleFinalSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const phone =
        firebaseUser?.phoneNumber || '';

      /* 1. Provision account */

      console.log(
        '[FAMILY_ONBOARDING] Provisioning family account'
      );

      const preferredLanguage = resolveLanguageCode(state.language);

      const provRes = await provisionUser({
        name: state.name.trim(),
        role: 'FAMILY',
        phone: phone || undefined,
        preferred_language: preferredLanguage,
      });

      const provisionedUser =
        provRes.data?.data?.user;

      if (!provisionedUser?.id) {
        throw new Error(
          'Account creation failed. Please try again.'
        );
      }

      /* 2. Upload profile photo */

      let remotePhotoUrl:
        | string
        | undefined = undefined;

      if (state.photoUri) {
        try {
          remotePhotoUrl =
            await uploadProfilePhoto(
              state.photoUri
            );
        } catch (photoErr) {
          console.warn(
            '[FAMILY_ONBOARDING] Photo upload non-fatal notice:',
            photoErr
          );
        }
      }

      /* 3. Update core user fields */

      await updateMe({
        name: state.name.trim(),

        date_of_birth:
          state.dob || undefined,

        gender:
          state.gender || undefined,

        city:
          state.city.trim() || undefined,

        preferred_language: preferredLanguage,

        photo_url:
          remotePhotoUrl || undefined,
      });

      /* 4. Update family profile */

      await updateFamilyProfile({
        relation_label:
          state.relationLabel.trim() ||
          null,

        proximity:
          state.proximity || null,

        involvement_interests:
          state.involvementInterests,

        avatar_url:
          remotePhotoUrl || null,
      });

      console.log(
        '[FAMILY_ONBOARDING] Family profile successfully saved'
      );

      /* 5. Authenticate family session */

      await login(
        {
          id: provisionedUser.id,

          phone:
            provisionedUser.phone ||
            phone,

          name: state.name.trim(),

          role: 'FAMILY',

          preferred_language: preferredLanguage,

          photo_url:
            remotePhotoUrl || undefined,
        },
        undefined,
        'FAMILY'
      );

      /* 6. Redeem care circle invitation */

      if (
        state.hasInvite &&
        state.inviteCode.trim()
      ) {
        try {
          await redeemInviteCode(
            state.inviteCode.trim()
          );

          console.log(
            '[FAMILY_ONBOARDING] Care Circle join request submitted successfully'
          );
        } catch (inviteErr: any) {
          console.warn(
            '[FAMILY_ONBOARDING] Care Circle redemption non-fatal notice:',
            inviteErr?.response?.data?.message ||
              inviteErr?.message
          );
        }
      }

      /* 7. Refresh authentication context */

      await refreshUser();

      console.log(
        '[FAMILY_ONBOARDING] Onboarding successfully completed'
      );

    } catch (err: any) {
      console.error(
        '[FAMILY_ONBOARDING] Submission error:',
        err
      );

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

  /* Render onboarding steps */

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
          involvementInterests={
            state.involvementInterests
          }
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
          verifiedPatientName={
            state.verifiedPatientName
          }
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
          onJumpToStep={
            handleJumpToStep
          }
          onSubmit={
            handleFinalSubmit
          }
          onBack={handleBack}
          submitting={submitting}
          submitError={submitError}
        />
      );
  }
};
