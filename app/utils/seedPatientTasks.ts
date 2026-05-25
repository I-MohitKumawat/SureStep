// import { supabase } from './supabaseClient'; // REMOVED: Supabase migration to Express/PostgreSQL

/**
 * Seeds a default set of routines + tasks for a brand-new patient.
 * Safe to call multiple times — uses ON CONFLICT DO NOTHING.
 */
// REMOVED: Supabase migration to Express/PostgreSQL
export async function seedNewPatientTasks(patientPhone: string): Promise<void> {
  console.warn('[seedPatientTasks] seedNewPatientTasks: Supabase removed, no-op');
}
