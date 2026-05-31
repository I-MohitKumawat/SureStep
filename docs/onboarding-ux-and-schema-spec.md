# SureStep — Onboarding UX & Role Schema Specification

This document provides a unified specification combining the backend database schema requirements, database/code discrepancies, and onboarding UX flow designs for each user role (`PATIENT`, `CAREGIVER`, `FAMILY`). It serves as the single source of truth for both frontend UI implementation and database sync tasks.

---

## 1. Core User Schema (Common to All Roles)

Every user registers a core record in the `users` table via Firebase Auth, which is provisioned during the POST `/auth/provision` endpoint and updated via PATCH `/users/me`.

### Fields Defined in Backend Schemas:
*   `id` (UUID, Primary Key) — Internal unique identifier.
*   `firebase_uid` (VARCHAR(200), Unique, Not Null) — Firebase Auth UID (translated from Bearer token).
*   `email` (VARCHAR(255), Unique, Optional) — Retrieved from Firebase Auth token.
*   `phone` (VARCHAR(20), Unique, Optional) — E.164 phone number, verified via OTP.
*   `name` (VARCHAR(100), Not Null) — Full display name.
*   `role` (Enum `user_role` / `user_role_type`, Not Null) — Allowed values: `'PATIENT'`, `'CAREGIVER'`, `'FAMILY'`.
*   `date_of_birth` (DATE, Optional) — Birth date.
*   `gender` (VARCHAR(20), Optional) — User gender (restricted to `["Male", "Female"]` on frontend).
*   `preferred_language` (VARCHAR(10), Defaults to `'en'`) — ISO 639-1 language code.
*   `city` (VARCHAR(100), Optional) — User's registered city (resolved via reverse-geocoding).
*   `photo_url` (TEXT, Optional) — Profile image location path.
*   `is_active` (BOOLEAN, Defaults to `TRUE`) — Status of the user account.
*   `onboarding_complete` (BOOLEAN, Defaults to `FALSE`) — Set to `TRUE` once role-specific profiles are upserted.

---

## 2. Role-Specific Profile Schemas

### 2.1. Patient Profile (`patient_profiles` table)
Stores medical history, emergency contacts, routines, and safety configs.

*   `user_id` (UUID, Primary Key, references `users.id`) — Identifies the patient.
*   `emergency_contact_name` (VARCHAR(100), Optional) — Contact person for emergencies.
*   `emergency_contact_phone` (VARCHAR(20), Optional) — Phone number of emergency contact.
*   `emergency_contact_relation` (VARCHAR(50), Optional) — Relationship of emergency contact. *(Declared in schema doc but missing in DB, see Section 3)*.
*   `diagnosis` (VARCHAR(100), Optional) — e.g., 'Alzheimer\'s', 'Mild Cognitive Impairment'.
*   `diagnosis_date` (DATE, Optional) — Date of clinical diagnosis.
*   `medications` (JSONB, Defaults to `'[]'`) — Structured array of medication schedules.
*   `known_triggers` (Text Array, Defaults to `'{}'`) — Cognitive/behavioral triggers.
*   `comfort_items` (Text Array, Defaults to `'{}'`) — Familiar items to orient the patient.
*   `favourite_songs` (JSONB, Defaults to `'[]'`) — Comfort audio list.
*   `cognitive_baseline_date` (DATE, Optional) — Reference point for cognitive assessment trends.
*   `nimhans_patient_id` (VARCHAR(50), Optional) — Reference code for clinical assessment syncs.

### 2.2. Caregiver Profile (`caregiver_profiles` table)
Stores professional history, capabilities, availability, and pricing.

