/**
 * SureStep — src/hooks/usePatientCareMode.ts
 *
 * Centralized Patient mode selector hook.
 * Production source of truth: `patient_profiles.onboarding_source` via
 * `careContext.profiles.patientOnboardingSource` (returned by GET /users/me).
 *
 * Values:
 *  - 'SELF'   -> Self-managed Patient (routine CRUD allowed)
 *  - 'FAMILY' -> Assisted Patient (routine CRUD managed by family care circle)
 */
import { useAuth } from './useAuth';

export interface PatientCareMode {
  isSelfManaged: boolean;
  isAssisted: boolean;
  onboardingSource: 'SELF' | 'FAMILY' | string | null;
}

/**
 * Pure helper function to derive patient care mode from onboarding source.
 */
export function getPatientCareMode(onboardingSource?: string | null): {
  isSelfManaged: boolean;
  isAssisted: boolean;
} {
  return {
    isSelfManaged: onboardingSource === 'SELF',
    isAssisted: onboardingSource === 'FAMILY',
  };
}

/**
 * Centralized hook to consume Patient mode throughout the application.
 */
export function usePatientCareMode(): PatientCareMode {
  const { careContext } = useAuth();
  const onboardingSource = careContext?.profiles?.patientOnboardingSource ?? null;
  const { isSelfManaged, isAssisted } = getPatientCareMode(onboardingSource);

  return {
    isSelfManaged,
    isAssisted,
    onboardingSource,
  };
}
