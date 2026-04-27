# project-spec.md

## Product Idea

SureStep is a cross-platform mobile application designed to support dementia patients and their caregivers in the intervals between clinical consultations. The system stabilizes patient daily routines through guided reminders and activity tracking, while providing caregivers with structured behavioral awareness and alert mechanisms. Target users are two distinct groups: dementia patients (cognitive decline, elderly) requiring low-friction interfaces, and their caregivers (family members, professional care workers) who manage routines and respond to safety signals.

---

## Core Features

### Caregiver-Side
- Create, edit, and assign patient daily routines and activity schedules
- Receive notifications for missed or incomplete patient activities
- Monitor behavioral pattern reports and routine adherence summaries
- Manage appointment scheduling and reminders for the patient
- Configure escalation contacts for emergency situations
- View real-time GPS location and geofence breach alerts
- Access low-battery alerts for patient device
- Generate structured behavioral reports for clinical handoff
- Provide recorded voice messages for patient orientation
- Grant read-only portal access to clinical staff

### Patient-Side
- Receive scheduled activity reminders and step-by-step routine guidance
- Mark activities as completed or skipped
- Receive medication and appointment reminders
- Access cognitive and therapeutic games
- Complete simple cognitive self-assessments with result logging
- Write and review personal journal entries
- View a family tree visualization for orientation support
- Initiate calls via photo-based contact interface
- Receive geofence boundary alerts
- Access guided exercise and calming therapeutic experiences

---

## Tech Stack

- **Frontend:** React Native (single cross-platform app with role-based interfaces for patient, caregiver, and doctor)
- **Backend:** Python / FastAPI
- **Database:** PostgreSQL
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Infrastructure:** Docker, cloud-hosted (AWS or equivalent)
- **Version Control:** GitHub (feature-branch workflow)
- **AI Layer (Phase 3 only):** Internal model or third-party API for behavioral analysis — deferred

---

## System Architecture

### Frontend

**Framework:** React Native (single app with role-based interfaces)

**Patient Mode — Key Screens/Components:**
- `DailyRoutineScreen` — displays current activity queue with completion controls
- `MedicationReminderScreen` — timed medication prompts
- `AppointmentScreen` — upcoming appointment display
- `CognitiveGamesScreen` — embedded game modules
- `SelfAssessmentScreen` — short cognitive check with result submission
- `JournalScreen` — simple text entry and review
- `FamilyTreeScreen` — visual orientation aid
- `QuickDialScreen` — photo-contact call launcher
- `CalmingScreen` — therapeutic media display

**Caregiver Mode — Key Screens/Components:**
- `DashboardScreen` — activity adherence summary and active alerts
- `RoutineManagerScreen` — create/edit/delete patient activity schedules
- `ReportsScreen` — behavioral trend summaries and exportable logs
- `AppointmentManagerScreen` — schedule and edit clinical appointments
- `LocationScreen` — live GPS map with geofence configuration
- `AlertCenterScreen` — aggregated notifications (missed activity, geofence, low battery)
- `EscalationContactsScreen` — secondary emergency contact management
- `VoiceMessageScreen` — record and send orientation audio messages
- `DoctorPortalScreen` — manage read-only access credentials for clinicians
- `BehavioralQuestionnaireScreen` — structured change-detection form

---

### Backend

**Framework:** FastAPI (Python 3.11+)

**API Structure:**
```
/auth
  POST /register
  POST /login
  POST /refresh
  POST /logout

/users
  GET    /me
  PATCH  /me

/patients
  GET    /:id
  PATCH  /:id

/routines
  GET    /
  POST   /
  PATCH  /:id
  DELETE /:id

/activities
  GET    /
  POST   /
  PATCH  /:id/complete
  PATCH  /:id/skip

/events
  GET    /                  # activity log history
  POST   /                  # log patient activity event

/appointments
  GET    /
  POST   /
  PATCH  /:id
  DELETE /:id

/reports
  GET    /summary
  GET    /export            # generate PDF or CSV report

/alerts
  GET    /
  POST   /                  # trigger alert (missed activity, geofence, battery)
  PATCH  /:id/acknowledge

/location
  POST   /update            # patient device location push
  GET    /latest

/questionnaires
  GET    /
  POST   /submit

/voice-messages
  POST   /upload
  GET    /                  # list messages for patient

/assessments
  POST   /submit
  GET    /history
```

