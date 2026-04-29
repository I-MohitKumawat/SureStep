/**
 * backend/users.ts
 * Supabase queries for user profiles.
 * Source of truth: mock_users (role, full_name) + caregivers (specialty, bio, etc.)
 */
import { supabase } from '../app/utils/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MockUser = {
  phoneNumber: string;
  role: 'patient' | 'caregiver';
  fullName: string | null;
};

export type CaregiverProfile = {
  phoneNumber: string;
  fullName: string;
  specialty: string;
  bio: string;
  availability: string;
  location: string;
  rating: number;
  patients: number;
  fee: string;
  emoji: string;
};

export type PatientProfile = {
  phoneNumber: string;
  fullName: string;
};

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapMockUser(row: Record<string, unknown>): MockUser {
  return {
    phoneNumber: row.phone_number as string,
    role:        row.role as 'patient' | 'caregiver',
    fullName:    (row.full_name as string) ?? null,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Load full_name and role for a phone number.
 */
export async function fetchMockUser(phoneNumber: string): Promise<MockUser | null> {
  const { data, error } = await supabase
    .from('mock_users')
    .select('phone_number, role, full_name')
    .eq('phone_number', phoneNumber)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapMockUser(data as Record<string, unknown>);
}

/**
 * Load full caregiver profile (mock_users + caregivers joined in JS).
 */
export async function fetchCaregiverProfile(phoneNumber: string): Promise<CaregiverProfile | null> {
  const [userResult, cgResult] = await Promise.all([
    supabase
      .from('mock_users')
      .select('full_name')
      .eq('phone_number', phoneNumber)
      .maybeSingle(),
    supabase
      .from('caregivers')
      .select('*')
      .eq('id', phoneNumber)
      .maybeSingle(),
  ]);

  if (userResult.error) throw userResult.error;
  if (cgResult.error) throw cgResult.error;

  const user = userResult.data as { full_name: string } | null;
  const cg   = cgResult.data  as Record<string, unknown> | null;

  if (!user) return null;

  return {
    phoneNumber,
    fullName:     user.full_name ?? 'Anonymous',
    specialty:    (cg?.specialty   as string)  ?? 'General',
    bio:          (cg?.bio         as string)  ?? '',
    availability: (cg?.availability as string) ?? 'Flexible',
    location:     (cg?.location    as string)  ?? 'Remote',
    rating:       (cg?.rating      as number)  ?? 5.0,
    patients:     (cg?.patients    as number)  ?? 0,
    fee:          (cg?.fee         as string)  ?? 'Free',
    emoji:        (cg?.emoji       as string)  ?? '🧑‍⚕️',
  };
}

/**
 * Load patient profile (mock_users only for now).
 */
export async function fetchPatientProfile(phoneNumber: string): Promise<PatientProfile | null> {
  const { data, error } = await supabase
    .from('mock_users')
    .select('phone_number, full_name')
    .eq('phone_number', phoneNumber)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    phoneNumber: row.phone_number as string,
    fullName:    (row.full_name as string) ?? 'Patient',
  };
}

/**
 * Upsert a caregiver's profile into both mock_users and caregivers tables.
 */
export async function saveCaregiverProfile(
  phoneNumber: string,
  profile: { fullName: string; specialty?: string; bio?: string; availability?: string; location?: string; emoji?: string },
): Promise<void> {
  const [userResult, cgResult] = await Promise.all([
    supabase
      .from('mock_users')
      .upsert({ phone_number: phoneNumber, otp: '0000', role: 'caregiver', full_name: profile.fullName }),
    supabase.from('caregivers').upsert({
      id:           phoneNumber,
      name:         profile.fullName,
      specialty:    profile.specialty    ?? 'General',
      bio:          profile.bio          ?? '',
      availability: profile.availability ?? 'Flexible',
      location:     profile.location     ?? 'Remote',
      emoji:        profile.emoji        ?? '🧑‍⚕️',
    }),
  ]);

  if (userResult.error) throw userResult.error;
  if (cgResult.error)   throw cgResult.error;
}

/**
 * Upsert a patient's full_name in mock_users.
 */
export async function savePatientProfile(
  phoneNumber: string,
  profile: { fullName: string },
): Promise<void> {
  // upsert so new patients (who don't yet have a DB row) also get inserted
  const { error } = await supabase
    .from('mock_users')
    .upsert({ phone_number: phoneNumber, otp: '0000', role: 'patient', full_name: profile.fullName });
  if (error) throw error;
}

/**
 * Register a brand-new user (called on first login with an unrecognised phone).
 */
export async function registerUser(
  phoneNumber: string,
  role: 'patient' | 'caregiver',
  fullName?: string,
): Promise<void> {
  const { error } = await supabase.from('mock_users').upsert({
    phone_number: phoneNumber,
    otp:          '0000',   // default dev OTP — change to real OTP flow later
    role,
    full_name:    fullName ?? null,
  });
  if (error) throw error;
}
