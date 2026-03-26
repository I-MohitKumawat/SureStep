import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../packages/ui/theme/ThemeProvider';

import TextInputField from './inputs/TextInputField';
import DropdownPicker from './inputs/DropdownPicker';
import PhoneInputField from './inputs/PhoneInputField';

const { countries, genders, languages } = require('../utils/profile/profileData');
const { validateProfileDraft } = require('../utils/profile/validation');

const toDropdownItems = (list) => list.map((i) => ({ value: i.value, label: i.label }));

export default function ProfileForm({
  role,
  initialValues,
  onSubmit,
  submitLabel = 'Save & Continue'
}) {
  const theme = useTheme();
  const isPatient = role === 'patient';
  const minFontSize = isPatient ? 18 : 14;
  const highContrast = isPatient;

  const [values, setValues] = React.useState(() => ({
    role,
    fullName: initialValues?.fullName ?? '',
    age: initialValues?.age != null ? String(initialValues.age) : '',
    gender: initialValues?.gender ?? null,
    preferredLanguage: initialValues?.preferredLanguage ?? null,
    phoneCountryCallingCode: initialValues?.phoneCountryCallingCode ?? '',
    phoneNumber: initialValues?.phoneNumber ?? '',
    email: initialValues?.email ?? '',
    city: initialValues?.city ?? '',
    country: initialValues?.country ?? null,
    emergencyContactName: initialValues?.emergencyContactName ?? '',
    emergencyPhoneCountryCallingCode: initialValues?.emergencyPhoneCountryCallingCode ?? '',
    emergencyPhoneNumber: initialValues?.emergencyPhoneNumber ?? '',
    relationshipToPatient: initialValues?.relationshipToPatient ?? ''
  }));

  const [touched, setTouched] = React.useState({});

  const errors = React.useMemo(() => validateProfileDraft(values), [values]);

  const setFieldTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));
  const getError = (field) => (touched[field] ? errors[field] : null);

  const hasEmergencyAny =
    Boolean(values.emergencyContactName) ||
    Boolean(values.emergencyPhoneCountryCallingCode) ||
    Boolean(values.emergencyPhoneNumber);

  const requiredValid =
    !errors.fullName &&
    !errors.age &&
    !errors.gender &&
    !errors.preferredLanguage &&
    !errors.phone &&
    !errors.email &&
    !errors.city &&
    !errors.country &&
    (!hasEmergencyAny || !errors.emergencyContact);

  const genderItems = React.useMemo(() => toDropdownItems(genders), []);
  const languageItems = React.useMemo(() => toDropdownItems(languages), []);
  const countryItems = React.useMemo(
    () => countries.map((c) => ({ value: c.code, label: c.label })),
    []
  );

  return (
    <View style={styles.form}>
      <TextInputField
        label="Full Name"
        value={values.fullName}
        onChangeText={(v) => setValues((s) => ({ ...s, fullName: v }))}
        onBlur={() => setFieldTouched('fullName')}
        error={getError('fullName')}
        required
        placeholder="e.g., Maria Rodriguez"
        autoCapitalize="words"
        highContrast={highContrast}
        minFontSize={minFontSize}
      />

      <TextInputField
        label="Age"
        value={values.age}
        onChangeText={(v) => setValues((s) => ({ ...s, age: v }))}
        onBlur={() => setFieldTouched('age')}
        error={getError('age')}
        required
        placeholder="1-120"
        keyboardType="numeric"
        autoCapitalize="none"
        highContrast={highContrast}
        minFontSize={minFontSize}
      />

      <DropdownPicker
        label="Gender"
        items={genderItems}
        value={values.gender}
        onValueChange={(v) => {
          setValues((s) => ({ ...s, gender: v }));
          setFieldTouched('gender');
        }}
        error={getError('gender')}
        required
        highContrast={highContrast}
        minFontSize={minFontSize}
      />

      <DropdownPicker
        label="Preferred Language"
        items={languageItems}
        value={values.preferredLanguage}
        onValueChange={(v) => {
          setValues((s) => ({ ...s, preferredLanguage: v }));
          setFieldTouched('preferredLanguage');
        }}
        error={getError('preferredLanguage')}
        required
        highContrast={highContrast}
        minFontSize={minFontSize}
      />

      <PhoneInputField
        label="Phone Number"
        countryCallingCode={values.phoneCountryCallingCode}
        phoneNumber={values.phoneNumber}
        onChangeCountryCallingCode={(v) => setValues((s) => ({ ...s, phoneCountryCallingCode: v }))}
        onChangePhoneNumber={(v) => setValues((s) => ({ ...s, phoneNumber: v }))}
        onCountryCodeTouched={() => setFieldTouched('phone')}
        onPhoneTouched={() => setFieldTouched('phone')}
        error={getError('phone')}
        required
        highContrast={highContrast}
        minFontSize={minFontSize}
      />

      <TextInputField
        label="Email"
        value={values.email}
        onChangeText={(v) => setValues((s) => ({ ...s, email: v }))}
        onBlur={() => setFieldTouched('email')}
        error={getError('email')}
        required
        placeholder="name@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        highContrast={highContrast}
        minFontSize={minFontSize}
      />

      <TextInputField
        label="City"
        value={values.city}
        onChangeText={(v) => setValues((s) => ({ ...s, city: v }))}
        onBlur={() => setFieldTouched('city')}
        error={getError('city')}
        required
        placeholder="e.g., Bengaluru"
        autoCapitalize="words"
        highContrast={highContrast}
        minFontSize={minFontSize}
      />

      <DropdownPicker
        label="Country"
        items={countryItems}
        value={values.country}
        onValueChange={(v) => {
          setValues((s) => ({ ...s, country: v }));
          setFieldTouched('country');
        }}
        error={getError('country')}
        required
        placeholder="Select your country"
        searchable
        highContrast={highContrast}
        minFontSize={minFontSize}
      />

      {role === 'patient' ? (
        <View style={[styles.section, isPatient && styles.sectionHighContrast]}>
          <Text style={[styles.sectionTitle, isPatient && styles.sectionTitleHighContrast, { fontSize: isPatient ? 18 : 14 }]}>
            Emergency Contact (optional)
          </Text>

          <TextInputField
            label="Emergency Contact Name"
            value={values.emergencyContactName}
            onChangeText={(v) => setValues((s) => ({ ...s, emergencyContactName: v }))}
            onBlur={() => setFieldTouched('emergencyContact')}
            error={touched.emergencyContact ? errors.emergencyContact : null}
            placeholder="Name"
            required={false}
            autoCapitalize="words"
            highContrast={highContrast}
            minFontSize={minFontSize}
          />

          <PhoneInputField
            label="Emergency Contact Phone"
            countryCallingCode={values.emergencyPhoneCountryCallingCode}
            phoneNumber={values.emergencyPhoneNumber}
            onChangeCountryCallingCode={(v) =>
              setValues((s) => ({ ...s, emergencyPhoneCountryCallingCode: v }))
            }
            onChangePhoneNumber={(v) => setValues((s) => ({ ...s, emergencyPhoneNumber: v }))}
            onCountryCodeTouched={() => setFieldTouched('emergencyContact')}
            onPhoneTouched={() => setFieldTouched('emergencyContact')}
            error={touched.emergencyContact ? errors.emergencyContact : null}
            required={false}
            highContrast={highContrast}
            minFontSize={minFontSize}
          />
        </View>
      ) : null}

      {role === 'caregiver' ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }, { fontSize: isPatient ? 18 : 14 }]}>
            Relationship to Patient (optional)
          </Text>
          <TextInputField
            label="Relationship"
            value={values.relationshipToPatient}
            onChangeText={(v) => setValues((s) => ({ ...s, relationshipToPatient: v }))}
            onBlur={() => setFieldTouched('relationshipToPatient')}
            placeholder="e.g., Spouse, Child, Professional"
            required={false}
            highContrast={highContrast}
            minFontSize={minFontSize}
          />
        </View>
      ) : null}

      <Pressable
        disabled={!requiredValid}
        onPress={() => {
          setTouched({
            fullName: true,
            age: true,
            gender: true,
            preferredLanguage: true,
            phone: true,
            email: true,
            city: true,
            country: true,
            emergencyContact: true
          });

          const currentErrors = validateProfileDraft(values);
          const stillValid = Object.values(currentErrors).every((e) => e == null);
          if (!stillValid) return;

          onSubmit({
            role,
            fullName: values.fullName.trim(),
            age: Number(values.age),
            gender: values.gender,
            preferredLanguage: values.preferredLanguage,
            phoneCountryCallingCode: values.phoneCountryCallingCode,
            phoneNumber: values.phoneNumber.trim(),
            email: values.email.trim(),
            city: values.city.trim(),
            country: values.country,
            emergencyContactName: values.emergencyContactName.trim(),
            emergencyPhoneCountryCallingCode: values.emergencyPhoneCountryCallingCode,
            emergencyPhoneNumber: values.emergencyPhoneNumber.trim(),
            relationshipToPatient: values.relationshipToPatient.trim()
          });
        }}
        style={({ pressed }) => [
          styles.submitButton,
          isPatient && styles.submitButtonHighContrast,
          !requiredValid && { opacity: 0.5 },
          pressed && requiredValid && { opacity: 0.85 }
        ]}
      >
        <Text
          style={[
            styles.submitButtonText,
            isPatient && styles.submitButtonTextHighContrast,
            { fontSize: isPatient ? 18 : 16 }
          ]}
        >
          {submitLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%'
  },
  section: {
    marginTop: 16,
    paddingTop: 8
  },
  sectionHighContrast: {
    marginTop: 16,
    paddingTop: 8
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827'
  },
  sectionTitleHighContrast: {
    color: '#ffffff'
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  submitButtonHighContrast: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#ffffff'
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  submitButtonTextHighContrast: {
    color: '#ffffff'
  }
});

