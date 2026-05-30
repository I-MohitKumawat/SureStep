# SureStep Frontend Technical Design Document (TDD)
## Full Vision · Screens, Components, Navigation & API Wiring

Companion document to the SureStep Backend TDD. Every screen in this document maps directly to API endpoints defined in the Backend TDD.

| Stack | React Native · Expo (EAS / Prebuild) |
| --- | --- |
| **Language** | TypeScript — all files `.tsx` or `.ts`, no `.jsx` or `.js` |
| **Navigation** | React Navigation v6 — per-role navigator trees |
| **State** | React Context + hooks — SecureStore for auth tokens |
| **Theme** | Single source of truth: `src/theme/` — tokens, colors, fonts |
| **Maps** | React Native Maps (Google Maps SDK) |
| **Status Legend** | `EXISTS` · `RENAME` · `REDESIGN` · `BUILD` · `DELETE` |

---

## Section 1: How to Read This Document

### 1.1 Status Tags

Every file in this document carries one of five status tags. These tell you exactly what to do with each file:

*   **`EXISTS`**: File exists, name is correct, no redesign needed.
*   **`RENAME`**: File exists but name does not follow convention.
*   **`REDESIGN`**: File exists but must be redesigned per TDD spec.
*   **`BUILD`**: Does not exist yet — must be built in V1.
*   **`DELETE`**: Remove from codebase. Do not ship.

### 1.2 API Column

The API column in every screen table maps directly to Backend TDD Section 4. The format is:
*   Method + endpoint path — e.g. `GET /tasks/patient/:id/today`
*   Multiple endpoints separated by line breaks within the cell
*   If a screen has no API dependency (pure UI), the column reads: `none`

### 1.3 File Naming Convention

| Pattern | Rule / Example |
| --- | --- |
| **Screens** | `.tsx` — PascalCase + role prefix + descriptive name + Screen — e.g. `PatientHomeScreen.tsx` |
| **Components** | `.tsx` — PascalCase + descriptive name, no suffix — e.g. `TaskCard.tsx`, `SosButton.tsx` |
| **Navigators** | `.tsx` — PascalCase + Navigator — e.g. `PatientNavigator.tsx` |
| **Contexts** | `.tsx` — PascalCase + Context — e.g. `AuthContext.tsx`, `TaskContext.tsx` |
| **Hooks** | `.ts` — use prefix + PascalCase — e.g. `useAuth.ts`, `usePatientState.ts` |
| **Utils** | `.ts` — camelCase — e.g. `geofenceUtils.ts`, `buildDashboardModel.ts` |
| **Theme / tokens** | `.ts` — camelCase — e.g. `colors.ts`, `tokens.ts`, `fonts.ts` |
| **Types** | `.ts` — camelCase — e.g. `api.types.ts`, `navigation.types.ts` |

---

## Section 2: Folder Structure

