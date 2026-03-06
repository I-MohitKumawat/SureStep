## Development Tasks by Feature

Each task is sized to be **< 4 hours**, touch a **minimal set of files**, and be **as independent as possible**. File paths are indicative and may be adjusted to the actual code layout.

---

## Frontend Features

### Core App and Roles

- **Feature: Single cross-platform mobile app shell**
  - Task FE-APP-001: Set up React Native project with TypeScript and basic folder structure (`/app`, `/app/screens`, `/app/components`).
  - Task FE-APP-002: Configure React Navigation root navigator with placeholder stacks/tabs.
  - Task FE-APP-003: Implement global theming (light/dark + typography, spacing tokens in `/packages/ui`).

- **Feature: Role-based interface modes**
  - Task FE-ROLE-001: Define role types (`PATIENT`, `CAREGIVER`, `DOCTOR`) and auth context (`/packages/core/auth/AuthContext.tsx`).
  - Task FE-ROLE-002: Implement role-aware navigation flow (switch navigator by role after login).
  - Task FE-ROLE-003: Add simple role switch dev screen (for local testing only, hidden in production builds).

### Patient-Facing Features

- **Feature: Daily routine dashboard**
  - Task FE-PAT-ROUTINE-001: Create `DailyRoutineScreen` UI layout with mocked data.
  - Task FE-PAT-ROUTINE-002: Wire `DailyRoutineScreen` to `GET /activities` via `useActivities` hook.
  - Task FE-PAT-ROUTINE-003: Implement complete/skip buttons and optimistic UI updates.

- **Feature: Guided activity flows**
  - Task FE-PAT-GUIDE-001: Create `ActivityDetailScreen` with step-by-step layout using mocked activity steps.
  - Task FE-PAT-GUIDE-002: Add navigation from `DailyRoutineScreen` to `ActivityDetailScreen`.
  - Task FE-PAT-GUIDE-003: Persist completion/skip from detail view via `PATCH /activities/:id/complete|skip`.

- **Feature: Medication reminders**
  - Task FE-PAT-MED-001: Create `MedicationReminderScreen` with list of medication activities.
  - Task FE-PAT-MED-002: Add client-side mapping from activity type to medication display (pill icons, dosage labels).
  - Task FE-PAT-MED-003: Implement notification deep-link handling into `MedicationReminderScreen`.

- **Feature: Appointment reminders**
  - Task FE-PAT-APPT-001: Implement `AppointmentScreen` listing upcoming appointments (`GET /appointments`).
  - Task FE-PAT-APPT-002: Add appointment detail bottom sheet/modal with location and notes.
  - Task FE-PAT-APPT-003: Handle appointment reminder notification deep-link navigation.

- **Feature: Cognitive and therapeutic games access**
  - Task FE-PAT-GAME-001: Implement `CognitiveGamesScreen` with grid of game tiles using static config.
  - Task FE-PAT-GAME-002: Integrate one simple in-app game module (e.g., memory match) behind a tile.
  - Task FE-PAT-GAME-003: Add lightweight tracking event when a game session starts/ends (local for now).

- **Feature: Self-assessment checks**
  - Task FE-PAT-SELF-001: Create `SelfAssessmentScreen` with simple multi-step question UI.
  - Task FE-PAT-SELF-002: Connect submission flow to `POST /assessments/submit`.
  - Task FE-PAT-SELF-003: Add success/confirmation screen and basic error handling.

- **Feature: Journal**
  - Task FE-PAT-JOURNAL-001: Implement `JournalScreen` list view for existing entries (`GET /journal`).
  - Task FE-PAT-JOURNAL-002: Implement new entry composer UI and submit to `POST /journal`.
  - Task FE-PAT-JOURNAL-003: Add optimistic insertion and local-only draft state handling.

- **Feature: Family tree visualization**
  - Task FE-PAT-FAMILY-001: Implement `FamilyTreeScreen` layout with simple tree or list-with-groups visualization.
  - Task FE-PAT-FAMILY-002: Create patient-side read-only data model and mock data for initial build.
  - Task FE-PAT-FAMILY-003: Add tap interaction to show a short description overlay for each person.

- **Feature: Photo-based quick dial**
  - Task FE-PAT-DIAL-001: Implement `QuickDialScreen` grid UI with photo tiles and contact names.
  - Task FE-PAT-DIAL-002: Wire tiles to OS-level phone dialer using platform APIs.
  - Task FE-PAT-DIAL-003: Add simple configuration screen (caregiver-only) to manage quick dial contacts (local mock first).

- **Feature: Calming and therapeutic experiences**
  - Task FE-PAT-CALM-001: Implement `CalmingScreen` with list of calming experiences (audio, video, breathing).
  - Task FE-PAT-CALM-002: Integrate one audio-based calming experience with play/pause controls.
  - Task FE-PAT-CALM-003: Add “quick access” entry point from the main patient home screen.

