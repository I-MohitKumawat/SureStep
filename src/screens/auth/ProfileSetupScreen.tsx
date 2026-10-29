/**
 * SureStep — src/screens/auth/ProfileSetupScreen.tsx
 * Onboarding screen matching the clean step-based UI from reference.
 * Patient: 2 steps total (1: RoleSelection, 2: ProfileSetup)
 * Caregiver: 3 steps total (1: RoleSelection, 2: Basic Info, 3: Professional Info)
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Platform, Pressable,
  ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { AuthStackParams } from '../../types/navigation.types';
import { updateCaregiverProfile, updatePatientProfile, updateMe, uploadProfilePhoto } from '../../services/userService';
import { updateFamilyProfile } from '../../services/familyService';
import { provisionUser } from '../../services/authService';
import { ScreenContainer } from '../../components/shared/ScreenContainer';

type Props = NativeStackScreenProps<AuthStackParams, 'ProfileSetupScreen'>;

// ─── Constants ───────────────────────────────────────────────────────────────
const SPECIALIZATIONS = [
  "Alzheimer's",
  "Dementia",
  "Bedridden Care",
  "Night Care",
  "Emergency Assistance",
];
const LANGUAGES = [
  "English",
  "Hindi",
  "Kannada",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Bengali",
];
const AVAILABILITY = [
  "Day Shift",
  "Night Shift",
  "Full Time",
  "Emergency Calls",
];
const GENDERS = ["Male", "Female"];
const PREF_LANGUAGES = ["English", "Hindi", "Kannada", "Tamil", "Telugu"];
const RELATION_OPTIONS = ["Spouse", "Parent", "Daughter", "Son", "Sibling", "Grandchild", "Friend", "Other"];

// ─── Step Indicator ──────────────────────────────────────────────────────────
function StepIndicator({
  current,
  total,
  labels,
}: {
  current: number;
  total: number;
  labels: string[];
}) {
  return (
    <View style={si.wrap}>
      {Array.from({ length: total }, (_, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <React.Fragment key={idx}>
            <View style={si.item}>
              <View
                style={[
                  si.circle,
                  done && si.circleDone,
                  active && si.circleActive,
                ]}
              >
                {done ? (
                  <Text style={si.check}>✓</Text>
                ) : (
                  <Text
                    style={[
                      si.num,
                      active && si.numActive,
                      !active && !done && si.numMuted,
                    ]}
                  >
                    {idx}
                  </Text>
                )}
              </View>
              <Text
                style={[si.label, active && si.labelActive, done && si.labelDone]}
              >
                {labels[i]}
              </Text>
            </View>
            {i < total - 1 && <View style={[si.dash, done && si.dashDone]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─── Underline Input ─────────────────────────────────────────────────────────
function UnderlineInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  error,
  rightElement,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "phone-pad";
  error?: boolean;
  rightElement?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const showFloatingLabel = value.length > 0 || focused;

  return (
    <View style={ui.container}>
      <View style={ui.wrapper}>
        <Text
          style={[
            ui.label,
            showFloatingLabel ? ui.labelVisible : ui.labelHidden,
            focused && ui.labelFocused,
            error && ui.labelError,
          ]}
        >
          {label}
        </Text>
        <View style={ui.row}>
          <TextInput
            style={[
              ui.input,
              multiline && ui.inputMultiline,
              focused && ui.inputFocused,
              error && ui.inputError,
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={focused ? "" : placeholder || label}
            placeholderTextColor={C.textMuted}
            multiline={multiline}
            keyboardType={keyboardType ?? "default"}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {rightElement}
        </View>
      </View>
    </View>
  );
}

// ─── Dropdown Picker ─────────────────────────────────────────────────────────
function DropdownPicker({
  label,
  value,
  options,
  onSelect,
  error,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={dp.container}>
      <Pressable style={dp.wrapper} onPress={() => setOpen((prev) => !prev)}>
        <Text style={[dp.label, value.length > 0 && dp.labelVisible, error && dp.labelError]}>
          {label}
        </Text>
        <View style={dp.inputRow}>
          <Text style={[dp.valueText, !value && dp.valuePlaceholder]}>
            {value || label}
          </Text>
          <Text style={dp.chevron}>{open ? "▲" : "▼"}</Text>
        </View>
      </Pressable>

      {open && (
        <View style={dp.dropdown}>
          {options.map((opt) => (
            <Pressable
              key={opt}
              style={[dp.item, value === opt && dp.itemSelected]}
              onPress={() => {
                onSelect(opt);
                setOpen(false);
              }}
            >
              <Text style={[dp.itemText, value === opt && dp.itemTextSelected]}>
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Interactive Chips ───────────────────────────────────────────────────────
function SelectionChips({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  return (
    <View style={ch.container}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => onToggle(opt)}
            style={[ch.chip, isSelected && ch.chipActive]}
          >
            <Text style={[ch.chipText, isSelected && ch.chipTextActive]}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Stepper Row ─────────────────────────────────────────────────────────────
function StepperRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={st.container}>
      <Text style={st.label}>{label}</Text>
      <View style={st.controls}>
        <Pressable
          style={st.button}
          onPress={() => onChange(Math.max(0, value - 1))}
        >
          <Text style={st.buttonText}>−</Text>
        </Pressable>
        <Text style={st.value}>{value}</Text>
        <Pressable style={st.button} onPress={() => onChange(value + 1)}>
          <Text style={st.buttonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ProfileSetupScreen({ route, navigation }: Props) {
  const { login, user, firebaseUser, logout, refreshUser } = useAuth();
  const role =
    route.params?.role ||
    (user?.role && user.role !== "NEW_USER" ? user.role : "PATIENT");

  useEffect(() => {
    if (role === 'PATIENT') {
      const intent = route.params?.intent || 'RECEIVING_CARE';
      navigation.replace('PatientOnboardingScreen', { intent });
    } else if (role === 'FAMILY') {
      const intent = route.params?.intent || 'SUPPORTING_AS_FAMILY';
      navigation.replace('FamilyOnboardingScreen', { intent });
    }
  }, [role, route.params?.intent, navigation]);

  // Flow State logic
  const [step, setStep] = useState<2 | 3>(2); // Starts at step 2 (Role selection was step 1)
  const totalSteps = role === "CAREGIVER" ? 3 : 2;
  const stepLabels =
    role === "CAREGIVER"
      ? ["Your Role", "Basic Info", "Professional"]
      : ["Your Role", "Profile Info"];

  // Form Fields State
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [showDob, setShowDob] = useState(false);
  const [gender, setGender] = useState("");
  const [language, setLanguage] = useState("English");
  const [city, setCity] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [optInNews, setOptInNews] = useState(true);

  // Family Fields
  const [relationLabel, setRelationLabel] = useState("");
  const [whatsAppNumber, setWhatsAppNumber] = useState("");
  const [notifyOnBreach, setNotifyOnBreach] = useState(true);
  const [notifyOnSos, setNotifyOnSos] = useState(true);
  const [notifyOnMissedCritical, setNotifyOnMissedCritical] = useState(true);
  const [notifyOnDailyDigest, setNotifyOnDailyDigest] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState<'DAILY' | 'WEEKLY'>('DAILY');

  // Professional Caregiver Fields (Step 3)
  const [yearsExp, setYearsExp] = useState(0);
  const [maxPatients, setMaxPatients] = useState(3);
  const [radiusKm, setRadiusKm] = useState(10);
  const [specs, setSpecs] = useState<string[]>([]);
  const [langsSpoken, setLangsSpoken] = useState<string[]>([]);
  const [availTypes, setAvailTypes] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [bio, setBio] = useState("");
  const [isDiscoverable, setIsDiscoverable] = useState(true);

  // Validation / Location / API state
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow photo access to set a profile picture."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    setPhotoUri(result.assets[0].uri);
  };

  const detectLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to detect city.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const reverse = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      if (reverse && reverse.length > 0) {
        const item = reverse[0];
        const cityName = item.city || item.subregion || item.district || item.region || "";
        if (cityName) {
          setCity(cityName);
        } else {
          Alert.alert("Location Resolved", "Unable to extract city name from address details. Please type manually.");
        }
      }
    } catch (e) {
      console.warn("Location error:", e);
      Alert.alert("Error", "Could not fetch current city location.");
    } finally {
      setLocLoading(false);
    }
  };

  const handleNext = () => {
    // Validation: name, date of birth, gender, and city are required
    if (!name.trim() || !dob || !gender || !city.trim()) {
      setSubmitError("Please fill out all required fields.");
      setShowErrors(true);
      return;
    }
    if (role === "PATIENT") {
      if (!emergencyName.trim() || !emergencyPhone.trim()) {
        setSubmitError("Please fill out all required fields.");
        setShowErrors(true);
        return;
      }
    }
    if (role === "FAMILY") {
      if (!relationLabel) {
        setSubmitError("Please select your relationship to the patient.");
        setShowErrors(true);
        return;
      }
    }
    setSubmitError(null);

    if (role === "CAREGIVER" && step === 2) {
      setStep(3);
      setShowErrors(false);
      return;
    }
    void handleFinish();
  };

  const saveProfile = async (draft: any) => {
    try {
      if (role === "CAREGIVER") {
        const res = await updateCaregiverProfile({
          years_of_experience: draft.yearsExperience,
          specializations: draft.specializations,
          languages_spoken: draft.languagesSpoken,
          availability_types: draft.availabilityTypes,
          service_radius_km: draft.serviceRadiusKm,
          bio: draft.aboutMe,
          hourly_rate: draft.hourlyRate ? parseFloat(draft.hourlyRate) : null,
          daily_rate: draft.dailyRate ? parseFloat(draft.dailyRate) : null,
          max_patients: draft.maxPatients,
          is_discoverable: draft.isDiscoverable,
        });
        return res.status === 200 || res.status === 201;
      } else if (role === "FAMILY") {
        console.log("[ONBOARDING] Updating family profile...");
        try {
          const res = await updateFamilyProfile({
            relation_label: draft.relationLabel || null,
            whatsapp_number: draft.whatsAppNumber || null,
            notify_on_breach: draft.notifyOnBreach,
            notify_on_sos: draft.notifyOnSos,
            notify_on_missed_critical: draft.notifyOnMissedCritical,
            notify_on_daily_digest: draft.notifyOnDailyDigest,
            digest_frequency: draft.digestFrequency,
          });
          console.log("[ONBOARDING] Family profile updated successfully");
          return res.status === 200 || res.status === 201 || (res.data as any)?.success;
        } catch (famErr: any) {
          console.warn("[ONBOARDING] updateFamilyProfile extended payload failed, retrying core fields:", famErr?.message);
          try {
            const fallbackRes = await updateFamilyProfile({
              whatsapp_number: draft.whatsAppNumber || null,
              digest_frequency: draft.digestFrequency,
            });
            console.log("[ONBOARDING] Family profile core fallback updated successfully");
            return fallbackRes.status === 200 || fallbackRes.status === 201 || (fallbackRes.data as any)?.success;
          } catch (coreErr: any) {
            console.warn("[ONBOARDING] updateFamilyProfile core payload notice:", coreErr?.message);
            return true; // Non-fatal: user row already provisioned
          }
        }
      } else {
        const res = await updatePatientProfile({
          emergency_contact_name: draft.emergencyContactName,
          emergency_contact_phone: draft.emergencyContactPhone,
          diagnosis: null,
          diagnosis_date: null,
          medications: [],
          known_triggers: [],
          comfort_items: [],
          favourite_songs: [],
        });
        return res.status === 200 || res.status === 201;
      }
    } catch (err: any) {
      console.error("[ONBOARDING] Failed to save profile details:", err?.message);
      return false;
    }
  };

  const handleFinish = async () => {
    const phone = firebaseUser?.phoneNumber || user?.phone;
    if (!firebaseUser && !user) {
      setSubmitError("Session expired — go back and log in.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const draft = {
        fullName: name.trim(),
        role,
        dob,
        gender,
        city: city.trim(),
        language,
        profilePhotoUrl: photoUri,
        // patient fields
        emergencyContactName: emergencyName.trim(),
        emergencyContactPhone: emergencyPhone.trim(),
        // caregiver professional fields
        yearsExperience: yearsExp,
        maxPatients,
        specializations: specs,
        languagesSpoken: langsSpoken,
        availabilityTypes: availTypes,
        serviceRadiusKm: radiusKm,
        hourlyRate,
        dailyRate,
        aboutMe: bio.trim(),
        isDiscoverable,
        // family fields
        relationLabel,
        whatsAppNumber,
        notifyOnBreach,
        notifyOnSos,
        notifyOnMissedCritical,
        notifyOnDailyDigest,
        digestFrequency,
      };

      // 1. Provision user in backend DB
      console.log("[ONBOARDING] Family provision started, role:", role);
      let provisionedUser: any;
      try {
        const provisionRes = await provisionUser({
          name: name.trim(),
          role: role as "PATIENT" | "CAREGIVER" | "FAMILY",
          phone: phone || undefined,
          preferred_language: language === "Hindi" ? "hi" : "en",
        });
        provisionedUser = provisionRes.data?.data?.user;
        if (!provisionedUser) {
          setSubmitError("Failed to create account. Please try again.");
          return;
        }
        console.log("[ONBOARDING] Family provision succeeded, id:", provisionedUser.id);
      } catch (provErr: any) {
        const errMsg =
          provErr.response?.data?.error?.message ||
          provErr.message ||
          "Account creation failed.";
        console.error("[ONBOARDING] Family provision failed:", errMsg);
        setSubmitError(errMsg);
        return;
      }

      // 1.5 Upload profile picture if exists
      let remotePhotoUrl = undefined;
      if (photoUri) {
        try {
          remotePhotoUrl = await uploadProfilePhoto(photoUri);
        } catch (uploadErr) {
          console.warn("[ProfileSetup] photo upload failed, proceeding without photo:", uploadErr);
        }
      }

      // 2. Update core user fields
      try {
        await updateMe({
          name: name.trim(),
          date_of_birth: dobDate
            ? dobDate.toISOString().split("T")[0]
            : undefined,
          gender: draft.gender,
          city: draft.city,
          preferred_language: language === "Hindi" ? "hi" : "en",
          photo_url: remotePhotoUrl || undefined,
        });
        console.log("[ONBOARDING] Core user fields updated");
      } catch (updateErr: any) {
        console.warn("[ProfileSetup] updateMe notice:", updateErr?.message);
      }

      // 3. Update role-specific extended profile rows
      try {
        await saveProfile(draft);
      } catch (saveErr: any) {
        console.warn("[ProfileSetup] saveProfile non-fatal notice:", saveErr?.message);
      }

      // 4. Mark context as authenticated with the explicit role
      console.log("[ONBOARDING] Marking context as authenticated with role:", provisionedUser.role);
      await login(
        {
          id: provisionedUser.id,
          phone: provisionedUser.phone || phone,
          name: name.trim(),
          role: provisionedUser.role as any,
          photo_url: remotePhotoUrl || undefined,
        },
        undefined,
        provisionedUser.role as any
      );

      // Refresh to load complete domain context and care relationships
      try {
        console.log("[AUTH] refreshUser started");
        await refreshUser();
        console.log("[AUTH] refreshUser finished");
      } catch (refErr: any) {
        console.warn("[ProfileSetup] refreshUser notice:", refErr?.message);
      }
    } catch (e) {
      console.error("[ProfileSetup] handleFinish error:", e);
      setSubmitError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace("WelcomeScreen");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const toggleList = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const formatDob = (d: Date) =>
    d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const hasErrors = (field: string) => {
    if (!showErrors) return false;
    if (field === "name") return !name.trim();
    if (field === "dob") return !dob;
    if (field === "gender") return !gender;
    if (field === "city") return !city.trim();
    if (field === "emergencyName") return !emergencyName.trim();
    if (field === "emergencyPhone") return !emergencyPhone.trim();
    if (field === "relationLabel") return !relationLabel;
    return false;
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} style={s.root}>
      {() => (
        <>
          {/* Top action bar */}
          <View style={s.topBar}>
            <Pressable
              onPress={() => {
                if (role === "CAREGIVER" && step === 3) {
                  setStep(2);
                } else {
                  navigation.goBack();
                }
              }}
              style={s.topBtn}
            >
              <Text style={s.topBtnText}>
                {role === "CAREGIVER" && step === 3 ? "← Back" : "← Cancel"}
              </Text>
            </Pressable>

            <Text style={s.topTitle}>Welcome back!</Text>

            <Pressable onPress={handleLogout} style={s.topBtn}>
              <Text style={[s.topBtnText, s.logoutColor]}>Log out</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <StepIndicator current={step} total={totalSteps} labels={stepLabels} />

            {/* Profile Avatar (Step 2 Only) */}
            {step === 2 && (
              <View style={s.avatarContainer}>
                <Pressable onPress={pickPhoto} style={s.avatarTouchable}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={s.avatarImage} />
                  ) : (
                    <View style={s.avatarPlaceholder}>
                      <Text style={s.avatarInitials}>
                        {name ? name.substring(0, 2).toUpperCase() : "?"}
                      </Text>
                    </View>
                  )}
                  {/* Badge Camera icon */}
                  <View style={s.cameraBadge}>
                    <Text style={s.cameraIcon}>📷</Text>
                  </View>
                </Pressable>
                <Text style={s.avatarTip}>
                  Please make sure that your profile picture is a photo of yourself *
                </Text>
              </View>
            )}

            {/* White Rounded Form Box (matches reference image) */}
            <View style={s.card}>
              {step === 2 && (
                <>
                  {/* Basic Fields */}
                  <UnderlineInput
                    label="Full Name"
                    value={name}
                    onChangeText={setName}
                    error={hasErrors("name")}
                  />

                  <Pressable onPress={() => setShowDob(true)}>
                    <View pointerEvents="none">
                      <UnderlineInput
                        label="Date of Birth"
                        value={dob}
                        onChangeText={() => {}}
                        placeholder="Date of Birth"
                        error={hasErrors("dob")}
                      />
                    </View>
                  </Pressable>

                  {showDob && (
                    <DateTimePicker
                      value={dobDate ?? new Date(1990, 0, 1)}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      maximumDate={new Date()}
                      onChange={(event, date) => {
                        setShowDob(false);
                        if (date) {
                          setDobDate(date);
                          setDob(formatDob(date));
                        }
                      }}
                    />
                  )}

                  <DropdownPicker
                    label="Gender"
                    value={gender}
                    options={GENDERS}
                    onSelect={setGender}
                    error={hasErrors("gender")}
                  />

                  <DropdownPicker
                    label="Preferred Language"
                    value={language}
                    options={PREF_LANGUAGES}
                    onSelect={setLanguage}
                  />

                  <UnderlineInput
                    label="City"
                    value={city}
                    onChangeText={setCity}
                    error={hasErrors("city")}
                    rightElement={
                      <Pressable
                        onPress={detectLocation}
                        disabled={locLoading}
                        style={s.locDetectBtn}
                      >
                        {locLoading ? (
                          <ActivityIndicator size="small" color={C.primary} />
                        ) : (
                          <Text style={s.locDetectText}>📍 Locate</Text>
                        )}
                      </Pressable>
                    }
                  />

                  {/* Patient Emergency Details */}
                  {role === "PATIENT" && (
                    <>
                      <View style={s.divider} />
                      <Text style={s.sectionHeader}>Emergency Contact</Text>

                      <UnderlineInput
                        label="Contact Person Name"
                        value={emergencyName}
                        onChangeText={setEmergencyName}
                        error={hasErrors("emergencyName")}
                      />

                      <UnderlineInput
                        label="Contact Phone Number"
                        value={emergencyPhone}
                        onChangeText={setEmergencyPhone}
                        keyboardType="phone-pad"
                        error={hasErrors("emergencyPhone")}
                      />
                    </>
                  )}

                  {/* Caregiver Bio */}
                  {role === "CAREGIVER" && (
                    <>
                      <View style={s.divider} />
                      <UnderlineInput
                        label="About Me (Short Bio)"
                        value={bio}
                        onChangeText={setBio}
                        multiline
                      />
                    </>
                  )}

                  {/* Family Role Details */}
                  {role === "FAMILY" && (
                    <>
                      <View style={s.divider} />
                      <Text style={s.sectionHeader}>Family Member Profile</Text>

                      <DropdownPicker
                        label="Relationship to Patient"
                        value={relationLabel}
                        options={RELATION_OPTIONS}
                        onSelect={setRelationLabel}
                        error={hasErrors("relationLabel")}
                      />

                      <UnderlineInput
                        label="WhatsApp Number (optional)"
                        value={whatsAppNumber}
                        onChangeText={setWhatsAppNumber}
                        keyboardType="phone-pad"
                      />

                      <View style={s.divider} />
                      <Text style={s.sectionHeader}>Notification Preferences</Text>

                      <View style={s.toggleRow}>
                        <View style={s.toggleTextWrap}>
                          <Text style={s.toggleLabel}>Geofence Breach</Text>
                          <Text style={s.toggleSub}>Alert when patient leaves safe zone</Text>
                        </View>
                        <Switch
                          value={notifyOnBreach}
                          onValueChange={setNotifyOnBreach}
                          trackColor={{ false: C.border, true: C.primaryLight }}
                          thumbColor={notifyOnBreach ? C.primary : '#f4f3f4'}
                        />
                      </View>

                      <View style={s.toggleRow}>
                        <View style={s.toggleTextWrap}>
                          <Text style={s.toggleLabel}>SOS Triggered</Text>
                          <Text style={s.toggleSub}>Emergency SOS alerts (always critical)</Text>
                        </View>
                        <Switch
                          value={notifyOnSos}
                          onValueChange={setNotifyOnSos}
                          trackColor={{ false: C.border, true: C.primaryLight }}
                          thumbColor={notifyOnSos ? C.primary : '#f4f3f4'}
                        />
                      </View>

                      <View style={s.toggleRow}>
                        <View style={s.toggleTextWrap}>
                          <Text style={s.toggleLabel}>Critical Task Missed</Text>
                          <Text style={s.toggleSub}>When a critical routine task is overdue</Text>
                        </View>
                        <Switch
                          value={notifyOnMissedCritical}
                          onValueChange={setNotifyOnMissedCritical}
                          trackColor={{ false: C.border, true: C.primaryLight }}
                          thumbColor={notifyOnMissedCritical ? C.primary : '#f4f3f4'}
                        />
                      </View>

                      <View style={s.toggleRow}>
                        <View style={s.toggleTextWrap}>
                          <Text style={s.toggleLabel}>Daily Digest</Text>
                          <Text style={s.toggleSub}>Summary of the day's events</Text>
                        </View>
                        <Switch
                          value={notifyOnDailyDigest}
                          onValueChange={setNotifyOnDailyDigest}
                          trackColor={{ false: C.border, true: C.primaryLight }}
                          thumbColor={notifyOnDailyDigest ? C.primary : '#f4f3f4'}
                        />
                      </View>

                      {notifyOnDailyDigest && (
                        <View style={s.chipGroup}>
                          <Text style={s.chipGroupTitle}>Digest Frequency</Text>
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                            {(['DAILY', 'WEEKLY'] as const).map(f => (
                              <Pressable
                                key={f}
                                style={[
                                  ch.chip,
                                  digestFrequency === f && ch.chipActive
                                ]}
                                onPress={() => setDigestFrequency(f)}
                              >
                                <Text style={[
                                  ch.chipText,
                                  digestFrequency === f && ch.chipTextActive
                                ]}>
                                  {f === 'DAILY' ? 'Daily' : 'Weekly'}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      )}
                    </>
                  )}

                  {/* Opt-in Newsletter */}
                  <Pressable
                    onPress={() => setOptInNews(!optInNews)}
                    style={s.checkboxRow}
                  >
                    <View style={[s.checkbox, optInNews && s.checkboxChecked]}>
                      {optInNews && <Text style={s.checkmark}>✓</Text>}
                    </View>
                    <Text style={s.checkboxLabel}>
                      Be the first to know about new features, community news, and
                      events. Opt in to receive occasional emails from Carefully.
                    </Text>
                  </Pressable>
                </>
              )}

              {step === 3 && role === "CAREGIVER" && (
                <>
                  {/* Professional details */}
                  <Text style={s.sectionHeader}>Professional Information</Text>

                  <StepperRow
                    label="Years of Experience"
                    value={yearsExp}
                    onChange={setYearsExp}
                  />

                  <StepperRow
                    label="Max Patient Capacity"
                    value={maxPatients}
                    onChange={setMaxPatients}
                  />

                  <StepperRow
                    label="Service Radius (km)"
                    value={radiusKm}
                    onChange={setRadiusKm}
                  />

                  <View style={s.chipGroup}>
                    <Text style={s.chipGroupTitle}>Specializations</Text>
                    <SelectionChips
                      options={SPECIALIZATIONS}
                      selected={specs}
                      onToggle={(v) => setSpecs(toggleList(specs, v))}
                    />
                  </View>

                  <View style={s.chipGroup}>
                    <Text style={s.chipGroupTitle}>Languages Spoken</Text>
                    <SelectionChips
                      options={LANGUAGES}
                      selected={langsSpoken}
                      onToggle={(v) => setLangsSpoken(toggleList(langsSpoken, v))}
                    />
                  </View>

                  <View style={s.chipGroup}>
                    <Text style={s.chipGroupTitle}>Availability Types</Text>
                    <SelectionChips
                      options={AVAILABILITY}
                      selected={availTypes}
                      onToggle={(v) => setAvailTypes(toggleList(availTypes, v))}
                    />
                  </View>

                  <UnderlineInput
                    label="Hourly Rate (INR)"
                    value={hourlyRate}
                    onChangeText={setHourlyRate}
                    keyboardType="numeric"
                  />

                  <UnderlineInput
                    label="Daily Rate (INR)"
                    value={dailyRate}
                    onChangeText={setDailyRate}
                    keyboardType="numeric"
                  />

                  <View style={s.toggleRow}>
                    <View style={s.toggleTextWrap}>
                      <Text style={s.toggleLabel}>Discoverable Profile</Text>
                      <Text style={s.toggleSub}>
                        Allow new patients to search and invite you
                      </Text>
                    </View>
                    <Switch
                      value={isDiscoverable}
                      onValueChange={setIsDiscoverable}
                      trackColor={{ false: C.borderMid, true: C.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </>
              )}
            </View>

            {/* App language selector (matches reference design) */}
            <Pressable style={s.langBar}>
              <Text style={s.langIcon}>🌐</Text>
              <Text style={s.langLabel}>App language: English</Text>
              <Text style={s.langChevron}>›</Text>
            </Pressable>

            {submitError && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{submitError}</Text>
              </View>
            )}

            {/* Pill next button (matches highlight style in bottom right) */}
            <View style={s.ctaContainer}>
              <TouchableOpacity
                onPress={handleNext}
                disabled={submitting}
                activeOpacity={0.88}
                style={[
                  s.pillBtn,
                  submitting && s.pillBtnDisabled,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={s.pillBtnText}>
                    {role === "CAREGIVER" && step === 2
                      ? "Next: professional info ›"
                      : "Next: complete setup ›"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </>
      )}
    </ScreenContainer>
  );
}

// ─── Step Indicator Styles ────────────────────────────────────────────────────
const si = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginVertical: 20,
    paddingHorizontal: 8,
  },
  item: { alignItems: "center", gap: 6, width: 72 },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: C.borderMid,
    backgroundColor: '#F9FAFB',
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
  circleDone: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
  check: { fontFamily: F.bold, fontSize: 14, color: "#FFFFFF" },
  num: { fontFamily: F.bold, fontSize: 14, color: C.textMuted },
  numActive: { color: "#FFFFFF" },
  numMuted: { color: C.textMuted },
  label: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.textMuted,
    textAlign: "center",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  labelActive: { color: C.primary, fontFamily: F.semiBold },
  labelDone: { color: C.primary },
  dash: {
    flex: 1,
    height: 2,
    backgroundColor: C.border,
    marginTop: 17,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: C.borderMid,
  },
  dashDone: { borderColor: C.primary, backgroundColor: C.primary },
});

