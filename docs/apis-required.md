## APIs Required

### Overview

The backend exposes a REST API consumed by a single mobile app (with patient, caregiver, and doctor roles), plus a simple doctor portal. Endpoints are grouped by resource, follow predictable patterns, and favor clarity over extreme optimization.

All authenticated endpoints require a JWT access token; doctor portal endpoints use a separate token from `doctor_access_tokens`.

### Auth

- `POST /auth/register`
  - Register new user (primarily caregivers in production; patient records usually created by caregivers).
- `POST /auth/login`
  - Returns access and refresh tokens.
- `POST /auth/refresh`
  - Exchanges a valid refresh token for a new access token.
- `POST /auth/logout`
  - Revokes the refresh token.

### Users and Profiles

- `GET /users/me`
  - Returns current user profile and role.
- `PATCH /users/me`
  - Update basic profile fields (e.g., name, phone).

- `GET /patients/:id`
  - Returns patient profile, allowed for:
    - The patient themselves.
    - Linked caregivers.
    - Doctors with valid portal token (read-only).
- `PATCH /patients/:id`
  - Update patient-specific fields; only caregivers with appropriate permissions.

### Routines and Activities

- `GET /routines`
  - List routines for the current user’s patient context (or all linked patients for caregivers with optional filter).
- `POST /routines`
  - Create a routine for a patient.
- `PATCH /routines/:id`
  - Update name, active flag, or associated schedule details.
- `DELETE /routines/:id`
  - Soft-delete or deactivate routine.

- `GET /activities`
  - List upcoming activities for the current patient (patient role) or for a given patient (caregiver role).
- `POST /activities`
  - Create or update scheduled activity instances for a routine.
- `PATCH /activities/:id/complete`
  - Mark an activity as completed (typically from the mobile app in patient role).
- `PATCH /activities/:id/skip`
  - Mark an activity as skipped.

### Events (Activity Log)

- `GET /events`
  - Returns paginated activity event history filtered by patient, date range, and status.
- `POST /events`
  - Allows the client (mobile app in patient role) to log events directly, including offline-synced batches.

### Appointments

- `GET /appointments`
  - List appointments for a patient within a date range.
- `POST /appointments`
  - Create a new appointment.
- `PATCH /appointments/:id`
  - Update appointment details.
- `DELETE /appointments/:id`
  - Cancel an appointment.

### Reports

- `GET /reports/summary`
  - Returns high-level behavioral and adherence summaries for a patient (time range filters).
- `GET /reports/export`
  - Generates exportable report (PDF or CSV) with activity and alert summaries for clinical handoff.

### Alerts

- `GET /alerts`
  - Returns active and historical alerts for patients linked to caregiver.
- `POST /alerts`
  - Internal or system-triggered creation of alert records (missed activity, geofence, battery).
- `PATCH /alerts/:id/acknowledge`
  - Marks alert as acknowledged by caregiver.

### Location and Geofencing

- `POST /location/update`
  - Mobile app (patient role) posts current GPS location.
- `GET /location/latest`
  - Mobile app (caregiver role) fetches most recent location for a patient.

- `GET /geofences`
  - List geofences for a patient.
- `POST /geofences`
  - Create a new geofence.
- `PATCH /geofences/:id`
  - Update geofence properties.
- `DELETE /geofences/:id`
  - Deactivate/remove geofence.

### Questionnaires and Assessments

- `GET /questionnaires`
  - Returns available caregiver questionnaires and metadata.
- `POST /questionnaires/submit`
  - Caregiver submits a behavioral questionnaire for a patient.

- `POST /assessments/submit`
  - Patient submits self-assessment results.
- `GET /assessments/history`
  - Returns history of assessments for a patient.

### Journal and Voice Messages

- `GET /journal`
  - List patient journal entries (patient or linked caregiver).
- `POST /journal`
  - Create a new journal entry.

- `POST /voice-messages/upload`
  - Mobile app (caregiver role) uploads orientation audio, returns `storage_url`.
- `GET /voice-messages`
  - Mobile app (patient role) lists voice messages available to play.

### Doctor Portal

- `POST /doctor-access/tokens`
  - Caregiver creates a new read-only doctor access token for a patient.
- `GET /doctor-access/tokens`
  - List existing tokens and their statuses.
- `PATCH /doctor-access/tokens/:id/revoke`
  - Revoke a doctor token.

- Doctor-facing endpoints reuse existing `/patients`, `/events`, `/reports`, etc., but authenticated via doctor token with read-only permissions.