- **Feature: Geofence boundary alerts (patient-view)**
  - Task FE-PAT-GEOFENCE-001: Implement simple in-app banner/alert component for boundary warnings.
  - Task FE-PAT-GEOFENCE-002: Handle push/deep-link from geofence alerts into a reassurance/“call caregiver” view.

- **Feature: Offline-tolerant usage**
  - Task FE-PAT-OFFLINE-001: Implement local storage module for caching routines/appointments (`/packages/core/storage`).
  - Task FE-PAT-OFFLINE-002: Implement offline queue for activity events, journal entries, and assessments.
  - Task FE-PAT-OFFLINE-003: Implement background sync trigger on network reconnect.

### Caregiver-Facing Features

- **Feature: Multi-patient dashboard**
  - Task FE-CG-DASH-001: Implement `CaregiverDashboardScreen` listing linked patients with basic status indicators.
  - Task FE-CG-DASH-002: Fetch patient summary tiles from a `GET /reports/summary`-like endpoint.
  - Task FE-CG-DASH-003: Implement navigation from patient tile to patient detail screen.

- **Feature: Routine and activity management**
  - Task FE-CG-ROUTINE-001: Implement `RoutineManagerScreen` listing routines for a selected patient.
  - Task FE-CG-ROUTINE-002: Implement routine creation/edit form UI.
  - Task FE-CG-ROUTINE-003: Wire routine CRUD to `/routines` endpoints.
  - Task FE-CG-ROUTINE-004: Implement activity list editor within a routine, wired to `/activities`.

- **Feature: Appointment management**
  - Task FE-CG-APPT-001: Implement caregiver-facing `AppointmentManagerScreen` with calendar/list toggle.
  - Task FE-CG-APPT-002: Implement create/edit appointment form wired to `/appointments`.
  - Task FE-CG-APPT-003: Add basic validation and success/error toasts.

- **Feature: Alert center**
  - Task FE-CG-ALERT-001: Implement `AlertCenterScreen` list UI with filters for type, patient, status.
  - Task FE-CG-ALERT-002: Connect to `GET /alerts` with pagination.
  - Task FE-CG-ALERT-003: Implement acknowledge action wired to `PATCH /alerts/:id/acknowledge`.

- **Feature: Location and geofence management**
  - Task FE-CG-LOC-001: Implement `LocationScreen` with map view and last known patient location.
  - Task FE-CG-LOC-002: Connect to `GET /location/latest` to fetch coordinates.
  - Task FE-CG-LOC-003: Implement basic geofence list UI (`GET /geofences`).
  - Task FE-CG-LOC-004: Implement create/edit geofence form wired to `/geofences`.

- **Feature: Behavior and adherence reports**
  - Task FE-CG-REPORT-001: Implement `ReportsScreen` with time-range selector and summary cards.
  - Task FE-CG-REPORT-002: Connect to `GET /reports/summary`.
  - Task FE-CG-REPORT-003: Implement “Export report” button that triggers `GET /reports/export` and handles download/share.

- **Feature: Behavioral questionnaires**
  - Task FE-CG-QUEST-001: Implement `BehavioralQuestionnaireScreen` that loads available questionnaires from `GET /questionnaires`.
  - Task FE-CG-QUEST-002: Implement dynamic question rendering UI (single/multi-choice, scale).
  - Task FE-CG-QUEST-003: Wire submission to `POST /questionnaires/submit` with success state.

- **Feature: Voice orientation messages**
  - Task FE-CG-VOICE-001: Implement `VoiceMessageScreen` list UI for messages per patient.
  - Task FE-CG-VOICE-002: Implement record-and-upload flow using native audio APIs and `POST /voice-messages/upload`.
  - Task FE-CG-VOICE-003: Implement message enable/disable or ordering controls (client-side first).

- **Feature: Doctor access management**
  - Task FE-CG-DOCTOR-001: Implement `DoctorPortalScreen` managing doctor access tokens for a patient.
  - Task FE-CG-DOCTOR-002: Wire token create/list/revoke actions to `/doctor-access/tokens` endpoints.
  - Task FE-CG-DOCTOR-003: Implement quick copy/share of doctor access links.

### Doctor-Facing Features

- **Feature: Doctor read-only views**
  - Task FE-DR-OVERVIEW-001: Implement doctor-mode entry flow using doctor token.
  - Task FE-DR-OVERVIEW-002: Implement read-only patient overview screen re-using existing patient detail components.
  - Task FE-DR-OVERVIEW-003: Implement read-only reports view re-using `ReportsScreen` in view-only mode.

### Cross-Cutting Frontend Features

