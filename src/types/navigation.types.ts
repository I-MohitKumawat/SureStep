/**
 * SureStep — src/types/navigation.types.ts
 * Route param types for all navigators.
 * Every navigation.navigate() call is type-checked against these.
 * TDD Section 10.4.
 */
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { UserRoleType } from './enums';

// ─── Onboarding Intent ────────────────────────────────────────────────────────
export type OnboardingIntent =
  | 'RECEIVING_CARE'         // Option 1: "I'm receiving care myself"
  | 'SETTING_UP_CARE'        // Option 2: "I'm setting up care for someone"
  | 'SUPPORTING_AS_FAMILY'   // Option 3: "I'm supporting someone as family"
  | 'PROFESSIONAL_CAREGIVER'; // Option 4: "I'm providing professional care"

// ─── Auth Stack ───────────────────────────────────────────────────────────────
export type AuthStackParams = {
  WelcomeScreen:            undefined;
  PhoneAuthScreen:          undefined;
  RoleSelectionScreen:      undefined;
  ProfileSetupScreen:       { role?: UserRoleType; intent?: OnboardingIntent } | undefined;
  PatientOnboardingScreen:  { intent: OnboardingIntent; returnToStep?: number };
  FamilyOnboardingScreen:   { intent?: OnboardingIntent; returnToStep?: number } | undefined;
  CaregiverOnboardingScreen: { intent?: OnboardingIntent; returnToStep?: number } | undefined;
  InviteAcceptScreen:       { token: string };
};

import type { CaregiverListing } from '../screens/patient/CaregiverSearchView';

// ─── Patient Tabs ─────────────────────────────────────────────────────────────
export type PatientTabParams = {
  HomeTab:       undefined;
  FamilyTab:     undefined;
  ActivitiesTab: undefined;
  CareTeamTab:   undefined;
};

// ─── Patient Stack ────────────────────────────────────────────────────────────
export type PatientStackParams = {
  PatientTabs:             NavigatorScreenParams<PatientTabParams> | undefined;
  PatientHomeScreen:       { initialTab?: 'Home' | 'Family' | 'Activity' | 'Search' | 'CareTeam' } | undefined;
  CareDiscoveryScreen:     { targetPatientId?: string; targetPatientName?: string } | undefined;
  CaregiverProfileScreen:  { caregiver?: CaregiverListing; caregiverId?: string; targetPatientId?: string; targetPatientName?: string };
  CareRequestScreen:       { caregiver: CaregiverListing; targetPatientId?: string; targetPatientName?: string };
  CareRequestDetailScreen: { requestId: string; onUpdated?: () => void };
  CareRequestsListScreen:  { initialTab?: 'PENDING' | 'ALL'; targetPatientId?: string; targetPatientName?: string } | undefined;
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
  CareRequestDetailScreen:        { requestId: string; isCaregiverViewer?: boolean; onUpdated?: () => void };
  CareRequestsListScreen:         { initialTab?: 'PENDING' | 'ALL' } | undefined;
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
  FamilyHomeScreen:        undefined;
  FamilyFeedScreen:        undefined;
  FamilyPatientOverviewScreen: { patientId: string; patientName?: string; initialTab?: 'Overview' | 'Routines' | 'Safety' | 'People' | 'Memories' };
  FamilyPatientRoutinesScreen: { patientId: string; patientName?: string; initialFilter?: 'all' | 'active' | 'paused' };
  FamilyRoutineEditorScreen:   { patientId: string; patientName?: string; mode: 'create' | 'edit'; routine?: any };
  FamilyPeopleScreen:      undefined;
  CareDiscoveryScreen:     { targetPatientId: string; targetPatientName?: string };
  CaregiverProfileScreen:  { caregiver?: CaregiverListing; caregiverId?: string; targetPatientId?: string; targetPatientName?: string };
  CareRequestScreen:       { caregiver: CaregiverListing; targetPatientId?: string; targetPatientName?: string };
  CareRequestDetailScreen: { requestId: string; onUpdated?: () => void };
  CareRequestsListScreen:  { initialTab?: 'PENDING' | 'ALL'; targetPatientId?: string; targetPatientName?: string } | undefined;
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
  HomeTab:                 undefined;
  PeopleTab:               undefined;
  AlertsTab:               undefined;
  CareTab:                 undefined;
  FamilyHomeScreen:        undefined;
  FamilyFeedScreen:        undefined;
  FamilyPeopleScreen:      undefined;
  FamilyMapScreen:         { patientId?: string } | undefined;
  FamilyAlertsScreen:      undefined;
  FamilyMessagesScreen:    { patientId?: string } | undefined;
  FamilySettingsScreen:    undefined;
  CareRequestsListScreen:  undefined;
};

// ─── Doctor Stack ─────────────────────────────────────────────────────────────
export type DoctorStackParams = {
  DoctorPatientListScreen:       undefined;
  DoctorCognitiveReportScreen:   { patientId: string };
  DoctorAssessmentDetailScreen:  { assessmentId: string };
};
