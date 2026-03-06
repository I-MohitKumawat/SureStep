### Dev A (Frontend)

- **Core app & roles**
  - Single cross‑platform mobile app shell (FE-APP-001..003)  
  - Role-based interface modes (FE-ROLE-001..003)
- **Patient core flows**
  - Daily routine dashboard (FE-PAT-ROUTINE-001..003)  
  - Guided activity flows (FE-PAT-GUIDE-001..003)
- **Reminders & offline**
  - Medication reminders (FE-PAT-MED-001..003)  
  - Appointment reminders (FE-PAT-APPT-001..003)  
  - Offline-tolerant usage (FE-PAT-OFFLINE-001..003)
- **Auth & notifications UX**
  - Secure authentication UX (FE-AUTH-001..003)  
  - Notifications UX (FE-NOTIF-001..003)

---

### Dev B (Frontend)

- **Patient enrichment features**
  - Cognitive & therapeutic games access (FE-PAT-GAME-001..003)  
  - Self-assessment checks (FE-PAT-SELF-001..003)  
  - Journal (FE-PAT-JOURNAL-001..003)  
  - Family tree visualization (FE-PAT-FAMILY-001..003)  
  - Photo-based quick dial (FE-PAT-DIAL-001..003)  
  - Calming & therapeutic experiences (FE-PAT-CALM-001..003)  
  - Geofence boundary alerts (patient-view) (FE-PAT-GEOFENCE-001..002)
- **Accessibility**
  - Accessibility & usability (FE-A11Y-001..003)

---

### Dev C (Frontend & Backend)

- **Caregiver UI**
  - Multi-patient dashboard (FE-CG-DASH-001..003)  
  - Routine & activity management UI (FE-CG-ROUTINE-001..004)  
  - Appointment management UI (FE-CG-APPT-001..003)  
  - Alert center UI (FE-CG-ALERT-001..003)  
  - Location & geofence management UI (FE-CG-LOC-001..004)
- **Reports, questionnaires, voice, doctor UI**
  - Behavior & adherence reports UI (FE-CG-REPORT-001..003)  
  - Behavioral questionnaires UI (FE-CG-QUEST-001..003)  
  - Voice orientation messages UI (FE-CG-VOICE-001..003)  
  - Doctor access management UI (FE-CG-DOCTOR-001..003)  
  - Doctor read-only views (FE-DR-OVERVIEW-001..003)
- **Backend cross-cutting / integration**
  - Reporting & exports (BE-REPORT-001..002, BE-REPORT-EXP-001..002)  
  - Doctor access (BE-DR-ACCESS-001..003)  
  - CI/CD setup (INF-CI-001..002)

*(Acts as integration bridge between FE and BE, but tasks stay mostly in distinct files to avoid conflicts.)*

---

### Dev D (Backend)

- **Auth & roles**
  - User registration & login (BE-AUTH-REG-001..003)  
  - JWT-based session management (BE-AUTH-JWT-001..003)  
  - Role-based access control (BE-AUTH-RBAC-001..003)
- **Users & linking**
  - User and profile storage (BE-USER-001..002)  
  - Caregiver–patient linking (BE-LINK-001..003)
- **Infra / platform**
  - Managed PostgreSQL & migrations (INF-DB-001..002)  
  - Configuration & secrets management (INF-CONFIG-001..002)  
  - Logging & monitoring (INF-LOG-001..002)

---

### Dev E (Backend)

- **Routines, activities, events**
  - Routine & schedule management APIs (BE-ROUTINE-001..003)  
  - Activity execution logging (BE-ACT-LOG-001..003)  
  - Offline event ingestion (BE-ACT-BATCH-001..002)
- **Appointments & alerts**
  - Appointment management APIs (BE-APPT-001..003)  
  - Alert generation & lifecycle (BE-ALERT-001..003, BE-ALERT-LIFE-001..002)
- **Notifications & location**
  - Push notification orchestration (BE-NOTIF-001..003)  
  - Location ingestion & history (BE-LOC-001..002, BE-LOC-HIST-001..002)  
  - Geofence evaluation (BE-GEOFENCE-001..003)
- **Assessments, journal, voice**
  - Caregiver questionnaires (BE-QUEST-001..003)  
  - Patient self-assessments (BE-SELF-001..003)  
  - Journal storage (BE-JOURNAL-001..003)  
  - Voice message metadata management (BE-VOICE-001..003)
- **Infra / runtime**
  - Containerized deployment (INF-DOCKER-001..002)  
  - Scalable web service & health check docs (INF-WEB-001..002)  
  - Push notification infra config (INF-NOTIF-001)  
  - Object storage for media (INF-STORAGE-001..002)  
  - Data retention & cleanup jobs (INF-RET-001..002)

This split lets **frontend and backend run in parallel** with minimal file overlap: Dev A/B focus on patient/core UI, Dev C on caregiver/doctor UI and cross-cutting features, Dev D on auth/users/config, and Dev E on domain APIs, notifications, and infra.