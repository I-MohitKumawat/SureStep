db/
  schema/

    # =========================================================
    # 00–09 → FOUNDATION / GLOBAL SETUP
    # Must load first. Shared across entire database.
    # =========================================================

    00_extensions.sql        # pgcrypto, uuid-ossp, postgis, etc.
    01_enums.sql             # All PostgreSQL ENUM TYPE definitions


    # =========================================================
    # 10–19 → CORE IDENTITY & ACCESS
    # Authentication, authorization, users, permissions.
    # Everything else depends on this layer.
    # =========================================================

    10_users_auth.sql        # users, auth_sessions, otp_requests, user_roles
    11_relationships.sql     # patient_relationships, access relationships
    12_profiles.sql          # patient_profiles, caregiver_profiles, family_profiles


    # =========================================================
    # 20–29 → DAILY OPERATIONS / CARE WORKFLOWS
    # Main caregiving operational flows.
    # =========================================================

    20_routines_tasks.sql    # routines, templates, tasks
    21_appointments.sql      # appointments and reminders


    # =========================================================
    # 30–39 → REALTIME SAFETY & AWARENESS
    # Core intelligence and monitoring systems.
    # =========================================================

    30_location_geofencing.sql   # GPS pings, zones, geofence alerts
    31_awareness.sql             # patient_states, state history
    32_alerts.sql                # unified alerts system


    # =========================================================
    # 40–49 → COMMUNICATION & EMOTIONAL SUPPORT
    # Human connection and orientation systems.
    # =========================================================

    40_voice.sql             # voice samples, voice messages
    41_familiarity.sql       # familiarity assets
    42_stories.sql           # family stories feed
    43_messaging.sql         # caregiver/family messaging


    # =========================================================
    # 50–59 → HEALTH & COGNITIVE TRACKING
    # Patient assessment and treatment systems.
    # =========================================================

    50_cognition.sql         # game sessions, assessments, mood
    51_medications.sql       # medications and medication logs


    # =========================================================
    # 60–69 → CAREGIVER MANAGEMENT
    # Staffing, scheduling, wellbeing.
    # =========================================================

    60_shifts.sql            # caregiver shifts and handovers
    61_wellbeing.sql         # caregiver wellbeing tracking


    # =========================================================
    # 70–79 → INFRASTRUCTURE & SUPPORT SYSTEMS
    # Shared platform services and device systems.
    # =========================================================

    70_documents.sql         # shared documents
    71_devices.sql           # device registry
    72_notifications.sql     # notification delivery logs


    # =========================================================
    # 80–89 → PAYMENTS & COMMERCIAL SYSTEMS
    # Billing and financial flows.
    # Usually isolated because business logic changes often.
    # =========================================================

    80_payments.sql          # subscriptions, caregiver payments


    # =========================================================
    # 90–99 → PERFORMANCE / ADVANCED DB FEATURES
    # Optional later-stage scaling and optimization.
    # =========================================================

    90_indexes.sql           # heavy indexes if separated later
    91_views.sql             # database views
    92_functions.sql         # stored procedures/functions
    93_triggers.sql          # triggers
    94_policies.sql          # RLS/security policies (if added later)
    95_seed_data.sql         # dev/demo seed data


### Minor Suggestions:

Consider adding updated_at triggers to auto-update timestamps
Consider RLS (Row Level Security) policies for multi-tenant data isolation

```
backend/
├── src/
│
├── server.ts
├── app.ts
│
├── config/
│   ├── env.ts
│   ├── db.ts
│   ├── redis.ts
│   └── logger.ts
│
├── shared/
│   ├── middleware/
│   ├── utils/
│   ├── errors/
│   ├── types/
│   ├── constants/
│   └── validators/
│
├── db/
│   ├── schema/
│   ├── migrations/
│   └── seeds/
│
├── modules/
│   │
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.middleware.ts
│   │   ├── auth.types.ts
│   │   └── auth.validation.ts
│   │
│   ├── users/
│   ├── relationships/
│   ├── routines/
│   ├── appointments/
│   ├── location/
│   ├── awareness/
│   ├── alerts/
│   ├── voice/
│   ├── cognition/
│   ├── medications/
│   ├── shifts/
│   ├── payments/
│   └── notifications/
│
└── jobs/
    ├── awareness.job.ts
    ├── reminders.job.ts
    └── cleanup.job.ts
```