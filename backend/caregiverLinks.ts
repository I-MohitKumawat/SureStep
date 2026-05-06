/**
 * backend/caregiverLinks.ts
 * Supabase queries for the patient_caregiver_links table.
 * Replaces AsyncStorage-based caregiver link storage in caregiverContext.ts.
 */
import { supabase } from '../app/utils/supabaseClient';
import type { CaregiverListing } from '../app/screens/CaregiverSearchView';

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch the confirmed caregiver for a patient.
 * Joins caregivers table to get full listing details.
 * Returns null if no link exists.
 */
export async function fetchConfirmedCaregiver(
  patientPhone: string,
): Promise<CaregiverListing | null> {
  const { data: link, error: linkError } = await supabase
    .from('patient_caregiver_links')
    .select('caregiver_phone')
    .eq('patient_phone', patientPhone)
    .maybeSingle();

  if (linkError) throw linkError;
  if (!link) return null;

  const { data: caregiver, error: cgError } = await supabase
    .from('caregivers')
    .select('*')
    .eq('id', link.caregiver_phone)
    .maybeSingle();

  if (cgError) throw cgError;
  if (!caregiver) return null;

  return caregiver as CaregiverListing;
}

/**
 * Fetch all patient phones linked to a caregiver.
 */
export async function fetchLinkedPatients(caregiverPhone: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('patient_caregiver_links')
    .select('patient_phone')
    .eq('caregiver_phone', caregiverPhone);

  if (error) throw error;
  return (data ?? []).map((l: { patient_phone: string }) => l.patient_phone);
}

/**
 * Confirm a caregiver for a patient (upsert link row).
 * Also writes patient name to mock_users at confirm time so the caregiver
 * dashboard can show the correct name immediately.
 */
export async function confirmCaregiver(
  patientPhone: string,
  caregiver: CaregiverListing,
  patientName?: string,
): Promise<void> {
  // Run all writes in parallel — each returns { data, error } not reject
  const [cgRes, linkRes, ...nameRes] = await Promise.all([
    // 1. Ensure caregiver row exists
    supabase.from('caregivers').upsert({
      id:           caregiver.id,
      name:         caregiver.name,
      specialty:    caregiver.specialty    ?? 'General',
      patients:     caregiver.patients     ?? 0,
      rating:       caregiver.rating       ?? 5.0,
      fee:          caregiver.fee          ?? 'Free',
      emoji:        caregiver.emoji        ?? '🧑‍⚕️',
      bio:          caregiver.bio          ?? '',
      availability: caregiver.availability ?? 'Flexible',
      location:     caregiver.location     ?? '',
    }),
    // 2. Create / update the patient→caregiver link
    supabase.from('patient_caregiver_links').upsert({
      patient_phone:   patientPhone,
      caregiver_phone: caregiver.id,
      confirmed_at:    new Date().toISOString(),
    }),
    // 3. Write patient name to BOTH tables so caregiver screen shows it immediately
    ...(patientName ? [
      supabase.from('mock_users').upsert({
        phone_number: patientPhone,
        otp:          '0000',
        role:         'patient',
        full_name:    patientName,
      }),
      supabase.from('patients').upsert({
        id:   patientPhone,
        name: patientName,
      }),
    ] : []),
  ]);

  // Supabase resolves (never rejects) — must check .error on each result
  if (cgRes.error)   throw cgRes.error;
  if (linkRes.error) throw linkRes.error;
  for (const res of nameRes) {
    if (res.error) console.warn('[confirmCaregiver] name write failed:', res.error.message);
  }
}

/**
 * Remove a patient-caregiver link.
 */
export async function removeCaregiver(patientPhone: string): Promise<void> {
  const { error } = await supabase
    .from('patient_caregiver_links')
    .delete()
    .eq('patient_phone', patientPhone);
  if (error) throw error;
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

/**
 * Subscribe to link insertions for a specific caregiver.
 * Calls `onNewPatient` when any patient confirms them.
 * Returns cleanup function.
 */
export function subscribeToCaregiversLinks(
  caregiverPhone: string,
  onNewPatient: () => void,
): () => void {
  const channel = supabase
    .channel(`caregiver_links:${caregiverPhone}:${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'patient_caregiver_links',
        filter: `caregiver_phone=eq.${caregiverPhone}`,
      },
      onNewPatient,
    )
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
}
