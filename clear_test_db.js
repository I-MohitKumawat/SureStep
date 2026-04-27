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
  console.log('Clearing extra test users (leaving 1111111111 and 2222222222 intact)...');

  // Remove non-seed users
  await supabase.from('mock_users').delete()
    .neq('phone_number', '1111111111')
    .neq('phone_number', '2222222222');

  await supabase.from('caregivers').delete()
    .neq('id', '1111111111')
    .neq('id', '2222222222');

  // Remove all confirmation links (fresh state — patient must re-confirm)
  await supabase.from('patient_caregiver_links').delete().neq('patient_phone', 'NEVER');

  // Re-seed test users with correct canonical names
  await supabase.from('mock_users').upsert([
    { phone_number: '1111111111', otp: '1111', role: 'caregiver', full_name: 'Ramesh Kumar' },
    { phone_number: '2222222222', otp: '2222', role: 'patient',   full_name: 'Srinivas Rao'  },
  ]);

  await supabase.from('caregivers').upsert({
    id: '1111111111',
    name: 'Ramesh Kumar',
    specialty: 'Family Caregiver',
    bio: 'Dedicated family caregiver with years of experience supporting elderly patients in daily routines.',
    availability: 'Daily – 8 AM to 8 PM',
    location: 'Bangalore, India',
  });

  console.log('✓ Test DB cleared and seed data restored.');
  console.log('  Rescan Expo Go or shake → Reload to start from the login screen.');
}

run();
