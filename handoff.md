# SureStep — Project Handoff Document
> Last updated: 2026-05-22 · Working directory: `c:\dev\SureStep`

---

## 1. Project Goal

**SureStep** is a dementia-care coordination platform for India. It connects four types of users in a single mobile application:

| Role | Who they are | What they do |
|---|---|---|
| **Patient** | Person with dementia | Follows daily routines, plays cognitive games, receives orientation prompts |
| **Caregiver** | Professional caregiver / nurse | Monitors patient state, manages routines, tracks geofence, responds to alerts |
| **Family** | Family members | Receives peace-of-mind updates, views stories, watches location, sends voice messages |
| **Doctor** | Medical professional | Reads cognitive trend reports, reviews game session data, assesses decline |

**Tech Stack:**
- **Frontend:** React Native (Expo) — TypeScript
- **Backend:** Node.js + Express + TypeScript + PostgreSQL  
  ⚠️ **Backend is a separate repository.** No backend code lives here. The frontend consumes REST API endpoints and Socket.IO events from the Express backend.
- **Auth:** Clerk (replacing legacy custom OTP/JWT system)
- **Real-time:** Socket.IO (caregiver/family location + alert feed) — replacing legacy Supabase realtime
- **Previous DB (deprecated):** Supabase — all direct Supabase client calls are being removed; data flows through the Express API instead.

**The overall goal** is to complete full Clerk authentication, protect all backend routes, wire the frontend to the Express API, and build the complete feature set defined in `docs/surestep-frontend-tdd.js`.

---

## 2. Current Project Status

### ✅ Completed
| Area | Notes |
|---|---|
| `AI_GUIDE.md` | Defines all AI collaboration and pedagogy rules — read first |
| **Frontend TDD structural migration** | 121 files created in `src/` — canonical source of truth |
| `src/AppShell.tsx` | Root provider wrapper with correct provider hierarchy |
| `src/navigation/` — 6 navigators | RoleNavigator, AuthNavigator, PatientNavigator, CaregiverNavigator, FamilyNavigator, DoctorNavigator |
| `src/context/` — 10 contexts | AuthContext, TaskContext, PatientStateContext, GeofenceContext, CaregiverContext + 5 stubs |
| `src/services/` — 15 services | apiClient, socketClient, authService, taskService, relationshipService + 10 others |
| `src/types/` — 3 type files | enums.ts, api.types.ts, navigation.types.ts |
| `src/theme/` — 4 files | colors.ts, fonts.ts, tokens.ts, ThemeContext.tsx |
| `src/screens/` — 40 screens | 22 migrated + 18 new stubs |
| `src/components/` | shared/, forms/, caregiver/ (ConcentricRings, Sparkline, dashboard tabs) |
| `CaregiverDashboardScreen` split | 77 KB monolith → HomeTab, AlertsTab, ManageTab, dashboardStyles |
| `src/games/` + `src/activities/` | 5 games + 10 activities migrated |
| `src/hooks/` — 8 hooks | useAuth, useTasks, usePatientState, useGeofence, useCaregiver, useAlerts, useVoice, useCognition |
| `src/utils/` | offlineQueue, geofenceUtils, dateUtils, buildDashboardModel |
| `App.tsx` entry point | Imports `src/AppShell` as the new root |
| **Caregiver relationship layer** | `relationshipService.ts`, `CaregiverContext.tsx`, `useCaregiver.ts`, `CaregiverProvider` mounted in AppShell |
| **TypeScript compilation — `src/` CLEAN** | `npx tsc --noEmit` → **0 errors in `src/`** ✅ |

### ⏳ Pending — Not Yet Done
| Area | Blocker |
|---|---|
| `npx expo start` boot verification | Not yet run after fixing imports |
| Clerk frontend SDK | Not integrated — `PhoneAuthScreen` still uses mock OTP `0000` |
| SecureStore token persistence | In-memory fallback only; `expo-secure-store` not yet wired |
| API calls end-to-end | Services have correct signatures but not tested against live backend |
| Socket.IO real-time | `socketClient.ts` ready; backend Socket.IO server setup is a separate repo concern |
| Stub screens (18 screens) | Render "Coming soon" placeholder — no real data yet |
| `app/` tree cleanup | Preserved as rollback safety net — delete after `expo start` confirms clean boot |
| `packages/` cleanup | Old monorepo remnants — delete after boot confirmed |
| Database `clerk_id` migration | Backend concern: `users` table needs `clerk_id TEXT UNIQUE` column |

