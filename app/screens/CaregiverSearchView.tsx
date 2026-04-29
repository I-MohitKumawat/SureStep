/**
 * CaregiverSearchView.tsx
 *
 * Caregiver search sourced exclusively from Supabase `caregivers` table.
 * MOCK_CAREGIVERS removed — only real DB rows are shown.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import { supabase } from '../utils/supabaseClient';

// ─── Data shape ───────────────────────────────────────────────────────────────

export type CaregiverListing = {
  id: string;
  name: string;
  specialty: string;
  patients: number;
  rating: number;
  fee: string;
  emoji: string;
  bio: string;
  availability: string;
  location: string;
};

// ─── Star row ─────────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  const full  = Math.floor(rating);
  const empty = 5 - full;
  return (
    <Text style={s.stars}>
      {'★'.repeat(full)}
      {'☆'.repeat(empty)}
      {'  '}
      <Text style={s.ratingNum}>{rating.toFixed(1)}</Text>
    </Text>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  onSelect: (c: CaregiverListing) => void;
};

export const CaregiverSearchView: React.FC<Props> = ({ onSelect }) => {
  const [query,      setQuery]      = useState('');
  const [caregivers, setCaregivers] = useState<CaregiverListing[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  // ── Load from Supabase on mount ───────────────────────────────────────────
  React.useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: qErr } = await supabase
          .from('caregivers')
          .select('*')
          .order('name', { ascending: true });

        if (qErr) {
          setError('Unable to load caregivers. Please try again.');
        } else {
          setCaregivers((data ?? []) as CaregiverListing[]);
        }
      } catch {
        setError('Network error. Please check your connection.');
      }
      setLoading(false);
    }
    void load();
  }, []);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = caregivers.filter(
    (c) =>
      c.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.specialty?.toLowerCase().includes(query.toLowerCase()),
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.heading}>Find a Caregiver</Text>
        <Text style={s.sub}>Browse qualified specialists near you</Text>
      </View>

      {/* Search bar */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search by name or specialty…"
          placeholderTextColor={C.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Text style={s.clearBtn}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Loading */}
      {loading && (
        <View style={{ alignItems: 'center', paddingTop: 40 }}>
          <ActivityIndicator color={C.primary} />
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <Text style={s.empty}>{error}</Text>
      )}

      {/* Caregiver list */}
      {!loading && !error && (
        <ScrollView
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filtered.length === 0 ? (
            <Text style={s.empty}>
              {query ? `No caregivers match "${query}".` : 'No caregivers registered yet.'}
            </Text>
          ) : (
            filtered.map((c) => (
              <Pressable
                key={c.id}
                style={({ pressed }) => [s.capsule, pressed && s.capsulePressed]}
                onPress={() => onSelect(c)}
              >
                <View style={s.avatarWrap}>
                  <Text style={s.avatarEmoji}>{c.emoji || '🧑‍⚕️'}</Text>
                </View>

                <View style={s.infoWrap}>
                  <Text style={s.name} numberOfLines={1}>{c.name}</Text>
                  <Text style={s.specialty} numberOfLines={1}>{c.specialty}</Text>
                  <View style={s.metaRow}>
                    <Stars rating={c.rating ?? 5.0} />
                    <Text style={s.dot}> · </Text>
                    <Text style={s.patientCount}>{c.patients ?? 0} patients</Text>
                  </View>
                </View>

                <View style={s.rightWrap}>
                  <Text style={s.fee}>{c.fee ?? 'Free'}</Text>
                  <Text style={s.chevron}>›</Text>
                </View>
              </Pressable>
            ))
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14 },
  heading: { fontFamily: F.extraBold, fontSize: 26, color: C.textPrimary },
  sub:     { fontFamily: F.regular, fontSize: 14, color: C.textSecondary, marginTop: 2 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 14,
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchIcon:  { fontSize: 16 },
  searchInput: { flex: 1, fontFamily: F.regular, fontSize: 15, color: C.textPrimary, padding: 0 },
  clearBtn:    { fontSize: 13, color: C.textMuted, paddingHorizontal: 4 },

  list: { paddingHorizontal: 16, gap: 12, paddingBottom: 96 },

  capsule: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 18,
    paddingVertical: 14, paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.border, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  capsulePressed: { transform: [{ scale: 0.98 }], opacity: 0.88 },

  avatarWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 26 },

  infoWrap:     { flex: 1 },
  name:         { fontFamily: F.bold, fontSize: 15, color: C.textPrimary },
  specialty:    { fontFamily: F.regular, fontSize: 12, color: C.textSecondary, marginTop: 1 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  stars:        { fontSize: 11, color: '#F59E0B', letterSpacing: 0.8 },
  ratingNum:    { fontFamily: F.bold, fontSize: 11, color: C.textBody },
  dot:          { fontFamily: F.regular, fontSize: 12, color: C.textMuted },
  patientCount: { fontFamily: F.regular, fontSize: 12, color: C.textSecondary },

  rightWrap: { alignItems: 'flex-end', gap: 6 },
  fee:       { fontFamily: F.bold, fontSize: 13, color: C.primary },
  chevron:   { fontSize: 22, color: C.textMuted, lineHeight: 22 },

  empty: {
    fontFamily: F.regular, fontSize: 15, color: C.textSecondary,
    textAlign: 'center', marginTop: 40, fontStyle: 'italic',
  },
});
