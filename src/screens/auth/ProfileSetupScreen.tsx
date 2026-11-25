/**
 * SureStep — src/screens/auth/ProfileSetupScreen.tsx
 * Onboarding screen matching the clean step-based UI from reference.
 * Patient: 2 steps total (1: RoleSelection, 2: ProfileSetup)
 * Caregiver: 3 steps total (1: RoleSelection, 2: Basic Info, 3: Professional Info)
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Platform, Pressable,
  ScrollView, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { C } from '../../theme/colors';
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
    <View className="flex-row items-start justify-center my-[20px] px-[8px]">
      {Array.from({ length: total }, (_, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <React.Fragment key={idx}>
            <View className="items-center gap-[6px] w-[72px]">
              <View
                className="w-[36px] h-[36px] rounded-[18px] border-[2px] border-[#D6DDDD] bg-[#F9FAFB] items-center justify-center" style={[done && {"borderColor":"#0E7A67","backgroundColor":"#0E7A67"}, active && {"borderColor":"#0E7A67","backgroundColor":"#0E7A67"}]}
              >
                {done ? (
                  <Text className="font-inter-bold text-[14px] text-white">✓</Text>
                ) : (
                  <Text
                    className="font-inter-bold text-[14px] text-[#9CA3AF]" style={[active && {"color":"#FFFFFF"}, !active && !done && {"color":"#9CA3AF"}]}
                  >
                    {idx}
                  </Text>
                )}
              </View>
              <Text
                className="font-inter-regular text-[10px] text-[#9CA3AF] text-center tracking-[0.3px] uppercase" style={[active && {"color":"#0E7A67","fontFamily":"Inter_600SemiBold"}, done && {"color":"#0E7A67"}]}
              >
                {labels[i]}
              </Text>
            </View>
            {i < total - 1 && <View className="flex-1 h-[2px] bg-[#E6EAEC] mt-[17px] border-dashed border-[1px] border-[#D6DDDD]" style={done && {"borderColor":"#0E7A67","backgroundColor":"#0E7A67"}} />}
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
    <View className="mb-[16px]">
      <View className="border-b-[1.5px] border-[#D6DDDD] py-[4px]">
        <Text
          className="font-inter-regular text-[11px] text-[#6B7280] mb-[2px] capitalize" style={[showFloatingLabel ? {"opacity":1} : {"opacity":0}, focused && {"color":"#0E7A67"}, error && {"color":"#DC2626"}]}
        >
          {label}
        </Text>
        <View className="flex-row items-center justify-between">
          <TextInput
            className="flex-1 font-inter-regular text-[16px] text-[#111827] p-[0px] min-h-[32px]" style={[multiline && {"minHeight":64,"textAlignVertical":"top"}, focused && {"color":"#000000"}, error && {}]}
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
    <View className="mb-[16px]">
      <Pressable className="border-b-[1.5px] border-[#D6DDDD] py-[4px]" onPress={() => setOpen((prev) => !prev)}>
        <Text className="font-inter-regular text-[11px] text-[#6B7280] mb-[2px] opacity-[0]" style={[value.length > 0 && {"opacity":1}, error && {"color":"#DC2626"}]}>
          {label}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="font-inter-regular text-[16px] text-[#111827]" style={!value && {"color":"#9CA3AF"}}>
            {value || label}
          </Text>
          <Text className="text-[11px] text-[#6B7280]">{open ? "▲" : "▼"}</Text>
        </View>
      </Pressable>

      {open && (
        <View className="bg-white border-[1px] border-[#E6EAEC] rounded-[8px] mt-[4px] max-h-[180px]" style={{"shadowColor":"#000","shadowOpacity":0.05,"shadowOffset":{"width":0,"height":2},"shadowRadius":6,"elevation":3,"overflow":"scroll"}}>
          {options.map((opt) => (
            <Pressable
              key={opt}
              className="p-[12px] border-b-[0.5px] border-b-[#F2F5F5]" style={value === opt && {"backgroundColor":"#b1f3da"}}
              onPress={() => {
                onSelect(opt);
                setOpen(false);
              }}
            >
              <Text className="font-inter-regular text-[14px] text-[#1F2937]" style={value === opt && {"color":"#0E7A67","fontFamily":"Inter_600SemiBold"}}>
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
    <View className="flex-row flex-wrap gap-[8px] mt-[8px]">
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => onToggle(opt)}
            className="px-[12px] py-[8px] rounded-[18px] border-[1px] border-[#D6DDDD] bg-white" style={isSelected && {"borderColor":"#0E7A67","backgroundColor":"#b1f3da"}}
          >
            <Text className="font-inter-regular text-[13px] text-[#6B7280]" style={isSelected && {"color":"#0E7A67","fontFamily":"Inter_600SemiBold"}}>
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
    <View className="flex-row items-center justify-between py-[12px] border-b-[1px] border-b-[#F2F5F5]">
      <Text className="font-inter-regular text-[15px] text-[#1F2937]">{label}</Text>
      <View className="flex-row items-center gap-[16px]">
        <Pressable
          className="w-[32px] h-[32px] rounded-[16px] bg-[#F2F5F5] items-center justify-center"
          onPress={() => onChange(Math.max(0, value - 1))}
        >
          <Text className="text-[18px] font-inter-bold text-[#6B7280]">−</Text>
        </Pressable>
        <Text className="font-inter-bold text-[16px] text-[#111827] min-w-[20px] text-center">{value}</Text>
        <Pressable className="w-[32px] h-[32px] rounded-[16px] bg-[#F2F5F5] items-center justify-center" onPress={() => onChange(value + 1)}>
          <Text className="text-[18px] font-inter-bold text-[#6B7280]">+</Text>
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
    <ScreenContainer edges={["top", "bottom", "left", "right"]} style={{"flex":1,"backgroundColor":"#FFFFFF"}}>
      {() => (
        <>
          {/* Top action bar */}
          <View className="flex-row justify-between items-center px-[20px] h-[48px]">
            <Pressable
              onPress={() => {
                if (role === "CAREGIVER" && step === 3) {
                  setStep(2);
                } else {
                  navigation.goBack();
                }
              }}
              className="py-[6px] px-[4px]"
            >
              <Text className="font-inter-medium text-[14px] text-[#6B7280]">
                {role === "CAREGIVER" && step === 3 ? "← Back" : "← Cancel"}
              </Text>
            </Pressable>

            <Text className="font-inter-bold text-[16px] text-[#111827]">Welcome back!</Text>

            <Pressable onPress={handleLogout} className="py-[6px] px-[4px]">
              <Text className="font-inter-medium text-[14px] text-[#6B7280]" style={{"color":"#DC2626"}}>Log out</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerClassName="px-[20px] pb-[48px]"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <StepIndicator current={step} total={totalSteps} labels={stepLabels} />

            {/* Profile Avatar (Step 2 Only) */}
            {step === 2 && (
              <View className="items-center my-[16px]">
                <Pressable onPress={pickPhoto} className="relative w-[100px] h-[100px]">
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} className="w-[100px] h-[100px] rounded-[50px]" />
                  ) : (
                    <View className="w-[100px] h-[100px] rounded-[50px] bg-[#F2F5F5] items-center justify-center">
                      <Text className="font-inter-bold text-[32px] text-[#9CA3AF]">
                        {name ? name.substring(0, 2).toUpperCase() : "?"}
                      </Text>
                    </View>
                  )}
                  {/* Badge Camera icon */}
                  <View className="absolute bottom-[2px] right-[2px] w-[30px] h-[30px] rounded-[15px] bg-brand items-center justify-center border-[2px] border-white">
                    <Text className="text-[14px]">📷</Text>
                  </View>
                </Pressable>
                <Text className="font-inter-regular text-[12px] text-[#6B7280] text-center max-w-[240px] mt-[12px] leading-[16px]">
                  Please make sure that your profile picture is a photo of yourself *
                </Text>
              </View>
            )}

            {/* White Rounded Form Box (matches reference image) */}
            <View className="bg-[#F8FAFA] rounded-[24px] p-[20px] mb-[16px] border-[1px] border-[#E6EAEC]">
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
                        className="bg-brand-light rounded-[12px] px-[12px] py-[6px] justify-center items-center ml-[8px]"
                      >
                        {locLoading ? (
                          <ActivityIndicator size="small" color={C.primary} />
                        ) : (
                          <Text className="font-inter-bold text-[12px] text-brand">📍 Locate</Text>
                        )}
                      </Pressable>
                    }
                  />

                  {/* Patient Emergency Details */}
                  {role === "PATIENT" && (
                    <>
                      <View className="h-[1px] bg-[#E6EAEC] my-[20px]" />
                      <Text className="font-inter-bold text-[15px] text-[#111827] mb-[16px]">Emergency Contact</Text>

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
                      <View className="h-[1px] bg-[#E6EAEC] my-[20px]" />
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
                      <View className="h-[1px] bg-[#E6EAEC] my-[20px]" />
                      <Text className="font-inter-bold text-[15px] text-[#111827] mb-[16px]">Family Member Profile</Text>

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

                      <View className="h-[1px] bg-[#E6EAEC] my-[20px]" />
                      <Text className="font-inter-bold text-[15px] text-[#111827] mb-[16px]">Notification Preferences</Text>

                      <View className="flex-row items-center justify-between py-[14px] border-b-[1px] border-b-[#F2F5F5]">
                        <View className="flex-1 mr-[8px]">
                          <Text className="font-inter-medium text-[15px] text-[#1F2937]">Geofence Breach</Text>
                          <Text className="font-inter-regular text-[12px] text-[#6B7280] mt-[2px]">Alert when patient leaves safe zone</Text>
                        </View>
                        <Switch
                          value={notifyOnBreach}
                          onValueChange={setNotifyOnBreach}
                          trackColor={{ false: C.border, true: C.primaryLight }}
                          thumbColor={notifyOnBreach ? C.primary : '#f4f3f4'}
                        />
                      </View>

                      <View className="flex-row items-center justify-between py-[14px] border-b-[1px] border-b-[#F2F5F5]">
                        <View className="flex-1 mr-[8px]">
                          <Text className="font-inter-medium text-[15px] text-[#1F2937]">SOS Triggered</Text>
                          <Text className="font-inter-regular text-[12px] text-[#6B7280] mt-[2px]">Emergency SOS alerts (always critical)</Text>
                        </View>
                        <Switch
                          value={notifyOnSos}
                          onValueChange={setNotifyOnSos}
                          trackColor={{ false: C.border, true: C.primaryLight }}
                          thumbColor={notifyOnSos ? C.primary : '#f4f3f4'}
                        />
                      </View>

                      <View className="flex-row items-center justify-between py-[14px] border-b-[1px] border-b-[#F2F5F5]">
                        <View className="flex-1 mr-[8px]">
                          <Text className="font-inter-medium text-[15px] text-[#1F2937]">Critical Task Missed</Text>
                          <Text className="font-inter-regular text-[12px] text-[#6B7280] mt-[2px]">When a critical routine task is overdue</Text>
                        </View>
                        <Switch
                          value={notifyOnMissedCritical}
                          onValueChange={setNotifyOnMissedCritical}
                          trackColor={{ false: C.border, true: C.primaryLight }}
                          thumbColor={notifyOnMissedCritical ? C.primary : '#f4f3f4'}
                        />
                      </View>

                      <View className="flex-row items-center justify-between py-[14px] border-b-[1px] border-b-[#F2F5F5]">
                        <View className="flex-1 mr-[8px]">
                          <Text className="font-inter-medium text-[15px] text-[#1F2937]">Daily Digest</Text>
                          <Text className="font-inter-regular text-[12px] text-[#6B7280] mt-[2px]">Summary of the day's events</Text>
                        </View>
                        <Switch
                          value={notifyOnDailyDigest}
                          onValueChange={setNotifyOnDailyDigest}
                          trackColor={{ false: C.border, true: C.primaryLight }}
                          thumbColor={notifyOnDailyDigest ? C.primary : '#f4f3f4'}
                        />
                      </View>

                      {notifyOnDailyDigest && (
                        <View className="my-[12px]">
                          <Text className="font-inter-medium text-[14px] text-[#1F2937]">Digest Frequency</Text>
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                            {(['DAILY', 'WEEKLY'] as const).map(f => (
                              <Pressable
                                key={f}
                                className="px-[12px] py-[8px] rounded-[18px] border-[1px] border-[#D6DDDD] bg-white" style={digestFrequency === f && {"borderColor":"#0E7A67","backgroundColor":"#b1f3da"}}
                                onPress={() => setDigestFrequency(f)}
                              >
                                <Text className="font-inter-regular text-[13px] text-[#6B7280]" style={digestFrequency === f && {"color":"#0E7A67","fontFamily":"Inter_600SemiBold"}}>
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
                    className="flex-row items-start mt-[18px] gap-[12px]"
                  >
                    <View className="w-[24px] h-[24px] rounded-[6px] border-[2px] border-[#D6DDDD] items-center justify-center bg-white" style={optInNews && {"borderColor":"#0E7A67","backgroundColor":"#0E7A67"}}>
                      {optInNews && <Text className="text-white text-[13px] font-inter-bold">✓</Text>}
                    </View>
                    <Text className="flex-1 font-inter-regular text-[12px] text-[#1F2937] leading-[17px]">
                      Be the first to know about new features, community news, and
                      events. Opt in to receive occasional emails from Carefully.
                    </Text>
                  </Pressable>
                </>
              )}

              {step === 3 && role === "CAREGIVER" && (
                <>
                  {/* Professional details */}
                  <Text className="font-inter-bold text-[15px] text-[#111827] mb-[16px]">Professional Information</Text>

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

                  <View className="my-[12px]">
                    <Text className="font-inter-medium text-[14px] text-[#1F2937]">Specializations</Text>
                    <SelectionChips
                      options={SPECIALIZATIONS}
                      selected={specs}
                      onToggle={(v) => setSpecs(toggleList(specs, v))}
                    />
                  </View>

                  <View className="my-[12px]">
                    <Text className="font-inter-medium text-[14px] text-[#1F2937]">Languages Spoken</Text>
                    <SelectionChips
                      options={LANGUAGES}
                      selected={langsSpoken}
                      onToggle={(v) => setLangsSpoken(toggleList(langsSpoken, v))}
                    />
                  </View>

                  <View className="my-[12px]">
                    <Text className="font-inter-medium text-[14px] text-[#1F2937]">Availability Types</Text>
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

                  <View className="flex-row items-center justify-between py-[14px] border-b-[1px] border-b-[#F2F5F5]">
                    <View className="flex-1 mr-[8px]">
                      <Text className="font-inter-medium text-[15px] text-[#1F2937]">Discoverable Profile</Text>
                      <Text className="font-inter-regular text-[12px] text-[#6B7280] mt-[2px]">
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
            <Pressable className="flex-row items-center bg-white rounded-[16px] border-[1px] border-[#E6EAEC] p-[16px] mb-[24px]" style={{"shadowColor":"#000","shadowOpacity":0.02,"shadowOffset":{"width":0,"height":2},"shadowRadius":4,"elevation":1}}>
              <Text className="text-[18px] mr-[12px]">🌐</Text>
              <Text className="flex-1 font-inter-regular text-[14px] text-[#1F2937]">App language: English</Text>
              <Text className="text-[16px] text-[#9CA3AF]">›</Text>
            </Pressable>

            {submitError && (
              <View className="bg-[#FEF2F2] rounded-[12px] border-[1px] border-[#FECACA] p-[12px] mb-[16px]">
                <Text className="font-inter-medium text-[13px] text-[#DC2626] text-center">{submitError}</Text>
              </View>
            )}

            {/* Pill next button (matches highlight style in bottom right) */}
            <View className="items-end mt-[8px]">
              <TouchableOpacity
                onPress={handleNext}
                disabled={submitting}
                activeOpacity={0.88}
                className="flex-row items-center bg-brand px-[22px] py-[13px] rounded-[26px]" style={[{"shadowColor":"#0E7A67","shadowOpacity":0.25,"shadowOffset":{"width":0,"height":4},"shadowRadius":10,"elevation":4}, submitting && {"backgroundColor":"#D6DDDD","shadowOpacity":0}]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="font-inter-bold text-[14px] text-white">
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

