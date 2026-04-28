-- Supabase Schema for SureStep
-- Run this entire file in the Supabase SQL Editor after any DROP SCHEMA reset.

-- ── Step 0: Restore grants wiped by DROP SCHEMA public CASCADE ───────────────
-- Without these the anon/authenticated roles get 42501 on every query.
GRANT USAGE  ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL    ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL    ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL    ON ALL ROUTINES  IN SCHEMA public TO anon, authenticated, service_role;

-- Default privileges so future tables get the same grants automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON ROUTINES  TO anon, authenticated, service_role;

-- 1. Create routines table
CREATE TABLE IF NOT EXISTS public.routines (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    schedule_label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    routine_id TEXT REFERENCES public.routines(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    time TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'done', 'missed', 'unsure')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Realtime on the tasks and routines tables
-- (You can also do this in the Dashboard: Database "Replication" settings)
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.routines;

-- 4. Enable Row Level Security (RLS) and define basic policies
-- For simplicity in development, we allow all operations. In production, 
-- restrict based on auth.uid() or specific caregiver/patient mappings.
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.routines FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users" ON public.routines FOR ALL USING (true);

CREATE POLICY "Enable read access for all users" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users" ON public.tasks FOR ALL USING (true);

-- 7. Create caregivers table for search feature
CREATE TABLE public.caregivers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialty TEXT DEFAULT 'General',
    patients INTEGER DEFAULT 0,
    rating NUMERIC DEFAULT 5.0,
    fee TEXT DEFAULT 'Free',
    emoji TEXT DEFAULT '🧑‍⚕️',
    bio TEXT,
    availability TEXT DEFAULT 'Flexible',
    location TEXT DEFAULT 'Remote'
);
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.caregivers FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users" ON public.caregivers FOR ALL USING (true);

INSERT INTO public.caregivers (id, name, specialty, bio, availability, location) VALUES
('1111111111', 'Ramesh Kumar', 'Family Caregiver', 'Dedicated family caregiver with years of experience supporting elderly patients in daily routines.', 'Daily – 8 AM to 8 PM', 'Bangalore, India')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, bio = EXCLUDED.bio;

-- 5. Create mock_users table for testing
CREATE TABLE public.mock_users (
    phone_number TEXT PRIMARY KEY,
    otp TEXT NOT NULL,
    role TEXT NOT NULL,
    full_name TEXT,
    dob TEXT,
    gender TEXT,
    city TEXT,
    language TEXT DEFAULT 'English'
);

-- If the table already exists, add the new columns safely:
ALTER TABLE public.mock_users ADD COLUMN IF NOT EXISTS dob TEXT;
ALTER TABLE public.mock_users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.mock_users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.mock_users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English';

ALTER TABLE public.mock_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.mock_users FOR SELECT USING (true);

-- 6. Insert Test Seed Data
INSERT INTO public.mock_users (phone_number, otp, role, full_name) VALUES 
('1111111111', '1111', 'caregiver', 'Ramesh Kumar'),
('2222222222', '2222', 'patient', 'Srinivas Rao')
ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name;

INSERT INTO public.routines (id, patient_id, name, schedule_label) VALUES 
('r-1', '2222222222', 'Morning Routine', 'Daily'),
('r-2', '2222222222', 'Evening Routine', 'Daily')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tasks (id, patient_id, routine_id, title, time, status) VALUES 
('t-1', '2222222222', 'r-1', 'Take Medicine', '08:00 AM', 'pending'),
('t-2', '2222222222', 'r-1', 'Eat Breakfast', '08:30 AM', 'pending'),
('t-3', '2222222222', 'r-2', 'Drink Water', '06:00 PM', 'pending')
ON CONFLICT (id) DO NOTHING;

-- Allow new users to register themselves
CREATE POLICY "Enable write access for all users" ON public.mock_users FOR ALL USING (true);

-- 8. Patient-Caregiver confirmation links
-- A row here means the patient has confirmed that caregiver. Only then does the
-- caregiver see that patient on their dashboard.
CREATE TABLE IF NOT EXISTS public.patient_caregiver_links (
    patient_phone  TEXT NOT NULL,
    caregiver_phone TEXT NOT NULL,
    confirmed_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (patient_phone, caregiver_phone)
);
ALTER TABLE public.patient_caregiver_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users"  ON public.patient_caregiver_links FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users" ON public.patient_caregiver_links FOR ALL    USING (true);
-- NOTE: No seed data here. The patient must confirm their caregiver from within the app.

-- 9. Dev config table — used by start:clear to force-logout all devices
CREATE TABLE IF NOT EXISTS public.dev_config (
    id          INTEGER PRIMARY KEY DEFAULT 1,         -- always single row
    force_logout_at TIMESTAMP WITH TIME ZONE DEFAULT '2020-01-01T00:00:00Z',
    CHECK (id = 1)                                     -- enforce single-row constraint
);
ALTER TABLE public.dev_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users"  ON public.dev_config FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users" ON public.dev_config FOR ALL    USING (true);

-- Seed single config row (safe to run multiple times)
INSERT INTO public.dev_config (id, force_logout_at)
VALUES (1, '2020-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
