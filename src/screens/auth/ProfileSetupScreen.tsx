import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Platform, Pressable,
  ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
// Navigation types migrated to src/types/navigation.types.ts
// useUserProfile removed — use useAuth() from src/context/AuthContext instead
import { useAuth } from '../../context/AuthContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { AuthStackParams } from '../../types/navigation.types';
import { updateCaregiverProfile, updatePatientProfile } from '../../services/userService';
import { provisionUser } from '../../services/authService';

type Props = NativeStackScreenProps<AuthStackParams, 'ProfileSetupScreen'>;

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SPECIALIZATIONS = ['Alzheimer\'s','Dementia','Bedridden Care','Night Care','Emergency Assistance'];
const AVAILABILITY    = ['Day Shift','Night Shift','Full Time','Emergency Calls'];
const LANGUAGES       = ['English','Hindi','Kannada','Tamil','Telugu','Malayalam','Bengali'];
const TRANSPORT       = ['Own Vehicle','Public Transport','None'];
const GENDERS         = ['Male','Female','Other','Prefer not to say'];
const PREF_LANGUAGES  = ['English','Hindi','Kannada','Tamil','Telugu'];

// â”€â”€ Step Indicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StepBar({ step }: { step: 1 | 2 }) {
  return (
    <View style={s.stepBar}>
      <View style={s.stepItem}>
        <View style={[s.stepCircle, s.stepDone]}>
          {step === 1 ? <Text style={s.stepNum}>1</Text> : <Text style={s.stepCheck}>âœ“</Text>}
        </View>
        <Text style={[s.stepLabel, step === 1 && s.stepLabelActive]}>Profile Details</Text>
      </View>
      <View style={s.stepLine} />
      <View style={s.stepItem}>
        <View style={[s.stepCircle, step === 2 && s.stepDone, step === 1 && s.stepInactive]}>
          <Text style={[s.stepNum, step === 1 && s.stepNumInactive]}>2</Text>
        </View>
        <Text style={[s.stepLabel, step === 2 && s.stepLabelActive]}>Preferences</Text>
      </View>
    </View>
  );
}

