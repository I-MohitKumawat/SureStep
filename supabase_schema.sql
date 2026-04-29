-- Supabase Schema for SureStep
-- Run this entire file in the Supabase SQL Editor to set up a clean database.
-- No seed data — users register themselves via the app with OTP 0000.

-- ── Step 0: Restore grants ────────────────────────────────────────────────────
GRANT USAGE  ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL    ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL    ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL    ON ALL ROUTINES  IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES  TO anon, authenticated, service_role;

-- ── 1. mock_users (phone-based auth) ─────────────────────────────────────────
-- Users register themselves from the app — no seed data.
CREATE TABLE IF NOT EXISTS public.mock_users (
    phone_number TEXT PRIMARY KEY,
    otp          TEXT NOT NULL DEFAULT '0000',
    role         TEXT NOT NULL CHECK (role IN ('caregiver', 'patient')),
    full_name    TEXT
);
ALTER TABLE public.mock_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_mock_users" ON public.mock_users FOR ALL USING (true);

-- ── 2. patients ───────────────────────────────────────────────────────────────
-- Extended patient profile. Created during ProfileSetup.
CREATE TABLE IF NOT EXISTS public.patients (
    id       TEXT PRIMARY KEY,         -- phone number
    name     TEXT NOT NULL,
    dob      TEXT,
    gender   TEXT,
    city     TEXT,
    language TEXT DEFAULT 'English'
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_patients" ON public.patients FOR ALL USING (true);

-- ── 3. caregivers ─────────────────────────────────────────────────────────────
-- Extended caregiver profile + search directory.
CREATE TABLE IF NOT EXISTS public.caregivers (
    id           TEXT PRIMARY KEY,     -- phone number
    name         TEXT NOT NULL,
    specialty    TEXT DEFAULT 'General',
    patients     INTEGER DEFAULT 0,
    rating       NUMERIC DEFAULT 5.0,
    fee          TEXT DEFAULT 'Free',
    emoji        TEXT DEFAULT '🧑‍⚕️',
    bio          TEXT,
    availability TEXT DEFAULT 'Flexible',
    location     TEXT DEFAULT 'Remote'
);
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_caregivers" ON public.caregivers FOR ALL USING (true);

-- ── 4. routines ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.routines (
    id             TEXT PRIMARY KEY,
    patient_id     TEXT NOT NULL,
    name           TEXT NOT NULL,
    is_active      BOOLEAN DEFAULT true,
    schedule_label TEXT,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_routines" ON public.routines FOR ALL USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.routines;

-- ── 5. tasks ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
    id           TEXT PRIMARY KEY,
    patient_id   TEXT NOT NULL,
    routine_id   TEXT REFERENCES public.routines(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    time         TEXT NOT NULL,
    description  TEXT,
    status       TEXT NOT NULL CHECK (status IN ('pending', 'done', 'missed', 'unsure')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_tasks" ON public.tasks FOR ALL USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- ── 6. patient_caregiver_links ────────────────────────────────────────────────
-- A row here means the patient has confirmed that caregiver.
CREATE TABLE IF NOT EXISTS public.patient_caregiver_links (
    patient_phone   TEXT NOT NULL,
    caregiver_phone TEXT NOT NULL,
    confirmed_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    PRIMARY KEY (patient_phone, caregiver_phone)
);
ALTER TABLE public.patient_caregiver_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_links" ON public.patient_caregiver_links FOR ALL USING (true);

-- ── 7. dev_config (force-logout signal) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dev_config (
    id              INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    force_logout_at TIMESTAMP WITH TIME ZONE DEFAULT '2020-01-01T00:00:00Z'
);
ALTER TABLE public.dev_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_dev_config" ON public.dev_config FOR ALL USING (true);

INSERT INTO public.dev_config (id, force_logout_at)
VALUES (1, '2020-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
