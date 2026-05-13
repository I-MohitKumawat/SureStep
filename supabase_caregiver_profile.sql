-- ═══════════════════════════════════════════════════════════════════════════
-- SureStep – Caregiver Professional Profile Schema (IDEMPOTENT)
-- Run in: Supabase Dashboard → SQL Editor → Paste → Run
-- Safe to run multiple times — uses ADD COLUMN IF NOT EXISTS
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Extend caregivers table with professional fields ───────────────────────
ALTER TABLE public.caregivers
  ADD COLUMN IF NOT EXISTS profile_photo_url    TEXT,
  ADD COLUMN IF NOT EXISTS years_experience     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dementia_experience  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS patients_handled     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS specializations      TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages_spoken     TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS availability_types   TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_radius_km    INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS transportation_mode  TEXT    DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS hourly_rate          TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS daily_rate           TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS about_me             TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS certification_url    TEXT,
  ADD COLUMN IF NOT EXISTS id_verification_url  TEXT,
  ADD COLUMN IF NOT EXISTS emergency_response   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_assist_nearby    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS dob                  TEXT,
  ADD COLUMN IF NOT EXISTS gender               TEXT,
  ADD COLUMN IF NOT EXISTS city                 TEXT,
  ADD COLUMN IF NOT EXISTS language             TEXT    DEFAULT 'English';

-- ── Extend patients table with profile photo ────────────────────────────────
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- ── Supabase Storage bucket for profile photos ──────────────────────────────
-- NOTE: Create this manually in Supabase Dashboard → Storage → New Bucket
-- Name: profile-photos  |  Public: YES
-- The SQL below is informational only — buckets cannot be created via SQL.
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true)
-- ON CONFLICT (id) DO NOTHING;

-- ── Update existing RLS policies to include WITH CHECK ──────────────────────
DROP POLICY IF EXISTS "all_caregivers" ON public.caregivers;
CREATE POLICY "all_caregivers" ON public.caregivers
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "all_patients" ON public.patients;
CREATE POLICY "all_patients" ON public.patients
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "all_mock_users" ON public.mock_users;
CREATE POLICY "all_mock_users" ON public.mock_users
  FOR ALL USING (true) WITH CHECK (true);

-- ── Restore grants (run if you get permission errors) ──────────────────────
GRANT USAGE  ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL    ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL    ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
