/**
 * SureStep — src/types/navigation.types.ts
 * Route param types for all navigators.
 * Every navigation.navigate() call is type-checked against these.
 * TDD Section 10.4.
 */
import type { UserRoleType } from './enums';

// ─── Auth Stack ───────────────────────────────────────────────────────────────
export type AuthStackParams = {
  WelcomeScreen:       undefined;
  PhoneAuthScreen:     undefined;
  RoleSelectionScreen: undefined;
  ProfileSetupScreen:  { role: UserRoleType };
  InviteAcceptScreen:  { token: string };
};

// ─── Patient Stack ────────────────────────────────────────────────────────────
export type PatientStackParams = {
  PatientHomeScreen:       { initialTab?: 'Home' | 'Family' | 'Activity' | 'Search' } | undefined;
  PatientGamesScreen:      undefined;
  PatientStoriesScreen:    undefined;
  PatientActivitiesScreen: undefined;
  PatientWorkoutScreen:    undefined;
  PatientRelaxingScreen:   undefined;
  PatientSettingsScreen:   undefined;
  PatientAiScreen:         undefined;
  ActivityDetailScreen:    { activityId: string };
  ActivityPlayScreen:      { activityId: string };
  ActivityReportsScreen:   undefined;
};

// ─── Caregiver Stack ──────────────────────────────────────────────────────────
export type CaregiverStackParams = {
  CaregiverTriageScreen:          undefined;
  CaregiverPatientDetailScreen:   { patientId: string; patientName: string };
  CaregiverPatientMapScreen:      { patientId: string; patientName?: string };
  CaregiverPatientRoutinesScreen: { patientId: string; patientName: string };
  CaregiverPatientAlertsScreen:   { patientId: string };
  CaregiverPatientShiftsScreen:   { patientId: string };
  CaregiverRoutineEditorScreen:   { patientId: string; patientName: string; mode: 'create' | 'edit'; routine?: any };
  CaregiverGeofenceEditorScreen:  {
    patientId:    string;
    patientName:  string;
    existingZone?: {
      id:       string;
      label:    string;
      center:   { latitude: number; longitude: number };
      radiusM:  number;
    } | null;
    initialCenter?: { latitude: number; longitude: number };
  };
  CaregiverShiftHandoverScreen:   { shiftId: string };
  CaregiverAlertFeedScreen:       undefined;
  CaregiverCalendarScreen:        undefined;
  CaregiverMessagesScreen:        { patientId: string };
  CaregiverWellbeingScreen:       undefined;
  CaregiverProfileEditScreen:     undefined;
  CaregiverSettingsScreen:        undefined;
};

// ─── Family Stack ─────────────────────────────────────────────────────────────
export type FamilyStackParams = {
  FamilyFeedScreen:     undefined;
  FamilyMapScreen:      { patientId: string };
  FamilyAlertsScreen:   undefined;
  FamilyStoriesScreen:  { patientId: string };
  FamilyMessagesScreen: { patientId: string };
  FamilySettingsScreen: undefined;
};

// ─── Doctor Stack ─────────────────────────────────────────────────────────────
export type DoctorStackParams = {
  DoctorPatientListScreen:       undefined;
  DoctorCognitiveReportScreen:   { patientId: string };
  DoctorAssessmentDetailScreen:  { assessmentId: string };
};
