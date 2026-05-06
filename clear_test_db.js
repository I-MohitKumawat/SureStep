const { createClient } = require('@supabase/supabase-js');

let dbUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
let dbKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!dbUrl) {
  try {
    require('dotenv').config({ path: '.env' });
    dbUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    dbKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  } catch(e) {}
}

if (!dbUrl || !dbKey) {
  console.log('Supabase config missing, skipping DB clear.');
  process.exit(0);
}

const supabase = createClient(dbUrl, dbKey);

async function run() {
  console.log('⏳ Clearing all test users and data...');

  // Wipe all user data — order matters (FK constraints)
  await supabase.from('patient_caregiver_links').delete().neq('patient_phone', 'NEVER');
  await supabase.from('tasks').delete().neq('id', 'NEVER');
  await supabase.from('routines').delete().neq('id', 'NEVER');
  await supabase.from('mock_users').delete().neq('phone_number', 'NEVER');
  await supabase.from('caregivers').delete().neq('id', 'NEVER');
  await supabase.from('patients').delete().neq('id', 'NEVER');

  // Bump force_logout_at to NOW → all devices will force-logout on next app open
  await supabase.from('dev_config').upsert({
    id: 1,
    force_logout_at: new Date().toISOString(),
  });

  console.log('✓ All test data cleared.');
  console.log('✓ force_logout_at bumped — all devices will be logged out.');
  console.log('  → Rescan Expo Go QR code or shake → Reload to start fresh.');
  console.log('  → Register any 10-digit number with OTP 0000 to create a new account.');
}

run().catch(console.error);