### 2.1 Directory Structure
```
surestep-app/
├── App.tsx                        ← Expo entry point. Renders AppShell only.
├── app.json
├── tsconfig.json
├── package.json
└── src/
    ├── navigation/                ← All navigators live here
    │   ├── RoleNavigator.tsx
    │   ├── PatientNavigator.tsx
    │   ├── CaregiverNavigator.tsx
    │   ├── FamilyNavigator.tsx
    │   ├── AuthNavigator.tsx
    │   └── DoctorNavigator.tsx
    ├── screens/                   ← One file per screen. No components inside here.
    │   ├── auth/
    │   │   ├── WelcomeScreen.tsx
    │   │   ├── PhoneAuthScreen.tsx
    │   │   ├── RoleSelectionScreen.tsx
    │   │   └── ProfileSetupScreen.tsx
    │   ├── patient/
    │   │   ├── PatientHomeScreen.tsx
    │   │   ├── PatientGamesScreen.tsx
    │   │   ├── PatientStoriesScreen.tsx
    │   │   ├── PatientActivitiesScreen.tsx
    │   │   ├── PatientWorkoutScreen.tsx
    │   │   ├── PatientRelaxingScreen.tsx
    │   │   └── PatientSettingsScreen.tsx
    │   ├── caregiver/
    │   │   ├── CaregiverTriageScreen.tsx
    │   │   ├── CaregiverPatientDetailScreen.tsx
    │   │   ├── CaregiverPatientMapScreen.tsx
    │   │   ├── CaregiverPatientAlertsScreen.tsx
    │   │   ├── CaregiverPatientRoutinesScreen.tsx
    │   │   ├── CaregiverPatientShiftsScreen.tsx
    │   │   ├── CaregiverRoutineEditorScreen.tsx
    │   │   ├── CaregiverGeofenceEditorScreen.tsx
    │   │   ├── CaregiverAlertFeedScreen.tsx
    │   │   ├── CaregiverCalendarScreen.tsx
    │   │   ├── CaregiverMessagesScreen.tsx
    │   │   ├── CaregiverShiftHandoverScreen.tsx
    │   │   ├── CaregiverWellbeingScreen.tsx
    │   │   ├── CaregiverProfileEditScreen.tsx
    │   │   └── CaregiverSettingsScreen.tsx
    │   ├── family/
    │   │   ├── FamilyFeedScreen.tsx
    │   │   ├── FamilyMapScreen.tsx
    │   │   ├── FamilyAlertsScreen.tsx
    │   │   ├── FamilyStoriesScreen.tsx
    │   │   ├── FamilyMessagesScreen.tsx
    │   │   └── FamilySettingsScreen.tsx
    │   └── doctor/
    │       ├── DoctorPatientListScreen.tsx
    │       ├── DoctorCognitiveReportScreen.tsx
    │       └── DoctorAssessmentDetailScreen.tsx
    ├── components/                ← Reusable UI components, organised by domain
    │   ├── shared/                ← Used across multiple roles
    │   │   ├── ScreenContainer.tsx
    │   │   ├── SosButton.tsx
    │   │   ├── AiAssistantFab.tsx
    │   │   ├── ConfirmModal.tsx
    │   │   ├── AlertBadge.tsx
    │   │   └── LoadingSpinner.tsx
    │   ├── patient/
    │   │   ├── OrientationStrip.tsx
    │   │   ├── TaskCard.tsx
    │   │   ├── TaskStepGuide.tsx
    │   │   ├── CaregiverPresenceTile.tsx
    │   │   ├── MoodCheckIn.tsx
    │   │   ├── VoiceMessagePlayer.tsx
    │   │   ├── StoryFeedCard.tsx
    │   │   └── PatientNavCard.tsx
    │   ├── caregiver/
    │   │   ├── PatientTriageRow.tsx
    │   │   ├── PatientStateCard.tsx
    │   │   ├── AlertFeedItem.tsx
    │   │   ├── TaskListItem.tsx
    │   │   ├── RoutineTemplateCard.tsx
    │   │   ├── GeofenceZoneCard.tsx
    │   │   ├── ShiftHandoverForm.tsx
    │   │   ├── VoiceNoteRecorder.tsx
    │   │   ├── Sparkline.tsx
    │   │   └── ConcentricRings.tsx
    │   ├── family/
    │   │   ├── PeaceOfMindCard.tsx
    │   │   ├── StoryComposer.tsx
    │   │   ├── VoiceSampleRecorder.tsx
    │   │   └── EmergencyConsensusPanel.tsx
    │   └── forms/
    │       ├── TextInputField.tsx
    │       ├── PhoneInputField.tsx
    │       ├── DropdownPicker.tsx
    │       └── ProfileForm.tsx
    ├── games/                     ← Cognitive game components
    │   ├── MemoryMatchGame.tsx
    │   ├── WordFinderGame.tsx
    │   ├── ColorSortGame.tsx
    │   ├── SoundRecallGame.tsx
    │   ├── PicturePuzzleGame.tsx
    │   └── OrientationCheckGame.tsx
    ├── activities/                ← Therapeutic activity components
    │   ├── relaxing/
    │   │   ├── MusicListenActivity.tsx
    │   │   ├── GratitudeActivity.tsx
    │   │   ├── NatureSoundsActivity.tsx
    │   │   ├── GentleStretchActivity.tsx
    │   │   └── HandMassageActivity.tsx
    │   └── workout/
    │       ├── ChairMarchExercise.tsx
    │       ├── DeepBreathingExercise.tsx
    │       ├── ArmCirclesExercise.tsx
    │       ├── HeelRaisesExercise.tsx
    │       └── NeckRollsExercise.tsx
    ├── context/                   ← All context providers
    │   ├── AuthContext.tsx
    │   ├── TaskContext.tsx
    │   ├── PatientStateContext.tsx
    │   ├── GeofenceContext.tsx
    │   ├── VoiceContext.tsx
    │   ├── CognitionContext.tsx
    │   ├── AlertContext.tsx
    │   ├── FamiliarityContext.tsx
    │   └── NotificationContext.tsx
    ├── hooks/                     ← Custom hooks extracted from contexts
    │   ├── useAuth.ts
    │   ├── usePatientState.ts
    │   ├── useTasks.ts
    │   ├── useGeofence.ts
    │   ├── useAlerts.ts
    │   ├── useVoice.ts
    │   └── useCognition.ts
    ├── theme/                     ← Single source of truth for all styling
    │   ├── colors.ts
    │   ├── tokens.ts
    │   ├── fonts.ts
    │   └── ThemeContext.tsx
    ├── services/                  ← API call functions, one file per backend module
    │   ├── authService.ts
    │   ├── userService.ts
    │   ├── taskService.ts
    │   ├── locationService.ts
    │   ├── alertService.ts
    │   ├── voiceService.ts
    │   ├── cognitionService.ts
    │   ├── storyService.ts
    │   ├── messageService.ts
    │   ├── medicationService.ts
    │   ├── appointmentService.ts
    │   ├── reportService.ts
    │   └── apiClient.ts             ← Axios instance with JWT interceptor
    ├── types/                     ← Shared TypeScript types
    │   ├── api.types.ts             ← Response shapes matching backend schema
    │   ├── navigation.types.ts      ← Route param types for all navigators
    │   └── enums.ts                 ← Frontend mirror of backend ENUM types
    └── utils/                     ← Pure utility functions
        ├── geofenceUtils.ts
        ├── buildDashboardModel.ts
        ├── dateUtils.ts
        └── offlineQueue.ts
```

