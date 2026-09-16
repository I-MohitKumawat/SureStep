# SureStep — Project State & Technical Architecture

This document outlines the current state of the SureStep application, covering both the React Native/Expo frontend and the Express/PostgreSQL backend, highlighting core migrations (such as moving from Clerk to Firebase Auth) and the system's design specifications (TDD).

---

## 1. Authentication Migration: Clerk to Firebase Auth

The application has fully migrated its identity and authentication layer from **Clerk** to **Firebase Auth**.

### Backend Identity Changes
- Removed all Clerk webhooks, Clerk middleware, and Clerk SDK dependencies.
- Replaced `clerk_id` with `firebase_uid` across all database tables (e.g., `users` table uses `firebase_uid VARCHAR(200) NOT NULL UNIQUE`).
- Integrated `firebase-admin` SDK in the Express backend for token verification.
- **Middleware**: The Express `authenticate` middleware extracts the Bearer token from the `Authorization` header, verifies it with Firebase Admin SDK, retrieves or provisions the user records, and sets `req.user` details (id, firebaseUid, role).

### Frontend Auth Changes
- Replaced Clerk provider and Hooks with `@react-native-firebase/app` and `@react-native-firebase/auth`.
- Authenticates users via Phone OTP verification in the app client.
- Exposes `AuthContext` with states:
  - `authenticated`: User exists in Firebase & DB.
  - `no_role` / `no_profile`: User is authenticated in Firebase but needs database provisioning and profile onboarding.
  - `unauthenticated`: User needs to log in.

---

## 2. Onboarding Flow (TDD Parameters)

The onboarding flow has been redesigned for a guided, step-based setup matching high-fidelity guidelines.

### Workflow by Role
- **Patient (2-Step Flow)**:
  - **Step 1 (Your Role)**: Select profile type.
  - **Step 2 (Profile Info)**: Profile photo + Name + DOB + Gender + Language + City + Emergency Contact Name + Emergency Contact Phone.
- **Caregiver (3-Step Flow)**:
  - **Step 1 (Your Role)**: Select profile type.
  - **Step 2 (Basic Info)**: Profile photo + Name + DOB + Gender + Language + City + Short Bio.
  - **Step 3 (Professional Info)**: Experience years + Max Patient Capacity + Service Radius + Specializations + Languages Spoken + Availability Types + Hourly Rate + Daily Rate + Discoverability.

### Verification & Constraints
- **Mandatory Profile Photo**: Users cannot proceed past Step 2 without selecting a profile photo.
- **Binary Gender**: Restricted strictly to `["Male", "Female"]`.
- **GPS City Resolution**: Implemented a `📍 Locate` action triggering `expo-location` to automatically reverse-geocode GPS coordinates into city names.
- **Backend Sync**: Provisions the user first via `provisionUser`, updates standard profile fields via `updateMe`, and writes extended parameters via `updatePatientProfile` or `updateCaregiverProfile`.

---

## 3. Database Schema

The database is built on PostgreSQL with primary tables optimized for indexing on search vectors:

### Core Identity Table
```sql
CREATE TABLE users (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid        VARCHAR(200) NOT NULL UNIQUE,
  email               VARCHAR(255) UNIQUE,
  phone               VARCHAR(20)  UNIQUE,
  name                VARCHAR(100) NOT NULL,
  role                user_role    NOT NULL,
  date_of_birth       DATE,
  gender              VARCHAR(20),
  preferred_language  VARCHAR(10)  NOT NULL DEFAULT 'en',
  city                VARCHAR(100),
  photo_url           TEXT,
  is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
  onboarding_complete BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### Profile Extension Tables
- **`patient_profiles`**: Emergency contacts, diagnoses, JSONB-structured medication logs, triggers list, comfort items, and songs.
- **`caregiver_profiles`**: Years of experience, specialties, languages spoken, availability types, service radius, capacity limit, and rates.
- **`family_profiles`**: Relations, notification thresholds, and contact options.

---

## 4. Key Frontend & Backend Tech Stack

### Frontend Mobile App
- **Core**: React Native, Expo SDK 54, TypeScript.
- **Navigation**: React Navigation (Native Stack & Bottom Tabs).
- **Libraries**:
  - `@react-native-firebase/auth` for OTP handling.
  - `expo-image-picker` for profile photo sourcing.
  - `expo-location` for reverse-geocoding city entries.
  - `expo-secure-store` for credentials caching.

### Backend REST API & Services
- **Core**: Node.js, Express, PostgreSQL (`pg` pool client), TypeScript.
- **Services**:
  - **Auth**: Firebase Admin SDK for token translation.
  - **Queues**: Redis + Bull for routine alerts and geofencing calculation tasks.
  - **Sockets**: Socket.io for live location mapping.
  - **Validation**: Zod schema parsing.

---

## 5. Caregiver Search, Linkage & Location-Based Filtering

To ensure a personalized and localized care experience, the search, linkage, and filtering systems have been tightly integrated between the Express backend and React Native frontend.

### Location-Based Filtering
- **City Matching**: The search query on `/relationships/caregivers/search` retrieves the patient's registered `city` and strictly filters results to caregivers residing in that city (e.g., a patient in Bangalore will only see caregivers registered in Bangalore).
- **Proximity**: This restricts long-distance mismatches and ensures the caregiver's location conforms to the patient's location.

### Caregiver Linkage Flow
- **Pending/Confirmed Status**: Patients can search caregivers from the **Search** tab and request connection. Clicking "Request Caregiver" sends a POST request to `/relationships/caregiver/confirm`, establishing a pending relationship.
- **Confirmed Profile View**: Once a caregiver is linked/confirmed, the patient's Search tab changes into a dedicated **Caregiver Profile** dashboard, displaying their active caregiver's full professional profile, including experience, specialties, languages spoken, and profile photo.
- **Unlinked Alert**: If a patient opens the application without a confirmed caregiver, a custom pop-up dialog (Alert) is displayed on the main home screen, reminding them to search for a caregiver nearby and offering a quick action to navigate to the search screen.

### Caregiver Detail Presentation
- **Detailed Layout**: Displays ratings, number of active patients, hourly fee, years of experience, emergency response capability, and specific specialization tags.
- **Profile Picture Rendering**: Integrated standard React Native `Image` rendering for caregiver profile photos, falling back gracefully to a healthcare emoji if no photo has been uploaded.

---

## 6. Developer Auth Bypass & Demo Mode

To facilitate rapid feature development, UI iterations, and role-based flow exploration without Firebase SMS/OTP limits, a native Developer Bypass system has been built.

### Client-Side Bypass Trigger
- **Welcome Screen Actions**: Added two developer action buttons on the Welcome Screen:
  - `Demo Patient`: Bypasses authentication and logs in as a patient.
  - `Demo Caregiver`: Bypasses authentication and logs in as a caregiver.
- **Mock Credentials Resolution**: Directs the `setFirebaseTokenResolver` to yield a mock token prefix (`mock-dev-patient-token` or `mock-dev-caregiver-token`) for all API requests.

### Backend Auto-Provisioning Middleware
- **Middleware Detection**: The Express `authenticate` middleware intercepts tokens starting with `mock-dev-`.
- **Automatic DB Provisioning**: If a corresponding developer record does not exist in the PostgreSQL database, the middleware automatically inserts a completed profile record:
  - Sets the city to `Bangalore` for both roles, enabling instant testing of nearby search listings.
  - Inserts mock profiles into `patient_profiles` or `caregiver_profiles` with default parameters (experience, specialties, etc.) to skip onboarding screens.
  - Resolves immediately with status 200, allowing the app frontend to transition directly to the home dashboards.