- **Feature: Secure authentication UX**
  - Task FE-AUTH-001: Implement login screen UI and validation.
  - Task FE-AUTH-002: Wire login to `/auth/login` and store access token in memory + secure storage where appropriate.
  - Task FE-AUTH-003: Implement logout flow clearing auth state and navigating to login.

- **Feature: Notifications UX**
  - Task FE-NOTIF-001: Integrate FCM client-side and obtain device token.
  - Task FE-NOTIF-002: Implement push registration call to backend on login.
  - Task FE-NOTIF-003: Implement push handlers that route to the correct screen via deep links.

- **Feature: Accessibility and usability**
  - Task FE-A11Y-001: Implement global font scaling controls and test in patient mode.
  - Task FE-A11Y-002: Apply high-contrast theme variant and ensure key screens are legible.
  - Task FE-A11Y-003: Audit and standardize button sizes and spacing for patient mode.

---

## Backend Features

### Authentication and Authorization

- **Feature: User registration and login**
  - Task BE-AUTH-REG-001: Define `users` ORM model and Pydantic schemas.
  - Task BE-AUTH-REG-002: Implement `POST /auth/register` for caregiver accounts.
  - Task BE-AUTH-REG-003: Implement `POST /auth/login` with password verification and token issuance.

- **Feature: JWT-based session management**
  - Task BE-AUTH-JWT-001: Implement JWT utilities for access token creation/verification.
  - Task BE-AUTH-JWT-002: Define `refresh_tokens` model and repository.
  - Task BE-AUTH-JWT-003: Implement `POST /auth/refresh` and `POST /auth/logout`.

- **Feature: Role-based access control**
  - Task BE-AUTH-RBAC-001: Extend `users` model with `role` enum and migration.
  - Task BE-AUTH-RBAC-002: Implement FastAPI dependencies to enforce required roles on routes.
  - Task BE-AUTH-RBAC-003: Add caregiver–patient linkage checks in service layer for patient-specific data.

### Patient and Caregiver Management

- **Feature: User and profile storage**
  - Task BE-USER-001: Implement `patients` and `caregivers` ORM models and migrations.
  - Task BE-USER-002: Implement `GET /users/me` and `PATCH /users/me`.

- **Feature: Caregiver–patient linking**
  - Task BE-LINK-001: Implement `caregiver_patient_links` model and repository.
  - Task BE-LINK-002: Add service method to link/unlink caregivers and patients.
  - Task BE-LINK-003: Integrate linkage checks into `RoutineService`, `ReportService`, and related queries.

### Routines, Activities, and Events

- **Feature: Routine and schedule management APIs**
  - Task BE-ROUTINE-001: Implement `routines` and `activities` models and basic migrations.
  - Task BE-ROUTINE-002: Implement `RoutineService` with create/update/delete methods.
  - Task BE-ROUTINE-003: Implement `/routines` router endpoints with validation.

- **Feature: Activity execution logging**
  - Task BE-ACT-LOG-001: Implement `activity_events` model and migrations.
  - Task BE-ACT-LOG-002: Implement `EventService` to log completion/skip events.
  - Task BE-ACT-LOG-003: Implement `PATCH /activities/:id/complete` and `/skip` endpoints.

- **Feature: Offline event ingestion**
  - Task BE-ACT-BATCH-001: Extend `EventService` with batch insertion API.
  - Task BE-ACT-BATCH-002: Implement `POST /events` to accept batched events safely.

### Appointments and Reminders

- **Feature: Appointment management APIs**
  - Task BE-APPT-001: Implement `appointments` model and migrations.
  - Task BE-APPT-002: Implement `AppointmentService` with CRUD operations.
  - Task BE-APPT-003: Implement `/appointments` router endpoints.

### Alerts and Notifications

- **Feature: Alert generation**
  - Task BE-ALERT-001: Implement `alerts` model and migrations.
  - Task BE-ALERT-002: Implement `AlertService` rules for missed activities based on `activity_events`.
  - Task BE-ALERT-003: Implement basic low-battery alert ingestion from client payloads.

- **Feature: Alert lifecycle**
  - Task BE-ALERT-LIFE-001: Implement `GET /alerts` with filters.
  - Task BE-ALERT-LIFE-002: Implement `PATCH /alerts/:id/acknowledge`.

- **Feature: Push notification orchestration**
  - Task BE-NOTIF-001: Design and store device tokens per user (table and model).
  - Task BE-NOTIF-002: Implement `NotificationService` with FCM integration for simple messages.
  - Task BE-NOTIF-003: Wire alert generation to send notifications via `NotificationService`.

### Location and Geofencing

- **Feature: Location ingestion**
  - Task BE-LOC-001: Implement `locations` model and migrations.
  - Task BE-LOC-002: Implement `LocationService.record_location` and `POST /location/update`.