### 2.2 Files to Delete Immediately

*   `app/screens/HomeScreen.tsx` — Unused placeholder, no route points here intentionally.
*   `app/screens/DetailsScreen.tsx` — Unused placeholder.
*   `app/screens/DevRoleSwitchScreen.tsx` — Dev-only, must never ship. Gate behind `__DEV__` if keeping locally.
*   `app/patient/mockState.ts` — Mock data. Remove entirely. Backend API provides real data.
*   `packages/ui/theme/` — Duplicate theme system. Consolidate into `src/theme/` only.
*   `packages/core/auth/AuthContext.tsx` — Move to `src/context/AuthContext.tsx` then delete `packages/core/`.

### 2.3 Theme — Single Source of Truth

Consolidate everything into `src/theme/` and delete the `packages/ui/theme/` folder.

| File | Responsibility |
| --- | --- |
| `src/theme/colors.ts` | Full colour palette. Exports the `C` object used everywhere. Includes patient-specific palette (no red), caregiver palette, family palette. |
| `src/theme/tokens.ts` | Raw design tokens: spacing scale, border radius, font sizes, shadow definitions, z-index scale. |
| `src/theme/fonts.ts` | Exports font loading utility or hooks. Loads Inter font family before app renders. |
| `src/theme/ThemeContext.tsx` | Light/dark theme provider. Exports `useTheme()` hook. Wraps entire app. |

---

