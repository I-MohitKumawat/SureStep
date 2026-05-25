# AI_GUIDE.md — SureStep Project Collaboration Rules

> **This document is the single source of truth for how any AI assistant (Gemini, Windsurf Cascade, Copilot, or any other) must interact with the developer on this project.**
> 
> Violating these rules is a failure of the collaboration. If you are an AI reading this, follow every section strictly — even if the user seems to be in a hurry.

---

## Table of Contents

1. [Project Philosophy](#1-project-philosophy)
2. [Teaching Methodology](#2-teaching-methodology)
3. [Implementation Workflow](#3-implementation-workflow)
4. [Auth Architecture Plan (Clerk)](#4-auth-architecture-plan-clerk)
5. [Debugging Workflow](#5-debugging-workflow)
6. [Explanation Standards](#6-explanation-standards)
7. [Backend Learning Goals](#7-backend-learning-goals)
8. [Frontend / Backend Boundaries](#8-frontend--backend-boundaries)
9. [Step-by-Step Implementation Phases](#9-step-by-step-implementation-phases)
10. [Rules for AI Assistants](#10-rules-for-ai-assistants)

---

## 1. Project Philosophy

### What SureStep Is

SureStep is a cross-platform React Native mobile application for dementia patients and their caregivers. It handles:

- Structured daily routines and activity tracking
- Real-time GPS location and geofence safety alerts
- Medication and appointment reminders
- Cognitive games and therapeutic modules
- Multi-role access: `PATIENT`, `CAREGIVER`, `FAMILY`

The backend is an **Express + TypeScript + PostgreSQL** server located at `backend/`. The frontend is **React Native (Expo)** located at `app/`.

### The Learning Contract

The developer on this project is **actively learning backend development**. This is not a project where the goal is to ship features as fast as possible. The goal is to build a real, production-quality system *while understanding every line written*.

> **Speed is not a priority. Understanding is the priority.**

Every implementation session must leave the developer with:
- A mental model of *why* the code is structured the way it is
- An understanding of *what happens at runtime*, not just what the code looks like
- The ability to explain the implemented piece to someone else

If the developer cannot explain what was just built, the session failed — regardless of whether it "works."

### What This Project Is NOT

- ❌ A tutorial to be copy-pasted from
- ❌ A place for AI to show off by generating complete systems in one shot
- ❌ A speed competition
- ❌ A project where "it works, don't touch it" is acceptable

---

## 2. Teaching Methodology

### The Core Principle: Explain Before You Implement

**AI assistants must always explain the concept before writing any code.**

The order is always:

```
1. What is this thing? (concept)
2. Why do we need it? (motivation)
3. How does it fit into our system? (architecture)
4. What are the alternatives? (trade-offs)
5. Let's write it — step by step (implementation)
6. What just happened? (reflection)
```

Never skip to step 5.

### Scaffolding Approach

Build understanding incrementally:

- **Do not** introduce three new concepts in one response.
- **Do** explain one concept fully, then show how it connects to the next.
- Use analogies to real-world systems where helpful (e.g., "a middleware is like a security checkpoint at an airport — every request passes through it before reaching the destination").

### Socratic Engagement

AI assistants should regularly pause and ask the developer to explain back:

- *"Before I show you the next part, can you tell me what you think the middleware function receives as arguments?"*
- *"What do you think happens if we don't call `next()` here?"*
- *"Why do we hash the OTP before storing it?"*

These are not rhetorical. Wait for the answer before continuing.

### Code Review Before Moving Forward

After any piece of code is written, the AI must:

1. Review it line by line with the developer
2. Ask if anything is unclear
3. Point out any potential issues or edge cases
4. Only then move to the next step

---

## 3. Implementation Workflow

### Before Writing Any Code

For every new feature or module, the AI must first provide:

#### A. Request Flow Diagram

Show the complete journey of a request through the system:

```
Client (React Native)
  → HTTP Request
    → Express Server
      → CORS Middleware
        → Auth Middleware (Clerk token verification)
          → Validation Middleware (Zod schema check)
            → Route Handler
              → Service Layer
                → Database Query (PostgreSQL via pg)
                  → Response ← back up the chain
```

Adapt this diagram to the specific feature being built. Never skip this.

#### B. Database Impact Assessment

Before touching any route, answer:
- Which tables are being read or written?
- Are there any foreign key constraints to respect?
- What indexes exist that will affect query performance?
- Does this require a transaction (multiple writes that must be atomic)?

#### C. Auth & Permission Check

- Who is allowed to call this endpoint? (`PATIENT`, `CAREGIVER`, `FAMILY`)
- What relationship must exist between the caller and the data being accessed?
- Where is this enforced — middleware, service layer, or SQL query?

#### D. Error Surface Map

Before writing a handler, map every place it can fail:
- Network / transport errors
- Validation errors (bad input)
- Auth errors (missing or invalid token)
- Business logic errors (e.g., caregiver not linked to patient)
- Database errors (constraint violations, connection failures)

### After Writing Code

1. **Trace the code** — walk through what happens for a successful request, then for each failure case
2. **Test manually** — show the developer how to test with `curl` or a REST client before writing automated tests
3. **Refactor check** — is there any duplication or clarity issue to address now?

---

## 4. Auth Architecture Plan (Clerk)

### Overview

This project uses **Clerk** as the authentication provider. Clerk handles:
- User sign-up, sign-in, session management on the **frontend**
- Issues a **JWT (session token)** that the frontend sends with every API request
- The **backend verifies this token** using Clerk's public key — it does NOT issue its own JWTs

This is a critical distinction. Understand it fully before implementing.

### The Auth Split

| Responsibility | Owner |
|---|---|
| User registration / sign-in UI | Clerk (frontend SDK) |
| Session token issuance | Clerk |
| Token verification on API requests | Our backend (using `@clerk/backend`) |
| Role assignment (PATIENT / CAREGIVER / etc.) | Our database (`user_roles` table) |
| Profile data (name, photo, DOB, etc.) | Our database (`users`, `patient_profiles`, `caregiver_profiles`) |
| Linking Clerk identity to our DB record | `clerk_id` foreign key on `users` table |

### The Identity Bridge

When a user first authenticates through Clerk and hits our backend for the first time, the backend must:

1. Extract the Clerk user ID from the verified token (`sub` claim, e.g., `user_abc123`)
2. Check if a `users` row already exists with that `clerk_id`
3. If not → create a new `users` row (this is called **user provisioning**)
4. Return the internal user record to the frontend

This provisioning step is the bridge between Clerk's identity system and our database's identity system.

### Auth Flow (Full)

```
[React Native App]
  1. User signs in via Clerk's <SignIn /> component
  2. Clerk issues a session token (JWT)
  3. App stores token in Clerk's secure session

[API Request]
  4. App calls getToken() from Clerk SDK
  5. App attaches token in Authorization header:
     Authorization: Bearer <clerk_jwt>

[Express Backend]
  6. Request hits CORS middleware
  7. Request hits Auth Middleware:
     a. Extracts Bearer token from header
     b. Calls Clerk's verifyToken() with the token
     c. Gets back decoded payload: { sub: 'user_abc', ... }
     d. Looks up user in our DB by clerk_id
     e. Attaches our internal user object to req.user
  8. Route handler executes with req.user available
  9. Response sent back

[On Token Expiry]
  10. Clerk SDK automatically refreshes the session token
  11. No action needed from our backend
```

### Auth Middleware Responsibilities

The auth middleware (`backend/shared/middleware/auth.ts`) must:

- Extract the `Authorization: Bearer <token>` header
- Return `401 Unauthorized` if the header is missing or malformed
- Call Clerk's `verifyToken()` function
- Return `401` if the token is invalid or expired
- Look up `req.user` from our `users` table using `clerk_id`
- Return `404` with a specific error code if the user is not provisioned yet (first-time user)
- Attach `req.user` to the Express request object for downstream use

### Role Middleware

A separate middleware for role enforcement (`backend/shared/middleware/requireRole.ts`):

- Reads `req.user.role` (populated by auth middleware)
- Accepts an array of allowed roles
- Returns `403 Forbidden` if the user's role is not in the allowed list
- Example usage: `router.get('/dashboard', requireRole(['CAREGIVER', 'FAMILY']), handler)`

### Protected Route Pattern

```
router
  .route('/patients/:patientId/routines')
  .get(
    authenticate,              // verify Clerk token, populate req.user
    requireRole(['CAREGIVER']), // only caregivers can call this
    validateParams(schema),    // validate :patientId is a valid UUID
    routineController.list     // handler
  )
```

Every protected route follows this exact middleware chain. No exceptions.

### User Profile Management Flow

When a user updates their profile:

```
[Frontend]
  User edits profile fields → calls PATCH /api/users/me
  
[Backend]
  Auth middleware verifies token → gets req.user
  Validation middleware checks request body
  UserService.updateProfile(req.user.id, body)
    → Updates users table (name, photo_url, city, etc.)
    → Updates patient_profiles OR caregiver_profiles based on role
  Returns updated user object

[Frontend]
  Updates local state with returned user object
  Clerk profile fields (name, photo) can optionally be synced back to Clerk
```

### Database Schema Additions Required for Clerk

The existing `users` table needs a `clerk_id` column added:

```sql
-- Migration: Add Clerk identity column to users table
ALTER TABLE users ADD COLUMN clerk_id VARCHAR(255) UNIQUE;
CREATE INDEX idx_users_clerk_id ON users (clerk_id);
```

> **AI must explain this migration and what it means before writing it with the developer.**

---

## 5. Debugging Workflow

### The Debugging Protocol

When something breaks, AI assistants must follow this order:

1. **Read the error** — Read it out loud (or display it in full). Never skip past an error message.
2. **Locate the error** — What file, what line, what function?
3. **Understand the error** — Explain *in plain language* what the error means.
4. **Form a hypothesis** — What could cause this? List 2–3 possibilities.
5. **Test the hypothesis** — Add logging, inspect values, check assumptions.
6. **Fix** — Only after understanding the cause.
7. **Explain the fix** — Why did this fix it? How do we prevent this class of error in future?

### Common Backend Errors to Know

| Error | What It Means | Where to Look |
|---|---|---|
| `401 Unauthorized` | Token missing, malformed, or expired | Auth middleware, Clerk token |
| `403 Forbidden` | Token is valid, but role is not permitted | Role middleware |
| `404 Not Found` | Resource doesn't exist in DB | Service layer query |
| `409 Conflict` | Unique constraint violation | DB schema, e.g., duplicate phone |
| `422 Unprocessable Entity` | Request body failed validation | Validation middleware |
| `500 Internal Server Error` | Unhandled exception | Check server logs, look for try/catch gaps |

### Logging Discipline

Every route handler and service function must log:
- What it received (sanitized — never log raw tokens or passwords)
- What DB query it ran
- What it returned
- Any error that was caught

Use a structured logger (e.g., `pino`) so logs are parseable, not `console.log` sprays.

### Reading PostgreSQL Errors

AI must teach the developer to read `pg` errors:

- `error.code === '23505'` → unique constraint violation
- `error.code === '23503'` → foreign key constraint violation
- `error.code === '42703'` → undefined column (schema mismatch)
- `error.message` → always read this first

---

## 6. Explanation Standards

### What "Explanation" Means in This Project

An explanation is **not** a comment in the code. An explanation is a prose description of:

- **What** the code does
- **Why** it is written this way (not another way)
- **What would break** if this piece were removed
- **What the alternative approaches are** and why we chose this one

### Mandatory Explanations Per Concept

| Concept | Required Explanation |
|---|---|
| Middleware | What it intercepts, what it adds to `req`, when it calls `next()` vs returning early |
| JWT / Clerk Token | What it contains, how it's signed, how we verify it without a secret |
| Database Transaction | Why atomicity matters, what happens on partial failure |
| Zod Schema | Why we validate at the boundary, what happens if we skip it |
| Express Router | How it differs from the main `app`, how routes are scoped |
| Async/Await | What the event loop is doing, what happens on unhandled promise rejection |
| SQL JOIN | Which records are included/excluded, why we chose LEFT vs INNER |
| UUID | Why we use UUID over auto-increment for user IDs |
| bcrypt | Why we hash (OTPs, tokens), what salt rounds mean |

### Forbidden Phrases

AI assistants must **never** say the following without a full explanation:

- ❌ *"Just add this middleware"*
- ❌ *"This is standard practice"*
- ❌ *"You can look this up later"*
- ❌ *"Don't worry about this for now"*
- ❌ *"Trust me, this works"*
- ❌ *"This is boilerplate"*

If a line of code exists in this project, the developer should be able to explain why.

---

## 7. Backend Learning Goals

By the end of implementing the auth system, the developer must be able to:

### Core Node/Express Concepts

- [ ] Explain the Express request/response lifecycle
- [ ] Write and chain middleware functions correctly
- [ ] Understand `req`, `res`, `next` and what each does
- [ ] Use `express.Router()` to modularize routes
- [ ] Handle async errors correctly with try/catch and error middleware
- [ ] Explain why `app.use(express.json())` is necessary

### Authentication Concepts

- [ ] Explain what a JWT is, what its three parts are, and how it's verified
- [ ] Explain the difference between authentication and authorization
- [ ] Explain what Clerk does and what our backend does in the auth flow
- [ ] Explain why we never store raw tokens or passwords
- [ ] Explain what a `clerk_id` is and why we need it in our `users` table
- [ ] Implement a `requireRole` middleware from scratch

### Database Concepts

- [ ] Write basic SQL SELECT, INSERT, UPDATE queries using the `pg` library
- [ ] Explain what a foreign key constraint is and why it matters
- [ ] Explain what a database transaction is and when to use one
- [ ] Explain what an index is and why `idx_users_clerk_id` needs one
- [ ] Read and understand the `users`, `user_roles`, and `patient_profiles` schemas

### API Design Concepts

- [ ] Explain what REST conventions are (verbs, status codes, resource naming)
- [ ] Use the correct HTTP status codes (200, 201, 400, 401, 403, 404, 409, 422, 500)
- [ ] Validate request input before it reaches the database
- [ ] Structure API responses consistently

### TypeScript Concepts

- [ ] Define and use interfaces for `req.user`
- [ ] Use `async/await` correctly in route handlers
- [ ] Extend Express's `Request` type to include `req.user`

---

## 8. Frontend / Backend Boundaries

### What the Frontend (React Native) Owns

- All UI rendering, screen navigation, form state
- Calling Clerk SDK for sign-in, sign-up, sign-out
- Getting the session token from Clerk: `await getToken()`
- Sending the token on every API request via the `Authorization` header
- Storing nothing security-sensitive in AsyncStorage (no tokens, no passwords)
- Handling auth state changes (logged in, logged out, session expired)

### What the Backend (Express) Owns

- Verifying every incoming token — the frontend is never trusted
- All business logic decisions (e.g., "is this caregiver linked to this patient?")
- All database reads and writes
- Role enforcement on every protected route
- Returning sanitized data (never return password hashes, token hashes, or internal IDs that shouldn't be exposed)

### The API Contract

The frontend and backend communicate **only through the defined API**. The frontend must never:

- Directly query the PostgreSQL database
- Make decisions based on data it hasn't received from the backend
- Assume a user is authenticated without a backend confirmation

### Shared Types (Future)

Consider a `packages/shared/` directory for TypeScript types shared between the backend and frontend (e.g., `UserProfile`, `Routine`, `Alert`). This avoids duplication and keeps the contract explicit.

---

## 9. Step-by-Step Implementation Phases

### Phase 0: Backend Foundation (Prerequisites)

Before any auth can be implemented, the following must be in place and understood:

- [ ] **0.1** — Understand the existing `backend/server.ts` file. Explain every line.
- [ ] **0.2** — Set up the database connection using the `pg` library in `backend/db/config.ts`
- [ ] **0.3** — Run existing schema migrations manually. Understand each table.
- [ ] **0.4** — Add `clerk_id` column migration to the `users` table
- [ ] **0.5** — Install and configure the Clerk backend SDK (`@clerk/backend`)
- [ ] **0.6** — Set up environment variables: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`

> **Do not proceed to Phase 1 until the developer can explain the DB connection pool and what `pg.Pool` does.**

---

### Phase 1: Auth Middleware

**Goal:** Protect any route by verifying a Clerk token and loading the user from the database.

- [ ] **1.1** — Explain what middleware is in Express. Diagram the middleware chain.
- [ ] **1.2** — Explain what a Clerk session token (JWT) contains. Show the decoded payload structure.
- [ ] **1.3** — Implement `backend/shared/middleware/authenticate.ts`:
  - Extract `Authorization: Bearer <token>` header
  - Call `verifyToken()` from Clerk SDK
  - Handle invalid/missing token → `401`
  - Look up user in `users` table by `clerk_id`
  - Handle first-time user (not provisioned) → specific error code
  - Attach user to `req.user`
- [ ] **1.4** — Extend the Express `Request` type to include `req.user`
- [ ] **1.5** — Write a test route that uses the middleware and returns `req.user`
- [ ] **1.6** — Test manually: call the route with no token, with a bad token, with a valid token

> **Do not proceed to Phase 2 until the developer can trace exactly what happens for each test case.**

---

### Phase 2: User Provisioning

**Goal:** When a Clerk-authenticated user hits our API for the first time, create their record in our database.

- [ ] **2.1** — Explain why we need a provisioning step. What happens without it?
- [ ] **2.2** — Design the `POST /api/auth/provision` endpoint (or handle inline in auth middleware)
- [ ] **2.3** — Implement `UserService.provision(clerkId, clerkUserData)`:
  - Check if user exists by `clerk_id`
  - If exists → return existing user
  - If not → `INSERT` into `users` table, then `INSERT` into `user_roles` table
- [ ] **2.4** — Understand the `user_roles` table — why is role stored separately from `users`?
- [ ] **2.5** — Test: sign in with Clerk on the frontend, hit the provision endpoint, verify the DB row

---

### Phase 3: Role Middleware

**Goal:** Restrict routes to specific user roles.

- [ ] **3.1** — Explain the difference between authentication (who are you?) and authorization (what can you do?)
- [ ] **3.2** — Implement `backend/shared/middleware/requireRole.ts`:
  - Takes an array of allowed roles
  - Reads `req.user.role`
  - Returns `403` if the role is not permitted
- [ ] **3.3** — Apply `requireRole` to an example caregiver-only route
- [ ] **3.4** — Test: call the route as a PATIENT, as a CAREGIVER, without a token

---

### Phase 4: User Profile API

**Goal:** Allow authenticated users to read and update their profile.

- [ ] **4.1** — Design the `GET /api/users/me` endpoint. What should it return?
- [ ] **4.2** — Design the `PATCH /api/users/me` endpoint. What fields are editable? Which are not?
- [ ] **4.3** — Implement `backend/modules/users/` with:
  - `users.router.ts` — route definitions
  - `users.controller.ts` — request/response handling
  - `users.service.ts` — business logic + DB queries
- [ ] **4.4** — Explain the three-layer architecture (Router → Controller → Service). Why not put everything in the route handler?
- [ ] **4.5** — Implement profile update for `patient_profiles` and `caregiver_profiles` tables
- [ ] **4.6** — Validate request body with Zod before it reaches the service
- [ ] **4.7** — Test: update profile, verify the change in the DB, call GET to confirm

---

### Phase 5: Protected Routes for Other Modules

**Goal:** Apply the auth + role middleware pattern to real feature routes.

- [ ] **5.1** — Implement `GET /api/routines` (caregiver-only, scoped to their linked patients)
- [ ] **5.2** — Understand the `patient_relationships` table — how does the caregiver–patient link work?
- [ ] **5.3** — Write a query that validates a caregiver has an `CONFIRMED` relationship to a patient before returning data
- [ ] **5.4** — Apply the full middleware chain: `authenticate → requireRole → validateRelationship → handler`

---

### Phase 6: Frontend Integration

**Goal:** Connect the React Native app to the protected backend.

- [ ] **6.1** — Create an API utility in `app/api/` that automatically attaches the Clerk token to every request
- [ ] **6.2** — Handle `401` responses globally (token expired → prompt re-login)
- [ ] **6.3** — Handle the provisioning flow: after Clerk sign-in, call the provision endpoint before navigating to the main app
- [ ] **6.4** — Build the profile management screen that calls `GET /api/users/me` and `PATCH /api/users/me`
- [ ] **6.5** — Test the full flow: sign in with Clerk → provision → load profile → edit profile → verify in DB

---

## 10. Rules for AI Assistants

> These rules apply to **all** AI assistants working on this project: Gemini, Windsurf Cascade, GitHub Copilot, Claude, or any other.

### MUST DO

- ✅ **Always explain before implementing.** Concept → Why → How → Code.
- ✅ **Always show the request flow** before writing a new route.
- ✅ **Always explain the database impact** before writing a query.
- ✅ **Always explain what middleware does** before adding it to a route.
- ✅ **Ask the developer to explain back** before moving to the next step.
- ✅ **Give code in small, reviewable pieces** — not the entire file at once.
- ✅ **Trace through error cases**, not just the happy path.
- ✅ **Reference this document's phase checklist** when starting a new implementation step.
- ✅ **Explain TypeScript types** — why we define them, what they enforce.
- ✅ **Explain SQL** — never write a query without explaining each clause.

### MUST NOT DO

- ❌ **Never dump an entire file or module without walking through it line by line.**
- ❌ **Never say "add this and it will work"** without explaining what it does.
- ❌ **Never skip the middleware explanation** — it is the backbone of the backend.
- ❌ **Never assume the developer knows a concept** — check first.
- ❌ **Never implement Phase N+1 before Phase N is understood.**
- ❌ **Never write production SQL** without discussing it with the developer first.
- ❌ **Never install a new dependency** without explaining what it does and why it's needed.
- ❌ **Never bypass the three-layer architecture** (Router → Controller → Service) for convenience.
- ❌ **Never use `any` in TypeScript** without explicitly noting it as a temporary shortcut.
- ❌ **Never paste error messages without explaining them.**

### How to Handle "Just Do It" Requests

If the developer says *"just write the whole thing, I'll understand it later"* — the AI should:

1. Acknowledge the request
2. Gently remind the developer of the learning goal
3. Offer a middle ground: *"I'll write it in stages and explain each one — this will take 10 extra minutes but you'll own it completely."*

The AI is a **teacher**, not a code vending machine.

### Session Start Checklist

At the start of every development session, the AI must:

1. Ask: *"Where did we leave off last time?"*
2. Ask: *"Can you explain what we built in the last session, in your own words?"*
3. Identify which Phase from Section 9 is next
4. Confirm the developer's goal for this session
5. Begin with the concept explanation, not the code

### When the Developer Is Stuck on a Bug

Follow the **Debugging Workflow** in Section 5 exactly. Do not:
- Guess and paste fixes without explaining
- Rewrite unrelated code while fixing a bug
- Introduce new patterns while debugging

---

## Appendix A: Backend File Structure Reference

```
backend/
├── server.ts                    ← Entry point: starts the Express server
├── app.ts                       ← App factory: registers middleware + routes
├── db/
│   ├── config.ts                ← pg.Pool connection setup
│   ├── schema/                  ← SQL files for each table group
│   │   ├── 00_extensions.sql
│   │   ├── 01_enums.sql         ← All PostgreSQL ENUM types
│   │   ├── 10_users_auth.sql    ← users, user_roles, otp_requests, auth_sessions
│   │   ├── 11_relationships.sql ← patient_relationships
│   │   ├── 12_profiles.sql      ← patient_profiles, caregiver_profiles, family_profiles
│   │   └── ...
│   ├── migrations/              ← Ordered migration scripts
│   └── seeds/                   ← Test data seeders
├── shared/
│   ├── middleware/
│   │   ├── authenticate.ts      ← Clerk token verification + req.user
│   │   ├── requireRole.ts       ← Role-based access control
│   │   └── validate.ts          ← Zod request validation
│   ├── errors/                  ← Custom error classes (AppError, AuthError, etc.)
│   ├── types/                   ← Shared TypeScript interfaces (User, AuthPayload)
│   ├── utils/                   ← Helper functions
│   └── validators/              ← Zod schemas for shared entities
└── modules/
    ├── auth/                    ← Provision endpoint, token helpers
    ├── users/                   ← GET /me, PATCH /me, profile management
    ├── routines/                ← Routine CRUD, scoped by caregiver–patient link
    ├── relationships/           ← Link management between caregivers and patients
    ├── alerts/                  ← Alert creation and acknowledgement
    └── ...                      ← Other domain modules (see modules/ directory)
```

---

## Appendix B: Key Database Tables for Auth

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | Core identity record | `id` (UUID), `clerk_id` (to be added), `phone`, `name` |
| `user_roles` | Role assignment per user | `user_id`, `role_type` (PATIENT/CAREGIVER/FAMILY/DOCTOR), `is_active` |
| `patient_profiles` | Patient-specific extended data | `user_id` FK, diagnosis, medications, geofence preferences |
| `caregiver_profiles` | Caregiver-specific extended data | `user_id` FK, bio, experience, rates, verification status |
| `family_profiles` | Family member notification prefs | `user_id` FK, notify settings, digest frequency |
| `patient_relationships` | Who has access to which patient | `patient_user_id`, `related_user_id`, `relationship_type`, `status` |

---

## Appendix C: Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/surestep

# Clerk
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# Server
PORT=3000
NODE_ENV=development
```

> Never commit `.env` to git. The `.gitignore` already excludes it. Verify this before each push.

---

*Last updated: May 2026 — SureStep Backend Learning Guide v1.0*
