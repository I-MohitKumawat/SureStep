import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import type { CaregiverListing } from './CaregiverSearchView';

// ─── Star row (full detail version) ──────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const empty = 5 - full;
  return (
    <Text style={d.stars}>
      {'★'.repeat(full)}
      {'☆'.repeat(empty)}
      {'  '}
      <Text style={d.ratingNum}>{rating.toFixed(1)}</Text>
    </Text>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
type Props = {
  caregiver: CaregiverListing;
  isConfirmed: boolean;
  onBack: () => void;
  onConfirm: (c: CaregiverListing) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────
export const CaregiverDetailView: React.FC<Props> = ({
  caregiver,
  isConfirmed,
  onBack,
  onConfirm,
}) => (
  <View style={d.root}>
    <ScrollView
      contentContainerStyle={d.scroll}
      showsVerticalScrollIndicator={false}
    >

      {/* Hero */}
      <View style={d.heroWrap}>
        <View style={[d.avatar, isConfirmed && d.avatarConfirmed]}>
          <Text style={d.avatarEmoji}>{caregiver.emoji}</Text>
        </View>
        {isConfirmed && (
          <View style={d.confirmedBadge}>
            <Text style={d.confirmedBadgeText}>✓  Your Caregiver</Text>
          </View>
        )}
      </View>

      {/* Name + specialty */}
      <Text style={d.name}>{caregiver.name}</Text>
      <Text style={d.specialty}>{caregiver.specialty}</Text>

      {/* Stats pills */}
      <View style={d.statsRow}>
        <View style={d.pill}>
          <Stars rating={caregiver.rating} />
        </View>
        <View style={d.pill}>
          <Text style={d.pillText}>👥 {caregiver.patients} patients</Text>
        </View>
        <View style={d.pill}>
          <Text style={d.pillText}>💰 {caregiver.fee}</Text>
        </View>
      </View>

      <View style={d.divider} />

      {/* Bio */}
      <Text style={d.sectionLabel}>ABOUT</Text>
      <Text style={d.bio}>{caregiver.bio}</Text>

      <View style={d.divider} />

      {/* Details */}
      <Text style={d.sectionLabel}>DETAILS</Text>

      <View style={d.infoRow}>
        <Text style={d.infoIcon}>🗓</Text>
        <View style={d.infoTextWrap}>
          <Text style={d.infoLabel}>Availability</Text>
          <Text style={d.infoValue}>{caregiver.availability}</Text>
        </View>
      </View>

      <View style={d.infoRow}>
        <Text style={d.infoIcon}>📍</Text>
        <View style={d.infoTextWrap}>
          <Text style={d.infoLabel}>Location</Text>
          <Text style={d.infoValue}>{caregiver.location}</Text>
        </View>
      </View>

      {/* Spacer: clears fixed button + bottom nav (80 + 76) */}
      <View style={{ height: 164 }} />
    </ScrollView>

    {/* Confirm button — only shown before confirmation */}
    {!isConfirmed && (
      <View style={d.buttonWrap}>
        <Pressable
          style={({ pressed }) => [d.confirmBtn, pressed && d.confirmBtnPressed]}
          onPress={() => onConfirm(caregiver)}
        >
          <Text style={d.confirmBtnText}>Confirm Caregiver</Text>
        </Pressable>
      </View>
    )}
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const d = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 2,
    marginBottom: 18,
  },
  backText: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: C.textSecondary,
  },

  heroWrap: {
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: C.border,
  },
  avatarConfirmed: {
    borderColor: C.primary,
    borderWidth: 3,
  },
  avatarEmoji: { fontSize: 52 },

  confirmedBadge: {
    backgroundColor: C.primary,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  confirmedBadgeText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.primaryText,
    letterSpacing: 0.3,
  },

  name: {
    fontFamily: F.extraBold,
    fontSize: 24,
    color: C.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  specialty: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
  },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 22,
  },
  pill: {
    backgroundColor: C.primaryLight,
    borderRadius: 99,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  stars: {
    fontSize: 13,
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  ratingNum: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.textBody,
  },
  pillText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textBody,
  },

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 18,
  },

  sectionLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    letterSpacing: 1.3,
    color: C.textMuted,
    marginBottom: 10,
  },
  bio: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 22,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  infoIcon: { fontSize: 20, marginTop: 2 },
  infoTextWrap: { flex: 1 },
  infoLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.textMuted,
    marginBottom: 2,
    letterSpacing: 0.4,
  },
  infoValue: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textPrimary,
  },

  // Fixed confirm button — bottom: 76 clears the bottom nav bar
  buttonWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 76,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  confirmBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  confirmBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  confirmBtnText: {
    fontFamily: F.bold,
    fontSize: 17,
    color: C.primaryText,
  },
  confirmedBtn: {
    backgroundColor: C.primaryLight,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  confirmedBtnText: {
    fontFamily: F.bold,
    fontSize: 17,
    color: C.primary,
  },
});
