/**
 * CaregiverProfileEditScreen.tsx
 * Allows a caregiver to edit their professional profile post-setup.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Pressable,
  ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
// Navigation types migrated to src/types/navigation.types.ts
import type { CaregiverStackParams } from '../../types/navigation.types';
// useUserProfile removed — use useAuth() from src/context/AuthContext instead
import { useAuth } from '../../context/AuthContext';
import { getCaregiverProfile, updateCaregiverProfile, updateMe, uploadProfilePhoto } from '../../services/userService';
// supabase removed — all data now via src/services/ + Express API
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverProfileEditScreen'>;

const SPECIALIZATIONS = ["Alzheimer's",'Dementia','Bedridden Care','Night Care','Emergency Assistance'];
const AVAILABILITY    = ['Day Shift','Night Shift','Full Time','Emergency Calls'];
const LANGUAGES       = ['English','Hindi','Kannada','Tamil','Telugu','Malayalam','Bengali'];
const TRANSPORT       = ['Own Vehicle','Public Transport','None'];

function Chips({ options, selected, onToggle }: { options:string[]; selected:string[]; onToggle:(v:string)=>void }) {
  return (
    <View style={s.chips}>
      {options.map(opt => {
        const on = selected.includes(opt);
        return (
          <Pressable key={opt} onPress={() => onToggle(opt)} style={[s.chip, on && s.chipOn]}>
            <Text style={[s.chipTxt, on && s.chipTxtOn]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Stepper({ label, value, onChange }: { label:string; value:number; onChange:(v:number)=>void }) {
  return (
    <View style={s.stepperRow}>
      <Text style={s.stepperLbl}>{label}</Text>
      <View style={s.stepperCtrl}>
        <Pressable style={s.stepperBtn} onPress={() => onChange(Math.max(0, value-1))}>
          <Text style={s.stepperBtnT}>âˆ’</Text>
        </Pressable>
        <Text style={s.stepperVal}>{value}</Text>
        <Pressable style={s.stepperBtn} onPress={() => onChange(value+1)}>
          <Text style={s.stepperBtnT}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ToggleRow({ label, sub, value, onChange }: { label:string; sub?:string; value:boolean; onChange:(v:boolean)=>void }) {
  return (
    <View style={s.toggleRow}>
      <View style={{ flex:1 }}>
        <Text style={s.toggleLbl}>{label}</Text>
        {sub && <Text style={s.toggleSub}>{sub}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false:'#D1D5DB', true: C.primary }} thumbColor="#fff" />
    </View>
  );
}

function Dropdown({ label, value, options, onSelect }: { label:string; value:string; options:string[]; onSelect:(v:string)=>void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom:14 }}>
      <Pressable style={s.fWrap} onPress={() => setOpen(p => !p)}>
        {value ? <Text style={s.fLbl}>{label}</Text> : null}
        <View style={s.fRow}>
          <Text style={[s.fInput, !value && { color: C.textMuted }]}>{value || label}</Text>
          <Text style={s.chevron}>{open ? 'â–´' : 'â–¾'}</Text>
        </View>
      </Pressable>
      {open && (
        <View style={s.ddBox}>
          {options.map(opt => (
            <Pressable key={opt} style={[s.ddItem, value===opt && s.ddItemOn]}
              onPress={() => { onSelect(opt); setOpen(false); }}>
              <Text style={[s.ddTxt, value===opt && s.ddTxtOn]}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export const CaregiverProfileEditScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUri, setPhotoUri] = useState<string|null>(null);

  const [yearsExp,        setYearsExp]        = useState(0);
  const [dementiaExp,     setDementiaExp]     = useState(false);
  const [patientsHandled, setPatientsHandled] = useState(0);
  const [specs,           setSpecs]           = useState<string[]>([]);
  const [langsSpoken,     setLangsSpoken]     = useState<string[]>([]);
  const [availTypes,      setAvailTypes]      = useState<string[]>([]);
  const [radiusKm,        setRadiusKm]        = useState(10);
  const [transport,       setTransport]       = useState('');
  const [hourlyRate,      setHourlyRate]      = useState('');
  const [dailyRate,       setDailyRate]       = useState('');
  const [aboutMe,         setAboutMe]         = useState('');
  const [emergencyResp,   setEmergencyResp]   = useState(false);
  const [canAssist,       setCanAssist]       = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await getCaregiverProfile(user.id);
      if (res.data) {
        const p = res.data;
        setProfile(p);
        setYearsExp(p.yearsExperience ?? 0);
        setDementiaExp(p.dementiaExperience ?? false);
        setPatientsHandled(p.patientsHandled ?? 0);
        setSpecs(p.specializations ?? []);
        setLangsSpoken(p.languagesSpoken ?? []);
        setAvailTypes(p.availabilityTypes ?? []);
        setRadiusKm(p.serviceRadiusKm ?? 10);
        setTransport(p.transportationMode ?? '');
        setHourlyRate(p.hourlyRate ?? '');
        setDailyRate(p.dailyRate ?? '');
        setAboutMe(p.aboutMe ?? '');
        setEmergencyResp(p.emergencyResponse ?? false);
        setCanAssist(p.canAssistNearby ?? false);
      }
    } catch (e) {
      console.error('[CaregiverProfileEdit] failed to fetch profile:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const toggle = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing:true, aspect:[1,1], quality:0.7 });
    if (res.canceled) return;
    const uri = res.assets[0].uri;
    setPhotoUri(uri);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let remotePhotoUrl = profile?.photo_url;
      if (photoUri && photoUri !== profile?.photo_url) {
        remotePhotoUrl = await uploadProfilePhoto(photoUri);
        await updateMe({ photo_url: remotePhotoUrl });
        updateUser({ photo_url: remotePhotoUrl });
      }

      await updateCaregiverProfile({
        ...profile,
        role: 'caregiver',
        yearsExperience: yearsExp, dementiaExperience: dementiaExp, patientsHandled,
        specializations: specs, languagesSpoken: langsSpoken, availabilityTypes: availTypes,
        serviceRadiusKm: radiusKm, transportationMode: transport,
        hourlyRate, dailyRate, aboutMe,
        emergencyResponse: emergencyResp, canAssistNearby: canAssist,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Please try again.');
    } finally { setSaving(false); }
  };

  const photoSrc = photoUri ?? profile?.photo_url;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F4F4' }}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>â€¹ Back</Text>
        </Pressable>
        <Text style={s.topTitle}>Professional Profile</Text>
        <Pressable onPress={() => void handleSave()} disabled={saving} style={s.saveBtn}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveTxt}>Save</Text>}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Photo */}
        <Pressable onPress={() => void pickPhoto()} style={s.photoWrap}>
          {photoSrc
            ? <Image source={{ uri: photoSrc }} style={s.photo} />
            : <View style={s.photoFallback}><Text style={{ fontSize:38 }}>👤</Text></View>}
          <View style={s.photoPlus}><Text style={{ color:'#fff', fontSize:16, fontFamily: F.bold }}>+</Text></View>
        </Pressable>

        <Text style={s.secTitle}>Experience</Text>
        <Stepper label="Years of Experience" value={yearsExp} onChange={setYearsExp} />
        <Stepper label="Patients Handled" value={patientsHandled} onChange={setPatientsHandled} />
        <ToggleRow label="Dementia Care Experience" value={dementiaExp} onChange={setDementiaExp} />

        <Text style={s.secTitle}>Specializations</Text>
        <Chips options={SPECIALIZATIONS} selected={specs} onToggle={v => setSpecs(toggle(specs,v))} />

        <Text style={s.secTitle}>Languages Spoken</Text>
        <Chips options={LANGUAGES} selected={langsSpoken} onToggle={v => setLangsSpoken(toggle(langsSpoken,v))} />

        <Text style={s.secTitle}>Available For</Text>
        <Chips options={AVAILABILITY} selected={availTypes} onToggle={v => setAvailTypes(toggle(availTypes,v))} />

        <Text style={s.secTitle}>Location & Transport</Text>
        <Stepper label="Service Radius (km)" value={radiusKm} onChange={setRadiusKm} />
        <Dropdown label="Transportation Mode" value={transport} options={TRANSPORT} onSelect={setTransport} />

        <Text style={s.secTitle}>Charges</Text>
        <View style={s.fWrap}>
          {hourlyRate ? <Text style={s.fLbl}>Hourly Rate</Text> : null}
          <TextInput style={s.fInput} value={hourlyRate} onChangeText={setHourlyRate} placeholder="Hourly Rate (e.g. â‚¹300/hr)" placeholderTextColor={C.textMuted} />
        </View>
        <View style={s.fWrap}>
          {dailyRate ? <Text style={s.fLbl}>Daily Rate</Text> : null}
          <TextInput style={s.fInput} value={dailyRate} onChangeText={setDailyRate} placeholder="Daily Rate (e.g. â‚¹2000/day)" placeholderTextColor={C.textMuted} />
        </View>

        <Text style={s.secTitle}>About Me</Text>
        <View style={[s.fWrap, { minHeight: 90 }]}>
          <TextInput style={[s.fInput, { textAlignVertical:'top', minHeight:70 }]}
            value={aboutMe} onChangeText={setAboutMe} multiline
            placeholder="Introduce yourself to patientsâ€¦" placeholderTextColor={C.textMuted} />
        </View>

        <Text style={s.secTitle}>Emergency Settings</Text>
        <ToggleRow label="Emergency Response Availability" sub="Available for patient emergencies" value={emergencyResp} onChange={setEmergencyResp} />
        <ToggleRow label="Can Assist Nearby Patients" sub="Help patients near you in emergencies" value={canAssist} onChange={setCanAssist} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root:  { flex:1, backgroundColor: C.bg },
  topBar:{ flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingTop:56, paddingBottom:12, backgroundColor: C.surface, borderBottomWidth:1, borderBottomColor: C.border },
  backBtn:{ paddingRight:12, paddingVertical:4 },
  backTxt:{ fontFamily: F.regular, fontSize:16, color: C.primary },
  topTitle:{ flex:1, fontFamily: F.bold, fontSize:17, color: C.textPrimary, textAlign:'center' },
  saveBtn: { paddingLeft:12, paddingVertical:4, paddingHorizontal:14, backgroundColor: C.primary, borderRadius:10 },
  saveTxt: { fontFamily: F.bold, fontSize:14, color:'#fff' },
  scroll: { paddingHorizontal:20, paddingTop:20, paddingBottom:60 },
  photoWrap:   { alignSelf:'center', marginBottom:24, position:'relative' },
  photo:       { width:88, height:88, borderRadius:44 },
  photoFallback:{ width:88, height:88, borderRadius:44, backgroundColor:'#E5E7EB', alignItems:'center', justifyContent:'center' },
  photoPlus:   { position:'absolute', bottom:0, right:0, width:26, height:26, borderRadius:13, backgroundColor: C.primary, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'#fff' },
  secTitle:{ fontFamily: F.bold, fontSize:12, color: C.textSecondary, letterSpacing:0.8, textTransform:'uppercase', marginTop:22, marginBottom:10 },
  fWrap:  { borderWidth:1.5, borderColor: C.border, borderRadius:14, paddingHorizontal:14, paddingTop:8, paddingBottom:8, marginBottom:12, minHeight:52, justifyContent:'center' },
  fLbl:   { fontFamily: F.regular, fontSize:11, color: C.primary, marginBottom:2 },
  fInput: { fontFamily: F.regular, fontSize:15, color: C.textPrimary, padding:0, minHeight:28 },
  fRow:   { flexDirection:'row', alignItems:'center' },
  chevron:{ fontSize:13, color: C.textSecondary, marginLeft:6 },
  ddBox:  { borderWidth:1.5, borderColor: C.border, borderRadius:14, backgroundColor: C.surface, paddingVertical:4, marginTop:-10, marginBottom:12, zIndex:100 },
  ddItem: { paddingVertical:11, paddingHorizontal:16 },
  ddItemOn:{ backgroundColor: C.primaryLight },
  ddTxt:  { fontFamily: F.regular, fontSize:15, color: C.textPrimary },
  ddTxtOn:{ fontFamily: F.bold, color: C.primary },
  chips:  { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:4 },
  chip:   { paddingHorizontal:14, paddingVertical:8, borderRadius:20, borderWidth:1.5, borderColor: C.border, backgroundColor: C.surface },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipTxt:{ fontFamily: F.regular, fontSize:13, color: C.textSecondary },
  chipTxtOn:{ color:'#fff' },
  toggleRow:{ flexDirection:'row', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderBottomColor: C.border + '40' },
  toggleLbl:{ fontFamily: F.semiBold, fontSize:14, color: C.textPrimary },
  toggleSub:{ fontFamily: F.regular, fontSize:12, color: C.textSecondary, marginTop:2 },
  stepperRow:{ flexDirection:'row', alignItems:'center', paddingVertical:10, borderBottomWidth:1, borderBottomColor: C.border + '40', marginBottom:2 },
  stepperLbl:{ flex:1, fontFamily: F.regular, fontSize:14, color: C.textPrimary },
  stepperCtrl:{ flexDirection:'row', alignItems:'center', gap:12 },
  stepperBtn: { width:32, height:32, borderRadius:16, backgroundColor: C.primaryLight ?? '#D1FAE5', alignItems:'center', justifyContent:'center' },
  stepperBtnT:{ fontFamily: F.bold, fontSize:18, color: C.primary, lineHeight:22 },
  stepperVal: { fontFamily: F.bold, fontSize:16, color: C.textPrimary, minWidth:28, textAlign:'center' },
});