## Section 3: Navigation Architecture

### 3.1 Overview

The navigations are split per-role. The global `RoleNavigator` evaluates the authentication status and mounts the appropriate Navigator. 

```
App.tsx
└── AppShell (src/AppShell.tsx)
    ├── GestureHandlerRootView
    ├── ThemeContext.tsx          ← Theme first, everything reads theme
    ├── AuthContext.tsx           ← Auth state, tokens from SecureStore
    ├── NotificationContext.tsx   ← FCM token registration
    └── SafeAreaProvider
        └── NavigationContainer
            └── RoleNavigator.tsx     ← Reads auth.role, mounts correct tree
                ├── AuthNavigator.tsx         (not logged in)
                ├── PatientNavigator.tsx      (role = PATIENT)
                ├── CaregiverNavigator.tsx    (role = CAREGIVER)
                ├── FamilyNavigator.tsx       (role = FAMILY)
                └── DoctorNavigator.tsx       (role = DOCTOR)
```

### 3.2 RoleNavigator Logic

```typescript
// src/navigation/RoleNavigator.tsx
const RoleNavigator = () => {
  const { status, user } = useAuth();

  if (status === 'loading')         return <ProfileLoadingScreen />;
  if (status === 'unauthenticated') return <AuthNavigator />;
  if (status === 'no_role')         return <AuthNavigator initialRoute='RoleSelectionScreen' />;
  if (status === 'no_profile')      return <AuthNavigator initialRoute='ProfileSetupScreen' />;

  switch (user.role) {
    case 'PATIENT':   return <PatientNavigator />;
    case 'CAREGIVER': return <CaregiverNavigator />;
    case 'FAMILY':    return <FamilyNavigator />;
    case 'DOCTOR':    return <DoctorNavigator />;
    default:          return <AuthNavigator />;
  }
};
```

### 3.3 AuthNavigator

| File | Status | API Endpoints | Description |
| --- | --- | --- | --- |
| `WelcomeScreen.tsx` | `EXISTS` | none | Splash screen. CTA goes to PhoneAuthScreen. |
| `PhoneAuthScreen.tsx` | `EXISTS` | `POST /auth/otp/request`<br>`POST /auth/otp/verify` | Phone + OTP login. On success writes session tokens. |
| `RoleSelectionScreen.tsx` | `RENAME` | none | Was `RoleEntryScreen.tsx`. New user selects `PATIENT`, `CAREGIVER`, or `FAMILY`. |
| `ProfileSetupScreen.tsx` | `REDESIGN` | `POST /auth/provision`<br>`PUT /users/me`<br>`PUT /profiles/patient`<br>`PUT /profiles/caregiver` | Wizard to complete onboarding registration details. |
| `InviteAcceptScreen.tsx` | `BUILD` | `POST /relationships/accept-invite/:token` | Family member arrives via deep link. |

### 3.4 PatientNavigator

| File | Status | API Endpoints | Description |
| --- | --- | --- | --- |
| `PatientHomeScreen.tsx` | `REDESIGN` | `GET /tasks/patient/:id/today`<br>`POST /tasks/:id/complete`<br>`POST /tasks/:id/unsure`<br>`POST /cognition/mood-checkin` | 4-card centred navigation. Single task focus. TTS enabled. |
| `PatientGamesScreen.tsx` | `EXISTS` | `POST /cognition/sessions` | Games hub. Horizontal paging carousel. |
| `PatientStoriesScreen.tsx` | `BUILD` | `GET /stories/patient/:id/feed`<br>`POST /stories/:id/react` | Family stories feed. Reads caption aloud. |
| `PatientActivitiesScreen.tsx` | `REDESIGN` | none | Activities hub. Database-driven content template. |
| `PatientWorkoutScreen.tsx` | `EXISTS` | none | Guided exercises hub. |
| `PatientRelaxingScreen.tsx` | `EXISTS` | none | Relaxation tracks (using familiar songs). |
| `PatientSettingsScreen.tsx` | `RENAME` | `GET /users/me` | Profile configuration and logout option. |

