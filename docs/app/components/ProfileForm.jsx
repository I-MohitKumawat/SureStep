import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../packages/ui/theme/ThemeProvider';

import TextInputField from './inputs/TextInputField';
import DropdownPicker from './inputs/DropdownPicker';

const { countries, genders, languages } = require('../utils/profile/profileData');
const { validateProfileDraft } = require('../utils/profile/validation');

const toDropdownItems = (list) => list.map((i) => ({ value: i.value, label: i.label }));

const ProfileForm = React.forwardRef(function ProfileForm(
{
  role,
  initialValues,
  onSubmit,
  submitLabel = 'Save & Continue',
  showSubmitButton = true
},
ref
) {
  const theme = useTheme();
  const minFontSize = role === 'patient' ? 18 : 14;
  const highContrast = false;

  const [values, setValues] = React.useState(() => ({
    role,
    fullName: initialValues?.fullName ?? '',
    age: initialValues?.age != null ? String(initialValues.age) : '',
    gender: initialValues?.gender ?? null,
    preferredLanguage: initialValues?.preferredLanguage ?? null,
    phoneCountryCallingCode:
      role === 'patient'
        ? '+91'
        : initialValues?.phoneCountryCallingCode ?? '+1',
    phoneNumber: initialValues?.phoneNumber ?? '',
    email: initialValues?.email ?? '',
    city: initialValues?.city ?? '',
    country: initialValues?.country ?? null,
    relationshipToPatient: initialValues?.relationshipToPatient ?? ''
  }));

  const [touched, setTouched] = React.useState({});
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  const errors = React.useMemo(() => validateProfileDraft(values), [values]);

  const setFieldTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));
  const getError = (field) => (touched[field] ? errors[field] : null);

  const hasEmergencyAny = false;

  const requiredValid =
    !errors.fullName &&
    !errors.age &&
    !errors.gender &&
    !errors.preferredLanguage &&
    !errors.city &&
    !errors.country &&
    true;

  const genderItems = React.useMemo(() => toDropdownItems(genders), []);
  const languageItems = React.useMemo(() => toDropdownItems(languages), []);
  const countryItems = React.useMemo(
    () => countries.map((c) => ({ value: c.code, label: c.label })),
    []
  );

  const attemptSubmit = React.useCallback(() => {
    setSubmitAttempted(true);
    setTouched({
      fullName: true,
      age: true,
      gender: true,
      preferredLanguage: true,
      city: true,
      country: true,
    });

    const currentErrors = validateProfileDraft(values);
    const stillValid = Object.values(currentErrors).every((e) => e == null);
    if (!stillValid) {
      Alert.alert('Please review your details', 'Some required fields are missing or invalid.');
      return;
    }

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
      relationshipToPatient: values.relationshipToPatient.trim()
    });
  }, [onSubmit, role, values]);

  React.useImperativeHandle(ref, () => ({
    submit: () => attemptSubmit()
  }));

  return (
    <View style={styles.form}>
      <TextInputField
        label="Full Name"
        value={values.fullName}
        onChangeText={(v) => {
          setValues((s) => ({ ...s, fullName: v }));
          if (submitAttempted) setFieldTouched('fullName');
        }}
        onBlur={() => setFieldTouched('fullName')}
        error={getError('fullName')}
        required
        autoCapitalize="words"
        highContrast={highContrast}
        minFontSize={minFontSize}
      />

      <TextInputField
        label="Age"
        value={values.age}
        onChangeText={(v) => {
          setValues((s) => ({ ...s, age: v }));
          if (submitAttempted) setFieldTouched('age');
        }}
        onBlur={() => setFieldTouched('age')}
        error={getError('age')}
        required
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

      <TextInputField
        label="City"
        value={values.city}
        onChangeText={(v) => {
          setValues((s) => ({ ...s, city: v }));
          if (submitAttempted) setFieldTouched('city');
        }}
        onBlur={() => setFieldTouched('city')}
        error={getError('city')}
        required
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
        searchable
        highContrast={highContrast}
        minFontSize={minFontSize}
      />

      {/* Relationship to Patient removed (optional caregiver-only field) */}

      {showSubmitButton ? (
        <Pressable
          onPress={attemptSubmit}
          style={({ pressed }) => [
            styles.submitButton,
            !requiredValid && { opacity: 0.5 },
            pressed && { opacity: 0.85 }
          ]}
        >
          <Text
            style={[
              styles.submitButtonText,
              { fontSize: role === 'patient' ? 18 : 16 }
            ]}
          >
            {submitLabel}
          </Text>
        </Pressable>
      ) : null}
      {!requiredValid && submitAttempted ? (
        <Text style={styles.formWarning}>
          Please fix the highlighted fields to continue.
        </Text>
      ) : null}
    </View>
  );
});

export default ProfileForm;

const styles = StyleSheet.create({
  form: {
    width: '100%'
  },
  section: {
    marginTop: 16,
    paddingTop: 8
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827'
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
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  formWarning: {
    marginTop: 8,
    color: '#dc2626',
    fontSize: 13,
    lineHeight: 18
  }
});

