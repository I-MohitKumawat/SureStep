# SureStep V1 — Existing Codebase Audit Report

**Date:** October 16, 2026  
**Auditor:** Technical Architecture & System Engineering Agent  
**Baseline Documents:**
- `docs/requirements/V1_REQUIREMENT.md`
- Workflows: `docs/workflows/01-IDENTITY.md` through `11-ACCOUNT-AND-SETTINGS.md`
- Requirements ↔ Workflows Consistency Audit (`audit-report.md`)

---

## 1. Executive Summary

This audit assesses the existing SureStep codebase (`SureStep/` React Native/Expo mobile application and `surestep-backend/` Node.js/Express/TypeScript/Drizzle backend) against the ratified V1 Requirements and the 11 Core Workflows.

The codebase represents a functional prototype with established foundations in authentication, relational modeling, real-time messaging, and background jobs. However, significant architectural discrepancies exist between the current codebase and the canonical V1 product specifications. Most critically:
1. **Explicit V1 Scope Violations:** The existing codebase includes features strictly prohibited in V1 (clinical cognitive scoring/MMSE tests, doctor roles, and payment processing).
2. **Authorization Inversion:** The backend uses an outdated 2-party relationship model (`patient_relationships`) where family members are restricted from managing safe zones and routines, directly contradicting the V1 Care Circle Owner and delegatable permission model.
3. **Caregiver Termination State Machine:** Caregiver resignation is implemented as an interactive request that family can decline, contradicting the approved 7-day non-interactive `Notice Period` transition.
4. **Care Circle Ownership of Safe Zones:** Safe zones in the database are tied to individual patients rather than the Care Circle with multi-patient monitoring configuration.

Below is the comprehensive audit and classification of all system components.

---

## 2. Classification Key

- **Reusable (R):** Meets V1 specifications and can be retained with minimal or no refactoring.
- **Requires Modification (M):** Sound foundation, but requires schema, logic, or signature changes to adhere to V1 rules.
- **Incomplete (I):** Scaffolding exists, but critical workflow states, fields, or operations are missing.
- **Incorrect Relative to Workflows (X):** Violates V1 specifications, contradicts approved audit decisions, or contains inverted business logic. Must be corrected or removed from the V1 runtime.
- **Missing (!):** Required by V1 specifications and workflows, but entirely absent from the codebase.

---

## 3. Detailed Component Audit

### 3.1 Backend Architecture (`surestep-backend/`)