### 3.5 CaregiverNavigator

| File | Status | API Endpoints | Description |
| --- | --- | --- | --- |
| `CaregiverTriageScreen.tsx` | `REDESIGN` | `GET /awareness/my-patients` | Home list, ranked by patient safety / routine status. |
| `CaregiverPatientDetailScreen.tsx`| `RENAME` | `GET /awareness/patient/:id`<br>`GET /tasks/patient/:id/today` | View patient detailed parameters, contains nested tabs. |
| `CaregiverPatientRoutinesScreen.tsx`| `REDESIGN`| `GET /tasks/patient/:id/today`<br>`POST /tasks/patient/:id`<br>`PATCH /tasks/:id`<br>`DELETE /tasks/:id` | Task management with voice note capabilities. |
| `CaregiverRoutineEditorScreen.tsx`| `RENAME` | `POST /tasks/patient/:id`<br>`PATCH /tasks/:id` | Create or update routines. |
| `CaregiverPatientMapScreen.tsx` | `REDESIGN` | `GET /location/patient/:id/current`<br>`GET /geofences/patient/:id` | Real-time map displaying location, zone, and incident status. |
| `CaregiverGeofenceEditorScreen.tsx`| `RENAME` | `GET /geofences/patient/:id`<br>`POST /geofences/patient/:id` | Add/edit safe boundaries. |
| `CaregiverPatientAlertsScreen.tsx`| `BUILD` | `GET /alerts/patient/:id`<br>`POST /alerts/:id/acknowledge` | Patient-scoped alerts. |
| `CaregiverAlertFeedScreen.tsx` | `BUILD` | `GET /alerts/caregiver/feed` | Unread notifications queue. |
| `CaregiverCalendarScreen.tsx` | `BUILD` | `GET /appointments/patient/:id` | Combined appointments and caregiver shifts calendar. |
| `CaregiverMessagesScreen.tsx` | `BUILD` | `GET /messages/threads/patient/:id` | Chat with families. |
| `CaregiverPatientShiftsScreen.tsx`| `BUILD` | `GET /shifts/patient/:id` | Shift clock-in and checklist. |
| `CaregiverShiftHandoverScreen.tsx`| `BUILD` | `POST /shifts/:id/handover` | Shift handover summary submission. |
| `CaregiverWellbeingScreen.tsx` | `BUILD` | `POST /wellbeing/checkin` | Caregiver well-being tracker. |
| `CaregiverProfileEditScreen.tsx` | `EXISTS` | `PUT /profiles/caregiver` | Details, bio, rates, services. |
| `CaregiverSettingsScreen.tsx` | `BUILD` | `GET /users/me` | General configurations. |

### 3.6 FamilyNavigator

| File | Status | API Endpoints | Description |
| --- | --- | --- | --- |
| `FamilyFeedScreen.tsx` | `REDESIGN` | `GET /reports/family-digest/patient/:id` | Adaptable feed depending on access tier. |
| `FamilyMapScreen.tsx` | `BUILD` | `GET /location/patient/:id/current` | Map displaying last tracked location. |
| `FamilyAlertsScreen.tsx` | `BUILD` | `GET /alerts/patient/:id` | Alerts log and SOS panel access. |
| `FamilyStoriesScreen.tsx` | `BUILD` | `POST /stories/patient/:id` | Create or upload stories/reminders. |
| `FamilyMessagesScreen.tsx` | `BUILD` | `GET /messages/threads/patient/:id` | Dynamic messaging with caregivers. |
| `FamilySettingsScreen.tsx` | `BUILD` | `PUT /profiles/family`<br>`POST /voice/samples` | Save voice files, update options. |

### 3.7 DoctorNavigator