- **Feature: Geofence evaluation**
  - Task BE-GEOFENCE-001: Implement `geofences` model and migrations.
  - Task BE-GEOFENCE-002: Implement `LocationService.check_geofences` and basic distance calculations.
  - Task BE-GEOFENCE-003: Wire geofence violations to `AlertService` for alert creation.

- **Feature: Location history access**
  - Task BE-LOC-HIST-001: Implement `GET /location/latest`.
  - Task BE-LOC-HIST-002: Implement simple `GET /locations` history endpoint (optional).

### Assessments, Questionnaires, and Journaling

- **Feature: Caregiver questionnaires**
  - Task BE-QUEST-001: Implement `questionnaire_submissions` model and migrations.
  - Task BE-QUEST-002: Implement `AssessmentService` methods for caregiver questionnaires.
  - Task BE-QUEST-003: Implement `GET /questionnaires` and `POST /questionnaires/submit`.

- **Feature: Patient self-assessments**
  - Task BE-SELF-001: Implement `cognitive_assessments` model and migrations.
  - Task BE-SELF-002: Implement `AssessmentService` methods for self-assessments.
  - Task BE-SELF-003: Implement `POST /assessments/submit` and `GET /assessments/history`.

- **Feature: Journal storage**
  - Task BE-JOURNAL-001: Implement `journal_entries` model and migrations.
  - Task BE-JOURNAL-002: Implement `JournalService` for CRUD-like operations (append-only).
  - Task BE-JOURNAL-003: Implement `/journal` router endpoints.

### Voice Messages

- **Feature: Voice message metadata management**
  - Task BE-VOICE-001: Implement `voice_messages` model and migrations.
  - Task BE-VOICE-002: Implement `VoiceMessageService` for create/list operations.
  - Task BE-VOICE-003: Implement `/voice-messages` router endpoints.

### Reporting and Exports

- **Feature: Behavioral and adherence summaries**
  - Task BE-REPORT-001: Implement aggregation queries in `ReportService` for completion/missed trends.
  - Task BE-REPORT-002: Implement `GET /reports/summary`.

- **Feature: Report generation**
  - Task BE-REPORT-EXP-001: Implement simple CSV export generator for report data.
  - Task BE-REPORT-EXP-002: Add `GET /reports/export` endpoint with streaming download.

### Doctor Access

- **Feature: Doctor token lifecycle**
  - Task BE-DR-ACCESS-001: Implement `doctor_access_tokens` model and migrations.
  - Task BE-DR-ACCESS-002: Implement `DoctorAccessService` for create/list/revoke.
  - Task BE-DR-ACCESS-003: Implement `/doctor-access/tokens` router endpoints and token validation.

---

## Infrastructure Features

- **Feature: Containerized deployment**
  - Task INF-DOCKER-001: Create Dockerfile for backend service with multi-stage build.
  - Task INF-DOCKER-002: Create basic `docker-compose.yml` for local backend + Postgres.

- **Feature: Scalable web service**
  - Task INF-WEB-001: Add health check endpoint (`/health`) to backend.
  - Task INF-WEB-002: Document recommended load balancer configuration and health probes in `infra/README.md`.

- **Feature: Managed PostgreSQL database**
  - Task INF-DB-001: Configure database connection settings via environment variables.
  - Task INF-DB-002: Set up Alembic migrations with initial migration script.

- **Feature: Push notification infrastructure**
  - Task INF-NOTIF-001: Configure FCM credentials management (env vars/secrets) and document setup.

- **Feature: Object storage for media**
  - Task INF-STORAGE-001: Implement storage configuration for S3-compatible provider (endpoint, credentials).
  - Task INF-STORAGE-002: Implement helper to generate pre-signed URLs for voice message uploads/downloads.

- **Feature: Configuration and secrets management**
  - Task INF-CONFIG-001: Centralize config handling in `app/config.py` with environment-based settings.
  - Task INF-CONFIG-002: Document required environment variables in `docs/configuration.md`.

- **Feature: Logging and monitoring**
  - Task INF-LOG-001: Configure structured logging (JSON) for backend.
  - Task INF-LOG-002: Add basic request logging middleware.

- **Feature: Data retention and cleanup jobs**
  - Task INF-RET-001: Implement retention config for `locations` and `alerts`.
  - Task INF-RET-002: Implement scheduled cleanup job (e.g., CLI or cron-in-container) to prune old data.

- **Feature: CI/CD friendly setup**
  - Task INF-CI-001: Add basic GitHub Actions workflow (or equivalent) for lint + tests on PRs.
  - Task INF-CI-002: Add build-and-push container job for main branch (documentation only if registry not yet chosen).