// ─── Underline Input Styles ──────────────────────────────────────────────────
const ui = StyleSheet.create({
  container: { marginBottom: 16 },
  wrapper: { borderBottomWidth: 1.5, borderColor: C.borderMid, paddingVertical: 4 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textSecondary,
    marginBottom: 2,
    textTransform: "capitalize",
  },
  labelVisible: { opacity: 1 },
  labelHidden: { opacity: 0 },
  labelFocused: { color: C.primary },
  labelError: { color: C.error },
  input: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 16,
    color: C.textPrimary,
    padding: 0,
    minHeight: 32,
  },
  inputMultiline: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  inputFocused: {
    color: "#000000",
  },
  inputError: {},
});

// ─── Dropdown Picker Styles ──────────────────────────────────────────────────
const dp = StyleSheet.create({
  container: { marginBottom: 16 },
  wrapper: { borderBottomWidth: 1.5, borderColor: C.borderMid, paddingVertical: 4 },
  label: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textSecondary,
    marginBottom: 2,
    opacity: 0,
  },
  labelVisible: { opacity: 1 },
  labelError: { color: C.error },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  valueText: { fontFamily: F.regular, fontSize: 16, color: C.textPrimary },
  valuePlaceholder: { color: C.textMuted },
  chevron: { fontSize: 11, color: C.textSecondary },
  dropdown: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    maxHeight: 180,
    overflow: "scroll",
  },
  item: { padding: 12, borderBottomWidth: 0.5, borderBottomColor: C.bg },
  itemSelected: { backgroundColor: C.primaryLight },
  itemText: { fontFamily: F.regular, fontSize: 14, color: C.textBody },
  itemTextSelected: { color: C.primary, fontFamily: F.semiBold },
});

