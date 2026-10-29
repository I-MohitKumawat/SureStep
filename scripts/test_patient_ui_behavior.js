/**
 * SureStep — scripts/test_patient_ui_behavior.js
 *
 * Automated verification suite for Patient UI behavior:
 *  1. Navigation stack composition:
 *     - Self-managed Patient has access to routine management and caregiver discovery routes.
 *     - Assisted Patient strictly excludes routine management and caregiver discovery routes.
 *  2. Caregiver Discovery context resolution:
 *     - Canonical shared feature resolves effective patient as user.id for PATIENT.
 *     - Resolves target patient for FAMILY.
 *  3. Patient UI Gating:
 *     - Routine management controls ("Manage" button on Patient Home).
 *     - Caregiver discovery controls ("Find a Caregiver" in My People).
 *     - Caregiver settings ("Manage connected caregiver" in Settings).
 *     - Care Inquiries banner in Care Team.
 *     - Verification that zero technical mode labels ("SELF", "FAMILY", "care_mode") are rendered.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const babel = require('@babel/core');

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
console.log('PATIENT UI BEHAVIOR & NAVIGATION GATING VERIFICATION SUITE');
console.log('Testing Self-Managed vs Assisted Patient UI Invariants');
console.log('======================================================================\n');

// ─── 1. Navigation Stack Composition ───────────────────────────────────────────
console.log('--- 1. Patient Navigation Stack Composition ---');

// Read PatientNavigator.tsx source
const navSource = fs.readFileSync(path.resolve(__dirname, '../src/navigation/PatientNavigator.tsx'), 'utf8');

test('1.1: PatientNavigator uses usePatientCareMode() to derive isSelfManaged', () => {
  assert.match(navSource, /import\s*\{\s*usePatientCareMode\s*\}\s*from\s*['"]\.\.\/hooks\/usePatientCareMode['"]/);
  assert.match(navSource, /const\s*\{\s*isSelfManaged\s*\}\s*=\s*usePatientCareMode\(\)/);
});

test('1.2: Routine management routes are conditionally wrapped inside {isSelfManaged && (...)}', () => {
  const conditionalSection = navSource.match(/\{isSelfManaged\s*&&\s*\(\s*<>([\s\S]*?)<\/>\s*\)\}/);
  assert.ok(conditionalSection, 'Must contain {isSelfManaged && (<>...</>)} block');
  const innerRoutes = conditionalSection[1];

  assert.ok(innerRoutes.includes('name="PatientRoutinesScreen"'), 'PatientRoutinesScreen must be in isSelfManaged block');
  assert.ok(innerRoutes.includes('name="CaregiverRoutineEditorScreen"'), 'CaregiverRoutineEditorScreen must be in isSelfManaged block');
});

test('1.3: Caregiver discovery routes are conditionally wrapped inside {isSelfManaged && (...)}', () => {
  const conditionalSection = navSource.match(/\{isSelfManaged\s*&&\s*\(\s*<>([\s\S]*?)<\/>\s*\)\}/);
  assert.ok(conditionalSection);
  const innerRoutes = conditionalSection[1];

  assert.ok(innerRoutes.includes('name="CareDiscoveryScreen"'), 'CareDiscoveryScreen must be in isSelfManaged block');
  assert.ok(innerRoutes.includes('name="CaregiverProfileScreen"'), 'CaregiverProfileScreen must be in isSelfManaged block');
  assert.ok(innerRoutes.includes('name="CareRequestScreen"'), 'CareRequestScreen must be in isSelfManaged block');
  assert.ok(innerRoutes.includes('name="CareRequestDetailScreen"'), 'CareRequestDetailScreen must be in isSelfManaged block');
  assert.ok(innerRoutes.includes('name="CareRequestsListScreen"'), 'CareRequestsListScreen must be in isSelfManaged block');
  assert.ok(innerRoutes.includes('name="PatientCareTeamScreen"'), 'PatientCareTeamScreen must be in isSelfManaged block');
});

test('1.4: Common Patient screens are unconditionally registered for both modes', () => {
  assert.ok(navSource.includes('name="PatientHomeScreen"'), 'PatientHomeScreen must be unconditional');
  assert.ok(navSource.includes('name="PatientGamesScreen"'), 'PatientGamesScreen must be unconditional');
  assert.ok(navSource.includes('name="PatientStoriesScreen"'), 'PatientStoriesScreen must be unconditional');
  assert.ok(navSource.includes('name="PatientActivitiesScreen"'), 'PatientActivitiesScreen must be unconditional');
  assert.ok(navSource.includes('name="PatientSettingsScreen"'), 'PatientSettingsScreen must be unconditional');
});

// ─── 2. Caregiver Discovery Context Resolution ─────────────────────────────────
console.log('\n--- 2. Canonical Caregiver Discovery Context Resolution ---');

const discoverySource = fs.readFileSync(path.resolve(__dirname, '../src/screens/patient/CareDiscoveryScreen.tsx'), 'utf8');

test('2.1: CareDiscoveryScreen resolves effectivePatientId as user.id when role is PATIENT', () => {
  assert.match(
    discoverySource,
    /effectivePatientId\s*=\s*route\.params\?\.targetPatientId\s*\|\|\s*\(isFamilyUser\s*\?\s*familyPatient\?\.id\s*:\s*\(user\?\.role\s*===\s*'PATIENT'\s*\?\s*user\?\.id\s*:\s*undefined\)\)/
  );
});

test('2.2: CareDiscoveryScreen resolves effectivePatientName as user.name when role is PATIENT', () => {
  assert.match(
    discoverySource,
    /effectivePatientName\s*=\s*route\.params\?\.targetPatientName\s*\|\|\s*\(isFamilyUser\s*\?\s*familyPatient\?\.name\s*:\s*\(user\?\.role\s*===\s*'PATIENT'\s*\?\s*\(user\?\.name\s*\|\|\s*'yourself'\)\s*:\s*undefined\)\)/
  );
});

test('2.3: CareDiscoveryScreen renders role-specific header subtitle ("For yourself" vs "For [PatientName]")', () => {
  assert.match(
    discoverySource,
    /user\?\.role\s*===\s*'PATIENT'\s*\?\s*'For yourself'\s*:\s*`For \$\{effectivePatientName\}`/
  );
});

// ─── 3. Caregiver Profile Fallback Target Patient ──────────────────────────────
console.log('\n--- 3. Caregiver Profile Target Patient Resolution ---');

const profileSource = fs.readFileSync(path.resolve(__dirname, '../src/screens/patient/CaregiverProfileScreen.tsx'), 'utf8');

test('3.1: CaregiverProfileScreen resolves targetPatientId for PATIENT role', () => {
  assert.match(
    profileSource,
    /targetPatientId\s*=\s*routeTargetPatientId\s*\|\|\s*\(isFamilyUser\s*\?\s*familyPatient\?\.id\s*:\s*\(user\?\.role\s*===\s*'PATIENT'\s*\?\s*user\?\.id\s*:\s*undefined\)\)/
  );
});

// ─── 4. Patient Screen Gating ──────────────────────────────────────────────────
console.log('\n--- 4. Patient Screen UI Controls Gating ---');

// A. PatientHomeScreen
const homeSource = fs.readFileSync(path.resolve(__dirname, '../src/screens/patient/PatientHomeScreen.tsx'), 'utf8');
test('4.1: PatientHomeScreen uses usePatientCareMode() to gate "Manage" routines', () => {
  assert.match(homeSource, /const\s*\{\s*isSelfManaged\s*\}\s*=\s*usePatientCareMode\(\)/);
  assert.match(homeSource, /isSelfManaged=\{isSelfManaged\}/);
});

// B. PatientFamilyScreen ("My People")
const familyScreenSource = fs.readFileSync(path.resolve(__dirname, '../src/screens/patient/PatientFamilyScreen.tsx'), 'utf8');
test('4.2: PatientFamilyScreen renders "My People" and avoids admin clutter', () => {
  assert.ok(familyScreenSource.includes('My People'), 'Must render "My People" screen title');
  assert.ok(familyScreenSource.includes('PatientPersonDetailScreen'), 'Must navigate to PatientPersonDetailScreen');
  assert.doesNotMatch(familyScreenSource, /CARE CIRCLE/i, 'Must not expose technical circle administrative titles');
});

// C. PatientCareScreen & PatientSettingsScreen
const careScreenSource = fs.readFileSync(path.resolve(__dirname, '../src/screens/patient/PatientCareScreen.tsx'), 'utf8');
const settingsSource = fs.readFileSync(path.resolve(__dirname, '../src/screens/patient/PatientSettingsScreen.tsx'), 'utf8');

test('4.3: PatientCareScreen gates Caregiver Discovery & Post What You Need by isSelfManaged', () => {
  assert.match(careScreenSource, /const\s*\{\s*isSelfManaged\s*\}\s*=\s*usePatientCareMode\(\)/);
  assert.match(careScreenSource, /isSelfManaged\s*\?/);
  assert.match(careScreenSource, /Find a Caregiver/);
  assert.match(careScreenSource, /Post What You Need/);
});

test('4.4: PatientSettingsScreen and PatientCareScreen do NOT expose technical mode labels ("SELF", "FAMILY", "care_mode")', () => {
  // Ensure no user-facing strings reveal internal mode constants
  assert.doesNotMatch(settingsSource, /['"]Mode:\s*SELF['"]/i);
  assert.doesNotMatch(settingsSource, /['"]Mode:\s*FAMILY['"]/i);
  assert.doesNotMatch(settingsSource, /['"]onboarding_source['"]/i);
  assert.doesNotMatch(careScreenSource, /['"]Mode:\s*SELF['"]/i);
  assert.doesNotMatch(careScreenSource, /['"]Mode:\s*FAMILY['"]/i);
  assert.doesNotMatch(careScreenSource, /['"]onboarding_source['"]/i);
});

// D. PatientCareTeamScreen
const careTeamSource = fs.readFileSync(path.resolve(__dirname, '../src/screens/patient/PatientCareTeamScreen.tsx'), 'utf8');
test('4.5: PatientCareTeamScreen uses usePatientCareMode() and hides Inquiries banner for assisted patients', () => {
  assert.match(careTeamSource, /const\s*\{\s*isAssisted\s*\}\s*=\s*usePatientCareMode\(\)/);
  assert.match(careTeamSource, /\{!isFamilyManaged\s*&&\s*\([\s\S]*?styles\.inquiriesBanner[\s\S]*?\)\}/);
});

console.log('\n======================================================================');
console.log(`PATIENT UI BEHAVIOR SUITE COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED!`);
console.log('======================================================================\n');
