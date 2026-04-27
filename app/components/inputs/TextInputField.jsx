import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../packages/ui/theme/ThemeProvider';

export default function TextInputField({
  label,
  value,
  onChangeText,
  onBlur,
  onFocus,
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
      <View
        style={[
          styles.shell,
          highContrast && styles.shellHighContrast,
          !highContrast && {
            borderColor: theme.colors.borderSubtle,
            backgroundColor: theme.colors.surface
          }
        ]}
      >
        {label ? (
          <Text
            style={[
              styles.innerLabel,
              highContrast && styles.innerLabelHighContrast,
              { fontSize: Math.max(minFontSize, 13) }
            ]}
          >
            {label}
            {required ? ' *' : ''}
          </Text>
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          onFocus={onFocus}
          editable={editable}
          placeholder={placeholder}
          placeholderTextColor={highContrast ? '#9ca3af' : theme.colors.textSecondary}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          style={[
            styles.input,
            highContrast && styles.inputHighContrast,
            !highContrast && { color: theme.colors.textPrimary },
            { fontSize: Math.max(minFontSize, 14) },
            style
          ]}
        />
      </View>

      {error ? <Text style={[styles.errorText, highContrast && styles.errorTextHighContrast]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 12
  },
  shell: {
    width: '100%',
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff'
  },
  shellHighContrast: {
    borderColor: '#ffffff',
    backgroundColor: '#000000'
  },
  innerLabel: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6
  },
  innerLabelHighContrast: {
    color: '#ffffff'
  },
  input: {
    width: '100%',
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent'
  },
  inputHighContrast: {
    color: '#ffffff'
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

