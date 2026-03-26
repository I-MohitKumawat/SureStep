const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateFullName,
  validateAge,
  validateEmail,
  validatePhone,
  validateEmergencyContact,
  isProfileDraftValid
} = require('./validation');

test('validateFullName rejects numbers', () => {
  const err = validateFullName('John 123');
  assert.equal(err !== null, true);
});

test('validateFullName accepts letters', () => {
  const err = validateFullName('Mary Jane');
  assert.equal(err, null);
});

test('validateAge enforces 1-120 integer', () => {
  assert.equal(validateAge(0) !== null, true);
  assert.equal(validateAge(121) !== null, true);
  assert.equal(validateAge(30), null);
});

test('validateEmail uses basic format', () => {
  assert.equal(validateEmail('not-an-email') !== null, true);
  assert.equal(validateEmail('a@b.com'), null);
});

test('validatePhone requires country code + numeric number', () => {
  assert.equal(validatePhone('', '123456') !== null, true);
  assert.equal(validatePhone('+1', '12ab') !== null, true);
  assert.equal(validatePhone('+1', '123456'), null);
});

test('validateEmergencyContact is optional unless partially filled', () => {
  assert.equal(validateEmergencyContact('', '', ''), null);
  assert.equal(validateEmergencyContact('Jane', '', '') !== null, true);
  assert.equal(validateEmergencyContact('', '+1', '123456') !== null, true);
});

test('isProfileDraftValid only returns true when all required fields are valid', () => {
  const base = {
    role: 'caregiver',
    fullName: 'Sarah Adams',
    age: 45,
    gender: 'Female',
    preferredLanguage: 'English',
    phoneCountryCallingCode: '+1',
    phoneNumber: '1234567890',
    email: 'sarah@example.com',
    city: 'Boston',
    country: 'US',
    emergencyContactName: '',
    emergencyPhoneCountryCallingCode: '',
    emergencyPhoneNumber: '',
    relationshipToPatient: ''
  };
  assert.equal(isProfileDraftValid(base), true);

  assert.equal(isProfileDraftValid({ ...base, fullName: 'A1' }), false);
});

