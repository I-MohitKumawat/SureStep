// Minimal country + dropdown data (expand later).
const countries = [
  { code: 'US', label: 'United States', callingCode: '+1' },
  { code: 'CA', label: 'Canada', callingCode: '+1' },
  { code: 'GB', label: 'United Kingdom', callingCode: '+44' },
  { code: 'IE', label: 'Ireland', callingCode: '+353' },
  { code: 'IN', label: 'India', callingCode: '+91' },
  { code: 'PK', label: 'Pakistan', callingCode: '+92' },
  { code: 'BD', label: 'Bangladesh', callingCode: '+880' },
  { code: 'AU', label: 'Australia', callingCode: '+61' },
  { code: 'NZ', label: 'New Zealand', callingCode: '+64' },
  { code: 'KE', label: 'Kenya', callingCode: '+254' },
  { code: 'NG', label: 'Nigeria', callingCode: '+234' },
  { code: 'ZA', label: 'South Africa', callingCode: '+27' },
  { code: 'PH', label: 'Philippines', callingCode: '+63' },
  { code: 'SG', label: 'Singapore', callingCode: '+65' },
  { code: 'MY', label: 'Malaysia', callingCode: '+60' },
  { code: 'AE', label: 'United Arab Emirates', callingCode: '+971' },
  { code: 'SA', label: 'Saudi Arabia', callingCode: '+966' },
  { code: 'EG', label: 'Egypt', callingCode: '+20' },
  { code: 'DE', label: 'Germany', callingCode: '+49' },
  { code: 'FR', label: 'France', callingCode: '+33' },
  { code: 'ES', label: 'Spain', callingCode: '+34' },
  { code: 'IT', label: 'Italy', callingCode: '+39' },
  { code: 'BR', label: 'Brazil', callingCode: '+55' },
  { code: 'MX', label: 'Mexico', callingCode: '+52' },
  { code: 'CL', label: 'Chile', callingCode: '+56' },
  { code: 'CO', label: 'Colombia', callingCode: '+57' }
];

const genders = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Prefer not to say', label: 'Prefer not to say' }
];

const languages = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'German', label: 'German' },
  { value: 'Portuguese', label: 'Portuguese' }
];

module.exports = {
  countries,
  genders,
  languages
};