*   `user_id` (UUID, Primary Key, references `users.id`) — Identifies the caregiver.
*   `bio` (TEXT, Optional) — Short professional description.
*   `years_of_experience` (INTEGER, Defaults to `0`) — Caregiving work duration.
*   `specializations` (Text Array, Defaults to `'{}'`) — Specialization categories.
*   `languages_spoken` (Text Array, Defaults to `'{}'`) — Languages caregiver can speak.
*   `availability_types` (Text Array / Enum, Defaults to `'{}'`) — Day/Night shifts or full-time.
*   `service_radius_km` (INTEGER, Defaults to `10`) — Distance limit for visiting services.
*   `max_patients` (INTEGER, Defaults to `3`) — Caregiver's patient limit.
*   `hourly_rate` (DECIMAL(10,2), Optional) — Hourly fee.
*   `daily_rate` (DECIMAL(10,2), Optional) — Daily fee.
*   `is_verified` (BOOLEAN, Defaults to `FALSE`) — Verification badge status.
*   `verification_method` (VARCHAR(50), Optional) — e.g. 'AADHAAR' or 'MANUAL'.
*   `verification_date` (DATE, Optional) — Date verification occurred.
*   `rating` (DECIMAL(3,2), Optional) — Average rating (0.00 to 5.00).
*   `rating_count` (INTEGER, Defaults to `0`) — Number of ratings received.
*   `is_discoverable` (BOOLEAN, Defaults to `TRUE`) — Flag to show in search directory.

### 2.3. Family Profile (`family_profiles` table)
Configures notifications, relationship context, and summary digest schedules.

*   `user_id` (UUID, Primary Key, references `users.id`) — Identifies the family user.
*   `notification_digest_enabled` (BOOLEAN, Defaults to `TRUE`) — Whether email/digest updates are active.
*   `digest_frequency` (VARCHAR(20), Defaults to `'DAILY'`) — Digest period (`DAILY` or `WEEKLY`).
*   `whatsapp_number` (VARCHAR(20), Optional) — Connected number for notifications.

---

## 3. Discrepancies & Gaps Found (Missing Schema Elements)

A thorough comparison between the documentation schema (`db/schema/*.sql`), actual SQL migrations (`db/migrations/001_initial_schema.sql`), service controllers (`users.service.ts`), and the mobile application highlights several major mismatches:

### 3.1. Major Discrepancy: `family_profiles`
The schema documentation file and the actual database implementation are completely out of sync.

| Attribute | Schema Doc (`12_profiles.sql`) | Implemented Migration / Service | Sync Status / Gap |
| :--- | :--- | :--- | :--- |
| **`relation_label`** | `VARCHAR(50)` (e.g., 'Daughter') | **Missing** | **Broken.** Family cannot record their exact relationship to the patient. |
| **`notify_on_breach`** | `BOOLEAN` | **Missing** | **Critical.** Crucial feature for immediate geofence exit push alerts is missing in the database. |
| **`notify_on_missed_critical`**| `BOOLEAN` | **Missing** | **Broken.** No custom toggle for missed routine medication alerts. |
| **`notify_on_sos`** | `BOOLEAN` | **Missing** | **Broken.** No toggle for immediate SOS alerts. |
| **`notify_on_daily_digest`** | `BOOLEAN` | **Missing** | Replaced by `notification_digest_enabled`. |
| **`digest_time`** | `TIME` | **Missing** | **Missing.** Digest schedule defaults to a hardcoded database time. |
| **`whatsapp_number`** | **Missing** | `VARCHAR(20)` | Exists in DB and code, but undocumented in schema file. |
| **`notification_digest_enabled`**| **Missing** | `BOOLEAN` | Exists in DB and code, but undocumented in schema file. |

### 3.2. Missing Fields in `patient_profiles`
The actual PostgreSQL table is missing several parameters that are vital for geofencing and accessibility features:
*   **`home_lat` & `home_lng` (DOUBLE PRECISION)**: Declared in `12_profiles.sql` but missing in the migration database and service scripts. Without these coordinates directly on the profile, geofencing coordinates must be derived from custom tables (`geofence_zones`) rather than a default home center.
*   **`home_address` (TEXT)**: Declared in schema file but missing in database.
*   **`emergency_contact_relation` (VARCHAR(50))**: Declared in schema file but missing in database.
*   **`can_use_phone_independently` (BOOLEAN)**, **`voice_command_enabled` (BOOLEAN)**, **`tts_enabled` & `tts_speed` (DECIMAL)**: Declared in schema docs but missing in database.

