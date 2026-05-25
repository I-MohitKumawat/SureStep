import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  TextInput
} from 'react-native';

import { useTheme } from '../../theme/ThemeContext';

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
        relationship:    initialValues?.caregiverInfo?.relationship    ?? '',
        experience:      initialValues?.caregiverInfo?.experience      ?? '',
        educationLevel:  initialValues?.caregiverInfo?.educationLevel  ?? '',
        yearsExperience: initialValues?.caregiverInfo?.yearsExperience ?? '',
        certifications:  initialValues?.caregiverInfo?.certifications  ?? '',
        languages:       initialValues?.caregiverInfo?.languages       ?? '',
        availability:    initialValues?.caregiverInfo?.availability    ?? '',
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
            relationship:    prev.caregiverInfo?.relationship    ?? '',
            experience:      prev.caregiverInfo?.experience      ?? '',
            educationLevel:  prev.caregiverInfo?.educationLevel  ?? '',
            yearsExperience: prev.caregiverInfo?.yearsExperience ?? '',
            certifications:  prev.caregiverInfo?.certifications  ?? '',
            languages:       prev.caregiverInfo?.languages       ?? '',
            availability:    prev.caregiverInfo?.availability    ?? '',
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

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Education Level</Text>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.colors.borderSubtle,
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.background
                }]}
                value={values.caregiverInfo?.educationLevel || ''}
                onChangeText={(value) => updateCaregiverInfo('educationLevel', value)}
                placeholder="e.g. Bachelor's in Nursing, Diploma in Healthcare"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Years of Experience</Text>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.colors.borderSubtle,
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.background
                }]}
                value={values.caregiverInfo?.yearsExperience || ''}
                onChangeText={(value) => updateCaregiverInfo('yearsExperience', value)}
                placeholder="e.g. 3"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Certifications</Text>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.colors.borderSubtle,
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.background,
                  height: 80
                }]}
                value={values.caregiverInfo?.certifications || ''}
                onChangeText={(value) => updateCaregiverInfo('certifications', value)}
                placeholder="e.g. CPR Certified, Dementia Care Certificate"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Languages Spoken</Text>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.colors.borderSubtle,
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.background
                }]}
                value={values.caregiverInfo?.languages || ''}
                onChangeText={(value) => updateCaregiverInfo('languages', value)}
                placeholder="e.g. English, Tamil, Hindi"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Availability</Text>
              <TextInput
                style={[styles.input, {
                  borderColor: theme.colors.borderSubtle,
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.background
                }]}
                value={values.caregiverInfo?.availability || ''}
                onChangeText={(value) => updateCaregiverInfo('availability', value)}
                placeholder="e.g. Weekdays 9amâ€“5pm, Flexible"
                placeholderTextColor={theme.colors.textSecondary}
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
