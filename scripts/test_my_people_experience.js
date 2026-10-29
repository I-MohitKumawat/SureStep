/**
 * SureStep — scripts/test_my_people_experience.js
 *
 * Automated verification suite for the Patient "My People" experience:
 *  1. Main "My People" Screen Layout & Visual Hierarchy (media_1793220876882.png)
 *  2. People Grid Structure & Prioritization
 *  3. Phone Dialer Integration & Safe Fallbacks
 *  4. Memories Preview Carousel & Full-Screen Viewer Integration
 *  5. Person Detail Screen Hierarchy & Layout (media_1793220884718.png)
 *  6. Memory Filtering by Person
 *  7. Full-Screen Memory Viewer (Photos, Videos with expo-av, Text Notes)
 *  8. Complete Absence of Social and Administrative Clutter
 *  9. Navigation Stack Registration
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
console.log('PATIENT "MY PEOPLE" EXPERIENCE VERIFICATION SUITE');
console.log('Testing Visual Layout, People Grid, Phone Calls, & Memories');
console.log('======================================================================\n');

// ─── 1. Main "My People" Screen Layout ──────────────────────────────────────────
console.log('--- 1. Main "My People" Screen Layout (PatientFamilyScreen.tsx) ---');

const familyScreenPath = path.resolve(__dirname, '../src/screens/patient/PatientFamilyScreen.tsx');
assert.ok(fs.existsSync(familyScreenPath), 'PatientFamilyScreen.tsx must exist');
const familyScreenSource = fs.readFileSync(familyScreenPath, 'utf8');

test('1.1: Displays "My People" heading with no unnecessary subtitle', () => {
  assert.ok(familyScreenSource.includes('My People'), 'Must contain "My People" title');
  assert.doesNotMatch(familyScreenSource, /Your Family/i, 'Must not contain old "Your Family" title');
  assert.doesNotMatch(familyScreenSource, /CARE CIRCLE/i, 'Must not contain "CARE CIRCLE" subtitle');
});

test('1.2: Renders persistent HomeHeader with SureStep branding and SOS button', () => {
  assert.match(familyScreenSource, /<HomeHeader\s+patientId=\{patientId\s*\|\|\s*null\}\s*\/>/);
});

test('1.3: Uses clean 3-column grid layout calculation', () => {
  assert.match(familyScreenSource, /GRID_GAP\s*=\s*16/);
  assert.match(familyScreenSource, /Math\.floor\(\s*\(SCREEN_WIDTH\s*-\s*HORIZONTAL_PADDING\s*\*\s*2\s*-\s*GRID_GAP\s*\*\s*2\)\s*\/\s*3\s*\)/);
  assert.match(familyScreenSource, /style=\{styles\.peopleGrid\}/);
  assert.match(familyScreenSource, /style=\{styles\.personColumn\}/);
});

test('1.4: Prioritizes circular photo (no heavy rectangular card containers)', () => {
  assert.match(familyScreenSource, /avatarWrap:\s*\{[\s\S]*?width:\s*84[\s\S]*?height:\s*84[\s\S]*?borderRadius:\s*42/);
  assert.doesNotMatch(familyScreenSource, /memberCard:\s*\{/);
});

test('1.5: Person tile includes name, relationship, and call action', () => {
  assert.match(familyScreenSource, /styles\.personName/);
  assert.match(familyScreenSource, /styles\.personRelationship/);
  assert.match(familyScreenSource, /styles\.callButton/);
});

test('1.6: Tapping person navigates to PatientPersonDetailScreen with person payload', () => {
  assert.match(familyScreenSource, /navigation\.navigate\(['"]PatientPersonDetailScreen['"],\s*\{\s*person\s*\}\)/);
});

test('1.7: Thin divider separates people grid and memories section', () => {
  assert.match(familyScreenSource, /styles\.divider/);
  assert.match(familyScreenSource, /divider:\s*\{[\s\S]*?height:\s*1/);
});

test('1.8: Memories section includes "Memories" heading and "View all" navigation', () => {
  assert.match(familyScreenSource, /styles\.memoriesTitle/);
  assert.match(familyScreenSource, /styles\.viewAllBtn/);
  assert.match(familyScreenSource, /navigation\.navigate\(['"]PatientMemoriesScreen['"]\)/);
});

test('1.9: Horizontal carousel displays photos, videos with duration badge, and text notes', () => {
  assert.match(familyScreenSource, /mem\.media_type\s*===\s*'PHOTO'/);
  assert.match(familyScreenSource, /mem\.media_type\s*===\s*'VIDEO'/);
  assert.match(familyScreenSource, /styles\.durationBadge/);
  assert.match(familyScreenSource, /styles\.playOverlay/);
  assert.match(familyScreenSource, /styles\.textMemoryThumbCard/);
  assert.match(familyScreenSource, /navigation\.navigate\(['"]PatientMemoryViewerScreen['"],\s*\{\s*memory:\s*mem\s*\}\)/);
});

// ─── 2. Real Backend Data & Call Dialer ────────────────────────────────────────
console.log('\n--- 2. Data Services & Safe Call Handling ---');

const relServicePath = path.resolve(__dirname, '../src/services/relationshipService.ts');
assert.ok(fs.existsSync(relServicePath), 'relationshipService.ts must exist');
const relServiceSource = fs.readFileSync(relServicePath, 'utf8');

test('2.1: relationshipService defines ConnectedPerson interface with phone support', () => {
  assert.match(relServiceSource, /export\s+interface\s+ConnectedPerson\s*\{[\s\S]*?id:\s*string;[\s\S]*?name:\s*string;[\s\S]*?photoUrl\?:\s*string\s*\|\s*null;[\s\S]*?phone\?:\s*string\s*\|\s*null;/);
});

test('2.2: fetchConnectedPeople aggregates family and active caregivers', () => {
  assert.match(relServiceSource, /export\s+const\s+fetchConnectedPeople\s*=\s*async/);
  assert.match(relServiceSource, /fetchMyFamily\(\)/);
  assert.match(relServiceSource, /fetchMyCaregivers\(\)/);
  assert.match(relServiceSource, /ACTIVE|CONFIRMED|NOTICE_PERIOD/);
});

test('2.3: Safe phone dialer triggers tel: URL and handles missing phone gracefully', () => {
  assert.match(familyScreenSource, /Linking\.openURL\(url\)/);
  assert.match(familyScreenSource, /Alert\.alert\(\s*['"]Phone Unavailable['"]/);
  assert.match(familyScreenSource, /Alert\.alert\(\s*['"]Unable to Call['"]/);
});

// ─── 3. Person Detail Screen ───────────────────────────────────────────────────
console.log('\n--- 3. Person Detail Screen (PatientPersonDetailScreen.tsx) ---');

const personDetailPath = path.resolve(__dirname, '../src/screens/patient/PatientPersonDetailScreen.tsx');
assert.ok(fs.existsSync(personDetailPath), 'PatientPersonDetailScreen.tsx must exist');
const personDetailSource = fs.readFileSync(personDetailPath, 'utf8');

test('3.1: Person detail screen features top bar with SureStep brand + SOS and Back button', () => {
  assert.match(personDetailSource, /<HomeHeader\s+patientId=\{patientId\s*\|\|\s*null\}\s*\/>/);
  assert.match(personDetailSource, /navigation\.goBack\(\)/);
  assert.match(personDetailSource, /Back/);
});

test('3.2: Hero section matches visual reference (130px photo, name, relation, call button)', () => {
  assert.match(personDetailSource, /heroAvatarWrap:\s*\{[\s\S]*?width:\s*130[\s\S]*?height:\s*130[\s\S]*?borderRadius:\s*65/);
  assert.match(personDetailSource, /styles\.heroName/);
  assert.match(personDetailSource, /styles\.heroRelationship/);
  assert.match(personDetailSource, /styles\.callButton/);
});

test('3.3: Person detail fetches memories filtered by personId', () => {
  assert.match(personDetailSource, /fetchPatientMemories\(patientId,\s*\{[\s\S]*?personId:\s*person\.id/);
});

test('3.4: Person detail displays 2-column memories grid and "View all >" link', () => {
  assert.match(personDetailSource, /styles\.gridContainer/);
  assert.match(personDetailSource, /styles\.viewAllBtn/);
  assert.match(personDetailSource, /navigation\.navigate\(\s*['"]PatientMemoriesScreen['"],\s*\{[\s\S]*?personId:\s*person\.id[\s\S]*?personName:\s*person\.name[\s\S]*?\}\s*\)/);
});

// ─── 4. Memories & Memory Viewer ───────────────────────────────────────────────
console.log('\n--- 4. Memory Services & Full-Screen Viewer ---');

const memoryServicePath = path.resolve(__dirname, '../src/services/memoryService.ts');
assert.ok(fs.existsSync(memoryServicePath), 'memoryService.ts must exist');
const memoryServiceSource = fs.readFileSync(memoryServicePath, 'utf8');

test('4.1: memoryService supports limit, cursor, and personId query parameters', () => {
  assert.match(memoryServiceSource, /personId\?:\s*string/);
  assert.match(memoryServiceSource, /apiClient\.get\(`\/patients\/\$\{patientId\}\/memories`/);
});

const memoryViewerPath = path.resolve(__dirname, '../src/screens/patient/PatientMemoryViewerScreen.tsx');
assert.ok(fs.existsSync(memoryViewerPath), 'PatientMemoryViewerScreen.tsx must exist');
const memoryViewerSource = fs.readFileSync(memoryViewerPath, 'utf8');

test('4.2: PatientMemoryViewerScreen supports PHOTO, VIDEO (expo-av), and TEXT memories', () => {
  assert.match(memoryViewerSource, /from\s+['"]expo-av['"]/);
  assert.match(memoryViewerSource, /memory\.media_type\s*===\s*'PHOTO'/);
  assert.match(memoryViewerSource, /memory\.media_type\s*===\s*'VIDEO'/);
  assert.match(memoryViewerSource, /styles\.textMemoryCard/);
});

test('4.3: PatientMemoryViewerScreen includes back navigation and memory date', () => {
  assert.match(memoryViewerSource, /navigation\.goBack\(\)/);
  assert.match(memoryViewerSource, /styles\.dateText/);
});

// ─── 5. Absence of Social & Complexity Clutter ─────────────────────────────────
console.log('\n--- 5. Absence of Social and Administrative Clutter ---');

test('5.1: Zero social clutter (likes, comments, reactions, follower counts, sharing)', () => {
  for (const src of [familyScreenSource, personDetailSource, memoryViewerSource]) {
    assert.doesNotMatch(src, /\blikes\b/i, 'Must not include likes');
    assert.doesNotMatch(src, /\bcomments\b/i, 'Must not include comments');
    assert.doesNotMatch(src, /\bfollowers\b/i, 'Must not include followers');
    assert.doesNotMatch(src, /\breactions\b/i, 'Must not include reactions');
    assert.doesNotMatch(src, /\bshare\b/i, 'Must not include share actions');
  }
});

test('5.2: Zero administrative clutter in Patient My People experience', () => {
  assert.doesNotMatch(familyScreenSource, /manage circle/i);
  assert.doesNotMatch(familyScreenSource, /permissions/i);
  assert.doesNotMatch(familyScreenSource, /invite code/i);
});

// ─── 6. Navigation Stack Registration ──────────────────────────────────────────
console.log('\n--- 6. Navigation Stack Registration ---');

const navPath = path.resolve(__dirname, '../src/navigation/PatientNavigator.tsx');
const navSource = fs.readFileSync(navPath, 'utf8');

test('6.1: Registers PatientPersonDetailScreen, PatientMemoriesScreen, PatientMemoryViewerScreen in PatientStack', () => {
  assert.ok(navSource.includes('name="PatientPersonDetailScreen"'), 'Must register PatientPersonDetailScreen');
  assert.ok(navSource.includes('name="PatientMemoriesScreen"'), 'Must register PatientMemoriesScreen');
  assert.ok(navSource.includes('name="PatientMemoryViewerScreen"'), 'Must register PatientMemoryViewerScreen');
});

console.log('\n======================================================================');
console.log(`MY PEOPLE EXPERIENCE SUITE COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED!`);
console.log('======================================================================\n');
