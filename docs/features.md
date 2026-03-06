## Features

This document translates the system architecture into concrete product features for a **single cross‑platform mobile app**. The app adapts its interface and capabilities based on the signed‑in user’s role (`PATIENT`, `CAREGIVER`, `DOCTOR`).

---

### Frontend Features

#### Core App and Roles
- **Single cross‑platform mobile app**
  - Runs on iOS and Android from one React Native codebase.
  - Role‑aware UI that adapts navigation and available screens after login.
- **Role‑based interface modes**
  - Patient mode with simplified, low‑friction flows.
  - Caregiver mode with configuration, monitoring, and reporting tools.
  - Doctor (read‑only) mode accessed via secure token links or credentials.

#### Patient‑Facing Features
- **Daily routine dashboard**
  - Today’s activities list with clear “complete” / “skip” actions.
  - Current and upcoming tasks shown with time, icon, and brief instructions.
- **Guided activity flows**
  - Step‑by‑step guidance for complex activities (e.g., getting dressed, meals).
  - Visual and textual cues with large touch targets.
- **Medication reminders**
  - Scheduled reminders with name, dosage, and simple confirmation.
  - Overdue reminder indicators until acknowledged.
- **Appointment reminders**
  - List of upcoming appointments with date, time, and location.
  - Reminder notifications and simple “got it” acknowledgements.
- **Cognitive and therapeutic games access**
  - Launcher screen for simple in‑app or embedded games.
  - Basic progress or streak indicators (optional).
- **Self‑assessment checks**
  - Short, guided self‑assessment flows (e.g., mood, orientation).
  - Clear question prompts with touch‑friendly answer choices.
- **Journal**
  - Simple text journaling interface.
  - Timeline view to revisit prior entries.
- **Family tree visualization**
  - Visual family tree with photos and names.
  - Tap on a person for short descriptive labels (e.g., “your daughter”).
- **Photo‑based quick dial**
  - Grid of contact photos for one‑tap calling.
  - Optionally grouped into “favorites” for faster access.
- **Calming and therapeutic experiences**
  - Access to calming audio/video or breathing guidance.
  - Full‑screen, distraction‑free views.
- **Geofence boundary alerts**
  - On‑device prompts when approaching or leaving a safe zone.
- **Offline‑tolerant usage**
  - Routine and appointment data cached locally.
  - Activity completions, skips, assessments, and journal entries queued offline and synced later.

#### Caregiver‑Facing Features
- **Multi‑patient dashboard**
  - Overview of linked patients with adherence indicators and recent alerts.
  - Quick access to any patient’s detail view.
- **Routine and activity management**
  - Create, edit, and assign daily/weekly routines per patient.
  - Configure activities (title, type, time, recurrence).
  - Activate/deactivate routines as needs change.
- **Appointment management**
  - Create and edit appointments for patients.
  - Set reminder offsets (e.g., 30 minutes, 1 day before).
- **Alert center**
  - List of alerts (missed activities, geofence breaches, low battery).
  - Filters by patient, alert type, and status.
  - Acknowledge and clear alerts.
- **Location and geofence management**
  - Map view of each patient’s last known location.
  - Create and adjust geofences (safe zones) on the map.
  - Toggle geofence activation.
- **Behavior and adherence reports**
  - Visual summaries of activity completion vs. missed/skipped over time.
  - Highlighted trends and recent changes.
  - Export triggers for clinical handoff (PDF/CSV via backend).
- **Behavioral questionnaires**
  - Guided caregiver questionnaires about patient behavior changes.
  - History view of past submissions.
- **Voice orientation messages**
  - Record and upload voice messages for patient orientation.
  - Manage the list of active messages for each patient.
- **Doctor access management**
  - Generate read‑only access tokens/links for clinicians.
  - View active tokens (expiration, status).
  - Revoke existing tokens.

#### Doctor‑Facing Features (Read‑Only)
- **Patient overview**
  - View selected patient’s profile and context.
- **Behavior and adherence reports**
  - Access structured summaries and report exports.
- **Historical data views**
  - Read‑only access to recent events, alerts, and questionnaire submissions.

#### Cross‑Cutting Frontend Features
- **Secure authentication UX**
  - Login, logout, and session expiration handling.
  - Role selection only where appropriate (e.g., when one account has multiple roles).
- **Notifications UX**
  - Handling in‑app banners and push notification taps with deep links.
- **Accessibility and usability**
  - Large fonts and buttons in patient mode.
  - High‑contrast color themes.
  - Consistent iconography and wording throughout the app.

