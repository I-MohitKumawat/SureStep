import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  TextInput
} from 'react-native';

import { useTheme } from '../../../packages/ui/theme/ThemeProvider';

interface ProfileFormProps {
  role: 'caregiver' | 'patient';
  initialValues?: any;
  onSubmit: (data: any) => void;
  submitLabel?: string;
  showSubmitButton?: boolean;
}

const ProfileForm = React.forwardRef<any, ProfileFormProps>(
  function ProfileForm(
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

    const [values, setValues] = React.useState(() => ({
      role,
      fullName: initialValues?.fullName ?? '',
      email: initialValues?.email ?? '',
      phone: initialValues?.phone ?? '',
      caregiverInfo: role === 'caregiver' ? {
        relationship: initialValues?.caregiverInfo?.relationship ?? '',
        experience: initialValues?.caregiverInfo?.experience ?? ''
      } : undefined
    }));

    const updateField = (field: string, value: string) => {
      setValues(prev => ({ ...prev, [field]: value }));
    };

    const updateCaregiverInfo = (field: string, value: string) => {
      if (role === 'caregiver') {
        setValues(prev => ({
          ...prev,
          caregiverInfo: {
            relationship: prev.caregiverInfo?.relationship ?? '',
            experience: prev.caregiverInfo?.experience ?? '',
            [field]: value
          }
        }));
      }
    };

    const handleSubmit = () => {
      onSubmit(values);
    };

    React.useImperativeHandle(ref, () => ({
      submit: handleSubmit,
      getValues: () => values,
      validate: () => true
    }));

    return (
      <View style={styles.formContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Basic Information
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { 
              borderColor: theme.colors.borderSubtle,
              color: theme.colors.textPrimary,
              backgroundColor: theme.colors.background
            }]}
            value={values.fullName}
            onChangeText={(value) => updateField('fullName', value)}
            placeholder="Enter your full name"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Email</Text>
          <TextInput
            style={[styles.input, { 
              borderColor: theme.colors.borderSubtle,
              color: theme.colors.textPrimary,
              backgroundColor: theme.colors.background
            }]}
            value={values.email}
            onChangeText={(value) => updateField('email', value)}
            placeholder="Enter your email"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Phone Number</Text>
          <TextInput
            style={[styles.input, { 
              borderColor: theme.colors.borderSubtle,
              color: theme.colors.textPrimary,
              backgroundColor: theme.colors.background
            }]}
            value={values.phone}
            onChangeText={(value) => updateField('phone', value)}
            placeholder="Enter your phone number"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        {role === 'caregiver' && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginTop: 24 }]}>
              Caregiver Information
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Relationship to Patient</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: theme.colors.borderSubtle,
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.background
                }]}
                value={values.caregiverInfo?.relationship || ''}
                onChangeText={(value) => updateCaregiverInfo('relationship', value)}
                placeholder="e.g., Parent, Spouse, Sibling"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Experience</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: theme.colors.borderSubtle,
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.background,
                  height: 80
                }]}
                value={values.caregiverInfo?.experience || ''}
                onChangeText={(value) => updateCaregiverInfo('experience', value)}
                placeholder="Describe your caregiving experience"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                textAlignVertical="top"
              />
            </View>
          </>
        )}

        {showSubmitButton && (
          <Pressable
            style={[styles.submitButton, { backgroundColor: theme.colors.accent }]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>{submitLabel}</Text>
          </Pressable>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  formContainer: {
    flex: 1
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16
  },
  submitButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default ProfileForm;