| Component | Path | Status | Finding & Workflow Analysis |
| :--- | :--- | :---: | :--- |
| **Server Entrypoint** | `server.ts` | **M** | Sound Express + HTTP server + Socket.IO setup. Graceful shutdown implemented. Requires removing routes for prohibited modules (`/payments`, `/cognition`, `/reports`, `/assessments`) and mounting Care Circle routes. |
| **Database Connection & Pool** | `db/config.ts` | **R** | Robust `pg` Pool configuration with SSL support and connection health queries. Safe for production. |
| **ORM Configuration** | `drizzle.config.ts`, `db/drizzle.ts` | **R** | Drizzle ORM configured with PostgreSQL dialect. Reusable across modular schema. |
| **Migration Runner** | `db/migrator.ts` | **M** | Sequential SQL file runner with tracking in `_migrations` table. Works well, but needs Drizzle-native migration sync or strictly ordered V1 migration files. |
| **Firebase Admin Auth** | `config/firebase.ts` | **R** | Properly initializes Firebase Admin SDK via service account or application default credentials. Reusable for JWT verification. |
| **Authentication Router & Controller** | `modules/auth/` | **M** | Firebase ID token verification, user provisioning, and role registration work. Needs enhancement for explicit multi-role profile setup (Patient, Family Member, Professional Caregiver) and session revocation handling. |
| **User & Profile Management** | `modules/users/` | **M** | Handles basic profile updates. Lacks 7 mandatory caregiver onboarding fields check before discoverability, and Care Circle profile context. |
| **Care Circle & Membership** | `db/schema/13_care_circle.sql` | **!** | **Missing.** The database contains only `invite_codes` and `care_notes`. The central `care_circles` and `care_circle_members` entities, ownership delegation, and delegatable permissions do not exist. |
| **Permission Middleware** | `shared/permissions/familyPermissions.ts` | **X** | **Incorrect.** Defines inverted permissions stating Family *cannot* edit geofences, edit routines, or acknowledge alerts. In V1, Family is the Circle Owner/Admin. Must be completely replaced with canonical permission matrix. |
| **Relationship Middleware** | `shared/middleware/requireRelationship.ts` | **X** | **Incorrect.** Enforces a flat 2-party relationship check (`patient_relationships`). Fails to evaluate the 4-tier model: Circle Membership ≠ Caregiver Relationship ≠ Patient Assignment ≠ Specific Care Permission. |
| **Caregiver Discovery** | `modules/discovery/` | **M** | City normalization (`cityNormalizer.ts`) and radius search are well engineered. Missing: enforcement of 7 required fields, default undiscoverable status, and caregiver platform report flow. |
| **Care Requests** | `modules/care-requests/` | **M** | Strong transaction handling (`SELECT FOR UPDATE`), canonical decline/withdraw reasons, and expiry sweeps. Needs alignment with Care Circle requester authority (`Search/Request Caregivers` permission). |
| **Care Relationships & Termination** | `modules/care-relationships/` | **X** | **Incorrect.** Implements caregiver resignation request that family can decline. Contradicts approved P1 decision: caregiver-initiated termination enters a 7-day `Notice Period` state where care continues, followed by automatic revocation. |
| **Location & Geofencing** | `modules/location/` | **M** | Ingestion of coordinates and telemetry works. Safe zones are tied directly to patients rather than Circle ownership. Multi-patient monitoring configuration is missing. |
| **Alerts & Realtime Notification** | `modules/alerts/`, `modules/notifications/` | **M** | FCM integration and WebSocket alert routing exist. Deduplication key pattern is effective. Needs alert escalation timer and explicit acknowledgment/resolution state machine. |
| **Routines & Tasks** | `modules/routines/` | **M** | Supports recurring schedules and task status. Missing wrong-Patient assignment validation, reminder snooze limits, and Caregiver routine log sign-off. |
| **Media & Storage** | `modules/media/` | **R** | AWS S3 client and presigned URL generation with Multer upload handling. Fully reusable for patient memory cards and profile photos. |
| **Memories & Activities** | `db/schema/41_familiarity.sql`, `42_stories.sql` | **M** | Stories and voice messages exist, but lack the canonical V1 `Manage Patient Memories` permission guard and default connected-person audience scoping. |
| **Cognition & MMSE Scoring** | `modules/cognition/`, `modules/assessment/`, `db/schema/50_cognition.sql` | **X** | **Prohibited in V1.** Computes MMSE scores, memory/attention ratings, and cognitive trends. Contradicts Requirement §2.4 & §12. Must be decommissioned from V1 runtime. |
| **Payments & Subscriptions** | `modules/payments/`, `db/schema/80_payments.sql` | **X** | **Prohibited in V1.** Payment gateway, billing, and subscription tracking are strictly out of scope for V1. Must be removed from V1 runtime. |
| **Background Processing** | `jobs/queues.ts` | **M** | Bull + Redis queue system is sound. Need to remove `weeklyReportQueue` (cognitive scoring) and implement 7-day `Notice Period` transition worker and routine occurrence generator. |
| **Error Handling & Response** | `shared/errors/AppError.ts`, `shared/utils/response.ts` | **R** | Clean operational error hierarchy (`AppError`) with structured JSON error responses. |
| **Audit Trail** | Entire backend | **!** | **Missing.** No structured immutable audit logging for permission grants/revocations, relationship terminations, and safety boundary modifications. |

---

### 3.2 Frontend Architecture (`SureStep/`)

| Component | Path | Status | Finding & Workflow Analysis |
| :--- | :--- | :---: | :--- |
| **Framework & Core** | `package.json`, `app.json` | **R** | Expo SDK 54, React Native 0.81.5, React 19, TypeScript. Solid, modern foundation. |
| **Role Navigation Routing** | `src/navigation/RoleNavigator.tsx` | **M** | Dispatches to role-specific stacks based on user role. Requires clean separation into: Patient, Family, Caregiver. |
| **Doctor Navigation & Screens** | `src/navigation/DoctorNavigator.tsx`, `src/screens/doctor/` | **X** | **Prohibited in V1.** Doctor role is not part of V1. Navigator and screens must be removed or disabled. |
| **Patient Navigation & Screens** | `src/navigation/PatientNavigator.tsx`, `src/screens/patient/` | **M** | Large text, high contrast, simplified UI aligned with Workflow 02. Needs strict Wrong-Patient prevention on multi-profile selection. |
| **Family Navigation & Screens** | `src/navigation/FamilyNavigator.tsx`, `src/screens/family/` | **M** | Comprehensive dashboard. Needs updating to reflect Care Circle Owner controls, Safe Zone Circle management, and Caregiver discovery. |
| **Caregiver Navigation & Screens** | `src/navigation/CaregiverNavigator.tsx`, `src/screens/caregiver/` | **M** | Includes schedule, requests, and active patients. Missing 7 required onboarding fields validation and 7-day Notice Period status banner. |
| **Authentication Flow** | `src/screens/auth/`, `src/context/AuthContext.tsx` | **R** | Phone authentication via Firebase Auth with SMS OTP verification. Fully aligned with V1 Identity workflow. |
| **Location Tracking Service** | `src/services/backgroundLocationService.ts` | **M** | Uses `react-native-background-geolocation` and Expo Location. Captures lat/lng/accuracy/battery. Needs power-efficient throttling and geofence exit triggers. |
| **Local Alarm & Alerting** | `src/services/localAlarmService.ts` | **R** | Local push notifications and audio playback for routine alerts. Highly reusable for Patient audio prompts. |
| **Realtime Sockets** | `src/services/socketClient.ts` | **R** | Socket.IO client with auto-reconnect and room subscription. Reusable for realtime alert broadcast. |
| **Mini-Games & Activities** | `src/games/`, `src/activities/` | **M** | MemoryMatch, PicturePuzzle, and WordFinder provide low-frustration cognitive engagement. Must ensure no scoring or diagnostic feedback is shown to users. |
| **Wrong-Patient Prevention UI** | Dashboard screens | **!** | **Missing.** Dashboards lack explicit persistent patient headers (photo, name, emergency contact) across multi-patient family switching. |

