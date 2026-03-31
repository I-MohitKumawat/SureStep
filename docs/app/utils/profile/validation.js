const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIGITS_RE = /\d/;

function normalizeString(value) {
  return String(value ?? '').trim();
}

function onlyLettersSpacesHyphensApostrophes(value) {
  // Allows unicode letters, spaces, apostrophes, hyphens.
  // Digits are blocked separately.
  return /^[\p{L}][\p{L}\s'-]*$/u.test(value);
}

function isIntegerInRange(value, min, max) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return false;
  if (!Number.isInteger(n)) return false;
  return n >= min && n <= max;
}

function validateFullName(fullName) {
  const v = normalizeString(fullName);
  if (v.length < 2) return 'Full name must be at least 2 characters.';
  if (DIGITS_RE.test(v)) return 'Full name must not contain numbers.';
  if (!onlyLettersSpacesHyphensApostrophes(v)) {
    return "Full name can contain letters, spaces, apostrophes, and hyphens only.";
  }
  return null;
}

function validateAge(age) {
  const v = typeof age === 'string' ? normalizeString(age) : age;
  if (!isIntegerInRange(v, 1, 120)) return 'Age must be a whole number between 1 and 120.';
  return null;
}

function validateEmail(email) {
  const v = normalizeString(email);
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.';
  return null;
}

function validateRequiredString(value, message) {
  const v = normalizeString(value);
  if (!v) return message;
  return null;
}

function validatePhone(countryCallingCode, phoneNumber) {
  const code = normalizeString(countryCallingCode);
  const number = normalizeString(phoneNumber);
  if (!code) return 'Select a country code.';
  if (!number) return 'Enter a phone number.';
  if (!/^\d+$/.test(number)) return 'Phone number must be numeric.';
  // Permissive length: numeric without needing strict country-specific digit counts.
  if (number.length < 1 || number.length > 15) return 'Phone number length looks invalid.';
  return null;
}

function validateEmergencyContact(emergencyName, emergencyCountryCallingCode, emergencyPhoneNumber) {
  const name = normalizeString(emergencyName);
  const code = normalizeString(emergencyCountryCallingCode);
  const number = normalizeString(emergencyPhoneNumber);

  const hasAny = Boolean(name) || Boolean(code) || Boolean(number);
  if (!hasAny) return null; // optional and empty

  if (!name) return 'Emergency contact name is required when adding emergency contact details.';
  if (!number) return 'Emergency contact phone is required.';
  if (!code) return 'Emergency contact country code is required.';

  const phoneError = validatePhone(code, number);
  return phoneError;
}

function validateProfileDraft(draft) {
  const errors = {};

  // Required core fields
  errors.fullName = validateFullName(draft.fullName);
  errors.age = validateAge(draft.age);

  errors.gender = validateRequiredString(draft.gender, 'Please select a gender.');
  errors.preferredLanguage = validateRequiredString(
    draft.preferredLanguage,
    'Please select a preferred language.'
  );

  // Phone + email fields are removed from the UI.
  // Ignore their validation so existing/invalid stored values never block saving.
  errors.phone = null;
  errors.email = null;
  errors.city = validateRequiredString(draft.city, 'City is required.');
  errors.country = validateRequiredString(draft.country, 'Country is required.');

  // Optional role-specific fields
  // Emergency contact is removed from the UI.
  errors.emergencyContact = null;

  return errors;
}

function isProfileDraftValid(draft) {
  const errors = validateProfileDraft(draft);
  return Object.values(errors).every((err) => err == null);
}

module.exports = {
  validateFullName,
  validateAge,
  validateEmail,
  validatePhone,
  validateEmergencyContact,
  validateProfileDraft,
  isProfileDraftValid
};