| File | Status | API Endpoints | Description |
| --- | --- | --- | --- |
| `DoctorPatientListScreen.tsx` | `RENAME` | `GET /relationships/my-patients` | List of patients assigned to doctor. |
| `DoctorCognitiveReportScreen.tsx`| `BUILD` | `GET /cognition/assessments/patient/:id` | Evaluation statistics and trends. |
| `DoctorAssessmentDetailScreen.tsx`| `BUILD` | `GET /cognition/assessments/patient/:id` | Individual test review and reports export. |

---

## Section 4: Components

### 4.1 Shared Components (`src/components/shared/`)

*   **`ScreenContainer.tsx` (EXISTS)**: consistent safe-area layout component.
*   **`SosButton.tsx` (BUILD)**: red button (`#DC2626`) always visible on patient screens; triggers SOS after modal confirmation.
*   **`AiAssistantFab.tsx` (RENAME)**: FAB for patients to access cognitive assistance.
*   **`ConfirmModal.tsx` (BUILD)**: styled two-option approval dialogue box.
*   **`AlertBadge.tsx` (BUILD)**: unread alerts count visual element.
*   **`LoadingSpinner.tsx` (BUILD)**: centered circular loader indicator.

### 4.2 Patient Components (`src/components/patient/`)

*   **`OrientationStrip.tsx` (BUILD)**: sticky status strip displaying day of the week, date, weather, and temperature.
*   **`TaskCard.tsx` (BUILD)**: single card displaying a task with large touch-points and automatic voice-note playback.
*   **`TaskStepGuide.tsx` (BUILD)**: breaks tasks into simple steps.
*   **`CaregiverPresenceTile.tsx` (BUILD)**: small tile indicating which caregiver is currently logged in/present.
*   **`MoodCheckIn.tsx` (BUILD)**: simple once-a-day mood assessment widget.
*   **`VoiceMessagePlayer.tsx` (BUILD)**: plays incoming spoken messages.
*   **`StoryFeedCard.tsx` (BUILD)**: formats family pictures and audio narratives.
*   **`PatientNavCard.tsx` (BUILD)**: large centered button to open sub-menus.

### 4.3 Caregiver Components (`src/components/caregiver/`)

*   **`PatientTriageRow.tsx` (BUILD)**: list item with safety/routine chips and vital status.
*   **`PatientStateCard.tsx` (REDESIGN)**: overview of patient parameters.
*   **`AlertFeedItem.tsx` (BUILD)**: warning feed row with action buttons.
*   **`TaskListItem.tsx` (BUILD)**: swipeable task list item.
*   **`RoutineTemplateCard.tsx` (BUILD)**: routine templates cards.
*   **`GeofenceZoneCard.tsx` (BUILD)**: represents a geofence zone boundary configurations.
*   **`ShiftHandoverForm.tsx` (BUILD)**: logs parameters for shift changes.
*   **`VoiceNoteRecorder.tsx` (BUILD)**: records voice notes to attach to tasks.
*   **`Sparkline.tsx` (RENAME)**: mini inline visual charts.
*   **`ConcentricRings.tsx` (RENAME)**: animated circular compliance percentage indicator.

### 4.4 Family Components (`src/components/family/`)

*   **`PeaceOfMindCard.tsx` (BUILD)**: simple color-coded feed card for quick health check status.
*   **`StoryComposer.tsx` (BUILD)**: composer interface to send photos/audio/texts.
*   **`VoiceSampleRecorder.tsx` (BUILD)**: step-by-step assistant to register family voice samples.
*   **`EmergencyConsensusPanel.tsx` (BUILD)**: safety consensus component for guardians.

### 4.5 Form Components (`src/components/forms/`)

*   **`TextInputField.tsx` (RENAME)**: standardized input field wrapper.
*   **`PhoneInputField.tsx` (RENAME)**: phone number field with country code support.
*   **`DropdownPicker.tsx` (RENAME)**: options selector wrapper.
*   **`ProfileForm.tsx` (EXISTS)**: handles details collections.

---

## Section 5: Games & Activities

### 5.1 Cognitive Games (`src/games/`)

All games log metrics using the `CognitionContext` and submit to `POST /cognition/sessions`.