---

## 3. Working Directory Tree Structure

```
c:\dev\SureStep\                          ← project root
│
├── App.tsx                               ← entry point → imports src/AppShell
├── app.json                              ← Expo config
├── package.json
├── tsconfig.json
├── AI_GUIDE.md                           ← AI collaboration rules (READ FIRST)
├── handoff.md                            ← this file
├── task.md                               ← compilation fix checklist
├── project-spec.md
├── docs/
│   └── surestep-frontend-tdd.js          ← master TDD spec (Word doc generator)
│
├── src/                                  ← NEW canonical source of truth (121 files)
│   ├── AppShell.tsx                      ← root provider wrapper
│   │
│   ├── navigation/
│   │   ├── RoleNavigator.tsx             ← auth-status routing (5 states)
│   │   ├── AuthNavigator.tsx
│   │   ├── PatientNavigator.tsx
│   │   ├── CaregiverNavigator.tsx
│   │   ├── FamilyNavigator.tsx
│   │   └── DoctorNavigator.tsx
│   │
│   ├── screens/
│   │   ├── auth/                         ← 5 screens
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── PhoneAuthScreen.tsx       ← mock OTP; awaiting Clerk replacement
│   │   │   ├── RoleSelectionScreen.tsx
│   │   │   ├── ProfileSetupScreen.tsx    ← 2-step form (roles: CAREGIVER / PATIENT etc)
│   │   │   └── InviteAcceptScreen.tsx    ← STUB
│   │   ├── patient/                      ← 11 screens
│   │   │   ├── PatientHomeScreen.tsx
│   │   │   ├── PatientGamesScreen.tsx
│   │   │   ├── PatientActivitiesScreen.tsx
│   │   │   ├── PatientWorkoutScreen.tsx
│   │   │   ├── PatientRelaxingScreen.tsx
│   │   │   ├── PatientSettingsScreen.tsx
│   │   │   ├── PatientAiScreen.tsx
│   │   │   ├── PatientStoriesScreen.tsx  ← STUB
│   │   │   ├── ActivityDetailScreen.tsx
│   │   │   ├── ActivityPlayScreen.tsx
│   │   │   └── ActivityReportsScreen.tsx
│   │   ├── caregiver/                    ← 15 screens
│   │   │   ├── CaregiverTriageScreen.tsx
│   │   │   ├── CaregiverPatientDetailScreen.tsx
│   │   │   ├── CaregiverPatientMapScreen.tsx  ← geofence map; caregiverPhone via useAuth()
│   │   │   ├── CaregiverPatientRoutinesScreen.tsx
│   │   │   ├── CaregiverRoutineEditorScreen.tsx
│   │   │   ├── CaregiverGeofenceEditorScreen.tsx
│   │   │   ├── CaregiverProfileEditScreen.tsx
│   │   │   └── 8 × STUB screens
│   │   ├── family/                       ← 6 screens
│   │   │   ├── FamilyFeedScreen.tsx      ← live safety card + mini-map + routine progress
│   │   │   └── 5 × STUB screens
│   │   └── doctor/                       ← 3 screens
│   │       ├── DoctorPatientListScreen.tsx
│   │       └── 2 × STUB screens
│   │
│   ├── components/
│   │   ├── shared/          ← ScreenContainer, AiAssistantFab
│   │   ├── forms/           ← TextInputField, PhoneInputField, DropdownPicker, ProfileForm
│   │   └── caregiver/
│   │       ├── ConcentricRings.tsx
│   │       ├── Sparkline.tsx
│   │       └── dashboard/   ← DashboardHomeTab, DashboardAlertsTab, DashboardManageTab, dashboardStyles
│   │
│   ├── context/
│   │   ├── AuthContext.tsx          ← 5-state machine: loading → unauthenticated → no_role → no_profile → authenticated
│   │   ├── TaskContext.tsx          ← Express API + offline queue
│   │   ├── PatientStateContext.tsx
│   │   ├── GeofenceContext.tsx
│   │   ├── CaregiverContext.tsx     ← patient-caregiver link state
│   │   └── 5 × STUB contexts       ← VoiceContext, CognitionContext, AlertContext, FamiliarityContext, NotificationContext
│   │
│   ├── hooks/               ← useAuth, useTasks, usePatientState, useGeofence, useCaregiver, useAlerts, useVoice, useCognition
│   │
│   ├── services/
│   │   ├── apiClient.ts             ← Axios + JWT interceptor + 401 refresh rotation
│   │   ├── socketClient.ts          ← Socket.IO factory with graceful fallback
│   │   ├── relationshipService.ts   ← caregiver-patient link API calls
│   │   └── 12 other services        ← auth, task, location, alert, voice, story, cognition, report, appointment, message, medication, user
│   │
│   ├── types/
│   │   ├── enums.ts                 ← 30+ backend ENUMs mirrored
│   │   ├── api.types.ts             ← User, Task, PatientState, Alert, VoiceMessage…
│   │   └── navigation.types.ts      ← typed route params for all 5 stacks
│   │
│   ├── theme/               ← colors, fonts, tokens, ThemeContext
│   ├── games/               ← 6 cognitive games
│   ├── activities/          ← relaxing/ (5) + workout/ (5) + activityData.ts
│   └── utils/               ← offlineQueue, geofenceUtils, dateUtils, buildDashboardModel
│
├── app/                     ← OLD BACKUP (rollback safety — do NOT delete yet)
│   ├── assets/icons/        ← STILL ACTIVE: NavIcons.tsx, ActivitiesIllustration.tsx
│   └── utils/geofence.ts    ← STILL ACTIVE: geofenceUtils re-exports from here
│
└── packages/                ← OLD monorepo remnants (delete after boot confirmed)
```

