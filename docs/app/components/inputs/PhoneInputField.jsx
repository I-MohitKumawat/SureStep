import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../../packages/ui/theme/ThemeProvider';

import DropdownPicker from './DropdownPicker';
import TextInputField from './TextInputField';

const { countries } = require('../../utils/profile/profileData');

function buildCallingCodeItems() {
  const map = new Map();
  for (const c of countries) {
    const key = c.callingCode;
    if (!map.has(key)) map.set(key, { value: c.callingCode, label: `${c.callingCode} (${c.code})` });
  }
  return Array.from(map.values()).sort((a, b) => (a.value > b.value ? 1 : -1));
}

const callingCodeItems = buildCallingCodeItems();

export default function PhoneInputField({
  label = 'Phone Number',
  countryCallingCode,
  phoneNumber,
  onChangeCountryCallingCode,
  onChangePhoneNumber,
  onCountryCodeTouched,
  onPhoneTouched,
  error,
  required,
  highContrast = false,
  minFontSize = 14,
  lockedCountryCallingCode
}) {
  const theme = useTheme();
  const phoneErrorToShow = error ? error : null;
  const [phoneFocused, setPhoneFocused] = React.useState(false);

  return (
    <View style={styles.wrapper}>
      {lockedCountryCallingCode ? (
        <View style={[styles.lockedCode, { borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surface }]}>
          <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
            Country code: {lockedCountryCallingCode}
          </Text>
        </View>
      ) : (
        <DropdownPicker
          label="Country code"
          items={callingCodeItems}
          value={countryCallingCode}
          onValueChange={(v) => {
            onChangeCountryCallingCode(v);
            onCountryCodeTouched?.();
          }}
          placeholder="Select…"
          searchable={false}
          highContrast={highContrast}
          minFontSize={minFontSize}
        />
      )}

      <TextInputField
        label={label}
        value={phoneNumber}
        onChangeText={onChangePhoneNumber}
        onBlur={() => {
          setPhoneFocused(false);
          onPhoneTouched?.();
        }}
        onFocus={() => setPhoneFocused(true)}
        required={required}
        keyboardType="phone-pad"
        autoCapitalize="none"
        error={phoneErrorToShow}
        highContrast={highContrast}
        minFontSize={minFontSize}
      />

      <View
        style={[
          styles.phoneUnderline,
          phoneFocused ? { backgroundColor: '#16a34a' } : { backgroundColor: 'transparent' }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 12
  },
  label: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6
  },
  labelHighContrast: {
    color: '#ffffff'
  },
  lockedCode: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginBottom: 12
  },
  phoneUnderline: {
    height: 3,
    borderRadius: 2,
    marginTop: 2,
    backgroundColor: 'transparent'
  }
});

