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
};

import type { CaregiverListing } from '../screens/patient/CaregiverSearchView';
import type { ConnectedPerson } from '../services/relationshipService';
import type { MemoryItem } from '../services/memoryService';

// ─── Patient Tabs ─────────────────────────────────────────────────────────────
export type PatientTabParams = {
  HomeTab:       undefined;
  FamilyTab:     undefined;
  ActivitiesTab: undefined;
  CareTab:       undefined;
};

// ─── Patient Stack ────────────────────────────────────────────────────────────
export type PatientStackParams = {
  PatientTabs:             NavigatorScreenParams<PatientTabParams> | undefined;
  PatientHomeScreen:       { initialTab?: 'Home' | 'Family' | 'Activity' | 'Search' | 'CareTeam' } | undefined;
  PatientCareScreen?:      undefined;
  PatientPersonDetailScreen: { person: ConnectedPerson };
  PatientMemoriesScreen:     { personId?: string; personName?: string } | undefined;
  PatientMemoryViewerScreen: { memory: MemoryItem; memories?: MemoryItem[]; initialIndex?: number };
  PatientRoutinesScreen:   { patientId?: string; patientName?: string; mode?: 'edit' | 'create'; routine?: any } | undefined;
  CaregiverRoutineEditorScreen?: { patientId: string; patientName: string; mode: 'create' | 'edit'; routine?: any };
  CareDiscoveryScreen:     { targetPatientId?: string; targetPatientName?: string } | undefined;
  CaregiverProfileScreen:  { caregiver?: CaregiverListing; caregiverId?: string; targetPatientId?: string; targetPatientName?: string };
  CareRequestScreen:       { caregiver: CaregiverListing; targetPatientId?: string; targetPatientName?: string };
  CareRequestDetailScreen: { requestId: string; onUpdated?: () => void };
  CareRequestsListScreen:  { initialTab?: 'PENDING' | 'ALL' | 'ACTIVE' | 'PAST'; targetPatientId?: string; targetPatientName?: string } | undefined;
  PostCareNeedScreen:      { targetPatientId?: string; targetPatientName?: string } | undefined;
  CareNeedResponsesScreen: { needId?: string; targetPatientId?: string; targetPatientName?: string } | undefined;
  PatientCareTeamScreen:   undefined;
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
  PatientPersonalDetailsScreen: undefined;
  PatientLanguageScreen:       undefined;
  PatientConnectFamilyScreen:  undefined;
  PatientLocationScreen:       undefined;
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
  JoinCareCircleScreen?:          undefined;
  NotificationHistoryScreen:      undefined;
  NotificationSettingsScreen:     undefined;
  NotificationTestScreen:         undefined;
  PatientProfileScreen:           { patientId: string };
};

// ─── Family Stack ─────────────────────────────────────────────────────────────
export type FamilyTabParams = {
  FamilyHomeTab:   undefined;
  FamilyPeopleTab: undefined;
  FamilyAlertsTab: undefined;
  FamilyCareTab:   undefined;
};

export type FamilyStackParams = {
  FamilyTabs:                  NavigatorScreenParams<FamilyTabParams> | undefined;
  FamilyHomeScreen:            undefined;
  FamilyPeopleScreen:          undefined;
  FamilyAlertsScreen:          undefined;
  FamilyCareScreen:            undefined;
  FamilySettingsScreen:        undefined;

  // Patient Sub-Flow
  PatientOverviewScreen:       { patientId: string; patientName?: string; initialTab?: 'Overview' | 'Routines' | 'Safety' | 'People' | 'Memories' };
  PatientRoutinesScreen:       { patientId: string; patientName?: string };
  PatientRoutineEditorScreen:  { patientId: string; patientName?: string; mode: 'create' | 'edit'; routine?: any };
  PatientSafetyScreen:         { patientId: string; patientName?: string };
  PatientSafeZonesScreen:      { circleId: string; patientId: string; patientName?: string };
  PatientSafeZoneEditorScreen: {
    circleId:     string;
    patientId:    string;
    patientName?: string;
    existingZone?: {
      id:       string;
      label:    string;
      center:   { latitude: number; longitude: number };
      radiusM:  number;
      boundaryType?: 'soft' | 'hard';
    } | null;
  };
  PatientMemoriesScreen:       { patientId: string; patientName?: string };
  PatientMemoryViewerScreen:   { memory: any; memories?: any[]; initialIndex?: number };

  // Circle Management Sub-Flow
  CreateCareCircleScreen:      undefined;
  JoinCareCircleScreen:        undefined;
  CareCircleManageScreen:      { circleId: string };
  CareCircleInviteScreen:      { circleId: string };
  CareCirclePermissionsScreen: { circleId: string; memberId: string; memberName: string };

  // Incident & Alert Sub-Flow
  AlertDetailScreen:           { alertId: string; circleId?: string; patientId?: string };

  // Caregiver Sub-Flow
  CareDiscoveryScreen:         { targetPatientId?: string; targetPatientName?: string } | undefined;
  CaregiverSearchScreen?:      { targetPatientId?: string; targetPatientName?: string } | undefined;
  CaregiverProfileScreen:      { caregiver?: CaregiverListing; caregiverId?: string; targetPatientId?: string; targetPatientName?: string };
  CareRequestScreen:           { caregiver: CaregiverListing; targetPatientId?: string; targetPatientName?: string };
  CareRequestDetailScreen:     { requestId: string; onUpdated?: () => void };
  CareRequestsListScreen:      { initialTab?: 'PENDING' | 'ALL' | 'ACTIVE' | 'PAST'; targetPatientId?: string; targetPatientName?: string } | undefined;
  PostCareNeedScreen:          { targetPatientId?: string; targetPatientName?: string } | undefined;
  CareNeedResponsesScreen:     { needId?: string; targetPatientId?: string; targetPatientName?: string } | undefined;

  // Shared Notifications & Profile
  NotificationHistoryScreen:   undefined;
  NotificationSettingsScreen:  undefined;
  NotificationTestScreen:      undefined;
  PatientProfileScreen:        { patientId: string };

  // Legacy compat aliases
  FamilyLinkPatientScreen?:    undefined;
  FamilyFeedScreen?:           undefined;
  FamilyMapScreen?:            { patientId?: string };
  FamilyStoriesScreen?:        { patientId: string };
  FamilyMessagesScreen?:       { patientId?: string };
};

// ─── Doctor Stack ─────────────────────────────────────────────────────────────
export type DoctorStackParams = {
  DoctorPatientListScreen:       undefined;
  DoctorCognitiveReportScreen:   { patientId: string };
  DoctorAssessmentDetailScreen:  { assessmentId: string };
};