// ─── Chip Styles ─────────────────────────────────────────────────────────────
const ch = StyleSheet.create({
  container: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.borderMid,
    backgroundColor: C.surface,
  },
  chipActive: {
    borderColor: C.primary,
    backgroundColor: C.primaryLight,
  },
  chipText: { fontFamily: F.regular, fontSize: 13, color: C.textSecondary },
  chipTextActive: { color: C.primary, fontFamily: F.semiBold },
});

// ─── Stepper Styles ──────────────────────────────────────────────────────────
const st = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.bg,
  },
  label: { fontFamily: F.regular, fontSize: 15, color: C.textBody },
  controls: { flexDirection: "row", alignItems: "center", gap: 16 },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 18, fontFamily: F.bold, color: C.textSecondary },
  value: { fontFamily: F.bold, fontSize: 16, color: C.textPrimary, minWidth: 20, textAlign: "center" },
});

// ─── Main Screen Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 48,
  },
  topBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  topBtnText: { fontFamily: F.medium, fontSize: 14, color: C.textSecondary },
  logoutColor: { color: C.error },
  topTitle: { fontFamily: F.bold, fontSize: 16, color: C.textPrimary },

  scroll: { paddingHorizontal: 20, paddingBottom: 48 },

  // Avatar Picker styles matching reference image
  avatarContainer: { alignItems: "center", marginVertical: 16 },
  avatarTouchable: { position: "relative", width: 100, height: 100 },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontFamily: F.bold, fontSize: 32, color: C.textMuted },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.surface,
  },
  cameraIcon: { fontSize: 14 },
  avatarTip: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    textAlign: "center",
    maxWidth: 240,
    marginTop: 12,
    lineHeight: 16,
  },

  // Rounded Card containing fields
  card: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 20 },
  sectionHeader: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
    marginBottom: 16,
  },

  // Locate button styling
  locDetectBtn: {
    backgroundColor: C.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  locDetectText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.primary,
  },

  // Checkbox field matching the reference image layout
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 18,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.borderMid,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
  },
  checkboxChecked: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
  checkmark: { color: C.surface, fontSize: 13, fontFamily: F.bold },
  checkboxLabel: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textBody,
    lineHeight: 17,
  },

  // App language selector bar (matches reference design)
  langBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  langIcon: { fontSize: 18, marginRight: 12 },
  langLabel: { flex: 1, fontFamily: F.regular, fontSize: 14, color: C.textBody },
  langChevron: { fontSize: 16, color: C.textMuted },

  // Chip options group
  chipGroup: { marginVertical: 12 },
  chipGroupTitle: { fontFamily: F.medium, fontSize: 14, color: C.textBody },

  // Switch Toggle Row
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.bg,
  },
  toggleTextWrap: { flex: 1, marginRight: 8 },
  toggleLabel: { fontFamily: F.medium, fontSize: 15, color: C.textBody },
  toggleSub: { fontFamily: F.regular, fontSize: 12, color: C.textSecondary, marginTop: 2 },

  // Next pill button matching the reference styling (primary theme color)
  ctaContainer: { alignItems: "flex-end", marginTop: 8 },
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 26,
    shadowColor: C.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  pillBtnDisabled: { backgroundColor: C.borderMid, shadowOpacity: 0 },
  pillBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  pillBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.primaryText,
  },

  // Error Alert box
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontFamily: F.medium, fontSize: 13, color: C.error, textAlign: "center" },
});
