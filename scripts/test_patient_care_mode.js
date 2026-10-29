/**
 * SureStep — scripts/test_patient_care_mode.js
 *
 * Unit tests for Patient Care Mode selector and usePatientCareMode() hook.
 *
 * Verifies:
 *  1. usePatientCareMode() correctly identifies 'SELF' -> { isSelfManaged: true, isAssisted: false }
 *  2. usePatientCareMode() correctly identifies 'FAMILY' -> { isSelfManaged: false, isAssisted: true }
 *  3. usePatientCareMode() handles null / undefined / unpopulated careContext safely -> { isSelfManaged: false, isAssisted: false }
 *  4. Pure selector getPatientCareMode() behaves identically without hook lifecycle
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
console.log('PATIENT CARE MODE HOOK & SELECTOR UNIT TEST SUITE');
console.log('Target: SureStep/src/hooks/usePatientCareMode.ts');
console.log('======================================================================\n');

// 1. Compile actual TS file using Babel with Expo preset
const hookPath = path.resolve(__dirname, '../src/hooks/usePatientCareMode.ts');
const rawSource = fs.readFileSync(hookPath, 'utf8');
const compiled = babel.transformSync(rawSource, {
  filename: 'usePatientCareMode.ts',
  presets: ['babel-preset-expo'],
}).code;

// 2. Set up dynamic AuthContext mocking harness
let mockCareContext = null;

const customRequire = (reqPath) => {
  if (reqPath === './useAuth') {
    return {
      useAuth: () => ({
        careContext: mockCareContext,
      }),
    };
  }
  return require(reqPath);
};

const moduleObj = { exports: {} };
const runner = new Function('require', 'exports', 'module', compiled);
runner(customRequire, moduleObj.exports, moduleObj);

const { usePatientCareMode, getPatientCareMode } = moduleObj.exports;

// 3. Test Cases
console.log('--- 1. Hook: usePatientCareMode() ---');

test("1.1: Correctly identifies Self-managed Patient ('SELF')", () => {
  mockCareContext = {
    profiles: {
      patientOnboardingSource: 'SELF',
    },
  };
  const mode = usePatientCareMode();
  assert.strictEqual(mode.isSelfManaged, true, 'isSelfManaged must be true');
  assert.strictEqual(mode.isAssisted, false, 'isAssisted must be false');
  assert.strictEqual(mode.onboardingSource, 'SELF');
});

test("1.2: Correctly identifies Assisted Patient ('FAMILY')", () => {
  mockCareContext = {
    profiles: {
      patientOnboardingSource: 'FAMILY',
    },
  };
  const mode = usePatientCareMode();
  assert.strictEqual(mode.isSelfManaged, false, 'isSelfManaged must be false');
  assert.strictEqual(mode.isAssisted, true, 'isAssisted must be true');
  assert.strictEqual(mode.onboardingSource, 'FAMILY');
});

test("1.3: Handles unpopulated / null onboarding source safely", () => {
  mockCareContext = {
    profiles: {
      patientOnboardingSource: null,
    },
  };
  const mode = usePatientCareMode();
  assert.strictEqual(mode.isSelfManaged, false);
  assert.strictEqual(mode.isAssisted, false);
  assert.strictEqual(mode.onboardingSource, null);
});

test("1.4: Handles empty careContext without crashing", () => {
  mockCareContext = null;
  const mode = usePatientCareMode();
  assert.strictEqual(mode.isSelfManaged, false);
  assert.strictEqual(mode.isAssisted, false);
  assert.strictEqual(mode.onboardingSource, null);
});

console.log('\n--- 2. Pure Selector: getPatientCareMode() ---');

test("2.1: getPatientCareMode('SELF') returns { isSelfManaged: true, isAssisted: false }", () => {
  const mode = getPatientCareMode('SELF');
  assert.deepStrictEqual(mode, {
    isSelfManaged: true,
    isAssisted: false,
  });
});

test("2.2: getPatientCareMode('FAMILY') returns { isSelfManaged: false, isAssisted: true }", () => {
  const mode = getPatientCareMode('FAMILY');
  assert.deepStrictEqual(mode, {
    isSelfManaged: false,
    isAssisted: true,
  });
});

test("2.3: getPatientCareMode(null | undefined) returns false for both flags", () => {
  assert.deepStrictEqual(getPatientCareMode(null), { isSelfManaged: false, isAssisted: false });
  assert.deepStrictEqual(getPatientCareMode(undefined), { isSelfManaged: false, isAssisted: false });
  assert.deepStrictEqual(getPatientCareMode('UNKNOWN'), { isSelfManaged: false, isAssisted: false });
});

console.log('\n======================================================================');
console.log(`PATIENT CARE MODE SUITE COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED!`);
console.log('======================================================================\n');
