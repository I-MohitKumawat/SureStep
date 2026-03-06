## Database Design

### Overview

The system uses PostgreSQL 15+ as the primary data store. The schema is intentionally simple, with clear relationships and minimal denormalization.

- Single logical database for all environments (separate instances per env).
- Strong referential integrity with foreign keys.
- Timestamps and soft-delete only where needed (most data is append-only).

### Core Tables and Relationships

**Identity and Roles**
- `users`
  - Fields: `id`, `email`, `hashed_password`, `role`, `created_at`.
  - Roles: `PATIENT`, `CAREGIVER`, `DOCTOR`.
  - Indexes on `email` (unique) and `role`.

- `patients`
  - Fields: `id`, `user_id (FK users.id)`, `name`, `dob`, `cognitive_stage`, `timezone`, `created_at`.
  - One-to-one with `users` for patient role.

- `caregivers`
  - Fields: `id`, `user_id (FK users.id)`, `name`, `phone`, `created_at`.
  - One-to-one with `users` for caregiver role.

- `caregiver_patient_links`
  - Fields: `id`, `caregiver_id (FK caregivers.id)`, `patient_id (FK patients.id)`, `link_type`, `created_at`.
  - Many-to-many between caregivers and patients.
  - Indexes on `(caregiver_id, patient_id)` and `(patient_id, caregiver_id)`.

**Routines and Activities**
- `routines`
  - Fields: `id`, `patient_id (FK patients.id)`, `name`, `created_by (FK caregivers.id)`, `active`, `created_at`.
  - Represents a named routine template for a patient.

- `activities`
  - Fields: `id`, `routine_id (FK routines.id)`, `title`, `type`, `scheduled_time`, `recurrence_rule`, `metadata_json`, `created_at`.
  - Represents a scheduled activity instance or a recurring pattern.

- `activity_events`
  - Fields: `id`, `activity_id (FK activities.id)`, `patient_id (FK patients.id)`, `status`, `timestamp`, `payload_json`.
  - Append-only log of patient interactions (completed, skipped, missed).
  - Indexes: `(patient_id, timestamp)` and `(activity_id, timestamp)`.

**Appointments and Reminders**
- `appointments`
  - Fields: `id`, `patient_id (FK patients.id)`, `title`, `datetime`, `location`, `reminder_offset_minutes`, `created_at`.
  - Used to schedule and remind appointments.

**Alerts and Notifications**
- `alerts`
  - Fields: `id`, `patient_id (FK patients.id)`, `type`, `payload_json`, `acknowledged`, `created_at`, `acknowledged_at`.
  - Types include missed activity, geofence breach, low battery, etc.
  - Indexes: `(patient_id, acknowledged)`, `(patient_id, created_at)`.

**Location and Geofencing**
- `locations`
  - Fields: `id`, `patient_id (FK patients.id)`, `latitude`, `longitude`, `accuracy`, `recorded_at`.
  - Stores GPS pings with configurable retention.
  - Indexes: `(patient_id, recorded_at)`.

- `geofences`
  - Fields: `id`, `patient_id (FK patients.id)`, `label`, `center_lat`, `center_lng`, `radius_meters`, `active`, `created_at`.
  - Defines safe zones for geofence alerts.

**Assessments and Journaling**
- `questionnaire_submissions`
  - Fields: `id`, `caregiver_id (FK caregivers.id)`, `patient_id (FK patients.id)`, `payload_json`, `submitted_at`.
  - Captures behavioral questionnaire data.

- `cognitive_assessments`
  - Fields: `id`, `patient_id (FK patients.id)`, `assessment_type`, `score`, `payload_json`, `completed_at`.
  - Stores patient self-assessment outcomes.

- `journal_entries`
  - Fields: `id`, `patient_id (FK patients.id)`, `body_text`, `created_at`.
  - Simple append-only journal.

**Voice Messages and Doctor Access**
- `voice_messages`
  - Fields: `id`, `caregiver_id (FK caregivers.id)`, `patient_id (FK patients.id)`, `storage_url`, `duration_seconds`, `created_at`.
  - References audio files stored in object storage.

- `doctor_access_tokens`
  - Fields: `id`, `patient_id (FK patients.id)`, `token_hash`, `expires_at`, `revoked`, `created_at`.
  - Used for revocable, read-only portal access.

**Auth and Sessions**
- `refresh_tokens`
  - Fields: `id`, `user_id (FK users.id)`, `token_hash`, `expires_at`, `revoked`, `created_at`.
  - Stores server-side refresh state for JWT rotation.

### Indexing Strategy

To keep the design simple and performant:
- Primary keys on all tables use auto-increment or UUIDs.
- Foreign key columns are indexed.
- Time-series heavy tables (events, alerts, locations) have composite indexes:
  - `activity_events (patient_id, timestamp)`
  - `alerts (patient_id, acknowledged, created_at)`
  - `locations (patient_id, recorded_at)`
- Additional indexes only added when a clear query pattern emerges.

### Retention and Data Management

- Location history (`locations`) subject to configurable retention (e.g., 30–90 days), enforced with a periodic cleanup job.
- `alerts` can be archived or pruned after a configurable time, keeping only summaries in reports.
- Append-only tables (`activity_events`, `journal_entries`, `assessments`) are not edited in place; corrections are represented as new entries where needed.

### Migrations

- Use a migration tool (e.g., Alembic) with:
  - Simple, linear migration history per environment.
  - Clear naming (`YYYYMMDDHHMM_description`) to keep evolution understandable.
  - Strong preference for additive changes over destructive schema changes.

