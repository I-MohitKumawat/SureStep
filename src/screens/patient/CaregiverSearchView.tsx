/**
 * CaregiverSearchView.tsx  (v2 — professional profile edition)
 * Shows specializations, availability, hourly rate, photo, experience.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator, Image, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { searchCaregivers } from '../../services/relationshipService';
import { Ionicons } from '@expo/vector-icons';

export type CaregiverListing = {
  id: string; name: string; specialty: string; patients: number;
  rating: number; fee: string; emoji: string; bio: string;
  availability: string; location: string;
  profile_photo_url?: string | null;
  years_experience?: number;
  specializations?: string[];
  status?: string;
  phone?: string;
  availability_types?: string[];
  hourly_rate?: string;
  daily_rate?: string;
  about_me?: string;
  emergency_response?: boolean;
  can_assist_nearby?: boolean;
  languages_spoken?: string[];
  service_radius_km?: number;
  transportation_mode?: string;
  dementia_experience?: boolean;
  patients_handled?: number;
};

const SPEC_COLORS: Record<string, string> = {
  "Alzheimer's":          '#EFF6FF',
  'Dementia':             '#F5F3FF',
  'Bedridden Care':       '#FFF7ED',
  'Night Care':           '#1E293B',
  'Emergency Assistance': '#FEF2F2',
};
const SPEC_TEXT: Record<string, string> = {
  "Alzheimer's":          '#1D4ED8',
  'Dementia':             '#7C3AED',
  'Bedridden Care':       '#EA580C',
  'Night Care':           '#F8FAFC',
  'Emergency Assistance': '#DC2626',
};

function SpecChip({ label }: { label: string }) {
  return (
    <View style={[s.chip, { backgroundColor: SPEC_COLORS[label] ?? '#F3F4F6' }]}>
      <Text style={[s.chipText, { color: SPEC_TEXT[label] ?? '#374151' }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <Text style={s.stars}>
      {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
      {' '}<Text style={s.ratingNum}>{rating.toFixed(1)}</Text>
    </Text>
  );
}

type Props = { onSelect: (c: CaregiverListing) => void };

export const CaregiverSearchView: React.FC<Props> = ({ onSelect }) => {
  const [query,      setQuery]      = useState('');
  const [caregivers, setCaregivers] = useState<CaregiverListing[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await searchCaregivers(query);
        if (active) {
          setCaregivers(results);
        }
      } catch (err: any) {
        if (active) {
          console.warn('[CaregiverSearchView] Search failed:', err);
          setError('Failed to fetch caregivers. Please try again.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      void fetchListings();
    }, 300); // 300ms debounce

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const filtered = caregivers.filter(c => {
    const q = query.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.specialty?.toLowerCase().includes(q) ||
      c.specializations?.some(sp => sp.toLowerCase().includes(q)) ||
      c.languages_spoken?.some(l => l.toLowerCase().includes(q)) ||
      c.location?.toLowerCase().includes(q)
    );
  });

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.heading}>Find a Caregiver</Text>
        <Text style={s.sub}>Browse qualified specialists near you</Text>
      </View>

      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Search by name, specialty or language…"
          placeholderTextColor={C.textMuted} value={query} onChangeText={setQuery}
          autoCorrect={false} autoCapitalize="none" />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Text style={s.clearBtn}>✕</Text>
          </Pressable>
        )}
      </View>

      {loading && <View style={{ alignItems: 'center', paddingTop: 40 }}><ActivityIndicator color={C.primary} /></View>}
      {error && !loading && <Text style={s.empty}>{error}</Text>}

      {!loading && !error && (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {filtered.length === 0
            ? <Text style={s.empty}>{query ? `No matches for "${query}"` : 'No caregivers registered yet.'}</Text>
            : filtered.map(c => {
                const specs = c.specializations ?? [];
                const rate  = c.hourly_rate || c.fee || 'Free';
                return (
                  <Pressable key={c.id} style={({ pressed }) => [s.card, pressed && s.cardPressed]}
                    onPress={() => onSelect(c)}>

                    {/* Avatar */}
                    <View style={s.avatarWrap}>
                      {c.profile_photo_url
                        ? <Image source={{ uri: c.profile_photo_url }} style={s.avatar} />
                        : <View style={s.avatarFallback}>
                            <Ionicons name="person-outline" size={20} color={C.textMuted} />
                          </View>
                      }
                      {c.emergency_response && (
                        <View style={[s.emergencyDot, { alignItems: 'center', justifyContent: 'center' }]}><Ionicons name="alert" size={8} color="#FFFFFF" /></View>
                      )}
                    </View>

                    <View style={s.info}>
                      <View style={s.nameRow}>
                        <Text style={s.name} numberOfLines={1}>{c.name}</Text>
                        {c.can_assist_nearby && <Text style={s.nearbyBadge}><Ionicons name="location-sharp" size={10} color="#059669" /> Nearby</Text>}
                      </View>
                      <Text style={s.location} numberOfLines={1}>
                        {[c.location, c.service_radius_km ? `${c.service_radius_km}km radius` : null].filter(Boolean).join(' · ')}
                      </Text>
                      <View style={s.metaRow}>
                        <Stars rating={c.rating ?? 5.0} />
                        {c.years_experience ? <Text style={s.exp}> · {c.years_experience}yr exp</Text> : null}
                      </View>
                      {specs.length > 0 && (
                        <View style={s.chips}>
                          {specs.slice(0, 2).map(sp => <SpecChip key={sp} label={sp} />)}
                          {specs.length > 2 && (
                            <View style={[s.chip, { backgroundColor: '#F3F4F6' }]}>
                              <Text style={[s.chipText, { color: '#6B7280' }]}>+{specs.length - 2}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    <View style={s.right}>
                      <Text style={s.rate}>{rate}</Text>
                      <Text style={s.chevron}>›</Text>
                    </View>
                  </Pressable>
                );
              })
          }
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  heading:{ fontFamily: F.extraBold, fontSize: 26, color: C.textPrimary },
  sub:    { fontFamily: F.regular, fontSize: 14, color: C.textSecondary, marginTop: 2 },

  searchWrap:{ flexDirection:'row', alignItems:'center', marginHorizontal:16, marginBottom:14,
    backgroundColor: C.surface, borderRadius:14, borderWidth:1, borderColor: C.border,
    paddingHorizontal:12, paddingVertical:10, gap:8 },
  searchIcon:  { fontSize: 16 },
  searchInput: { flex:1, fontFamily: F.regular, fontSize:15, color: C.textPrimary, padding:0 },
  clearBtn:    { fontSize:13, color: C.textMuted, paddingHorizontal:4 },

  list: { paddingHorizontal:16, gap:12, paddingBottom:96 },

  card:       { flexDirection:'row', alignItems:'flex-start', backgroundColor: C.surface,
    borderRadius:18, padding:14, borderWidth:1, borderColor: C.border, gap:12,
    shadowColor:'#000', shadowOpacity:0.04, shadowOffset:{width:0,height:2}, shadowRadius:6, elevation:2 },
  cardPressed:{ transform:[{scale:0.98}], opacity:0.88 },

  avatarWrap:    { position:'relative' },
  avatar:        { width:56, height:56, borderRadius:28 },
  avatarFallback:{ width:56, height:56, borderRadius:28, backgroundColor: C.primaryLight, alignItems:'center', justifyContent:'center' },
  avatarEmoji:   { fontSize:28 },
  emergencyDot:  { position:'absolute', bottom:0, right:0, width:18, height:18, borderRadius:9, backgroundColor:'#FEF2F2', alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor:'#fff' },

  info:    { flex:1 },
  nameRow: { flexDirection:'row', alignItems:'center', gap:6, flexWrap:'wrap' },
  name:    { fontFamily: F.bold, fontSize:15, color: C.textPrimary },
  nearbyBadge:{ fontFamily: F.regular, fontSize:11, color: C.primary, backgroundColor: C.primaryLight, paddingHorizontal:6, paddingVertical:2, borderRadius:8 },
  location:{ fontFamily: F.regular, fontSize:12, color: C.textSecondary, marginTop:1 },
  metaRow: { flexDirection:'row', alignItems:'center', marginTop:4 },
  stars:   { fontSize:11, color:'#F59E0B', letterSpacing:0.8 },
  ratingNum:{ fontFamily: F.bold, fontSize:11, color: C.textPrimary },
  exp:     { fontFamily: F.regular, fontSize:11, color: C.textSecondary },

  chips:    { flexDirection:'row', flexWrap:'wrap', gap:5, marginTop:6 },
  chip:     { paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  chipText: { fontFamily: F.regular, fontSize:11 },

  right:   { alignItems:'flex-end', gap:6 },
  rate:    { fontFamily: F.bold, fontSize:13, color: C.primary },
  chevron: { fontSize:22, color: C.textMuted, lineHeight:22 },

  empty: { fontFamily: F.regular, fontSize:15, color: C.textSecondary,
    textAlign:'center', marginTop:40, fontStyle:'italic' },
});