// â”€â”€ Floating label input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FInput({ label, value, onChangeText, placeholder, multiline, keyboardType, error }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; multiline?: boolean; keyboardType?: 'default'|'numeric'; error?: boolean;
}) {
  return (
    <View style={[s.fWrap, error && s.fError]}>
      {value.length > 0 && <Text style={s.fLabel}>{label}</Text>}
      <TextInput
        style={[s.fInput, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChangeText}
        placeholder={value.length === 0 ? label : placeholder ?? ''}
        placeholderTextColor={C.textMuted}
        multiline={multiline} keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

// â”€â”€ Chip row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Chips({ options, selected, onToggle }: {
  options: string[]; selected: string[]; onToggle: (v: string) => void;
}) {
  return (
    <View style={s.chips}>
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <Pressable key={opt} onPress={() => onToggle(opt)}
            style={[s.chip, on && s.chipOn]}>
            <Text style={[s.chipText, on && s.chipTextOn]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// â”€â”€ Dropdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Dropdown({ label, value, options, onSelect }: {
  label: string; value: string; options: string[]; onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Pressable style={s.fWrap} onPress={() => setOpen(p => !p)}>
        {value && <Text style={s.fLabel}>{label}</Text>}
        <View style={s.fRow}>
          <Text style={[s.fInput, !value && { color: C.textMuted }]}>{value || label}</Text>
          <Text style={s.chevron}>{open ? 'â–´' : 'â–¾'}</Text>
        </View>
      </Pressable>
      {open && (
        <View style={s.ddBox}>
          {options.map(opt => (
            <Pressable key={opt} style={[s.ddItem, value === opt && s.ddItemOn]}
              onPress={() => { onSelect(opt); setOpen(false); }}>
              <Text style={[s.ddText, value === opt && s.ddTextOn]}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// â”€â”€ Toggle row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ToggleRow({ label, sub, value, onChange }: {
  label: string; sub?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={s.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.toggleLabel}>{label}</Text>
        {sub && <Text style={s.toggleSub}>{sub}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange}
        trackColor={{ false: '#D1D5DB', true: C.primary }}
        thumbColor="#fff" />
    </View>
  );
}

// â”€â”€ Stepper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Stepper({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <View style={s.stepperRow}>
      <Text style={s.stepperLabel}>{label}</Text>
      <View style={s.stepperCtrl}>
        <Pressable style={s.stepperBtn} onPress={() => onChange(Math.max(0, value - 1))}>
          <Text style={s.stepperBtnText}>âˆ’</Text>
        </Pressable>
        <Text style={s.stepperVal}>{value}</Text>
        <Pressable style={s.stepperBtn} onPress={() => onChange(value + 1)}>
          <Text style={s.stepperBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Main Screen
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function ProfileSetupScreen({ route }: Props) {
  const { role } = route.params;
  const { login, user } = useAuth();

  const saveProfile = async (draft: any) => {
    try {
      if (role === 'CAREGIVER') {
        const res = await updateCaregiverProfile(draft);
        return res.status === 200 || res.status === 201;
      } else {
        const res = await updatePatientProfile(draft);
        return res.status === 200 || res.status === 201;
      }
    } catch (err) {
      console.error('[ProfileSetup] Failed to save profile:', err);
      return false;
    }
  };

  // â”€â”€ Step 1 state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [step,        setStep]        = useState<1|2>(1);
  const [photoUri,    setPhotoUri]    = useState<string | null>(null);
  const [photoUrl,    setPhotoUrl]    = useState<string | null>(null);
  const [name,        setName]        = useState('');
  const [dob,         setDob]         = useState('');
  const [dobDate,     setDobDate]     = useState<Date | null>(null);
  const [showDob,     setShowDob]     = useState(false);
  const [gender,      setGender]      = useState('');
  const [language,    setLanguage]    = useState('English');
  const [city,        setCity]        = useState('');
  const [showErrors,  setShowErrors]  = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // —————————————————————————————————————————————————————————————————————————————————————————————
  const [yearsExp,       setYearsExp]       = useState(0);
  const [dementiaExp,    setDementiaExp]    = useState(false);
  const [patientsHandled,setPatientsHandled]= useState(0);
  const [specs,          setSpecs]          = useState<string[]>([]);
  const [langsSpoken,    setLangsSpoken]    = useState<string[]>([]);
  const [availTypes,     setAvailTypes]     = useState<string[]>([]);
  const [radiusKm,       setRadiusKm]       = useState(10);
  const [transport,      setTransport]      = useState('');
  const [hourlyRate,     setHourlyRate]     = useState('');
  const [dailyRate,      setDailyRate]      = useState('');
  const [aboutMe,        setAboutMe]        = useState('');
  const [emergencyResp,  setEmergencyResp]  = useState(false);
  const [canAssist,      setCanAssist]      = useState(false);

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  // â”€â”€ Photo picker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to set a profile picture.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1,1], quality: 0.7,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setPhotoUri(uri);
    // Upload to Supabase Storage
    const phone = user?.id ?? 'unknown';
    const ext   = uri.split('.').pop() ?? 'jpg';
    const path  = `${phone}/avatar.${ext}`;
    try {
      const res  = await fetch(uri);
      const blob = await res.blob();
      // REMOVED: Supabase migration to Express/PostgreSQL
      console.warn('[ProfileSetup] uploadPhoto: Supabase removed, keeping local URI');
    } catch { /* keep local URI, upload failed */ }
  };

  const formatDob = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  // â”€â”€ Step 1 continue â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleStep1 = () => {
    if (!name.trim() || !dob || !gender || !city.trim()) { setShowErrors(true); return; }
    if (role === 'CAREGIVER') { setStep(2); setShowErrors(false); return; }
    void handleFinish();
  };

  // ── Final save ──────────────────────────────────────────────────────────────
  const handleFinish = async () => {
    const phone = user?.phone;
    if (!phone) { setSubmitError('Session expired — go back and log in.'); return; }
    setSubmitting(true); setSubmitError(null);
    try {
      const draft = {
        fullName: name.trim(), role, dob, gender, city: city.trim(), language,
        profilePhotoUrl:    photoUrl,
        // caregiver professional fields
        yearsExperience:    yearsExp,
        dementiaExperience: dementiaExp,
        patientsHandled,
        specializations:    specs,
        languagesSpoken:    langsSpoken,
        availabilityTypes:  availTypes,
        serviceRadiusKm:    radiusKm,
        transportationMode: transport,
        hourlyRate, dailyRate, aboutMe,
        emergencyResponse:  emergencyResp,
        canAssistNearby:    canAssist,
      };

      // 1. Provision the user in backend DB first (which seeds profile tables)
      const provisionRes = await provisionUser({
        name: name.trim(),
        role: role as 'PATIENT' | 'CAREGIVER' | 'FAMILY',
        phone: phone,
        preferred_language: language === 'Hindi' ? 'hi' : 'en',
      });

      if (!provisionRes.data?.success) {
        setSubmitError('Failed to setup account. Please try again.');
        return;
      }

      const dbUser = provisionRes.data.data.user;

      // 2. Update the provisioned profile rows with detailed fields
      const saved = await saveProfile(draft);
      if (!saved) { setSubmitError('Failed to save profile details. Check connection and try again.'); return; }

      // 3. Mark context as authenticated with active profile details
      login({
        id: dbUser.id,
        phone: dbUser.phone,
        name: dbUser.name,
        role: dbUser.role as any,
      });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  // â”€â”€ Step 1 validation helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const nameErr   = showErrors && !name.trim();
  const dobErr    = showErrors && !dob;
  const genderErr = showErrors && !gender;
  const cityErr   = showErrors && !city.trim();

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // RENDER STEP 1
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (step === 1) return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {role === 'CAREGIVER' && <StepBar step={1} />}

        {/* Avatar */}
        <Pressable onPress={pickPhoto} style={s.avatarWrap}>
          {photoUri
            ? <Image source={{ uri: photoUri }} style={s.avatarImg} />
            : <View style={s.avatarPlaceholder}><Text style={s.avatarIcon}>ðŸ‘¤</Text></View>
          }
          <View style={s.avatarPlus}><Text style={s.avatarPlusText}>+</Text></View>
        </Pressable>

        <Text style={s.heading}>Set up your profile</Text>
        <Text style={s.subheading}>{role === 'CAREGIVER' ? 'Caregiver account' : 'Patient account'}</Text>

        {/* Name */}
        <View style={[s.fWrap, nameErr && s.fError]}>
          {name.length > 0 && <Text style={s.fLabel}>Full Name</Text>}
          <TextInput style={s.fInput} value={name} onChangeText={setName}
            placeholder="Full Name" placeholderTextColor={C.textMuted} />
        </View>
        {nameErr && <Text style={s.errText}>Name is required</Text>}

        {/* DOB */}
        <Pressable style={[s.fWrap, dobErr && s.fError]} onPress={() => setShowDob(p => !p)}>
          {dob && <Text style={s.fLabel}>Date of Birth</Text>}
          <View style={s.fRow}>
            <Text style={[s.fInput, !dob && { color: C.textMuted }]}>{dob || 'Date of Birth'}</Text>
            <Text style={s.calIcon}>ðŸ“…</Text>
          </View>
        </Pressable>
        {dobErr && <Text style={s.errText}>Date of birth is required</Text>}
        {showDob && Platform.OS === 'ios' && (
          <View style={s.pickerWrap}>
            <DateTimePicker value={dobDate ?? new Date(1975,0,1)} mode="date" display="spinner"
              maximumDate={new Date()}
              onChange={(e, d) => { if (e.type !== 'dismissed' && d) { setDobDate(d); setDob(formatDob(d)); } }} />
          </View>
        )}
        {showDob && Platform.OS === 'android' && (
          <DateTimePicker value={dobDate ?? new Date(1975,0,1)} mode="date" display="default"
            maximumDate={new Date()}
            onChange={(e, d) => { setShowDob(false); if (e.type !== 'dismissed' && d) { setDobDate(d); setDob(formatDob(d)); } }} />
        )}

        {/* Gender */}
        <Dropdown label="Gender" value={gender} options={GENDERS} onSelect={setGender} />
        {genderErr && <Text style={[s.errText, { marginTop: -10 }]}>Gender is required</Text>}

        {/* Language */}
        <Dropdown label="Preferred Language" value={language} options={PREF_LANGUAGES} onSelect={setLanguage} />

        {/* City */}
        <View style={[s.fWrap, cityErr && s.fError]}>
          {city.length > 0 && <Text style={s.fLabel}>City</Text>}
          <TextInput style={s.fInput} value={city} onChangeText={setCity}
            placeholder="City" placeholderTextColor={C.textMuted} />
        </View>
        {cityErr && <Text style={s.errText}>City is required</Text>}

        {submitError && <View style={s.errBox}><Text style={s.errBoxText}>âš  {submitError}</Text></View>}

        <Pressable style={({ pressed }) => [s.cta, (pressed || submitting) && s.ctaPressed]}
          onPress={() => void handleStep1()} disabled={submitting}>
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.ctaText}>{role === 'CAREGIVER' ? 'Continue' : 'Get Started'}</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // RENDER STEP 2 (caregiver only)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <StepBar step={2} />
        <Text style={s.heading}>Professional Info</Text>
        <Text style={s.subheading}>Help patients find the right match</Text>

        <Text style={s.sectionTitle}>Experience</Text>
        <Stepper label="Years of Caregiving Experience" value={yearsExp} onChange={setYearsExp} />
        <Stepper label="Total Patients Handled" value={patientsHandled} onChange={setPatientsHandled} />
        <ToggleRow label="Dementia Care Experience" value={dementiaExp} onChange={setDementiaExp} />

        <Text style={s.sectionTitle}>Specializations</Text>
        <Chips options={SPECIALIZATIONS} selected={specs}
          onToggle={v => setSpecs(toggle(specs, v))} />

        <Text style={s.sectionTitle}>Languages Spoken</Text>
        <Chips options={LANGUAGES} selected={langsSpoken}
          onToggle={v => setLangsSpoken(toggle(langsSpoken, v))} />

        <Text style={s.sectionTitle}>Available For</Text>
        <Chips options={AVAILABILITY} selected={availTypes}
          onToggle={v => setAvailTypes(toggle(availTypes, v))} />

        <Text style={s.sectionTitle}>Location & Transport</Text>
        <Stepper label="Service Radius (km)" value={radiusKm} onChange={setRadiusKm} />
        <Dropdown label="Transportation Mode" value={transport} options={TRANSPORT} onSelect={setTransport} />

        <Text style={s.sectionTitle}>Charges</Text>
        <FInput label="Hourly Rate (e.g. â‚¹300/hr)" value={hourlyRate} onChangeText={setHourlyRate} />
        <FInput label="Daily Rate (e.g. â‚¹2000/day)" value={dailyRate} onChangeText={setDailyRate} />

        <Text style={s.sectionTitle}>About Me</Text>
        <FInput label="Short bio â€” introduce yourself to patients..." value={aboutMe} onChangeText={setAboutMe} multiline />

        <Text style={s.sectionTitle}>Emergency Settings</Text>
        <ToggleRow label="Emergency Response Availability"
          sub="You can be contacted for patient emergencies"
          value={emergencyResp} onChange={setEmergencyResp} />
        <ToggleRow label="Can Assist Nearby Patients"
          sub="Available to help patients in your area during emergencies"
          value={canAssist} onChange={setCanAssist} />

        {submitError && <View style={s.errBox}><Text style={s.errBoxText}>âš  {submitError}</Text></View>}

        <Pressable style={({ pressed }) => [s.cta, (pressed || submitting) && s.ctaPressed]}
          onPress={() => void handleFinish()} disabled={submitting}>
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.ctaText}>Complete Profile</Text>}
        </Pressable>
        <Pressable onPress={() => void handleFinish()} style={s.skipBtn}>
          <Text style={s.skipText}>Skip for now</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: C.bg },
  scroll:{ paddingHorizontal: 22, paddingTop: 20, paddingBottom: 48 },

  // Step bar
  stepBar:  { flexDirection:'row', alignItems:'center', justifyContent:'center', marginBottom: 28 },
  stepItem: { alignItems:'center', gap: 4 },
  stepLine: { flex:1, height:2, backgroundColor:'#D1FAE5', marginHorizontal: 8, marginBottom: 16 },
  stepCircle:{ width:32, height:32, borderRadius:16, backgroundColor: C.primary, alignItems:'center', justifyContent:'center' },
  stepDone:  { backgroundColor: C.primary },
  stepInactive:{ backgroundColor:'#E5E7EB' },
  stepNum:   { fontFamily: F.bold, fontSize:14, color:'#fff' },
  stepNumInactive:{ color:'#9CA3AF' },
  stepCheck: { fontFamily: F.bold, fontSize:14, color:'#fff' },
  stepLabel: { fontFamily: F.regular, fontSize:11, color: C.textSecondary, textAlign:'center', width:64 },
  stepLabelActive:{ fontFamily: F.bold, color: C.primary },

  // Avatar
  avatarWrap:       { alignSelf:'center', marginBottom:20, position:'relative' },
  avatarPlaceholder:{ width:90, height:90, borderRadius:45, backgroundColor:'#E5E7EB', alignItems:'center', justifyContent:'center' },
  avatarImg:        { width:90, height:90, borderRadius:45 },
  avatarIcon:       { fontSize:40 },
  avatarPlus:       { position:'absolute', bottom:0, right:0, width:26, height:26, borderRadius:13, backgroundColor: C.primary, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'#fff' },
  avatarPlusText:   { color:'#fff', fontSize:16, fontFamily: F.bold, lineHeight:20 },

  heading:   { fontFamily: F.extraBold, fontSize:24, color: C.textPrimary, textAlign:'center', marginBottom:4 },
  subheading:{ fontFamily: F.regular, fontSize:14, color: C.textSecondary, textAlign:'center', marginBottom:24 },

  // Floating-label input
  fWrap:  { borderWidth:1.5, borderColor: C.border, borderRadius:14, paddingHorizontal:14, paddingTop:8, paddingBottom:8, marginBottom:14, minHeight:52, justifyContent:'center' },
  fError: { borderColor: C.error },
  fLabel: { fontFamily: F.regular, fontSize:11, color: C.primary, marginBottom:2 },
  fInput: { fontFamily: F.regular, fontSize:15, color: C.textPrimary, padding:0, minHeight:28 },
  fRow:   { flexDirection:'row', alignItems:'center' },
  chevron:{ fontSize:13, color: C.textSecondary, marginLeft:6 },
  calIcon:{ fontSize:18, marginLeft:6 },

  pickerWrap:{ borderRadius:12, backgroundColor: C.surface, borderWidth:1, borderColor: C.border, marginTop:-8, marginBottom:8, overflow:'hidden' },

  ddBox:    { borderWidth:1.5, borderColor: C.border, borderRadius:14, backgroundColor: C.surface, paddingVertical:4, marginTop:-10, marginBottom:14, zIndex:100 },
  ddItem:   { paddingVertical:11, paddingHorizontal:16 },
  ddItemOn: { backgroundColor: C.primaryLight },
  ddText:   { fontFamily: F.regular, fontSize:15, color: C.textPrimary },
  ddTextOn: { fontFamily: F.bold, color: C.primary },

  errText:{ fontFamily: F.regular, fontSize:12, color: C.error, marginTop:-10, marginBottom:8, marginLeft:4 },
  errBox: { borderRadius:10, backgroundColor:'#FEF2F2', borderWidth:1, borderColor:'#FECACA', padding:12, marginBottom:12 },
  errBoxText:{ fontFamily: F.semiBold, fontSize:13, color:'#DC2626' },

  cta:       { height:52, borderRadius:26, backgroundColor: C.primary, alignItems:'center', justifyContent:'center', marginTop:12, shadowColor: C.primary, shadowOpacity:0.3, shadowOffset:{width:0,height:6}, shadowRadius:12, elevation:6 },
  ctaPressed:{ opacity:0.88, transform:[{scale:0.98}] },
  ctaText:   { fontFamily: F.bold, fontSize:17, color:'#fff' },
  skipBtn:   { alignItems:'center', marginTop:14, paddingVertical:6 },
  skipText:  { fontFamily: F.regular, fontSize:14, color: C.textMuted },

  // Section title
  sectionTitle:{ fontFamily: F.bold, fontSize:13, color: C.textLabel ?? C.textSecondary, letterSpacing:0.8, textTransform:'uppercase', marginTop:20, marginBottom:10 },

  // Chips
  chips:   { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:4 },
  chip:    { paddingHorizontal:14, paddingVertical:8, borderRadius:20, borderWidth:1.5, borderColor: C.border, backgroundColor: C.surface },
  chipOn:  { backgroundColor: C.primary, borderColor: C.primary },
  chipText:{ fontFamily: F.medium ?? F.regular, fontSize:13, color: C.textSecondary },
  chipTextOn:{ color:'#fff' },

  // Toggle
  toggleRow:  { flexDirection:'row', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderBottomColor: C.border + '40' },
  toggleLabel:{ fontFamily: F.semiBold, fontSize:14, color: C.textPrimary },
  toggleSub:  { fontFamily: F.regular, fontSize:12, color: C.textSecondary, marginTop:2 },

  // Stepper
  stepperRow: { flexDirection:'row', alignItems:'center', paddingVertical:10, borderBottomWidth:1, borderBottomColor: C.border + '40', marginBottom:2 },
  stepperLabel:{ flex:1, fontFamily: F.regular, fontSize:14, color: C.textPrimary },
  stepperCtrl: { flexDirection:'row', alignItems:'center', gap:12 },
  stepperBtn:  { width:32, height:32, borderRadius:16, backgroundColor: C.primaryLight ?? '#D1FAE5', alignItems:'center', justifyContent:'center' },
  stepperBtnText:{ fontFamily: F.bold, fontSize:18, color: C.primary, lineHeight:22 },
  stepperVal:  { fontFamily: F.bold, fontSize:16, color: C.textPrimary, minWidth:28, textAlign:'center' },
});
