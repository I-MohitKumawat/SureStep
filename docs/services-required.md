## Services Required

### Overview

The backend uses a small set of focused services to keep business logic organized and testable. Each service encapsulates a coherent domain and exposes simple methods used by the API layer.

### Core Domain Services

- **AuthService**
  - Handles registration, login, logout.
  - Manages JWT access token creation and validation.
  - Manages refresh token lifecycle using the `refresh_tokens` table.

- **RoutineService**
  - CRUD operations for `routines` and associated `activities`.
  - Applies simple validation (e.g., scheduling rules, recurrence).
  - Ensures caregivers can modify only routines for linked patients.

- **EventService**
  - Records `activity_events` (completed, skipped, missed).
  - Supports batch ingestion for offline-synced events.
  - Exposes queries for event history used by reports and caregiver dashboards.

- **AlertService**
  - Creates `alerts` based on:
    - Missed activities (no completion within a grace period).
    - Geofence breaches (combining `locations` and `geofences`).
    - Low-battery or other device signals (from client).
  - Handles acknowledgement updates.

- **NotificationService**
  - Integrates with Firebase Cloud Messaging.
  - Given a user or patient and an alert/event, resolves device tokens and sends notifications.
  - Logs delivery attempts and errors for retries.

- **LocationService**
  - Ingests GPS updates from `location/update`.
  - Persists to `locations` and enforces retention policies.
  - Evaluates geofence rules and forwards violations to `AlertService`.

- **ReportService**
  - Aggregates `activity_events`, `alerts`, and relevant patient data into:
    - Summary views for dashboards.
    - Exportable reports (PDF/CSV) for clinical handoff.
  - Keeps logic for time-window queries and aggregation in one place.

- **AssessmentService**
  - Handles:
    - Caregiver `questionnaire_submissions`.
    - Patient `cognitive_assessments`.
  - Stores raw payloads and simple derived metrics (e.g., scores).
  - Provides history views per patient.

- **VoiceMessageService**
  - Manages `voice_messages` metadata and integration with object storage.
  - Generates pre-signed URLs or storage references for upload/download.

### Supporting Services

- **DoctorAccessService**
  - Manages `doctor_access_tokens` lifecycle (create, list, revoke).
  - Validates doctor token on read-only API calls.

- **UserService**
  - Handles general user profile updates and role-specific lookups (patients, caregivers).

### External Integrations

- **FCM Integration**
  - Minimal client wrapping Firebase APIs for sending notifications.
  - Abstracted so the rest of the code calls `NotificationService` without knowing about FCM details.

- **Object Storage Integration**
  - Simple wrapper for S3-compatible storage for voice messages.
  - Responsible for generating upload/download URLs and basic validation on allowed file types.

### Service Interaction Patterns

- API routers call one or more services per request, e.g.:
  - Completing an activity:
    - `EventService.log_completion(...)`
    - `AlertService.resolve_missed_alerts_for_activity(...)` (if applicable)
  - Handling location updates:
    - `LocationService.record_location(...)`
    - `LocationService.check_geofences(...)` → may call `AlertService` and `NotificationService`.

Services communicate synchronously within the same process; no distributed system or message bus is introduced initially to keep the system simple. A message queue can be added later if specific workflows require stronger decoupling.