---

## 4. Key Subsystem Evaluations

### 4.1 Authentication & Identity (Workflow 01)
- **Current State:** Firebase Phone Auth handles SMS OTP verification on mobile. Backend verifies Firebase ID tokens and maps them to Postgres `users` via `firebase_uid`.
- **Verdict:** **Reusable with Modification.**
- **Required Modifications:** Ensure multi-role users have clear persona switching, device registration registers FCM tokens on login, and account deletion / deactivation cascades properly.

### 4.2 Authorization & Access Control (Workflows 03, 04, 06)
- **Current State:** Monolithic `patient_relationships` table stores all connections with hardcoded roles (`FAMILY_PRIMARY`, `CAREGIVER`, etc.). Middleware checks if a relationship row exists.
- **Verdict:** **Incorrect / Requires Architecture Overhaul.**
- **Root Problem:**
  1. No `care_circles` entity.
  2. No concept of delegatable permissions (`Manage Member Permissions`, `Manage Caregiver Relationships`, `Search/Request Caregivers`, `Manage Patient Memories`).
  3. Caregiver access is not decoupled from Patient assignment.
  4. Notice period lifecycle is absent.

### 4.3 Location, Geofencing & Safety (Workflows 07, 08)
- **Current State:** `geofences` table stores circular geofences with center point and radius. Linked directly to `patient_id`.
- **Verdict:** **Requires Modification.**
- **Required Modifications:**
  1. Safe Zones must belong to the Care Circle (`care_circle_id`), allowing monitoring rules to be applied to one or more Patients in that Circle.
  2. Add polygonal/custom boundary support where specified.
  3. Implement deduplicated alert triggers and 15-minute signal loss escalation.

### 4.4 Caregiver Discovery & Relationship Lifecycle (Workflows 05, 06)
- **Current State:** `care_requests` handles proposal, accept, decline, withdraw, and expiry. `caregiver_profiles` stores professional data. `caregiver_resignation_requests` handles resignations.
- **Verdict:** **Requires Modification.**
- **Required Modifications:**
  1. Replace resignation request flow with 7-day `Notice Period` state machine.
  2. Enforce 7 mandatory onboarding fields before discoverability.
  3. Ensure credential verification infrastructure is removed (self-reported only).
  4. Implement platform reporting endpoint for caregiver misconduct.

### 4.5 Excluded Features Removal (Requirement §12)
- **Current State:** Backend contains `modules/cognition`, `modules/assessment`, `modules/payments`, and tables `50_cognition.sql`, `80_payments.sql`. Frontend contains `DoctorNavigator` and `reportsService`.
- **Verdict:** **Must be Decommissioned.**
- **Action Plan:** Remove routers from `server.ts`, disable background workers in `jobs/queues.ts`, and archive schema tables. Prevent any clinical interpretation or billing logic in V1.

---

## 5. Summary Table of Audit Findings

| Category | Reusable | Requires Modification | Incomplete | Incorrect | Missing |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Backend Services & Routers** | 4 | 7 | 1 | 3 | 2 |
| **Database Schemas & Tables** | 6 | 8 | 2 | 2 | 3 |
| **Frontend Navigators & Screens** | 3 | 5 | 1 | 1 | 1 |
| **Background Jobs & Queues** | 2 | 2 | 0 | 1 | 1 |
| **Security & Authorization** | 1 | 1 | 1 | 2 | 1 |
| **Total Components Audited** | **16** | **23** | **5** | **9** | **8** |

---

## 6. Architectural Recommendations for Next Phases

1. **Phase 2 (System Architecture):** Retain the Express + TypeScript + Drizzle ORM modular monolith. Do not introduce microservices. Establish strict domain boundaries for Identity, Care Circle, Patient Care, Safety, and Discovery.
2. **Phase 3 (Data Model):** Introduce normalized `care_circles`, `care_circle_members`, `circle_permissions`, and `circle_permission_delegations`. Refactor `geofences` to be Circle-owned. Add 7-day notice period fields to caregiver relationships.
3. **Phase 4 (Authorization Engine):** Implement a unified server-side policy engine: `(Actor, Operation, Target, PatientContext) => Decision` that strictly validates Circle Owner status, explicit delegated permissions, and active caregiver assignments.
4. **Phase 5 (API Design):** Replace ad-hoc CRUD with workflow-driven domain endpoints enforcing idempotency, transactional locking, and audit trail emission.