---

### Backend Features

#### Authentication and Authorization
- **User registration and login**
  - Create caregiver and patient accounts (with appropriate flows).
  - Email/password authentication.
- **JWT‑based session management**
  - Short‑lived access tokens attached to API requests.
  - Secure refresh token rotation via server‑side `refresh_tokens`.
- **Role‑based access control**
  - Enforce `PATIENT`, `CAREGIVER`, `DOCTOR` roles on endpoints.
  - Ensure caregivers only access linked patient data.
  - Doctor tokens provide read‑only access to selected patient data.

#### Patient and Caregiver Management
- **User and profile storage**
  - Persist user profiles, roles, and basic contact data.
- **Caregiver–patient linking**
  - Link caregivers to one or more patients with link types (primary, secondary).
  - Use these links for access control and dashboard scoping.

#### Routines, Activities, and Events
- **Routine and schedule management APIs**
  - CRUD for routines and associated activities.
  - Recurrence rules and scheduled times persisted server‑side.
- **Activity execution logging**
  - Endpoints to mark activities as completed or skipped.
  - Logging of `activity_events` for analytics and history.
- **Offline event ingestion**
  - Accept batched event submissions from devices that were offline.

#### Appointments and Reminders
- **Appointment management APIs**
  - Create, update, and delete patient appointments.
  - Store reminder offsets and metadata for notification orchestration.

#### Alerts and Notifications
- **Alert generation**
  - Create alerts for:
    - Missed or significantly late activities.
    - Geofence breaches.
    - Low battery and other device‑reported issues.
- **Alert lifecycle**
  - Persist, query, and acknowledge alerts.
  - Track created and acknowledged timestamps.
- **Push notification orchestration**
  - Manage device tokens for each user.
  - Trigger push notifications (via FCM) for relevant alerts and reminders.

#### Location and Geofencing
- **Location ingestion**
  - Accept frequent GPS updates from patient devices.
  - Store recent locations per patient.
- **Geofence evaluation**
  - Compare incoming locations against defined geofences.
  - Trigger alerts and notifications when boundaries are crossed.
- **Location history access**
  - Provide recent path or last known location for caregiver dashboards.

#### Assessments, Questionnaires, and Journaling
- **Caregiver questionnaires**
  - Store structured or semi‑structured behavioral questionnaires.
  - Provide query APIs for history and reporting.
- **Patient self‑assessments**
  - Accept assessment submissions with type, score, and payload.
  - Provide historical views for trend analysis.
- **Journal storage**
  - Store and retrieve patient journal entries chronologically.

#### Voice Messages
- **Voice message metadata management**
  - Store references to orientation audio files (URLs, durations).
  - Associate messages with caregiver and patient.
- **Access control**
  - Ensure only linked caregivers manage messages; patients can only play their own messages.

#### Reporting and Exports
- **Behavioral and adherence summaries**
  - Aggregate events, alerts, assessments, and routines into summary metrics.
  - Provide time‑windowed summaries for dashboards.
- **Report generation**
  - Produce exportable artifacts (PDF/CSV) for clinicians.

#### Doctor Access
- **Doctor token lifecycle**
  - Create, list, and revoke doctor access tokens.
  - Validate tokens on read‑only requests.

---

### Infrastructure Features

- **Containerized deployment**
  - Backend packaged as a Docker image.
  - Environment‑specific configuration via environment variables.
- **Scalable web service**
  - Deployed behind a load balancer (e.g., on AWS or similar).
  - Horizontal scaling without changing the application architecture.
- **Managed PostgreSQL database**
  - Cloud‑hosted PostgreSQL instance with backups and basic monitoring.
- **Push notification infrastructure**
  - Firebase Cloud Messaging integration for iOS and Android.
  - Secure management of FCM credentials.
- **Object storage for media**
  - S3‑compatible storage for voice message audio files.
  - Use of secure, time‑limited URLs for uploads and downloads.
- **Configuration and secrets management**
  - Separation of environment configurations (dev, staging, prod).
  - Secure storage for secrets (DB credentials, FCM keys, storage keys).
- **Logging and monitoring**
  - Centralized logging from the backend service.
  - Basic health checks and uptime monitoring.
- **Data retention and cleanup jobs**
  - Scheduled jobs to prune old location data and, optionally, aged alerts.
  - Migration tooling for safe schema evolution.
- **CI/CD friendly setup**
  - Repository structured for automated builds, tests, and deployments using a feature‑branch workflow.