---

## 4. Session History

### Session 1 — Frontend TDD Migration
- Created `AI_GUIDE.md` (pedagogy contract)
- Read and analysed `docs/surestep-frontend-tdd.js` (1,249 lines)
- Executed 14 migration phases → **121 files** created in `src/`
- Split 77 KB `CaregiverDashboardScreen.tsx` monolith into 4 focused files
- Updated `App.tsx` to mount `src/AppShell` as the entry point

### Session 2 — TypeScript Compilation Pass
- Built the **Caregiver relationship layer**: `relationshipService.ts`, `CaregiverContext.tsx`, `useCaregiver.ts`
- Mounted `CaregiverProvider` inside `src/AppShell.tsx`
- **Round 1 fixes** — resolved compilation errors in:
  - `AuthNavigator.tsx` (named → default import)
  - `CaregiverTriageScreen.tsx` (imports, params, navigation)
  - `DoctorPatientListScreen.tsx` (component name, imports, params)
  - `FamilyFeedScreen.tsx` (imports, route params cast, Supabase → Socket.IO)
- **Round 2 fixes** — resolved remaining 5 error files:
  - `PhoneAuthScreen.tsx` — fixed `login()` 3-arg signature, `AuthUser.phone`/`.name`, route name `'RoleSelectionScreen'`
  - `ProfileSetupScreen.tsx` — replaced all 6 lowercase `'caregiver'` role checks with `'CAREGIVER'`
  - `CaregiverPatientMapScreen.tsx` — renamed export from `GeofenceMapScreen`, sourced `caregiverPhone` from `useAuth()`, guarded `patientName ?? ''`
  - `FamilyFeedScreen.tsx` — cast `route.params` to typed partial record
- **Verification:** `npx tsc --noEmit | Where-Object { $_ -match "^src/" }` → **empty output = 0 errors in `src/`** ✅

---

## 5. What Needs to Be Done Next

### Priority 1 — Boot Verification
```
npx expo start
```
Watch the Metro bundler output for import resolution errors. Most likely remaining issues:
- `app/assets/icons/NavIcons.tsx` still referenced by navigators inside `src/` — may need to move to `src/assets/`
- Any other stale `../app/...` import paths that tsc doesn't catch at compile time

### Priority 2 — Clerk Frontend Integration
This is the primary pending feature. Steps to implement (teach concept before code):

1. Install the SDK: `npx expo install @clerk/clerk-expo expo-secure-store`
2. Wrap `AppShell.tsx` with `<ClerkProvider publishableKey={...}>` (outermost provider)
3. Replace the mock OTP flow in `PhoneAuthScreen.tsx`:
   - Use `useSignIn()` from `@clerk/clerk-expo` to trigger Clerk phone verification
   - Replace the static `0000` check with real Clerk `attemptFirstFactor({ strategy: 'phone_code', code })`
4. Wire `apiClient.ts` Axios interceptor to attach the Clerk session token as `Authorization: Bearer <jwt>` on every request

### Priority 3 — App Boot Assets
Move `app/assets/icons/` → `src/assets/icons/` and update all navigator imports so the old `app/` folder can be safely deleted.

