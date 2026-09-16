# SureStep — Frontend Component Map

> This document lists every React component and context file in the frontend,
> and shows which components are rendered inside which parent.

---

## 🌳 The Render Tree (Top to Bottom)

```
App.tsx (root/App.tsx)
└── AppShell  (app/App.tsx)
    ├── GestureHandlerRootView          ← Enables swipe gestures app-wide
    ├── AuthProvider                    ← Provides auth state (logged in / logged out)
    │   └── ThemeProvider              ← Provides light/dark theme to all children
    │       └── UserProfileProvider    ← Provides current user's profile data
    │           └── TaskProvider       ← Provides routine/task data
    │               └── CaregiverProvider  ← Provides caregiver-specific state
    │                   └── SafeAreaProvider
    │                       └── ThemedNavigation (internal component)
    │                           └── NavigationContainer
    │                               └── RoleNavigator
```

---

## 🧭 Navigation Layer

### [`App.tsx`](file:///c:/dev/SureStep/App.tsx) ← Root Entry Point
The very first file Expo loads. It renders nothing itself.
- **Renders:** `AppShell` (which is `app/App.tsx`)

---

### [`app/App.tsx`](file:///c:/dev/SureStep/app/App.tsx) ← App Shell
Wraps the entire app in all the global Providers and the Navigation container.
- **Renders:**
  - `GestureHandlerRootView`
  - `AuthProvider`
  - `ThemeProvider`
  - `UserProfileProvider`
  - `TaskProvider`
  - `CaregiverProvider`
  - `SafeAreaProvider`
  - `ThemedNavigation` (internal component defined in the same file)
    - `NavigationContainer`
    - `RoleNavigator`

---

### [`app/navigation/RoleNavigator.tsx`](file:///c:/dev/SureStep/app/navigation/RoleNavigator.tsx) ← The Traffic Director
Reads the auth state and profile state, then decides which Navigator (and which first screen) to show.

| Condition | What It Renders |
|---|---|
| User is NOT logged in | `RootNavigator` starting at `Welcome` screen |
| User is a `DOCTOR` | `DoctorNavigator` |
| User is `NEW_USER` (no role yet) | `RootNavigator` starting at `RoleEntry` screen |
| Profile is still loading | `ProfileLoadingNavigator` → `ProfileLoadingScreen` |
| User has no profile set up yet | `RootNavigator` starting at `ProfileSetup` screen |
| User is a `PATIENT` | `RootNavigator` starting at `PatientDashboard` screen |
| User is a `CAREGIVER` | `RootNavigator` starting at `CaregiverPatients` screen |

---

### [`app/navigation/RootNavigator.tsx`](file:///c:/dev/SureStep/app/navigation/RootNavigator.tsx) ← The Main Stack
Defines a single Native Stack containing ALL the screens in the app. The `RoleNavigator` tells it which screen to start on.

**All screens registered in this stack:**

| Route Name | Component File |
|---|---|
| `Welcome` | `WelcomeScreen.tsx` |
| `PhoneAuth` | `PhoneAuthScreen.tsx` |
| `RoleEntry` | `RoleEntryScreen.tsx` |
| `Home` | `HomeScreen.tsx` |
| `Details` | `DetailsScreen.tsx` |
| `CaregiverPatients` | `CaregiverPatientsScreen.tsx` |
| `CaregiverDashboard` | `CaregiverDashboardScreen.tsx` |
| `CaregiverManage` | `CaregiverManageScreen.tsx` |
| `PatientDashboard` | `PatientRoleScreen.tsx` |
| `PatientFamily` | `PatientFamilyScreen.tsx` |
| `PatientFamilyProfile` | `PatientFamilyProfileScreen.tsx` |
| `PatientActivities` | `PatientActivitiesScreen.tsx` |
| `PatientGames` | `PatientGamesScreen.tsx` |
| `PatientWorkout` | `PatientWorkoutScreen.tsx` |
| `PatientRelaxing` | `PatientRelaxingScreen.tsx` |
| `AskAi` | `AskAiScreen.tsx` |
| `ActivityDetail` | `ActivityDetailScreen.tsx` |
| `ActivityPlay` | `ActivityPlayScreen.tsx` |
| `ActivityReports` | `ActivityReportsScreen.tsx` |
| `Settings` | `MoreScreen.tsx` |
| `ProfileSetup` | `ProfileSetup.tsx` |
| `ProfileView` | `ProfileView.jsx` |
| `ProfileEdit` | `ProfileEdit.jsx` |
| `PatientDetail` | `PatientDetailScreen.tsx` |
| `RoutineManager` | `RoutineManagerScreen.tsx` |
| `RoutineEditor` | `RoutineEditorScreen.tsx` |
| `GeofenceMap` | `GeofenceMapScreen.tsx` |
| `GeofenceEditor` | `GeofenceEditorScreen.tsx` |
| `FamilyDashboard` | `FamilyDashboardScreen.tsx` |
| `CaregiverProfileEdit` | `CaregiverProfileEditScreen.tsx` |

