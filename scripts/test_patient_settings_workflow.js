/**
 * SureStep — scripts/test_patient_settings_workflow.js
 *
 * Automated verification suite for the Patient Settings workflow:
 *  1. Header Gear Icon Access & Invariants
 *  2. Bottom Tab Exclusivity (No Settings Tab)
 *  3. Settings Main Screen Layout (media_1793224148027.png)
 *  4. Personal Details Viewing & Editing Workflow
 *  5. Language Preference Selection & Persistence
 *  6. Connect with Family 6-Digit Code Workflow
 *  7. Location Screen & Permission Checking (No Safe Zone Admin)
 *  8. Sign Out & Account Deletion Workflows
 *  9. Navigation Stack Registration & Semantic Outline Icons
 * 10. Role Boundaries & Clutter-Free Patient Experience
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
console.log('PATIENT SETTINGS WORKFLOW VERIFICATION SUITE');
console.log('Testing Settings Access, Child Workflows, APIs, & Visual Layout');
console.log('======================================================================\n');

// ─── 1. Header Settings Gear Icon ─────────────────────────────────────────────
console.log('--- 1. Header Settings Gear Icon Access & Invariants ---');

const homeHeaderPath = path.resolve(__dirname, '../src/components/patient/home/HomeHeader.tsx');
assert.ok(fs.existsSync(homeHeaderPath), 'HomeHeader.tsx must exist');
const homeHeaderSource = fs.readFileSync(homeHeaderPath, 'utf8');

test('1.1: HomeHeader renders IconSettings button next to SOS', () => {
  assert.ok(homeHeaderSource.includes('IconSettings'), 'HomeHeader must import IconSettings');
  assert.match(homeHeaderSource, /navigation\.navigate\(['"]PatientSettingsScreen['"]\)/);
  assert.match(homeHeaderSource, /accessibilityLabel=["']Settings["']/);
});

test('1.2: HomeHeader preserves approved Home layout and avatar area', () => {
  assert.ok(homeHeaderSource.includes('showSettings = true'), 'showSettings defaults to true');
  // Confirm HomeHeader does not take over avatar or routine card
  assert.ok(homeHeaderSource.includes('SureStep'), 'SureStep logo branding is preserved');
  assert.ok(homeHeaderSource.includes('SOS'), 'SOS button is preserved in header');
});

const activitiesScreenPath = path.resolve(__dirname, '../src/screens/patient/PatientActivitiesScreen.tsx');
assert.ok(fs.existsSync(activitiesScreenPath), 'PatientActivitiesScreen.tsx must exist');
const activitiesScreenSource = fs.readFileSync(activitiesScreenPath, 'utf8');

test('1.3: PatientActivitiesScreen provides Settings gear icon in header', () => {
  assert.ok(activitiesScreenSource.includes('IconSettings'), 'PatientActivitiesScreen must include IconSettings');
  assert.match(activitiesScreenSource, /navigation\.navigate\(['"]PatientSettingsScreen['"]\)/);
});

// ─── 2. Bottom Tab Exclusivity ────────────────────────────────────────────────
console.log('\n--- 2. Bottom Tab Exclusivity (No Settings Tab) ---');

const patientNavPath = path.resolve(__dirname, '../src/navigation/PatientNavigator.tsx');
assert.ok(fs.existsSync(patientNavPath), 'PatientNavigator.tsx must exist');
const patientNavSource = fs.readFileSync(patientNavPath, 'utf8');

test('2.1: Patient bottom tabs strictly contain Home, My People, Activities, Care', () => {
  assert.ok(patientNavSource.includes('name="HomeTab"'), 'Bottom tab HomeTab must exist');
  assert.ok(patientNavSource.includes('name="FamilyTab"'), 'Bottom tab FamilyTab (My People) must exist');
  assert.ok(patientNavSource.includes('name="ActivitiesTab"'), 'Bottom tab ActivitiesTab must exist');
  assert.ok(patientNavSource.includes('name="CareTab"'), 'Bottom tab CareTab must exist');
});

test('2.2: Settings is NOT present in bottom navigation', () => {
  const bottomTabsBlockMatch = patientNavSource.match(/const\s+PatientTabs[\s\S]*?<\/Tab\.Navigator>/);
  assert.ok(bottomTabsBlockMatch, 'PatientTabs block must exist');
  const bottomTabsBlock = bottomTabsBlockMatch[0];
  assert.doesNotMatch(bottomTabsBlock, /name=["']Settings["']/i, 'Settings must not be a bottom tab');
  assert.doesNotMatch(bottomTabsBlock, /name=["']PatientSettings["']/i, 'PatientSettings must not be a bottom tab');
});

// ─── 3. Main Settings Screen Layout ───────────────────────────────────────────
console.log('\n--- 3. Main Settings Screen Layout (media_1793224148027.png) ---');

const settingsScreenPath = path.resolve(__dirname, '../src/screens/patient/PatientSettingsScreen.tsx');
assert.ok(fs.existsSync(settingsScreenPath), 'PatientSettingsScreen.tsx must exist');
const settingsScreenSource = fs.readFileSync(settingsScreenPath, 'utf8');

test('3.1: Header renders back button, SureStep branding, and SOS button', () => {
  assert.match(settingsScreenSource, /styles\.topHeader/);
  assert.match(settingsScreenSource, /navigation\.goBack\(\)/);
  assert.ok(settingsScreenSource.includes('SureStep'));
  assert.ok(settingsScreenSource.includes('SOS'));
});

test('3.2: Heading displays "Settings"', () => {
  assert.match(settingsScreenSource, /<Text[\s\S]*?styles\.pageTitle[\s\S]*?>\s*Settings\s*<\/Text>/);
});

test('3.3: Profile section displays photo/initials avatar, patient name, and preferred language', () => {
  assert.match(settingsScreenSource, /styles\.avatarWrap/);
  assert.match(settingsScreenSource, /styles\.profileName/);
  assert.match(settingsScreenSource, /styles\.profileSub/);
  assert.match(settingsScreenSource, /currentLanguage/);
});

test('3.4: Renders exactly the 6 approved full-width menu rows with semantic icons', () => {
  // Row 1: Personal Details
  assert.ok(settingsScreenSource.includes('Personal Details'));
  assert.match(settingsScreenSource, /<IconUser/);
  assert.match(settingsScreenSource, /handlePersonalDetails/);

  // Row 2: Language
  assert.ok(settingsScreenSource.includes('Language'));
  assert.match(settingsScreenSource, /<IconGlobe/);
  assert.match(settingsScreenSource, /handleLanguagePress/);

  // Row 3: Connect with Family
  assert.ok(settingsScreenSource.includes('Connect with Family'));
  assert.match(settingsScreenSource, /<IconFamily/);
  assert.match(settingsScreenSource, /handleConnectWithFamily/);

  // Row 4: Location
  assert.ok(settingsScreenSource.includes('Location'));
  assert.match(settingsScreenSource, /<IconLocationPin/);
  assert.match(settingsScreenSource, /handleLocationPress/);

  // Row 5: Sign Out
  assert.ok(settingsScreenSource.includes('Sign Out'));
  assert.match(settingsScreenSource, /<IconSignOut/);
  assert.match(settingsScreenSource, /handleSignOut/);

  // Row 6: Delete Account
  assert.ok(settingsScreenSource.includes('Delete Account'));
  assert.match(settingsScreenSource, /<IconTrash/);
  assert.match(settingsScreenSource, /handleDeleteAccount/);
});

test('3.5: Location row dynamically displays status badge', () => {
  assert.match(settingsScreenSource, /styles\.locationBadge/);
  assert.match(settingsScreenSource, /Location available/);
});

// ─── 4. Personal Details Viewing & Editing ───────────────────────────────────
console.log('\n--- 4. Personal Details Viewing & Editing (PatientProfileScreen.tsx) ---');

const profileScreenPath = path.resolve(__dirname, '../src/screens/shared/PatientProfileScreen.tsx');
assert.ok(fs.existsSync(profileScreenPath), 'PatientProfileScreen.tsx must exist');
const profileScreenSource = fs.readFileSync(profileScreenPath, 'utf8');

test('4.1: PatientProfileScreen provides an Edit button for patient users', () => {
  assert.match(profileScreenSource, /userRole\s*===\s*'PATIENT'/);
  assert.match(profileScreenSource, /handleOpenEditModal/);
  assert.match(profileScreenSource, /styles\.editHeaderBtn/);
});

test('4.2: Edit modal allows editing identity, address, living arrangement, and emergency contacts', () => {
  assert.ok(profileScreenSource.includes('editModalVisible'));
  assert.ok(profileScreenSource.includes('editName'));
  assert.ok(profileScreenSource.includes('editDob'));
  assert.ok(profileScreenSource.includes('editGender'));
  assert.ok(profileScreenSource.includes('editCity'));
  assert.ok(profileScreenSource.includes('editLiving'));
  assert.ok(profileScreenSource.includes('editEmergName'));
  assert.ok(profileScreenSource.includes('editEmergPhone'));
  assert.ok(profileScreenSource.includes('editEmergRel'));
});

test('4.3: Persists changes via updatePatientProfile and invokes refreshUser()', () => {
  assert.match(profileScreenSource, /await\s+updatePatientProfile\(\{/);
  assert.match(profileScreenSource, /if\s*\(refreshUser\)\s*\{?\s*await\s+refreshUser\(\);?\s*\}?/);
});

// ─── 5. Language Preference Selection & Persistence ───────────────────────────
console.log('\n--- 5. Language Preference Selection (PatientLanguageScreen.tsx) ---');

const languageScreenPath = path.resolve(__dirname, '../src/screens/patient/PatientLanguageScreen.tsx');
assert.ok(fs.existsSync(languageScreenPath), 'PatientLanguageScreen.tsx must exist');
const languageScreenSource = fs.readFileSync(languageScreenPath, 'utf8');

test('5.1: PatientLanguageScreen supports English and Indian regional languages without flags/emojis', () => {
  assert.ok(languageScreenSource.includes("'English'"));
  assert.ok(languageScreenSource.includes("'Hindi'"));
  assert.ok(languageScreenSource.includes("'Kannada'"));
  assert.ok(languageScreenSource.includes("'Tamil'"));
  assert.ok(languageScreenSource.includes("'Telugu'"));
  assert.ok(languageScreenSource.includes("'Malayalam'"));
  // Ensure no emoji flag characters
  assert.doesNotMatch(languageScreenSource, /[\uD83C][\uDDE6-\uDDFF]/, 'Must not contain flag emojis');
});

test('5.2: Language selection persists preference via updateMe and calls refreshUser()', () => {
  assert.match(languageScreenSource, /await\s+updateMe\(\{\s*preferred_language:\s*lang\.code\s*\}\)/);
  assert.match(languageScreenSource, /if\s*\(refreshUser\)\s*\{\s*await\s+refreshUser\(\);\s*\}/);
});

// ─── 6. Connect with Family 6-Digit Code Workflow ─────────────────────────────
console.log('\n--- 6. Connect with Family Workflow (PatientConnectFamilyScreen.tsx) ---');

const connectScreenPath = path.resolve(__dirname, '../src/screens/patient/PatientConnectFamilyScreen.tsx');
assert.ok(fs.existsSync(connectScreenPath), 'PatientConnectFamilyScreen.tsx must exist');
const connectScreenSource = fs.readFileSync(connectScreenPath, 'utf8');

test('6.1: Displays current connected family members if connected', () => {
  assert.ok(connectScreenSource.includes('fetchMyFamily'));
  assert.ok(connectScreenSource.includes('connectedFamily'));
  assert.ok(connectScreenSource.includes('Your Connected Family'));
});

test('6.2: Validates 6-digit invitation code via canonical GET /care-circles/invitations/:code', () => {
  assert.ok(connectScreenSource.includes('^[0-9]{6}$'));
  assert.match(connectScreenSource, /apiClient\.get\(`\/care-circles\/invitations\/\$\{clean\}`\)/);
});

test('6.3: Shows preview and joins circle via POST /care-circles/invitations/:code/join', () => {
  assert.ok(connectScreenSource.includes('invitation.circleName'));
  assert.ok(connectScreenSource.includes('invitation.ownerName'));
  assert.match(connectScreenSource, /apiClient\.post\(`\/care-circles\/invitations\/\$\{code\.trim\(\)\}\/join`\)/);
  assert.match(connectScreenSource, /setIsSuccess\(true\)/);
});

// ─── 7. Location Screen & Permission Checking ─────────────────────────────────
console.log('\n--- 7. Location Screen & Permission Status (PatientLocationScreen.tsx) ---');

const locationScreenPath = path.resolve(__dirname, '../src/screens/patient/PatientLocationScreen.tsx');
assert.ok(fs.existsSync(locationScreenPath), 'PatientLocationScreen.tsx must exist');
const locationScreenSource = fs.readFileSync(locationScreenPath, 'utf8');

test('7.1: Uses expo-location to inspect device services and foreground permissions', () => {
  assert.ok(locationScreenSource.includes('expo-location'));
  assert.match(locationScreenSource, /Location\.hasServicesEnabledAsync\(\)/);
  assert.match(locationScreenSource, /Location\.getForegroundPermissionsAsync\(\)/);
});

test('7.2: Handles AVAILABLE, UNAVAILABLE, and DENIED states with recovery actions', () => {
  assert.ok(locationScreenSource.includes("'AVAILABLE'"));
  assert.ok(locationScreenSource.includes("'UNAVAILABLE'"));
  assert.ok(locationScreenSource.includes("'DENIED'"));
  assert.match(locationScreenSource, /Location\.requestForegroundPermissionsAsync\(\)/);
  assert.match(locationScreenSource, /Linking\.openSettings\(\)/);
});

test('7.3: Zero Safe Zone admin controls in Patient Location screen', () => {
  assert.doesNotMatch(locationScreenSource, /createSafeZone/i);
  assert.doesNotMatch(locationScreenSource, /editSafeZone/i);
  assert.doesNotMatch(locationScreenSource, /safe_zone|geofence/i);
  assert.doesNotMatch(locationScreenSource, /safeZoneRadius/i);
});

// ─── 8. Sign Out & Delete Account Security ────────────────────────────────────
console.log('\n--- 8. Sign Out & Delete Account Security ---');

test('8.1: Sign Out triggers confirmation dialog and canonical logout()', () => {
  assert.match(settingsScreenSource, /Alert\.alert\(\s*['"]Sign Out['"],\s*['"]Are you sure you want to sign out\?['"]/);
  assert.match(settingsScreenSource, /await\s+logout\(\)/);
});

test('8.2: Delete Account requires destructive confirmation dialog', () => {
  assert.match(settingsScreenSource, /Alert\.alert\(\s*['"]Delete Account['"],\s*['"]Delete your account\? Your account and associated access will be permanently removed\.['"]/);
});

test('8.3: Delete Account calls DELETE /users/me and logout()', () => {
  assert.match(settingsScreenSource, /apiClient\.delete\(['"]\/users\/me['"]\)/);
  assert.match(settingsScreenSource, /await\s+logout\(\)/);
});

const backendUsersServicePath = path.resolve(__dirname, '../../surestep-backend/modules/users/users.service.ts');
assert.ok(fs.existsSync(backendUsersServicePath), 'Backend users.service.ts must exist');
const backendUsersServiceSource = fs.readFileSync(backendUsersServicePath, 'utf8');

test('8.4: Backend deleteAccount safely handles relationships, memberships, and sessions', () => {
  assert.ok(backendUsersServiceSource.includes('export async function deleteAccount'));
  assert.ok(backendUsersServiceSource.includes('care_circle_members'));
  assert.ok(backendUsersServiceSource.includes('device_registry'));
  assert.ok(backendUsersServiceSource.includes('UPDATE users'));
});

// ─── 9. Navigation Stack Registration & Semantic Icons ────────────────────────
console.log('\n--- 9. Navigation Stack Registration & Semantic Icons ---');

const navTypesPath = path.resolve(__dirname, '../src/types/navigation.types.ts');
const navTypesSource = fs.readFileSync(navTypesPath, 'utf8');

test('9.1: PatientStackParams defines all child Settings destinations', () => {
  assert.match(navTypesSource, /PatientSettingsScreen:\s*undefined;/);
  assert.match(navTypesSource, /PatientLanguageScreen:\s*undefined;/);
  assert.match(navTypesSource, /PatientConnectFamilyScreen:\s*undefined;/);
  assert.match(navTypesSource, /PatientLocationScreen:\s*undefined;/);
});

test('9.2: PatientNavigator registers all child Settings screens', () => {
  assert.match(patientNavSource, /<Stack\.Screen\s+name="PatientSettingsScreen"\s+component=\{PatientSettingsScreen\}/);
  assert.match(patientNavSource, /<Stack\.Screen\s+name="PatientLanguageScreen"\s+component=\{PatientLanguageScreen\}/);
  assert.match(patientNavSource, /<Stack\.Screen\s+name="PatientConnectFamilyScreen"\s+component=\{PatientConnectFamilyScreen\}/);
  assert.match(patientNavSource, /<Stack\.Screen\s+name="PatientLocationScreen"\s+component=\{PatientLocationScreen\}/);
});

const navIconsPath = path.resolve(__dirname, '../src/assets/icons/NavIcons.tsx');
const navIconsSource = fs.readFileSync(navIconsPath, 'utf8');

test('9.3: NavIcons exports all required outline icons with consistent styling', () => {
  assert.ok(navIconsSource.includes('export const IconSettings'));
  assert.ok(navIconsSource.includes('export const IconUser'));
  assert.ok(navIconsSource.includes('export const IconGlobe'));
  assert.ok(navIconsSource.includes('export const IconFamily'));
  assert.ok(navIconsSource.includes('export const IconLocationPin'));
  assert.ok(navIconsSource.includes('export const IconSignOut'));
  assert.ok(navIconsSource.includes('export const IconTrash'));
});

// ─── 10. Role Boundaries & Clutter-Free Patient Experience ────────────────────
console.log('\n--- 10. Role Boundaries & Clutter-Free Patient Experience ---');

test('10.1: Main Settings screen does NOT contain caregiver discovery, marketplace, or routine admin', () => {
  assert.doesNotMatch(settingsScreenSource, /searchCaregiver/i);
  assert.doesNotMatch(settingsScreenSource, /caregiver_marketplace/i);
  assert.doesNotMatch(settingsScreenSource, /requestCare/i);
  assert.doesNotMatch(settingsScreenSource, /postWhatYouNeed/i);
  assert.doesNotMatch(settingsScreenSource, /manageRoutines/i);
});

test('10.2: Main Settings screen does NOT expose internal technical concepts (permissions, Circle admin)', () => {
  assert.doesNotMatch(settingsScreenSource, /onboarding_source/i);
  assert.doesNotMatch(settingsScreenSource, /SELF_MANAGED/i);
  assert.doesNotMatch(settingsScreenSource, /ASSISTED/i);
  assert.doesNotMatch(settingsScreenSource, /careCircleId/i);
  assert.doesNotMatch(settingsScreenSource, /permissionRole/i);
});

console.log('\n======================================================================');
console.log(`ALL TESTS PASSED: ${passedTests} / ${totalTests} assertions verified successfully.`);
console.log('======================================================================');