### Priority 4 — Wire Live API Calls
Once backend is live:
1. `TaskContext` — wire `GET /tasks/patient/:id/today`
2. `CaregiverContext` — wire `GET /relationships/caregiver/confirmed?patientPhone=...`
3. Test the full caregiver-creates-routine → patient-sees-it flow

### Priority 5 — Stub Screen Implementations (in user value order)
1. `CaregiverAlertFeedScreen` — unified alert feed
2. `CaregiverCalendarScreen`
3. `FamilyAlertsScreen`
4. `PatientStoriesScreen`
5. `DoctorCognitiveReportScreen`

### Priority 6 — Old Tree Cleanup
After `npx expo start` boots cleanly:
- Move `app/assets/` → `src/assets/`
- Delete `app/screens/`, `app/context/`, `app/navigation/`, `app/components/`, `app/patient/`, `app/theme/`
- Delete `packages/core/`, `packages/ui/`

---

## 6. Methods Tried So Far

### Migration Strategy
- **Phase-by-phase execution** driven by a written implementation plan
- **Copy-first, delete-later** — originals preserved in `app/` for rollback safety
- **PowerShell batch scripts** for bulk file operations (22 screen copies, 17 stubs, 12 service files in one pass)
- **Monolith splitting** — 77 KB `CaregiverDashboardScreen` split into orchestrator + 3 tab components + 1 styles file

### TypeScript Fix Strategy
- **Incremental file-by-file refactoring** — trace each compiler error, fix root cause, re-run
- **Context-first pattern** — extracted all API calls into dedicated service files (e.g. `relationshipService.ts`) rather than fetching inside components
- **Enum alignment** — replaced all legacy lowercase string comparisons (`'caregiver'`) with uppercase `UserRoleType` enum values (`'CAREGIVER'`)
- **Auth-context sourcing** — props that don't belong in navigation params (e.g. `caregiverPhone`) are sourced from `useAuth()` instead

### Architecture Decisions
- **5-state AuthContext**: `loading → unauthenticated → no_role → no_profile → authenticated` maps directly to `RoleNavigator` routing
- **Role-scoped context mounting**: `TaskContext`, `PatientStateContext` mounted inside role navigators (not globally) — enforces data isolation
- **Offline queue**: `offlineQueue.ts` enqueues failed API calls, flushes on reconnect, discards after 24 h
- **Backend separation**: No backend code lives in this repo. All data flows through `apiClient.ts` to the Express API.

---

## 7. What Was Planned Next (Before This Handoff)

1. Run `npx expo start` and capture the Metro bundler output
2. Fix any asset import errors (most likely `NavIcons.tsx` path)
3. Move `app/assets/` → `src/assets/` and update all imports
4. Begin Clerk frontend integration as a teaching moment:
   - Explain the Clerk React Native SDK architecture
   - Walk through `ClerkProvider` → `useSignIn` → `attemptFirstFactor` step by step
   - Then implement together

---

## 8. Key Files for Any New AI Agent

| File | Why |
|---|---|
| `c:\dev\SureStep\AI_GUIDE.md` | **Mandatory** — defines all collaboration rules and teaching methodology |
| `c:\dev\SureStep\src\AppShell.tsx` | Provider hierarchy — understand the app root |
| `c:\dev\SureStep\src\navigation\RoleNavigator.tsx` | Auth-state routing logic (5 states) |
| `c:\dev\SureStep\src\context\AuthContext.tsx` | Auth state machine — 5 statuses, `login()` signature |
| `c:\dev\SureStep\src\services\apiClient.ts` | All HTTP calls go through here — JWT interceptor lives here |
| `c:\dev\SureStep\src\types\enums.ts` | All backend ENUMs — reference before adding any new field |
| `c:\dev\SureStep\src\types\navigation.types.ts` | All route params — check before any `navigation.navigate()` |
| `c:\dev\SureStep\docs\surestep-frontend-tdd.js` | Master specification |

> **IMPORTANT:** The user is learning backend development. Do NOT dump full implementations. Always explain concept → architecture → code, one step at a time. See `AI_GUIDE.md` for full rules.

> **WARNING:** The `app/` tree is intentionally preserved as a rollback safety net. Do NOT delete it until `npx expo start` confirms zero broken imports from `src/`. To roll back: change `App.tsx` import from `./src/AppShell` back to `./app/App`.
