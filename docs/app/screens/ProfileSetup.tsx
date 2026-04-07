import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'ProfileSetup'>;

export default function ProfileSetup({ navigation, route }: Props) {
  const { role } = route.params;
  const [dobDate, setDobDate] = React.useState<Date | null>(null);
  const [showDobPicker, setShowDobPicker] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    dob: '',
    gender: '',
    city: ''
  });
  const [language, setLanguage] = React.useState<'English' | 'Kannada' | 'Hindi' | 'Telugu' | 'Tamil'>('English');
  const [languageOpen, setLanguageOpen] = React.useState(false);
  const [genderOpen, setGenderOpen] = React.useState(false);
  const [showErrors, setShowErrors] = React.useState(false);

  const formatDob = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const onDobChange = (event: { type: string }, selectedDate?: Date) => {
    // Android opens a native modal date dialog; close it after selection/dismiss.
    if (Platform.OS === 'android') setShowDobPicker(false);
    if (event.type === 'dismissed' || !selectedDate) return;
    setDobDate(selectedDate);
    setFormData((prev) => ({ ...prev, dob: formatDob(selectedDate) }));
  };

  const handleSubmit = async () => {
    const requiredOk =
      formData.name.trim() &&
      formData.dob.trim() &&
      formData.gender.trim() &&
      formData.city.trim() &&
      language.trim();
    if (!requiredOk) {
      setShowErrors(true);
      return;
    }
    if (role === 'caregiver') {
      navigation.navigate('CaregiverDashboard');
    } else {
      navigation.navigate('PatientDashboard');
    }
  };

  const nameInvalid = showErrors && !formData.name.trim();
  const dobInvalid = showErrors && !formData.dob.trim();
  const genderInvalid = showErrors && !formData.gender.trim();
  const cityInvalid = showErrors && !formData.city.trim();
  const languageInvalid = showErrors && !language.trim();

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Name<Text style={styles.requiredStar}> *</Text></Text>
        <TextInput
          style={[styles.input, nameInvalid ? styles.inputError : null]}
          value={formData.name}
          onChangeText={(value) => setFormData((prev) => ({ ...prev, name: value }))}
        />

        <Text style={styles.label}>DOB<Text style={styles.requiredStar}> *</Text></Text>
        <Pressable
          onPress={() => setShowDobPicker((prev) => !prev)}
          style={[styles.input, styles.selectorInput, dobInvalid ? styles.inputError : null]}
        >
          <Text style={[styles.selectorText, !formData.dob ? styles.selectorPlaceholder : null]}>
            {formData.dob || 'Select date of birth'}
          </Text>
          <Text style={styles.languageChevron}>▾</Text>
        </Pressable>
        {showDobPicker && Platform.OS === 'ios' ? (
          <View style={styles.datePickerWrap}>
            <DateTimePicker
              value={dobDate ?? new Date(1971, 5, 14)}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={onDobChange}
            />
          </View>
        ) : null}
        {showDobPicker && Platform.OS === 'android' ? (
          <DateTimePicker
            value={dobDate ?? new Date(1971, 5, 14)}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={onDobChange}
          />
        ) : null}

        <Text style={styles.label}>Gender<Text style={styles.requiredStar}> *</Text></Text>
        <Pressable
          onPress={() => setGenderOpen((prev) => !prev)}
          style={[styles.input, styles.selectorInput, genderInvalid ? styles.inputError : null]}
        >
          <Text style={[styles.selectorText, !formData.gender ? styles.selectorPlaceholder : null]}>
            {formData.gender || 'Select gender'}
          </Text>
          <Text style={styles.languageChevron}>{genderOpen ? '▴' : '▾'}</Text>
        </Pressable>
        {genderOpen ? (
          <View style={styles.languageList}>
            {(['Male', 'Female', 'Other'] as const).map((option) => (
              <Pressable
                key={option}
                onPress={() => {
                  setFormData((prev) => ({ ...prev, gender: option }));
                  setGenderOpen(false);
                }}
                style={styles.languageListItem}
              >
                <Text style={[styles.languageListText, formData.gender === option ? styles.languageListTextSelected : null]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={styles.label}>Preferred language<Text style={styles.requiredStar}> *</Text></Text>
        <Pressable
          onPress={() => setLanguageOpen((prev) => !prev)}
          style={[styles.input, styles.languageSelector, languageInvalid ? styles.inputError : null]}
        >
          <Text style={styles.languageSelectedText}>{language}</Text>
          <Text style={styles.languageChevron}>{languageOpen ? '▴' : '▾'}</Text>
        </Pressable>
        {languageOpen ? (
          <View style={styles.languageList}>
            {(['English', 'Kannada', 'Hindi', 'Telugu', 'Tamil'] as const).map((option) => (
              <Pressable
                key={option}
                onPress={() => {
                  setLanguage(option);
                  setLanguageOpen(false);
                }}
                style={styles.languageListItem}
              >
                <Text style={[styles.languageListText, language === option ? styles.languageListTextSelected : null]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={styles.label}>City<Text style={styles.requiredStar}> *</Text></Text>
        <TextInput
          style={[styles.input, cityInvalid ? styles.inputError : null]}
          value={formData.city}
          onChangeText={(value) => setFormData((prev) => ({ ...prev, city: value }))}
        />

        <Pressable style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Proceed</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F6' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  label: { fontSize: 14, color: '#2A2A31', marginBottom: 6, marginLeft: 4 },
  requiredStar: { color: '#DC2626', fontWeight: '700' },
  input: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#D0CED0',
    borderWidth: 1,
    borderColor: '#D0CED0',
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    color: '#2A2A31'
  },
  inputError: { borderColor: '#DC2626' },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  selectorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  selectorText: { fontSize: 16, color: '#2A2A31' },
  selectorPlaceholder: { color: '#6B7280' },
  languageSelectedText: { fontSize: 16, color: '#2A2A31' },
  languageChevron: { fontSize: 16, color: '#2A2A31' },
  datePickerWrap: {
    borderRadius: 12,
    backgroundColor: '#E3E1E6',
    marginTop: -8,
    marginBottom: 12,
    overflow: 'hidden'
  },
  languageList: {
    borderRadius: 12,
    backgroundColor: '#E3E1E6',
    paddingVertical: 4,
    marginTop: -8,
    marginBottom: 12
  },
  languageListItem: { paddingVertical: 10, paddingHorizontal: 12 },
  languageListText: { fontSize: 15, color: '#2A2A31' },
  languageListTextSelected: { fontWeight: '700' },
  submitButton: {
    marginTop: 8,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#BFA2DB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitButtonText: { fontSize: 22, color: '#1F1F25', fontWeight: '700' }
});
