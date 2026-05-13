-- ═══════════════════════════════════════════════════════════════════════════
-- SureStep – Geofencing Schema  (IDEMPOTENT — safe to run multiple times)
-- Run in: Supabase Dashboard → SQL Editor → Paste → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ── patient_geofences ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patient_geofences (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    TEXT NOT NULL,
  label         TEXT NOT NULL DEFAULT 'Home',
  latitude      NUMERIC(10, 7) NOT NULL,
  longitude     NUMERIC(10, 7) NOT NULL,
  radius_m      INTEGER NOT NULL DEFAULT 300,
  is_active     BOOLEAN DEFAULT true,
  boundary_type TEXT NOT NULL DEFAULT 'soft',
  created_by    TEXT,
  created_at    TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);
-- Add boundary_type if the table already existed without it
ALTER TABLE public.patient_geofences
  ADD COLUMN IF NOT EXISTS boundary_type TEXT NOT NULL DEFAULT 'soft';

-- Drop + recreate constraint so it always matches (idempotent)
ALTER TABLE public.patient_geofences
  DROP CONSTRAINT IF EXISTS patient_geofences_boundary_type_check;
ALTER TABLE public.patient_geofences
  ADD CONSTRAINT patient_geofences_boundary_type_check
  CHECK (boundary_type IN ('soft', 'hard'));

-- RLS
ALTER TABLE public.patient_geofences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "all_patient_geofences" ON public.patient_geofences;
CREATE POLICY "all_patient_geofences" ON public.patient_geofences
  FOR ALL USING (true) WITH CHECK (true);

-- Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_geofences;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── patient_locations ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patient_locations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   TEXT NOT NULL,
  latitude     NUMERIC(10, 7) NOT NULL,
  longitude    NUMERIC(10, 7) NOT NULL,
  accuracy_m   NUMERIC(8, 2),
  speed_mps    NUMERIC(6, 2),
  heading_deg  NUMERIC(6, 2),
  source       TEXT DEFAULT 'foreground',
  recorded_at  TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.patient_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "all_patient_locations" ON public.patient_locations;
CREATE POLICY "all_patient_locations" ON public.patient_locations
  FOR ALL USING (true) WITH CHECK (true);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_locations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_patient_locations_patient_time
  ON public.patient_locations (patient_id, recorded_at DESC);

-- ── geofence_alerts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.geofence_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      TEXT NOT NULL,
  geofence_id     UUID REFERENCES public.patient_geofences(id) ON DELETE SET NULL,
  breach_type     TEXT NOT NULL,
  boundary_type   TEXT DEFAULT 'soft',
  latitude        NUMERIC(10, 7),
  longitude       NUMERIC(10, 7),
  distance_m      NUMERIC(10, 2),
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.geofence_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "all_geofence_alerts" ON public.geofence_alerts;
CREATE POLICY "all_geofence_alerts" ON public.geofence_alerts
  FOR ALL USING (true) WITH CHECK (true);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.geofence_alerts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── family_links ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.family_links (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_phone     TEXT NOT NULL,
  family_phone      TEXT NOT NULL,
  relationship      TEXT DEFAULT 'Family',
  can_view_location BOOLEAN DEFAULT true,
  can_view_routines BOOLEAN DEFAULT true,
  notify_on_breach  BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(patient_phone, family_phone)
);
ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "all_family_links" ON public.family_links;
CREATE POLICY "all_family_links" ON public.family_links
  FOR ALL USING (true) WITH CHECK (true);

-- ── mock_users role check ──────────────────────────────────────────────────
ALTER TABLE public.mock_users
  DROP CONSTRAINT IF EXISTS mock_users_role_check;
ALTER TABLE public.mock_users
  ADD CONSTRAINT mock_users_role_check
  CHECK (role IN ('caregiver', 'patient', 'family'));