| Game | Status | Metric Elements Recorded |
| --- | --- | --- |
| **`MemoryMatchGame.tsx`** | `EXISTS` | `recall_accuracy`, `error_count`, `duration_seconds` |
| **`WordFinderGame.tsx`** | `EXISTS` | `sequence_error`, `touch_hesitation_ms`, `completion_rate` |
| **`ColorSortGame.tsx`** | `EXISTS` | `reaction_time_ms`, `error_count` |
| **`SoundRecallGame.tsx`** | `EXISTS` | `recall_accuracy`, `avg_reaction_ms` |
| **`PicturePuzzleGame.tsx`** | `EXISTS` | `move_efficiency`, `completion_time`, `error_count` |
| **`OrientationCheckGame.tsx`** | `BUILD` | `orientation_correct` per domain (day, date, city) |

### 5.2 Relaxing Activities & Exercises

*   **`MusicListenActivity.tsx` (REDESIGN)**: reads track configurations dynamically using `FamiliarityContext`.
*   **Workout Exercises (Chair March, Deep Breathing, Arm Circles, Heel Raises, Neck Rolls) (EXISTS)**: guided mobility screens.

---

## Section 6: Contexts & Hooks

### 6.1 Context Architecture

| Context | Scope / Mount point | Description |
| --- | --- | --- |
| **`AuthContext.tsx`** | Global (AppShell) | Firebase session listener, gets and caches backend tokens. |
| **`TaskContext.tsx`** | Patient & Caregiver | Syncs daily routines using WebSocket and offline buffer. |
| **`PatientStateContext.tsx`** | Caregiver & Family | Maps patient IDs to their current safety state parameters. |
| **`GeofenceContext.tsx`** | Caregiver | Draggable safe zones editor support. |
| **`VoiceContext.tsx`** | Patient | Incoming voice notes storage queue and playback. |
| **`CognitionContext.tsx`** | Patient | Accumulates cognitive stats events. |
| **`AlertContext.tsx`** | Caregiver & Family | Subscribes to real-time notification warnings. |
| **`FamiliarityContext.tsx`** | Patient | Caches patient specific memories, media lists, and settings. |
| **`NotificationContext.tsx`**| Global (AppShell) | Handles OS push notifications registrations. |

### 6.2 Custom Hook Pattern

All components consume context parameters through hooks:
```typescript
const TaskContext = createContext<TaskContextType | null>(null);

export const useTasks = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
};
```

---

## Section 7: Patient UX — Non-Negotiable Rules

1.  **One thing at a time**: PatientHomeScreen shows exactly one task at a time. No complex lists.
2.  **4-card centered navigation**: PatientNavCard components in a 2x2 grid at center of home screen. No bottom tab bar.
3.  **OrientationStrip always visible**: Day, date, time, city, weather on every patient screen. Cannot be dismissed.
4.  **CaregiverPresenceTile always visible**: Caregiver name and photo visible on home screen.
5.  **Voice note first**: If `task.voice_note_url` exists, it auto-plays when `TaskCard` mounts.
6.  **TTS on every tap**: Tap any text element on patient screens to read it aloud.
7.  **STT for primary actions**: Speech recognition accepts "Done" and "Not sure".
8.  **No red colors**: No red warning text or icons (except for the SOS button itself).
9.  **SosButton always present**: Fixed, bottom-right, red button.
10. **Large touch targets**: All touchable zones must be at least 64x64dp.
11. **ConfirmModal**: Full-screen modal confirmation with 48sp+ text.
12. **No badges**: No unread badge counts on patient screens.
13. **Simple depth**: Navigation depth is capped at 2 screens maximum.

---

## Section 8: Backend Wiring Reference

