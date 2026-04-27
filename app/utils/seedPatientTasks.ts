import { supabase } from './supabaseClient';

/**
 * Seeds a default set of routines + tasks for a brand-new patient.
 * Safe to call multiple times — uses ON CONFLICT DO NOTHING.
 */
export async function seedNewPatientTasks(patientPhone: string): Promise<void> {
  const routineId1 = `r-${patientPhone}-morning`;
  const routineId2 = `r-${patientPhone}-evening`;

  await supabase.from('routines').upsert([
    { id: routineId1, patient_id: patientPhone, name: 'Morning Routine', schedule_label: 'Daily', is_active: true },
    { id: routineId2, patient_id: patientPhone, name: 'Evening Routine',  schedule_label: 'Daily', is_active: true },
  ], { onConflict: 'id', ignoreDuplicates: true });

  await supabase.from('tasks').upsert([
    { id: `t-${patientPhone}-1`, patient_id: patientPhone, routine_id: routineId1, title: 'Take Medicine',  time: '08:00 AM', status: 'pending', description: 'Take prescribed morning medication with a glass of water.' },
    { id: `t-${patientPhone}-2`, patient_id: patientPhone, routine_id: routineId1, title: 'Eat Breakfast',  time: '08:30 AM', status: 'pending', description: 'Have a nutritious breakfast — fruits, oats, or idli recommended.' },
    { id: `t-${patientPhone}-3`, patient_id: patientPhone, routine_id: routineId2, title: 'Afternoon Walk',  time: '04:00 PM', status: 'pending', description: 'Take a 15–20 minute walk at a comfortable pace.' },
    { id: `t-${patientPhone}-4`, patient_id: patientPhone, routine_id: routineId2, title: 'Drink Water',     time: '06:00 PM', status: 'pending', description: 'Drink at least one full glass of water.' },
    { id: `t-${patientPhone}-5`, patient_id: patientPhone, routine_id: routineId2, title: 'Evening Medicine', time: '08:00 PM', status: 'pending', description: 'Take prescribed evening medication.' },
  ], { onConflict: 'id', ignoreDuplicates: true });
}