### 3.3. Discrepancies in `caregiver_profiles`
*   **Naming Collision**: Schema file uses `hourly_rate_inr` and `daily_rate_inr`, whereas the database migration uses `hourly_rate` and `daily_rate`.
*   **Missing Columns**: `current_patient_count` (Integer), `aadhaar_hash` (Text), and `has_dementia_training` (Boolean) are specified in documentation but missing from migration tables.
*   **Data Types**: `availability_types` is declared as an enum array type `availability_type[]` in document specs, but implemented as a simple `TEXT[]` in the database.

---

## 4. Onboarding UX Strategy

To capture visual elegance while streamlining data entry, the application uses a dual-onboarding framework tailored by role:

### 4.1. Patient Onboarding Flow (Grouped-Input Cards)
Patients (including details like dementia stage/severity) will onboard via the **simple card aesthetic** (large typography, circular illustrations, solid color backgrounds) but with **grouped inputs** (2–3 related fields per screen) to keep the screen count low.

*   **Total Steps**: 4 Screens
*   **Screen 1: Select Role**
    *   *Visuals*: Large cards for Patient / Caregiver / Family.
*   **Screen 2: Basic Info**
    *   *Header*: "Tell us about yourself" (friendly avatar illustration).
    *   *Fields Grouped*: Profile Photo upload + Name + Date of Birth + Gender (dropdown).
*   **Screen 3: Health & Diagnosis**
    *   *Header*: "Dementia stage & details" (medical/safety shield illustration).
    *   *Fields Grouped*: Diagnosis type (e.g., Alzheimer's) + Stage/Severity Level (Mild/Moderate/Severe dropdown) + Diagnosis Date (optional date picker).
*   **Screen 4: Safety & Support**
    *   *Header*: "Emergency contact info" (shield/hands illustration).
    *   *Fields Grouped*: Contact Name + Contact Phone + Relationship (Daughter/Son/Spouse).

### 4.2. Family Onboarding Flow (Grouped-Input Cards)
Family members will onboard using the same simple, illustrative card aesthetic.

*   **Total Steps**: 3 Screens
*   **Screen 1: Select Role** (Same as patient)
*   **Screen 2: Basic Info & Relation**
    *   *Header*: "Who are you caring for?" (family portrait illustration).
    *   *Fields Grouped*: Name + Profile Photo + Relationship label (Daughter/Son/Spouse) + WhatsApp Number.
*   **Screen 3: Alert Settings**
    *   *Header*: "Configure your alerts" (notification bell illustration).
    *   *Fields Grouped*: Breach Toggles (GPS out-of-bounds) + Missed Routine Toggles + SOS Trigger Toggles + Digest Toggles.

### 4.3. Caregiver Onboarding Flow (Streamlined Form Layout)
Caregivers require a highly detailed professional profile. They will bypass the step-by-step card screens and onboard via a single-page or two-tab form designed for typing speed, professional completeness, and fast submission.

*   **Total Steps**: 2 Screens
*   **Screen 1: Select Role** (Same as others)
*   **Screen 2: Professional Profile Form**
    *   *Layout*: A clean, scrollable layout containing all caregiver parameters.
    *   *Sections*:
        *   *Basic Profile*: Photo + Name + DOB + Gender + City (reverse-geocoding locate).
        *   *Work Capabilities*: Bio + Years of experience (stepper) + Availability (Day/Night/Live-in chips) + Service radius.
        *   *Rates*: Hourly fee + Daily fee.
        *   *Verification*: Verification method choice + Aadhaar verification status/date.

---

## 5. Visual Execution Details

To achieve the premium, modern aesthetic from your design references:

1.  **Chunky, Flat Inputs**: Use large input fields with generous padding, subtle border-radius (e.g., `16px`), and high-contrast labels.
2.  **Color-Themed States**: Use background color blocks that reflect the role or step (e.g., warm yellow/orange for personal identity, calming forest green for safety/health info, soft teal for family setup).
3.  **Micro-indicators**: Use a horizontal indicator dots row (like the `• • • —` in your reference image) at the bottom so the user always knows how far along they are.
4.  **Circular Header Illustrations**: Pair each screen with a stylized, friendly circular illustration to elevate the feeling of warmth and premium quality.
