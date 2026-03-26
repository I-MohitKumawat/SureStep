import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../../packages/ui/theme/ThemeProvider';

export default function TextInputField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  required,
  placeholder,
  keyboardType,
  autoCapitalize = 'sentences',
  secureTextEntry,
  editable = true,
  highContrast = false,
  minFontSize = 14,
  style
}) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, highContrast && styles.labelHighContrast, { fontSize: Math.max(minFontSize, 13) }]}>
          {label}
          {required ? ' *' : ''}
        </Text>
      ) : null}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={highContrast ? '#9ca3af' : theme.colors.textSecondary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        style={[
          styles.input,
          highContrast && styles.inputHighContrast,
          !highContrast && {
            borderColor: theme.colors.borderSubtle,
            backgroundColor: theme.colors.surface,
            color: theme.colors.textPrimary
          },
          { minHeight: 48, fontSize: Math.max(minFontSize, 14) },
          style
        ]}
      />

      {error ? <Text style={[styles.errorText, highContrast && styles.errorTextHighContrast]}>{error}</Text> : null}
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
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff'
  },
  inputHighContrast: {
    borderColor: '#ffffff',
    color: '#ffffff',
    backgroundColor: '#000000'
  },
  errorText: {
    marginTop: 6,
    color: '#dc2626',
    fontSize: 12,
    lineHeight: 16
  },
  errorTextHighContrast: {
    color: '#fecaca'
  }
});

