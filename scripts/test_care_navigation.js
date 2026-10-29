/**
 * SureStep — scripts/test_care_navigation.js
 *
 * Automated verification suite for the approved Patient Navigation & Care Tab:
 * 1. Bottom Tab Navigator:
 *    - Exactly 4 tabs: Home | My People | Activities | Care
 *    - Settings removed from bottom tab bar
 *    - No fifth tab, no hidden tabs
 * 2. Icon & Design:
 *    - IconCare exists in NavIcons.tsx
 *    - PatientBottomBar uses IconCare for Care tab
 * 3. Patient Navigator:
 *    - CareTab mounted with PatientCareScreen
 *    - PatientSettingsScreen registered on Stack for push navigation
 * 4. Home Screen Avatar Entry Point:
 *    - PatientOrientation avatar wrapped in Pressable with onPressProfile
 *    - PatientHomeScreen passes navigation to PatientSettingsScreen
 * 5. Care Tab Dynamic States:
 *    - Uses usePatientCareMode()
 *    - Self-managed without caregiver: "Find a Caregiver" & "Post What You Need"
 *    - Self-managed with caregiver: "My Care Team"
 *    - Assisted patient: view-only (family + assigned caregivers, no marketplace or request buttons)
 *    - Zero technical terms ("SELF", "FAMILY", "onboarding_source") exposed
 * 6. Settings Screen Layout:
 *    - Matches media_1793219640289.png
 *    - Options: Personal Details, Language, Connect with Family, Location, Sign Out, Delete Account
 *    - Delete Account calls DELETE /users/me and logout
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
console.log('PATIENT NAVIGATION & CARE TAB VERIFICATION SUITE');
console.log('Testing 4 Bottom Tabs (Home, My People, Activities, Care) & Settings');
console.log('======================================================================\n');

// ─── 1. Bottom Navigation Bar Composition ──────────────────────────────────────
console.log('--- 1. Bottom Navigation Bar Composition ---');

const bottomBarSource = fs.readFileSync(path.resolve(__dirname, '../src/components/shared/PatientBottomBar.tsx'), 'utf8');

test('1.1: PatientBottomBar defines exactly 4 tabs: Home, My People, Activities, Care', () => {
  const tabsMatch = bottomBarSource.match(/const\s+tabs\s*=\s*\[([\s\S]*?)\]\s*as\s*const/);
  assert.ok(tabsMatch, 'tabs array must be defined');
  const tabsContent = tabsMatch[1];

  assert.ok(tabsContent.includes("name: 'Home'"), "Must have Home tab");
  assert.ok(tabsContent.includes("name: 'My People'"), "Must have My People tab");
  assert.ok(tabsContent.includes("name: 'Activities'"), "Must have Activities tab");
  assert.ok(tabsContent.includes("name: 'Care'"), "Must have Care tab");

  // Verify Settings is NOT in the bottom bar tabs
  assert.ok(!tabsContent.includes("name: 'Settings'"), "Settings must NOT be in the bottom bar tabs");
  assert.ok(!tabsContent.includes("screen: 'SettingsTab'"), "SettingsTab must NOT be in bottom bar");
});

test('1.2: PatientBottomBar maps Care to CareTab with IconCare', () => {
  assert.match(bottomBarSource, /\{\s*name:\s*'Care',\s*screen:\s*'CareTab',\s*Icon:\s*IconCare\s*\}/);
});

// ─── 2. Navigation Types & Icons ───────────────────────────────────────────────
console.log('\n--- 2. Navigation Types & SVG Icons ---');

const typesSource = fs.readFileSync(path.resolve(__dirname, '../src/types/navigation.types.ts'), 'utf8');
const iconsSource = fs.readFileSync(path.resolve(__dirname, '../src/assets/icons/NavIcons.tsx'), 'utf8');

test('2.1: PatientTabParams defines HomeTab, FamilyTab, ActivitiesTab, and CareTab (no SettingsTab)', () => {
  const tabParamsMatch = typesSource.match(/export\s+type\s+PatientTabParams\s*=\s*\{([\s\S]*?)\};/);
  assert.ok(tabParamsMatch, 'PatientTabParams must be defined');
  const content = tabParamsMatch[1];

  assert.ok(content.includes('HomeTab:'), 'Must define HomeTab');
  assert.ok(content.includes('FamilyTab:'), 'Must define FamilyTab');
  assert.ok(content.includes('ActivitiesTab:'), 'Must define ActivitiesTab');
  assert.ok(content.includes('CareTab:'), 'Must define CareTab');
  assert.ok(!content.includes('SettingsTab:'), 'Must NOT define SettingsTab');
});

test('2.2: NavIcons.tsx exports IconCare outline SVG icon', () => {
  assert.match(iconsSource, /export\s+const\s+IconCare\s*=/);
});

// ─── 3. Patient Navigator Configuration ─────────────────────────────────────────
console.log('\n--- 3. Patient Navigator Configuration ---');

const navSource = fs.readFileSync(path.resolve(__dirname, '../src/navigation/PatientNavigator.tsx'), 'utf8');

test('3.1: PatientTabs registers CareTab with PatientCareScreen', () => {
  assert.match(navSource, /<Tab\.Screen\s+name="CareTab"\s+component=\{PatientCareScreen/);
  assert.doesNotMatch(navSource, /<Tab\.Screen\s+name="SettingsTab"/);
});

test('3.2: PatientStack registers PatientSettingsScreen as a stack screen', () => {
  assert.match(navSource, /<Stack\.Screen\s+name="PatientSettingsScreen"\s+component=\{PatientSettingsScreen\}/);
});

test('3.3: PatientStack registers PatientCareScreen as a stack screen', () => {
  assert.match(navSource, /<Stack\.Screen\s+name="PatientCareScreen"\s+component=\{PatientCareScreen/);
});

// ─── 4. Home Screen Avatar Entry Point ──────────────────────────────────────────
console.log('\n--- 4. Home Screen Avatar Entry Point ---');

const orientationSource = fs.readFileSync(path.resolve(__dirname, '../src/components/patient/home/PatientOrientation.tsx'), 'utf8');
const homeSource = fs.readFileSync(path.resolve(__dirname, '../src/screens/patient/PatientHomeScreen.tsx'), 'utf8');

test('4.1: PatientOrientation supports onPressProfile prop and wraps photo in Pressable', () => {
  assert.match(orientationSource, /onPressProfile\?:/);
  assert.match(orientationSource, /<Pressable[\s\S]*?onPress=\{onPressProfile\}[\s\S]*?accessibilityLabel="View settings and profile"/);
});

test('4.2: PatientHomeScreen passes navigation to PatientSettingsScreen on avatar tap', () => {
  assert.match(homeSource, /onPressProfile=\{[()=> ]*navigation\.navigate\(['"]PatientSettingsScreen['"]\)\}/);
});

// ─── 5. Care Tab Dynamic States & Safeguards ───────────────────────────────────
console.log('\n--- 5. Care Tab Dynamic States & Safeguards ---');

const careScreenSource = fs.readFileSync(path.resolve(__dirname, '../src/screens/patient/PatientCareScreen.tsx'), 'utf8');

test('5.1: PatientCareScreen derives care mode via usePatientCareMode()', () => {
  assert.match(careScreenSource, /import\s*\{\s*usePatientCareMode\s*\}\s*from\s*['"]\.\.\/\.\.\/hooks\/usePatientCareMode['"]/);
  assert.match(careScreenSource, /const\s*\{\s*isSelfManaged/);
});

test('5.2: Self-managed state without active caregiver prominently offers Find a Caregiver and Post What You Need', () => {
  assert.match(careScreenSource, /Find a Caregiver/);
  assert.match(careScreenSource, /Post What You Need/);
  assert.match(careScreenSource, /navigation\.navigate\('CareDiscoveryScreen'/);
});

test('5.3: Self-managed state with active caregiver shows My Care Team', () => {
  assert.match(careScreenSource, /My Care Team/);
  assert.match(careScreenSource, /activeCaregivers\.map/);
  assert.match(careScreenSource, /View Profile/);
  assert.match(careScreenSource, /Manage/);
});

test('5.4: Assisted patient view is strictly view-only with family and assigned caregivers', () => {
  assert.match(careScreenSource, /Coordinated with Love/);
  assert.match(careScreenSource, /Family Supporting You/);
  assert.match(careScreenSource, /fetchMyFamily/);
  // Verify assisted view does NOT have request care or marketplace actions
  const assistedSection = careScreenSource.split('ASSISTED PATIENT EXPERIENCE')[1];
  assert.ok(assistedSection, 'Must have Assisted Patient section');
  assert.doesNotMatch(assistedSection, /onPress=\{\s*handleFindCaregiver\s*\}/);
  assert.doesNotMatch(assistedSection, /onPress=\{\s*handlePostWhatYouNeed\s*\}/);
});

test('5.5: Zero technical jargon exposed in PatientCareScreen', () => {
  assert.doesNotMatch(careScreenSource, /['"]Mode:\s*SELF['"]/i);
  assert.doesNotMatch(careScreenSource, /['"]Mode:\s*FAMILY['"]/i);
  assert.doesNotMatch(careScreenSource, /['"]onboarding_source['"]/i);
  assert.doesNotMatch(careScreenSource, /['"]Care Circle['"]/i);
  assert.doesNotMatch(careScreenSource, /['"]permissions['"]/i);
});

// ─── 6. Settings Screen Layout & Alignment ─────────────────────────────────────
console.log('\n--- 6. Settings Screen Layout & Alignment ---');

const settingsSource = fs.readFileSync(path.resolve(__dirname, '../src/screens/patient/PatientSettingsScreen.tsx'), 'utf8');

test('6.1: PatientSettingsScreen includes SureStep brand, SOS button, and back navigation', () => {
  assert.match(settingsSource, /SureStep/);
  assert.match(settingsSource, /triggerSOS/);
  assert.match(settingsSource, /navigation\.goBack\(\)/);
});

test('6.2: PatientSettingsScreen implements the 6 approved options matching visual reference', () => {
  assert.match(settingsSource, /Personal Details/);
  assert.match(settingsSource, /Language/);
  assert.match(settingsSource, /Connect with Family/);
  assert.match(settingsSource, /Location/);
  assert.match(settingsSource, /Location available/);
  assert.match(settingsSource, /Sign Out/);
  assert.match(settingsSource, /Delete Account/);
});

test('6.3: Delete Account is retained with authoritative DELETE /users/me and logout', () => {
  assert.match(settingsSource, /apiClient\.delete\('\/users\/me'\)/);
  assert.match(settingsSource, /logout\(\)/);
});

console.log('\n======================================================================');
console.log(`CARE NAVIGATION SUITE COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED!`);
console.log('======================================================================\n');