---

### [`app/navigation/DoctorNavigator.tsx`](file:///c:/dev/SureStep/app/navigation/DoctorNavigator.tsx) ← Doctor-only Stack
A separate stack just for the Doctor role.
- **Renders:** `DoctorRoleScreen`

---

## 📱 Screens (`app/screens/`)

### Auth & Onboarding
| File | What It Shows |
|---|---|
| [`WelcomeScreen.tsx`](file:///c:/dev/SureStep/app/screens/WelcomeScreen.tsx) | The first splash/welcome screen |
| [`PhoneAuthScreen.tsx`](file:///c:/dev/SureStep/app/screens/PhoneAuthScreen.tsx) | Phone number + OTP login screen |
| [`RoleEntryScreen.tsx`](file:///c:/dev/SureStep/app/screens/RoleEntryScreen.tsx) | Screen for new users to pick their role (PATIENT / CAREGIVER / FAMILY) |
| [`ProfileSetup.tsx`](file:///c:/dev/SureStep/app/screens/ProfileSetup.tsx) | Multi-step profile creation wizard |
| [`ProfileLoadingScreen.tsx`](file:///c:/dev/SureStep/app/screens/ProfileLoadingScreen.tsx) | Spinner shown while profile data is being fetched |

### Profile
| File | What It Shows |
|---|---|
| [`ProfileView.jsx`](file:///c:/dev/SureStep/app/screens/ProfileView.jsx) | Read-only view of a user's profile |
| [`ProfileEdit.jsx`](file:///c:/dev/SureStep/app/screens/ProfileEdit.jsx) | Editable form for updating user profile |

### Caregiver Screens
| File | What It Shows |
|---|---|
| [`CaregiverPatientsScreen.tsx`](file:///c:/dev/SureStep/app/screens/CaregiverPatientsScreen.tsx) | Caregiver's main screen — list of all their patients |
| [`CaregiverDashboardScreen.tsx`](file:///c:/dev/SureStep/app/screens/CaregiverDashboardScreen.tsx) | Detailed dashboard for a single patient |
| [`CaregiverManageScreen.tsx`](file:///c:/dev/SureStep/app/screens/CaregiverManageScreen.tsx) | Manage tasks/routines for a specific patient |
| [`CaregiverProfileEditScreen.tsx`](file:///c:/dev/SureStep/app/screens/CaregiverProfileEditScreen.tsx) | Professional profile editing (bio, rates, experience) |
| [`CaregiverDetailView.tsx`](file:///c:/dev/SureStep/app/screens/CaregiverDetailView.tsx) | Detail view of a caregiver's public profile |
| [`CaregiverSearchView.tsx`](file:///c:/dev/SureStep/app/screens/CaregiverSearchView.tsx) | Search and discover caregivers |

### Patient Screens
| File | What It Shows |
|---|---|
| [`PatientRoleScreen.tsx`](file:///c:/dev/SureStep/app/screens/PatientRoleScreen.tsx) | Patient's main dashboard (registered as `PatientDashboard` route) |
| [`PatientDetailScreen.tsx`](file:///c:/dev/SureStep/app/screens/PatientDetailScreen.tsx) | Detailed view of a patient record (viewed by caregiver) |
| [`PatientFamilyScreen.tsx`](file:///c:/dev/SureStep/app/screens/PatientFamilyScreen.tsx) | Patient's view of their connected family members |
| [`PatientFamilyProfileScreen.tsx`](file:///c:/dev/SureStep/app/screens/PatientFamilyProfileScreen.tsx) | Detail view of a single family member's profile |
| [`PatientActivitiesScreen.tsx`](file:///c:/dev/SureStep/app/screens/PatientActivitiesScreen.tsx) | List of therapeutic activities for the patient |
| [`PatientGamesScreen.tsx`](file:///c:/dev/SureStep/app/screens/PatientGamesScreen.tsx) | Cognitive games hub |
| [`PatientWorkoutScreen.tsx`](file:///c:/dev/SureStep/app/screens/PatientWorkoutScreen.tsx) | Physical exercise activities |
| [`PatientRelaxingScreen.tsx`](file:///c:/dev/SureStep/app/screens/PatientRelaxingScreen.tsx) | Relaxation and mindfulness activities |

### Activity Screens
| File | What It Shows |
|---|---|
| [`ActivityDetailScreen.tsx`](file:///c:/dev/SureStep/app/screens/ActivityDetailScreen.tsx) | Info page for a specific activity |
| [`ActivityPlayScreen.tsx`](file:///c:/dev/SureStep/app/screens/ActivityPlayScreen.tsx) | The active playing/doing screen for an activity |
| [`ActivityReportsScreen.tsx`](file:///c:/dev/SureStep/app/screens/ActivityReportsScreen.tsx) | Summary of completed activities |

### Routine Screens
| File | What It Shows |
|---|---|
| [`RoutineManagerScreen.tsx`](file:///c:/dev/SureStep/app/screens/RoutineManagerScreen.tsx) | Caregiver's list of routines for a patient |
| [`RoutineEditorScreen.tsx`](file:///c:/dev/SureStep/app/screens/RoutineEditorScreen.tsx) | Create or edit a routine |

### Geofence Screens
| File | What It Shows |
|---|---|
| [`GeofenceMapScreen.tsx`](file:///c:/dev/SureStep/app/screens/GeofenceMapScreen.tsx) | Map view showing patient's location and safety zones |
| [`GeofenceEditorScreen.tsx`](file:///c:/dev/SureStep/app/screens/GeofenceEditorScreen.tsx) | Draw and configure a new geofence zone |

### Other Screens
| File | What It Shows |
|---|---|
| [`FamilyDashboardScreen.tsx`](file:///c:/dev/SureStep/app/screens/FamilyDashboardScreen.tsx) | Family member's simplified safety overview of a patient |
| [`AskAiScreen.tsx`](file:///c:/dev/SureStep/app/screens/AskAiScreen.tsx) | AI chat assistant screen |
| [`MoreScreen.tsx`](file:///c:/dev/SureStep/app/screens/MoreScreen.tsx) | Settings / More screen |
| [`HomeScreen.tsx`](file:///c:/dev/SureStep/app/screens/HomeScreen.tsx) | Generic home placeholder screen |
| [`DetailsScreen.tsx`](file:///c:/dev/SureStep/app/screens/DetailsScreen.tsx) | Generic details placeholder screen |
| [`DoctorRoleScreen.tsx`](file:///c:/dev/SureStep/app/screens/DoctorRoleScreen.tsx) | Placeholder screen for the Doctor role |
| [`DevRoleSwitchScreen.tsx`](file:///c:/dev/SureStep/app/screens/DevRoleSwitchScreen.tsx) | Dev-only screen to switch roles without re-logging in |

---

## 🧩 Reusable Components (`app/components/`)

| File | What It Does |
|---|---|
| [`AiFab.tsx`](file:///c:/dev/SureStep/app/components/AiFab.tsx) | The floating "Ask AI" button that appears on multiple screens |
| [`ProfileForm.tsx`](file:///c:/dev/SureStep/app/components/ProfileForm.tsx) | Reusable profile form fields used in `ProfileSetup` and `ProfileEdit` |
| [`ScreenContainer.tsx`](file:///c:/dev/SureStep/app/components/ScreenContainer.tsx) | A wrapper that adds consistent padding/safe area to a screen |

### Input Components (`app/components/inputs/`)
| File | What It Does |
|---|---|
| [`TextInputField.jsx`](file:///c:/dev/SureStep/app/components/inputs/TextInputField.jsx) | Styled text input used in forms |
| [`PhoneInputField.jsx`](file:///c:/dev/SureStep/app/components/inputs/PhoneInputField.jsx) | Phone number input with country code support |
| [`DropdownPicker.jsx`](file:///c:/dev/SureStep/app/components/inputs/DropdownPicker.jsx) | Styled dropdown selector for forms |

---

## 🎮 Patient Activity Components (`app/patient/`)

### Games (`app/patient/games/`)
Rendered inside `PatientGamesScreen.tsx`

| File | What Game It Runs |
|---|---|
| [`MemoryMatchGame.tsx`](file:///c:/dev/SureStep/app/patient/games/MemoryMatchGame.tsx) | Card flipping memory match game |
| [`WordFinderGame.tsx`](file:///c:/dev/SureStep/app/patient/games/WordFinderGame.tsx) | Word search / finder game |
| [`ColorSortGame.tsx`](file:///c:/dev/SureStep/app/patient/games/ColorSortGame.tsx) | Color sorting cognitive game |
| [`SoundRecallGame.tsx`](file:///c:/dev/SureStep/app/patient/games/SoundRecallGame.tsx) | Audio memory recall game |
| [`PicturePuzzleGame.tsx`](file:///c:/dev/SureStep/app/patient/games/PicturePuzzleGame.tsx) | Picture-based puzzle game |

### Relaxing Activities (`app/patient/relaxing/`)
Rendered inside `PatientRelaxingScreen.tsx`

| File | What Activity It Runs |
|---|---|
| [`MusicListenActivity.tsx`](file:///c:/dev/SureStep/app/patient/relaxing/MusicListenActivity.tsx) | Guided music listening session |
| [`GratitudeActivity.tsx`](file:///c:/dev/SureStep/app/patient/relaxing/GratitudeActivity.tsx) | Gratitude reflection activity |
| [`NatureSoundsActivity.tsx`](file:///c:/dev/SureStep/app/patient/relaxing/NatureSoundsActivity.tsx) | Nature soundscape activity |
| [`GentleStretchActivity.tsx`](file:///c:/dev/SureStep/app/patient/relaxing/GentleStretchActivity.tsx) | Gentle guided stretching |
| [`HandMassageActivity.tsx`](file:///c:/dev/SureStep/app/patient/relaxing/HandMassageActivity.tsx) | Hand massage guidance activity |

### Exercise Components (`app/patient/exercises/`)
Rendered inside `PatientWorkoutScreen.tsx`

| File | What Exercise It Shows |
|---|---|
| [`ChairMarchExercise.tsx`](file:///c:/dev/SureStep/app/patient/exercises/ChairMarchExercise.tsx) | Seated chair marching exercise |
| [`DeepBreathingExercise.tsx`](file:///c:/dev/SureStep/app/patient/exercises/DeepBreathingExercise.tsx) | Guided deep breathing |
| [`ArmCirclesExercise.tsx`](file:///c:/dev/SureStep/app/patient/exercises/ArmCirclesExercise.tsx) | Arm circles exercise |
| [`HeelRaisesExercise.tsx`](file:///c:/dev/SureStep/app/patient/exercises/HeelRaisesExercise.tsx) | Heel raise exercise |
| [`NeckRollsExercise.tsx`](file:///c:/dev/SureStep/app/patient/exercises/NeckRollsExercise.tsx) | Neck rolls exercise |

### Patient Dashboard Widgets (`app/screens/patientDetail/`)
These are specialized components used inside `PatientDetailScreen.tsx`

| File | What It Shows |
|---|---|
| [`ConcentricRings.tsx`](file:///c:/dev/SureStep/app/screens/patientDetail/ConcentricRings.tsx) | Animated concentric ring visualization (e.g., adherence indicator) |
| [`Sparkline.tsx`](file:///c:/dev/SureStep/app/screens/patientDetail/Sparkline.tsx) | Small inline trend chart |
| [`buildDashboardModel.ts`](file:///c:/dev/SureStep/app/screens/patientDetail/buildDashboardModel.ts) | Data-shaping utility (not a component — converts raw data into dashboard display format) |

---

## 🌐 Context Providers (`app/context/`)

These are NOT screens. They are invisible data providers that wrap the whole app and share data to any component that needs it.

| File | What Data It Provides |
|---|---|
| [`userProfileContext.js`](file:///c:/dev/SureStep/app/context/userProfileContext.js) | The current logged-in user's profile, loading state, `hasProfileForRouting` flag |
| [`taskContext.ts`](file:///c:/dev/SureStep/app/context/taskContext.ts) | All routine tasks, CRUD functions for creating/updating/deleting tasks |
| [`caregiverContext.ts`](file:///c:/dev/SureStep/app/context/caregiverContext.ts) | Caregiver-specific data (linked patients, caregiver state) |
| [`geofenceContext.tsx`](file:///c:/dev/SureStep/app/context/geofenceContext.tsx) | Geofence zones and location state for the map screens |

---

## 📦 Shared Packages (`packages/`)

These are internal shared packages used across the app.

### `packages/core/auth/`
| File | What It Does |
|---|---|
| [`AuthContext.tsx`](file:///c:/dev/SureStep/packages/core/auth/AuthContext.tsx) | The core auth state provider. Exposes `auth.status`, `auth.user`, and login/logout functions via `useAuth()` hook |

### `packages/ui/theme/`
| File | What It Does |
|---|---|
| [`ThemeProvider.tsx`](file:///c:/dev/SureStep/packages/ui/theme/ThemeProvider.tsx) | Provides the current theme (light/dark) and `useTheme()` hook to all components |
| [`tokens.ts`](file:///c:/dev/SureStep/packages/ui/theme/tokens.ts) | Defines the raw design tokens (base colors, spacing values) |

### `app/theme/`
| File | What It Does |
|---|---|
| `colors.ts` | Exports the `C` object — the app's full color palette used everywhere |
| `fonts.ts` | Exports `useInterFonts()` hook — loads the Inter font family before the app renders |

---

## 🗂️ Data Files (Not Components)

| File | What It Contains |
|---|---|
| [`app/patient/activityData.ts`](file:///c:/dev/SureStep/app/patient/activityData.ts) | Static definitions of all available therapeutic activities |
| [`app/patient/gameProps.ts`](file:///c:/dev/SureStep/app/patient/gameProps.ts) | Static config/props definitions for each game |
| [`app/patient/mockState.ts`](file:///c:/dev/SureStep/app/patient/mockState.ts) | Mock/seed data used for UI testing and development |
