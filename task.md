# SureStep — Firebase Auth & Profile Implementation: Backend Task Flow

> This document is your **single source of truth** for the backend implementation.
> It is based on two sources:
> - `docs/SureStep_TDD_FullVision.docx` — the full product specification (API contract, schemas, routes)
> - `AI_GUIDE.md` — the learning approach and Firebase migration strategy
>
> **⚠️ Important conflict resolved:** The TDD was written with a custom OTP + JWT session system.
> The decision is to **replace that with Firebase Auth** as the auth provider.
> This means `otp_requests` and `auth_sessions` tables are **removed** (you already did this ✅).
> The TDD's `/auth/otp/*` and `/auth/refresh` routes are **replaced** by Firebase Auth on the frontend.
> Everything else in the TDD (routes, schemas, response shapes) stays exactly the same.

---

## 🗃️ What the TDD Says About Your Database

The TDD defines **these tables** for identity and auth (Section 3.3).
You have already updated your schema. Here is what your `users` table must now look like:

```sql
CREATE TABLE users (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid        VARCHAR(255)  NOT NULL UNIQUE,   -- ✅ Added. Links Firebase identity to our DB.
  phone               VARCHAR(20)   NOT NULL UNIQUE,   -- E.164 format: +919876543210
  name                VARCHAR(100)  NOT NULL,
  date_of_birth       DATE,
  gender              VARCHAR(30),
  preferred_language  VARCHAR(10)   NOT NULL DEFAULT 'en',
  city                VARCHAR(100),
  photo_url           TEXT,
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  last_login_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);
```

**The `user_roles` table** stores what role (PATIENT/CAREGIVER/FAMILY/DOCTOR) each user has.
One active role per user (enforced in code, not the DB).

```sql
CREATE TABLE user_roles (
  id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_type   user_role_type    NOT NULL,   -- ENUM: PATIENT | CAREGIVER | FAMILY | DOCTOR
  is_active   BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_active_role UNIQUE (user_id, is_active)
);
```

**The profile tables** (from TDD Section 3.5). You have already existing SQL for these:
- `patient_profiles` — linked via `user_id FK`
- `caregiver_profiles` — linked via `user_id FK`
- `family_profiles` — linked via `user_id FK`

---

## 📡 What the TDD Says About Your API

The TDD defines a strict **API contract** (Section 4). All responses must follow this shape:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```
or on failure:
```json
{
  "success": false,
  "data": null,
  "error": { "code": "USER_NOT_FOUND", "message": "No user found with that firebase_uid" }
}
```

**Base URL** (when deployed): `https://api.surestep.in/v1`
In development: `http://localhost:3000/api/v1`

---

## ✅ Phase 0: Database Preparation — COMPLETE ✅

You have already:
- [x] Added `firebase_uid VARCHAR(255) NOT NULL UNIQUE` to the `users` table
- [x] Added `CREATE INDEX idx_users_firebase_uid ON users (firebase_uid);`
- [x] Removed `otp_requests` table (Firebase handles OTPs now)
- [x] Removed `auth_sessions` table (Firebase handles sessions now)

---

## 🔐 Phase 1: Setup Firebase Admin SDK & Middleware

> **Install this in your `backend/` folder, not the root of the project!**
> Navigate into `backend/` first.

### Your Tasks:
1. **Install the SDK** in `backend/`:
   ```bash
   cd backend
   npm install firebase-admin
   ```
