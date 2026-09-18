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
  ProfileSetupScreen:  { role?: UserRoleType } | undefined;
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
  NotificationHistoryScreen:   undefined;
  NotificationSettingsScreen:  undefined;
  NotificationTestScreen:      undefined;
  PatientProfileScreen:        { patientId?: string } | undefined;
};

// ─── Caregiver Stack ──────────────────────────────────────────────────────────
export type CaregiverStackParams = {
  CaregiverTriageScreen:          undefined;
  CaregiverPatientDetailScreen:   { patientId: string; patientName: string; refresh?: boolean; initialTab?: 'Home' | 'Alerts' | 'Manage' };
  CaregiverAssessmentScreen:      { patientId: string; patientName: string; assessmentId?: string };
  CaregiverAssessmentViewScreen:  { patientId: string; patientName: string };
  CaregiverPatientMapScreen:      { patientId: string; patientName?: string };
  CaregiverPatientLocationEditScreen: { patientId: string; patientName?: string };
  CaregiverPatientRoutinesScreen: { patientId: string; patientName: string };
  CaregiverPatientAlertsScreen:   { patientId: string; patientName: string };
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
      boundaryType?: 'soft' | 'hard';
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
  CaregiverCareCircleScreen:      { patientId: string; patientName: string };
  NotificationHistoryScreen:      undefined;
  NotificationSettingsScreen:     undefined;
  NotificationTestScreen:         undefined;
  PatientProfileScreen:           { patientId: string };
};

// ─── Family Stack ─────────────────────────────────────────────────────────────
export type FamilyStackParams = {
  FamilyLinkPatientScreen: undefined;
  FamilyTabs:              undefined;
  FamilyFeedScreen:        undefined;
  FamilyMapScreen:         { patientId?: string } | undefined;
  FamilyAlertsScreen:      undefined;
  FamilyStoriesScreen:     { patientId: string };
  FamilyMessagesScreen:    { patientId?: string } | undefined;
  FamilySettingsScreen:    undefined;
  NotificationHistoryScreen:  undefined;
  NotificationSettingsScreen: undefined;
  NotificationTestScreen:     undefined;
  PatientProfileScreen:       { patientId: string };
};

export type FamilyTabParams = {
  FamilyFeedScreen:        undefined;
  FamilyMapScreen:         { patientId?: string } | undefined;
  FamilyAlertsScreen:      undefined;
  FamilyMessagesScreen:    { patientId?: string } | undefined;
  FamilySettingsScreen:    undefined;
};

// ─── Doctor Stack ─────────────────────────────────────────────────────────────
export type DoctorStackParams = {
  DoctorPatientListScreen:       undefined;
  DoctorCognitiveReportScreen:   { patientId: string };
  DoctorAssessmentDetailScreen:  { assessmentId: string };
};
