## Frontend Architecture

### Overview

The frontend is a single cross-platform React Native application that adapts its interface based on user role:
- **Patient mode**: Optimized for simplicity, large touch targets, and minimal navigation depth.
- **Caregiver mode**: Focused on configuration, monitoring, and reporting for one or more patients.
- **Doctor mode**: Read-only views of reports and patient context.

The app is built with:
- React Native (TypeScript)
- React Navigation
- React Query (or equivalent) for server state
- Lightweight Context for auth and app-wide settings

### High-Level Structure

- **`/app`**
  - Single app entry and navigation configuration with role-aware flows
- **`/packages/ui`**
  - Shared UI components (buttons, cards, typography, layout primitives)
- **`/packages/features`**
  - Feature modules shared where possible (routines, appointments, assessments, journal, alerts)
- **`/packages/core`**
  - API client, auth utilities, configuration, logging, error handling helpers

This separation keeps shared logic reusable while allowing role-specific UX tailoring within a single app.

### Navigation

- **Patient mode**
  - Very shallow navigation with at most 1–2 levels.
  - Likely a bottom tab layout (e.g., `Home`, `Journal`, `Family`, `More`) with stack navigation only where strictly needed.
  - Deep links from notifications into specific activities, reminders, or calming experiences.

- **Caregiver mode**
  - Tab or drawer-based main sections (e.g., `Dashboard`, `Patients`, `Routines`, `Alerts`, `Reports`).
  - Nested stacks inside each tab for detail views (patient details, routine editor, location view, etc.).

### State Management

- **Server state**
  - Managed by React Query (or similar) for:
    - Authenticated API calls
    - Routines, activities, appointments, reports
    - Alerts, locations, questionnaires, assessments, journal entries, voice messages
  - Automatic caching, refetching, and background updates.

- **Client (UI) state**
  - React Context for:
    - Auth session (access token, refresh flow; careful not to store refresh token on device)
    - Current patient selection (for caregivers managing multiple patients)
    - Basic app configuration (theme, font scale preferences)
  - Local component state for view-only UI concerns (e.g., modal visibility, form fields).

### Offline Support (Patient App)

To meet offline-tolerance:
- Use a small local storage layer (e.g., AsyncStorage + simple wrapper) to persist:
  - Today’s routine and activities
  - Pending activity events (completed/skipped)
  - Pending journal entries and assessments
- A background sync process:
  - On app start and on reconnect, push queued events to `/events`, `/assessments`, `/journal`.
  - Pull updated routines, appointments, and alerts.
- Keep conflict rules simple:
  - Last-write-wins from server for schedules.
  - Client can only append events and entries, never edit historical logs.

### UI and Accessibility

- **Patient app**
  - Large touch targets and fonts; high contrast themes.
  - Minimal choices per screen, clear labels and explicit text (avoid ambiguous icons).
  - Consistent color coding for action types (e.g., confirm vs. cancel) across the app.

- **Caregiver app**
  - Information-dense but still mobile-friendly.
  - Tables, charts, and summaries should be readable at a glance.

Both apps:
- Single design system in `/packages/ui` with tokens for spacing, typography, and colors.
- Centralized theming for light/dark and accessibility variants.

### Networking and API Client

- A shared API client in `/packages/core`:
  - Wraps `fetch` or axios with:
    - Base URL configuration
    - Attaching JWT access token on each request
    - Automatic token refresh via `/auth/refresh` when access token expires
    - Standardized error handling and logging
- Each feature module exposes simple hooks:
  - `useRoutines`, `useActivities`, `useAppointments`, `useReports`, `useAlerts`, etc.
  - Encapsulate endpoints under the hood for maintainability.

### Push Notifications

- Use Firebase Cloud Messaging:
  - Register device tokens at login and associate them with user and role on the backend.
  - Topics or per-user tokens for patient vs caregiver messages.
  - Deep-link handling so tapping a notification routes to the relevant screen.

### Code Organization and Conventions

- Feature-first structure inside `/packages/features`:
  - `routines/` (components, hooks, types)
  - `activities/`
  - `appointments/`
  - `reports/`
  - `alerts/`
  - `location/`
  - `journal/`
  - `assessments/`
  - `voice-messages/`
- Strict TypeScript types for API models shared across apps.
- Shared validation schemas (e.g., Zod) for forms and request payloads.