**Services:**
- `AuthService` — JWT-based authentication, refresh token rotation
- `RoutineService` — activity schedule creation, update, and assignment
- `EventService` — activity completion/skip event logging and retrieval
- `AlertService` — rule-based alert generation (missed activity, geofence, low battery)
- `NotificationService` — FCM integration for push delivery
- `LocationService` — GPS ingestion and geofence evaluation
- `ReportService` — aggregation of event logs into structured behavioral summaries
- `AssessmentService` — cognitive test result ingestion and storage
- `VoiceMessageService` — audio file storage reference and retrieval

**Authentication:**
- JWT access tokens (short-lived) + refresh tokens (long-lived, stored server-side)
- Role-based access control: `PATIENT`, `CAREGIVER`, `DOCTOR` (read-only)
- Caregiver–patient linkage enforced at service layer on all data access

---

### Database

**Engine:** PostgreSQL 15+

**Core Tables:**

| Table | Description |
|---|---|
| `users` | Shared identity table for all roles (id, email, hashed_password, role, created_at) |
| `patients` | Extended patient profile (user_id FK, name, dob, cognitive_stage, timezone) |
| `caregivers` | Extended caregiver profile (user_id FK, name, phone) |
| `caregiver_patient_links` | Many-to-many: caregiver ↔ patient with link_type (primary, secondary) |
| `routines` | Named routine templates (id, patient_id FK, name, created_by FK, active) |
| `activities` | Scheduled activity instances (id, routine_id FK, title, type, scheduled_time, recurrence_rule) |
| `activity_events` | Log of patient interactions (id, activity_id FK, patient_id FK, status [completed/skipped/missed], timestamp) |
| `appointments` | Clinical appointments (id, patient_id FK, title, datetime, location, reminder_offset_minutes) |
| `alerts` | System-generated alerts (id, patient_id FK, type, payload_json, acknowledged, created_at) |
| `locations` | Patient GPS pings (id, patient_id FK, latitude, longitude, accuracy, recorded_at) |
| `geofences` | Defined safe zones (id, patient_id FK, label, center_lat, center_lng, radius_meters, active) |
| `questionnaire_submissions` | Caregiver-submitted behavioral check entries (id, caregiver_id FK, patient_id FK, payload_json, submitted_at) |
| `cognitive_assessments` | Patient self-assessment results (id, patient_id FK, assessment_type, score, payload_json, completed_at) |
| `journal_entries` | Patient journal records (id, patient_id FK, body_text, created_at) |
| `voice_messages` | Orientation audio references (id, caregiver_id FK, patient_id FK, storage_url, duration_seconds, created_at) |
| `doctor_access_tokens` | Read-only portal tokens for clinicians (id, patient_id FK, token_hash, expires_at, revoked) |
| `refresh_tokens` | Server-side JWT refresh token store (id, user_id FK, token_hash, expires_at, revoked) |

**Indexes:** Foreign keys, `activity_events(patient_id, timestamp)`, `locations(patient_id, recorded_at)`, `alerts(patient_id, acknowledged)`

---

### External Services

| Service | Purpose |
|---|---|
| Firebase Cloud Messaging (FCM) | Push notifications to patient and caregiver devices |
| Cloud Object Storage (S3 or equivalent) | Voice message audio file storage |
| Mapping/Geolocation SDK (device-native or Google Maps SDK) | GPS display and geofence evaluation on caregiver app |
| AI/ML API (Phase 3 only, TBD) | Behavioral pattern analysis, adaptive reminder timing |

---

## Constraints

- Patient interface must be operable by individuals with moderate cognitive decline; minimal navigation depth, large touch targets, no ambiguous iconography
- System must not present itself or function as a diagnostic or clinical tool
- All patient data must be access-controlled; caregivers can only access their linked patients
- Doctor portal access must be token-based, revocable, and read-only
- Push notifications must be reliable; FCM delivery failures should be logged for retry
- Location data must be stored with configurable retention limits; raw GPS history should not be retained indefinitely
- Application must support offline-tolerant operation on the patient device; activity events should queue locally and sync on reconnect
- Initial deployment targets small user volume; architecture must support horizontal scaling without structural changes
- No vendor lock-in on core data layer; PostgreSQL chosen over managed proprietary databases
- AI integration is deferred to Phase 3; no ML dependencies in Phase 1 or Phase 2 codebase
- Repository must maintain strict branch separation: `feature/*` → `develop` → `main`
- Separate deployable units for the mobile app and the backend service
