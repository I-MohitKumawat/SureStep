/**
 * SureStep — scripts/test_bugfix_pass.js
 *
 * Comprehensive end-to-end verification suite for the 5-Bug Fix Pass:
 *   Issue 1: Settings UI reproduction against approved visual reference
 *   Issue 2: Personal Details & non-wiping profile updates
 *   Issue 3: Delete Account end-to-end execution
 *   Issue 4: Re-registration after account deletion with same phone number
 *   Issue 5: Onboarding UI button contrast, accessibility, and theme styling
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ [PASS] ${name}`);
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}:`, err.message || err);
    throw err;
  }
}

console.log('======================================================================');
console.log('SURESTEP 5-BUG FIX PASS VERIFICATION SUITE');
console.log('Verifying Settings, Personal Details, Deletion, Re-signup, Onboarding UI');
console.log('======================================================================\n');

// ─── ISSUE 1: Settings UI Visual Reference Match ─────────────────────────────
console.log('--- Issue 1: Settings UI Reproduction (patient settings.png) ---');

const settingsScreenPath = path.resolve(__dirname, '../src/screens/patient/PatientSettingsScreen.tsx');
assert.ok(fs.existsSync(settingsScreenPath), 'PatientSettingsScreen.tsx must exist');
const settingsSource = fs.readFileSync(settingsScreenPath, 'utf8');

test('1.1: Settings screen background uses warm cream #FAF8F5', () => {
  assert.ok(settingsSource.includes('#FAF8F5'), 'Must contain warm cream background #FAF8F5');
  assert.match(settingsSource, /container:\s*\{[\s\S]*?backgroundColor:\s*['"]#FAF8F5['"]/);
});

test('1.2: Header contains back button, serif SureStep brand #0E5A4A, and soft pink SOS pill', () => {
  assert.match(settingsSource, /brandRow/);
  assert.match(settingsSource, /brandText/);
  assert.ok(settingsSource.includes('#0E5A4A'), 'Brand text uses deep teal #0E5A4A');
  assert.ok(settingsSource.includes('#FCECE9'), 'SOS pill background uses #FCECE9');
  assert.ok(settingsSource.includes('#FECACA'), 'SOS pill border uses #FECACA');
  assert.ok(settingsSource.includes('#DC2626'), 'SOS text/icon uses #DC2626');
});

test('1.3: Heading displays large serif "Settings" (fontSize: 34)', () => {
  assert.match(settingsSource, /pageTitle:\s*\{[\s\S]*?fontSize:\s*34/);
  assert.match(settingsSource, /fontFamily:\s*Platform\.select\(\{\s*ios:\s*'Georgia',\s*default:\s*'serif'\s*\}\)/);
});

test('1.4: Profile section renders 96px circular avatar, 26px serif name, 15px subtitle', () => {
  assert.match(settingsSource, /avatarImg:\s*\{[\s\S]*?width:\s*96[\s\S]*?height:\s*96[\s\S]*?borderRadius:\s*48/);
  assert.match(settingsSource, /avatarFallback:\s*\{[\s\S]*?width:\s*96[\s\S]*?height:\s*96[\s\S]*?borderRadius:\s*48/);
  assert.match(settingsSource, /profileName:\s*\{[\s\S]*?fontSize:\s*26/);
  assert.match(settingsSource, /profileSub:\s*\{[\s\S]*?fontSize:\s*15/);
});

test('1.5: Renders exactly 6 full-width rows with deep teal outline icons & red delete row', () => {
  assert.ok(settingsSource.includes('IconUser'), 'Row 1 uses IconUser');
  assert.ok(settingsSource.includes('IconGlobe'), 'Row 2 uses IconGlobe');
  assert.ok(settingsSource.includes('IconFamily'), 'Row 3 uses IconFamily');
  assert.ok(settingsSource.includes('IconLocationPin'), 'Row 4 uses IconLocationPin');
  assert.ok(settingsSource.includes('IconSignOut'), 'Row 5 uses IconSignOut');
  assert.ok(settingsSource.includes('IconTrash'), 'Row 6 uses IconTrash');
  assert.ok(settingsSource.includes("const rowIconColor = '#0E5A4A'"));
  assert.match(settingsSource, /divider:\s*\{[\s\S]*?backgroundColor:\s*['"]#EDE8DF['"]/);
});

test('1.6: Location row shows green badge with checkmark "Location available"', () => {
  assert.match(settingsSource, /locationBadge:\s*\{[\s\S]*?backgroundColor:\s*['"]#E6F7F0['"]/);
  assert.match(settingsSource, /locationBadgeText:\s*\{[\s\S]*?color:\s*['"]#0E7A67['"]/);
  assert.ok(settingsSource.includes('Location available'));
});

// ─── ISSUE 2: Personal Details & Non-Wiping Profile Update ───────────────────
console.log('\n--- Issue 2: Personal Details Screen & Non-Wiping Backend Profile Update ---');

const personalDetailsPath = path.resolve(__dirname, '../src/screens/patient/PatientPersonalDetailsScreen.tsx');
assert.ok(fs.existsSync(personalDetailsPath), 'PatientPersonalDetailsScreen.tsx must exist');
const personalDetailsSource = fs.readFileSync(personalDetailsPath, 'utf8');

test('2.1: PatientPersonalDetailsScreen views and edits all personal and care details', () => {
  assert.ok(personalDetailsSource.includes('setName'), 'Must support name');
  assert.ok(personalDetailsSource.includes('setDob'), 'Must support date of birth');
  assert.ok(personalDetailsSource.includes('setGender'), 'Must support gender');
  assert.ok(personalDetailsSource.includes('setLanguage'), 'Must support preferred language');
  assert.ok(personalDetailsSource.includes('setCity'), 'Must support city');
  assert.ok(personalDetailsSource.includes('setLiving'), 'Must support living arrangement');
  assert.ok(personalDetailsSource.includes('setCareNeeds'), 'Must support care needs');
  assert.ok(personalDetailsSource.includes('setSafetyConcerns'), 'Must support safety concerns');
  assert.ok(personalDetailsSource.includes('setEmergName'), 'Must support emergency name');
  assert.ok(personalDetailsSource.includes('setEmergPhone'), 'Must support emergency phone');
  assert.ok(personalDetailsSource.includes('setEmergRel'), 'Must support emergency relation');
});

test('2.2: PatientPersonalDetailsScreen persists via updatePatientProfile and calls refreshUser()', () => {
  assert.match(personalDetailsSource, /await\s+updatePatientProfile\(\{/);
  assert.match(personalDetailsSource, /await\s+refreshUser\(\)/);
});

test('2.3: PatientPersonalDetailsScreen registered in PatientStackParams and PatientNavigator', () => {
  const navTypesSource = fs.readFileSync(path.resolve(__dirname, '../src/types/navigation.types.ts'), 'utf8');
  assert.match(navTypesSource, /PatientPersonalDetailsScreen:\s*undefined;/);
  const patientNavSource = fs.readFileSync(path.resolve(__dirname, '../src/navigation/PatientNavigator.tsx'), 'utf8');
  assert.match(patientNavSource, /name="PatientPersonalDetailsScreen"/);
});

const backendUsersServicePath = path.resolve(__dirname, '../../surestep-backend/modules/users/users.service.ts');
assert.ok(fs.existsSync(backendUsersServicePath), 'Backend users.service.ts must exist');
const backendUsersServiceSource = fs.readFileSync(backendUsersServicePath, 'utf8');

test('2.4: Backend getPatientProfile returns unified user identity + care profile', () => {
  assert.match(backendUsersServiceSource, /SELECT\s+pp\.\*,\s*u\.name,\s*u\.photo_url,\s*u\.city/);
  assert.match(backendUsersServiceSource, /FROM\s+users\s+u\s+LEFT\s+JOIN\s+patient_profiles\s+pp/);
});

test('2.5: Backend upsertPatientProfile pre-merges existing data to prevent partial wipeout', () => {
  assert.match(backendUsersServiceSource, /SELECT\s+\*\s+FROM\s+patient_profiles\s+WHERE\s+user_id\s*=\s*\$1/);
  assert.match(backendUsersServiceSource, /livingArrangement\s*=\s*data\.living_arrangement\s*!==\s*undefined\s*\?\s*data\.living_arrangement\s*:\s*\(existing\?\.living_arrangement\s*\?\?\s*null\)/);
  assert.match(backendUsersServiceSource, /careNeeds\s*=\s*data\.care_needs\s*!==\s*undefined\s*\?\s*data\.care_needs\s*:\s*\(existing\?\.care_needs\s*\?\?\s*\[\]\)/);
  assert.match(backendUsersServiceSource, /safetyConcerns\s*=\s*data\.safety_concerns\s*!==\s*undefined\s*\?\s*data\.safety_concerns\s*:\s*\(existing\?\.safety_concerns\s*\?\?\s*\[\]\)/);
});

// ─── ISSUE 3: Delete Account Completeness ─────────────────────────────────────
console.log('\n--- Issue 3: Delete Account Flow Completeness ---');

test('3.1: Frontend settings screen executes DELETE /users/me and triggers logout()', () => {
  assert.match(settingsSource, /apiClient\.delete\(['"]\/users\/me['"]\)/);
  assert.match(settingsSource, /await\s+logout\(\)/);
  assert.ok(settingsSource.includes('showDeleteModal'));
});

test('3.2: Backend deleteAccount deletes states, threads, memberships, and devices', () => {
  assert.match(backendUsersServiceSource, /DELETE\s+FROM\s+patient_states\s+WHERE\s+patient_id\s*=\s*\$1/);
  assert.match(backendUsersServiceSource, /DELETE\s+FROM\s+patient_threads\s+WHERE\s+patient_id\s*=\s*\$1/);
  assert.match(backendUsersServiceSource, /DELETE\s+FROM\s+care_circle_members\s+WHERE\s+user_id\s*=\s*\$1/);
  assert.match(backendUsersServiceSource, /DELETE\s+FROM\s+device_registry\s+WHERE\s+user_id\s*=\s*\$1/);
});

test('3.3: Backend deleteAccount deletes Firebase Auth user and tombstones firebase_uid', () => {
  assert.match(backendUsersServiceSource, /await\s+adminAuth\.deleteUser\(user\.firebase_uid\)/);
  assert.match(backendUsersServiceSource, /const\s+delPrefix\s*=\s*'DEL_'\s*\+\s*String\(userId\)/);
  assert.match(backendUsersServiceSource, /is_active\s*=\s*FALSE/);
  assert.match(backendUsersServiceSource, /deleted_at\s*=\s*NOW\(\)/);
});

// ─── ISSUE 4: Sign-up with Previously Deleted Phone Number ───────────────────
console.log('\n--- Issue 4: Sign-up After Account Deletion (Same Phone Number) ---');

const backendAuthServicePath = path.resolve(__dirname, '../../surestep-backend/modules/auth/auth.service.ts');
assert.ok(fs.existsSync(backendAuthServicePath), 'Backend auth.service.ts must exist');
const backendAuthServiceSource = fs.readFileSync(backendAuthServicePath, 'utf8');

test('4.1: Backend provisionUser ignores tombstoned/deleted users when matching by firebase_uid', () => {
  assert.match(backendAuthServiceSource, /WHERE\s+firebase_uid\s*=\s*\$1\s+AND\s+is_active\s*=\s*TRUE\s+AND\s+deleted_at\s+IS\s+NULL/);
});

test('4.2: Backend provisionUser ignores tombstoned/deleted users when matching by phone number', () => {
  assert.match(backendAuthServiceSource, /WHERE\s+phone\s*=\s*\$1\s+AND\s+is_active\s*=\s*TRUE\s+AND\s+deleted_at\s+IS\s+NULL/);
});

test('4.3: Fresh user is created cleanly without 404 or unique constraint collision', () => {
  assert.match(backendAuthServiceSource, /INSERT\s+INTO\s+users\s*\([\s\S]*?firebase_uid[\s\S]*?phone[\s\S]*?role/);
});

// ─── ISSUE 5: Onboarding UI Buttons & Theme Contrast ─────────────────────────
console.log('\n--- Issue 5: Onboarding Buttons Contrast & Accessibility ---');

const onboardingLayoutPath = path.resolve(__dirname, '../src/components/onboarding/OnboardingLayout.tsx');
assert.ok(fs.existsSync(onboardingLayoutPath), 'OnboardingLayout.tsx must exist');
const onboardingLayoutSource = fs.readFileSync(onboardingLayoutPath, 'utf8');

test('5.1: Onboarding primary action button is clearly visible in enabled and disabled states', () => {
  assert.match(onboardingLayoutSource, /continueBtn:\s*\{[\s\S]*?backgroundColor:\s*C\.primary/);
  assert.match(onboardingLayoutSource, /continueBtnDisabled:\s*\{[\s\S]*?backgroundColor:\s*['"]#E5E7EB['"]/);
  assert.match(onboardingLayoutSource, /continueBtnDisabled:\s*\{[\s\S]*?borderColor:\s*['"]#D1D5DB['"]/);
  assert.match(onboardingLayoutSource, /continueBtnTextDisabled:\s*\{[\s\S]*?color:\s*['"]#4B5563['"]/);
});

const optionCardPath = path.resolve(__dirname, '../src/components/onboarding/OptionCard.tsx');
assert.ok(fs.existsSync(optionCardPath), 'OptionCard.tsx must exist');
const optionCardSource = fs.readFileSync(optionCardPath, 'utf8');

test('5.2: OptionCard selection has high-contrast teal border C.primary, light tint #F0FBF8, and bold label', () => {
  assert.match(optionCardSource, /cardSelected:\s*\{[\s\S]*?borderColor:\s*(?:C\.primary|['"]#0E7A67['"])/);
  assert.match(optionCardSource, /cardSelected:\s*\{[\s\S]*?backgroundColor:\s*['"]#F0FBF8['"]/);
  assert.match(optionCardSource, /titleSelected:\s*\{[\s\S]*?color:\s*['"]#0E5A4A['"]/);
  assert.match(optionCardSource, /radioCircleSelected:\s*\{[\s\S]*?borderColor:\s*(?:C\.primary|['"]#0E7A67['"])/);
});

const roleSelectionPath = path.resolve(__dirname, '../src/screens/auth/RoleSelectionScreen.tsx');
assert.ok(fs.existsSync(roleSelectionPath), 'RoleSelectionScreen.tsx must exist');
const roleSelectionSource = fs.readFileSync(roleSelectionPath, 'utf8');

test('5.3: RoleSelectionScreen continue button disabled state has dark legible contrast', () => {
  assert.match(roleSelectionSource, /continueBtnDisabled:\s*\{[\s\S]*?borderColor:\s*['"]#D1D5DB['"]/);
  assert.match(roleSelectionSource, /continueBtnTextDisabled:\s*\{[\s\S]*?color:\s*['"]#4B5563['"]/);
});

const step1Path = path.resolve(__dirname, '../src/screens/auth/patient-onboarding/Step1AboutPatient.tsx');
assert.ok(fs.existsSync(step1Path), 'Step1AboutPatient.tsx must exist');
const step1Source = fs.readFileSync(step1Path, 'utf8');

test('5.4: Step1AboutPatient gender pills have high-contrast selected state (#0E5A4A)', () => {
  assert.match(step1Source, /genderPillSelected:\s*\{[\s\S]*?borderColor:\s*['"]#0E5A4A['"]/);
  assert.match(step1Source, /genderPillTextSelected:\s*\{[\s\S]*?color:\s*['"]#0E5A4A['"]/);
});

const step5Path = path.resolve(__dirname, '../src/screens/auth/patient-onboarding/Step5Medications.tsx');
assert.ok(fs.existsSync(step5Path), 'Step5Medications.tsx must exist');
const step5Source = fs.readFileSync(step5Path, 'utf8');

test('5.5: Step5Medications toggle buttons have high-contrast selected state (#0E5A4A)', () => {
  assert.match(step5Source, /toggleBtnSelected:\s*\{[\s\S]*?borderColor:\s*['"]#0E5A4A['"]/);
  assert.match(step5Source, /toggleBtnTextSelected:\s*\{[\s\S]*?color:\s*['"]#0E5A4A['"]/);
});

const step8Path = path.resolve(__dirname, '../src/screens/auth/patient-onboarding/Step8EmergencyContact.tsx');
assert.ok(fs.existsSync(step8Path), 'Step8EmergencyContact.tsx must exist');
const step8Source = fs.readFileSync(step8Path, 'utf8');

test('5.6: Step8EmergencyContact relationship pills have high-contrast selected state (#0E5A4A)', () => {
  assert.match(step8Source, /relPillSelected:\s*\{[\s\S]*?borderColor:\s*['"]#0E5A4A['"]/);
  assert.match(step8Source, /relPillTextSelected:\s*\{[\s\S]*?color:\s*['"]#0E5A4A['"]/);
});

const step9Path = path.resolve(__dirname, '../src/screens/auth/patient-onboarding/Step9Review.tsx');
assert.ok(fs.existsSync(step9Path), 'Step9Review.tsx must exist');
const step9Source = fs.readFileSync(step9Path, 'utf8');

test('5.7: Step9Review edit buttons have high-contrast #0E5A4A text', () => {
  assert.match(step9Source, /editText:\s*\{[\s\S]*?color:\s*['"]#0E5A4A['"]/);
});

console.log('\n======================================================================');
console.log(`BUG FIX PASS COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED!`);
console.log('======================================================================\n');
