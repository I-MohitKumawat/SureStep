## Backend Architecture

### Overview

The backend is a single FastAPI service that exposes REST APIs to the mobile app (patient, caregiver, and doctor roles). It is optimized for clarity and maintainability rather than microservices.

- **Language/Framework**: Python 3.11+, FastAPI
- **Persistence**: PostgreSQL 15+
- **Auth**: JWT access tokens + server-side refresh tokens
- **Deployment**: Containerized (Docker), horizontally scalable behind a load balancer

### Layered Architecture

The service uses a simple three-layer structure:

- **API Layer (routers)**
  - FastAPI routers grouped by resource (`auth`, `users`, `patients`, `routines`, `activities`, etc.).
  - Responsible only for:
    - Request validation (Pydantic models)
    - Authentication and authorization dependencies
    - Calling service-layer methods
    - Mapping service results to HTTP responses

- **Service Layer**
  - Business logic resides here.
  - Each domain has a corresponding service:
    - `AuthService`
    - `RoutineService`
    - `EventService`
    - `AlertService`
    - `NotificationService`
    - `LocationService`
    - `ReportService`
    - `AssessmentService`
    - `VoiceMessageService`
  - Enforces role-based access and caregiver–patient linkage.
  - Handles cross-cutting concerns like audit logging and simple retries where needed.

- **Data Access Layer (Repositories/ORM)**
  - Uses SQLAlchemy (or similar) with explicit models matching the database design.
  - Repository classes or functions per aggregate (`UserRepo`, `PatientRepo`, `RoutineRepo`, etc.).
  - All raw SQL is isolated here; services depend only on repository interfaces.

This separation keeps business logic testable and reduces coupling to the framework or DB.

### Module Structure

Example structure:

- `app/main.py` – FastAPI app creation and router registration
- `app/config.py` – environment configuration and settings
- `app/api/` – routers per domain (e.g., `auth.py`, `routines.py`, `activities.py`)
- `app/services/` – service implementations
- `app/db/` – models, repositories, session management
- `app/schemas/` – Pydantic models for requests/responses
- `app/core/` – auth utilities, security, logging, exceptions
- `app/integrations/` – FCM, object storage, email/SMS (if used)

### Authentication and Authorization

- **Authentication**
  - `/auth/login` issues short-lived access token + refresh token.
  - Access token is sent in the `Authorization: Bearer <token>` header.
  - Refresh tokens are:
    - Stored server-side in `refresh_tokens` with `token_hash`, `expires_at`, and `revoked`.
    - Exchanged via `/auth/refresh` to obtain new access tokens.

- **Authorization**
  - Roles: `PATIENT`, `CAREGIVER`, `DOCTOR`.
  - Dependencies in FastAPI check:
    - User is authenticated.
    - User has appropriate role for endpoint.
    - For patient data, caregiver must be linked to that patient.
  - Doctor access uses tokens from `doctor_access_tokens` for read-only access.

### Background Processing

To keep the core app simple:
- Use FastAPI background tasks (or a lightweight task queue if needed later) for:
  - Sending FCM notifications.
  - Generating reports asynchronously (if longer-running).
  - Cleanup tasks (e.g., expiring old location data).

Begin with in-process background tasks; introduce a queue (e.g., Redis + worker) only when necessary.

### Error Handling and Logging

- Centralized exception handlers that:
  - Map domain and validation errors to appropriate HTTP status codes.
  - Return consistent error payloads (`code`, `message`, `details`).
- Structured logging (JSON) with correlation IDs to trace requests.
- Key events logged:
  - Auth failures and suspicious access.
  - Alert generation and delivery attempts.
  - Report generation and exports.

### Security and Compliance Considerations

- All endpoints served over HTTPS.
- No diagnostic or clinical decision capabilities; endpoints focus on behavior tracking and reminders.
- Role checks enforced in the service layer to avoid bypassing via misconfigured routes.
- Configurable retention for location data and other sensitive logs, enforced via periodic cleanup jobs.

