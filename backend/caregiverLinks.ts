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
    .eq('status', 'confirmed')
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
    .eq('caregiver_phone', caregiverPhone)
    .eq('status', 'confirmed');

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
    // 2. Create / update the patient→caregiver link as pending
    supabase.from('patient_caregiver_links').upsert({
      patient_phone:   patientPhone,
      caregiver_phone: caregiver.id,
      confirmed_at:    new Date().toISOString(),
      status:          'pending',
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

/**
 * Fetch all pending requests for a caregiver (patients waiting for approval).
 */
export async function fetchPendingRequests(
  caregiverPhone: string,
): Promise<Array<{ patient_phone: string; patient_name: string; confirmed_at: string }>> {
  const { data, error } = await supabase
    .from('patient_caregiver_links')
    .select('patient_phone, confirmed_at')
    .eq('caregiver_phone', caregiverPhone)
    .eq('status', 'pending');

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const phones = data.map((r: { patient_phone: string }) => r.patient_phone);

  const [pRes, uRes] = await Promise.all([
    supabase.from('patients').select('id, name').in('id', phones),
    supabase.from('mock_users').select('phone_number, full_name').in('phone_number', phones),
  ]);

  const nameMap = new Map<string, string>();
  if (pRes.data) {
    for (const p of pRes.data as { id: string; name: string }[]) {
      if (p.name) nameMap.set(p.id, p.name);
    }
  }
  if (uRes.data) {
    for (const u of uRes.data as { phone_number: string; full_name: string }[]) {
      if (!nameMap.has(u.phone_number) && u.full_name)
        nameMap.set(u.phone_number, u.full_name);
    }
  }

  return data.map((r: { patient_phone: string; confirmed_at: string }) => ({
    patient_phone: r.patient_phone,
    patient_name:  nameMap.get(r.patient_phone) ?? `Patient (${r.patient_phone.slice(-4)})`,
    confirmed_at:  r.confirmed_at,
  }));
}

/**
 * Accept or reject a pending patient request.
 */
export async function respondToPatientRequest(
  caregiverPhone: string,
  patientPhone: string,
  action: 'confirmed' | 'rejected',
): Promise<void> {
  if (action === 'rejected') {
    const { error } = await supabase
      .from('patient_caregiver_links')
      .delete()
      .eq('caregiver_phone', caregiverPhone)
      .eq('patient_phone', patientPhone);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('patient_caregiver_links')
      .update({ status: 'confirmed' })
      .eq('caregiver_phone', caregiverPhone)
      .eq('patient_phone', patientPhone);
    if (error) throw error;
  }
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