2. **Add to `backend/.env`:**
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   DATABASE_URL=postgresql://user:password@localhost:5432/surestep
   PORT=3000
   NODE_ENV=development
   ```
3. **Create the file:** `backend/shared/middleware/authenticate.ts`
   - This is the "scanning machine" that reads the passport Firebase gave the user.
   - It must:
     - Extract the `Authorization: Bearer <token>` header
     - Verify the token using `firebase-admin`'s `verifyIdToken()` function
     - If no token or invalid → return `401 Unauthorized`
     - If valid → look up the user in `users` table by `firebase_uid`
     - If user not found → return `404` with error code `USER_NOT_PROVISIONED`
     - If found → attach user to `req.user` and call `next()`

---

## 👤 Phase 2: User Provisioning Endpoint

> **TDD Route:** `POST /api/v1/auth/provision` *(This replaces the TDD's OTP verify route)*

When a user signs up via Firebase on the frontend, they exist in Firebase's system but **not in our PostgreSQL database yet**. The frontend must call this endpoint once after first sign-in.

### Your Tasks:
1. **Create:** `backend/modules/auth/auth.router.ts`
2. **Create:** `backend/modules/auth/auth.controller.ts`
3. **Create:** `backend/modules/auth/auth.service.ts`

**The route:** `POST /api/v1/auth/provision`
- Uses the `authenticate` middleware (which verifies the Firebase token)
- Frontend must send in the body: `{ phone, name, role }` — the basic info Firebase doesn't store in our DB
- The service checks: does a `users` row with this `firebase_uid` already exist?
  - **Yes** → return existing user (idempotent — safe to call multiple times)
  - **No** → `INSERT` a new row into `users`, then `INSERT` a row into `user_roles`
- Returns the full user object in the TDD response envelope

---

## 📝 Phase 3: Profile API Routes

> **TDD Routes (Section 4.3):** `GET /api/v1/users/me` and `PATCH /api/v1/users/me`

### Your Tasks:
1. **Create:** `backend/modules/users/users.router.ts`
2. **Create:** `backend/modules/users/users.controller.ts`
3. **Create:** `backend/modules/users/users.service.ts`

**Route 1:** `GET /api/v1/users/me`
- Uses `authenticate` middleware
- Returns the current user + their role + profile completion %
- TDD specifies: *"Current user with role, profile completion percentage, relationship count"*

**Route 2:** `PATCH /api/v1/users/me`
- Uses `authenticate` middleware
- Allowed editable fields (from TDD): `name`, `preferred_language`, `city`, `date_of_birth`
- `phone` and `firebase_uid` are **NOT** editable via this route

**Route 3:** `PUT /api/v1/profiles/patient` (for the patient profile form)
- Updates their row in `patient_profiles` table
- Fields: `diagnosis`, `emergency_contact_*`, `home_address`, `tts_speed`, etc.

**Route 4:** `PUT /api/v1/profiles/caregiver` (for the caregiver profile form)
- Updates their row in `caregiver_profiles` table
- Fields: `bio`, `years_of_experience`, `specializations`, `hourly_rate_inr`, etc.

---

## 🔌 Phase 4: Wire Everything Into server.ts

Once the routes are built, register them in `backend/server.ts`:

```typescript
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/profiles', profilesRouter);
```

---

## 🔌 Phase 5: Frontend Integration

After all backend routes are manually tested:

1. Install Firebase Auth client SDK in the React Native folder
2. Configure Firebase in the mobile app
3. Build SignIn and SignUp screens using Firebase Auth Phone verification
4. Create an API utility in `app/api/client.ts` that:
   - Gets the token: `const token = await user.getIdToken()`
   - Attaches it: `Authorization: Bearer ${token}`
5. Call `POST /api/v1/auth/provision` right after first sign-in
6. Build Profile screens that call `GET /api/v1/users/me` and `PATCH /api/v1/users/me`

---

## 🗺️ Three-Layer Architecture (Required by AI_GUIDE.md)

Every module must follow this structure. Do NOT put DB queries directly in the router.

```
backend/modules/auth/
├── auth.router.ts      → Defines the route, applies middleware
├── auth.controller.ts  → Extracts data from req, calls service, sends res
└── auth.service.ts     → Contains all database queries and business logic
```

---

## ⚡ Quick Reference: What We Changed vs. What the TDD Says

| TDD Says | What We Do Instead | Why |
|---|---|---|
| `POST /auth/otp/request` | ❌ Not implementing | Firebase handles OTPs on the frontend |
| `POST /auth/otp/verify` | ❌ Not implementing | Firebase handles verification |
| `POST /auth/refresh` | ❌ Not implementing | Firebase handles token refresh |
| `otp_requests` table | ❌ Removed | Firebase's responsibility |
| `auth_sessions` table | ❌ Removed | Firebase's responsibility |
| `GET /users/me` | ✅ Keep exactly as TDD says | Same route, same response |
| `PATCH /users/me` | ✅ Keep exactly as TDD says | Same route, same response |
| `PUT /profiles/patient` | ✅ Keep exactly as TDD says | Same route, same response |
| `PUT /profiles/caregiver` | ✅ Keep exactly as TDD says | Same route, same response |
| Bearer JWT in header | ✅ Keep — now it's Firebase's ID Token | Same mechanism, different issuer |