### 8.1 API Client Interceptor
All calls go through `apiClient.ts` which injects the current Firebase ID token automatically:
```typescript
apiClient.interceptors.request.use(async (config) => {
  const token = await firebaseUser.getIdToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### 8.2 WebSocket Connection
```typescript
import { io } from 'socket.io-client';
export const connectSocket = (token: string) => {
  return io(process.env.EXPO_PUBLIC_API_URL, {
    auth: { token },
    transports: ['websocket'],
  });
};
```

### 8.3 Offline Queue
Items are enqueued when requests fail due to connectivity, saved to `SecureStore`, and retried in chronological sequence upon internet reconnection.

---

## Section 9: Migration Plan

1.  **Cleanup**: Delete dead folders (`DevRoleSwitchScreen.tsx`, `HomeScreen.tsx`, duplicate themes, and local mocks).
2.  **Reorganize Structure**: Set up folder branches under `src/`.
3.  **Context Migration**: Move authentication, task, and geofence contexts to `src/context/`.
4.  **TypeScript Cleanups**: Rename `.jsx` and `.js` file extensions to `.tsx`/`.ts`.
5.  **Per-role Navigators Split**: Extract role screens away from the main navigator into nested branch stacks.

### Rename Mapping (Partial)

| Current Location | Target Location |
| --- | --- |
| `app/screens/WelcomeScreen.tsx` | `src/screens/auth/WelcomeScreen.tsx` |
| `app/screens/PhoneAuthScreen.tsx` | `src/screens/auth/PhoneAuthScreen.tsx` |
| `app/screens/RoleEntryScreen.tsx` | `src/screens/auth/RoleSelectionScreen.tsx` |
| `app/screens/ProfileSetup.tsx` | `src/screens/auth/ProfileSetupScreen.tsx` |
| `app/screens/PatientRoleScreen.tsx` | `src/screens/patient/PatientHomeScreen.tsx` |
| `app/screens/PatientDetailScreen.tsx` | `src/screens/caregiver/CaregiverPatientDetailScreen.tsx` |
| `app/screens/CaregiverPatientsScreen.tsx`| `src/screens/caregiver/CaregiverTriageScreen.tsx` |
| `app/screens/FamilyDashboardScreen.tsx` | `src/screens/family/FamilyFeedScreen.tsx` |
| `app/screens/GeofenceMapScreen.tsx` | `src/screens/caregiver/CaregiverPatientMapScreen.tsx` |

---

## Section 10: Types

### api.types.ts
```typescript
export type User = {
  id: string;
  phone: string;
  name: string;
  date_of_birth?: string;
  gender?: string;
  preferred_language: string;
  city?: string;
  photo_url?: string;
  role: UserRoleType;
};

export type Task = {
  id: string;
  patient_id: string;
  title: string;
  patient_hint?: string;
  steps: { order: number; text: string }[];
  emoji?: string;
  voice_note_url?: string;
  scheduled_time: string;
  scheduled_date: string;
  duration_minutes: number;
  is_critical: boolean;
  status: TaskStatus;
  completed_at?: string;
};
```

### enums.ts
```typescript
export type UserRoleType = 'PATIENT' | 'CAREGIVER' | 'FAMILY' | 'DOCTOR';
export type TaskStatus = 'PENDING' | 'DONE' | 'MISSED' | 'UNSURE' | 'SKIPPED';
export type SafetyState = 'SAFE' | 'APPROACHING' | 'BREACH' | 'CRITICAL';
export type LocationState = 'MOVING' | 'STATIONARY_KNOWN' | 'STATIONARY_UNKNOWN' | 'NO_SIGNAL';
export type RoutineState = 'ON_TRACK' | 'BEHIND' | 'MISSED_CRITICAL' | 'ALL_DONE';
export type EngagementState = 'ACTIVE' | 'IDLE' | 'NO_INTERACTION';
```

---

## Appendix: Metrics Summary

*   **Total Screens in V1**: 37 (5 Auth, 8 Patient, 15 Caregiver, 6 Family, 3 Doctor).
*   **Total Components**: 48 (6 Shared, 8 Patient, 10 Caregiver, 4 Family, 4 Form, 6 Games, 10 Activities).
