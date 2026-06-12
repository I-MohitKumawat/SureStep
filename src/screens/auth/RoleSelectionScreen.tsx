/**
 * SureStep — src/screens/auth/RoleSelectionScreen.tsx
 * Step 1 of the onboarding wizard.
 * Patient: 2 steps total  (this = Step 1, Profile = Step 2)
 * Caregiver: 3 steps total (this = Step 1, Basic Info = Step 2, Professional = Step 3)
 */
import React, { useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { AuthStackParams } from '../../types/navigation.types';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AuthStackParams, 'RoleSelectionScreen'>;

// ─── Step Indicator ──────────────────────────────────────────────────────────
function StepIndicator({
  current, total, labels,
}: { current: number; total: number; labels: string[] }) {
  return (
    <View style={si.wrap}>
      {Array.from({ length: total }, (_, i) => {
        const idx    = i + 1;
        const done   = idx < current;
        const active = idx === current;
        return (
          <React.Fragment key={idx}>
            <View style={si.item}>
              <View style={[si.circle, done && si.circleDone, active && si.circleActive]}>
                {done
                  ? <Text style={si.check}>✓</Text>
                  : <Text style={[si.num, active && si.numActive, !active && !done && si.numMuted]}>
                      {idx}
                    </Text>
                }
              </View>
              <Text style={[si.label, active && si.labelActive, done && si.labelDone]}>
                {labels[i]}
              </Text>
            </View>
            {i < total - 1 && (
              <View style={[si.dash, done && si.dashDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─── Role Card ───────────────────────────────────────────────────────────────
function RoleCard({
  icon, title, description, selected, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap; title: string; description: string; selected: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        rc.card,
        selected && rc.cardSelected,
        pressed && rc.cardPressed,
      ]}
    >
      <View style={[rc.bubble, selected && rc.bubbleSelected]}>
        <Ionicons name={icon} size={24} color={selected ? C.primary : C.textMuted} />
      </View>

      <View style={rc.textWrap}>
        <Text style={[rc.title, selected && rc.titleSelected]}>{title}</Text>
        <Text style={rc.desc}>{description}</Text>
      </View>

      <View style={[rc.radio, selected && rc.radioSelected]}>
        {selected && <View style={rc.radioInner} />}
      </View>
    </Pressable>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export const RoleSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const { firebaseUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'CAREGIVER' | 'PATIENT' | 'FAMILY' | null>(null);

  const totalSteps  = selectedRole === 'CAREGIVER' ? 3 : 2;
  const stepLabels  = selectedRole === 'CAREGIVER'
    ? ['Your Role', 'Basic Info', 'Professional']
    : ['Your Role', 'Profile Info'];

  const proceed = () => {
    if (!selectedRole) return;
    navigation.navigate('ProfileSetupScreen', { role: selectedRole });
  };

  const phoneDisplay = firebaseUser?.phoneNumber ?? '';

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={s.screen}>
      {() => (
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Welcome to SureStep</Text>
            {phoneDisplay ? (
              <Text style={s.headerSub}>{phoneDisplay}</Text>
            ) : null}
          </View>

          {/* Step indicator */}
          <StepIndicator
            current={1}
            total={totalSteps}
            labels={stepLabels}
          />

          {/* Hero */}
          <View style={s.hero}>
            <Text style={s.heroTitle}>Who are you?</Text>
            <Text style={s.heroSub}>
              Select your profile type to get started.
            </Text>
          </View>

          {/* Role cards */}
          <View style={s.cards}>
            <RoleCard
              icon="heart-outline"
              title="I'm a Patient"
              description="Track daily routines and stay connected."
              selected={selectedRole === 'PATIENT'}
              onPress={() => setSelectedRole('PATIENT')}
            />
            <RoleCard
              icon="medkit-outline"
              title="I'm a Caregiver"
              description="Manage patients and monitor safety."
              selected={selectedRole === 'CAREGIVER'}
              onPress={() => setSelectedRole('CAREGIVER')}
            />
            <RoleCard
              icon="people-outline"
              title="I'm a Family Member"
              description="Observe, support, and stay informed."
              selected={selectedRole === 'FAMILY'}
              onPress={() => setSelectedRole('FAMILY')}
            />
          </View>

          {/* CTA */}
          <Pressable
            onPress={proceed}
            disabled={!selectedRole}
            style={({ pressed }) => [
              s.cta,
              !selectedRole && s.ctaDisabled,
              pressed && selectedRole && s.ctaPressed,
            ]}
          >
            <Text style={s.ctaText}>
              {selectedRole
                ? `Next: ${selectedRole === 'CAREGIVER' ? 'basic info' : 'profile info'}  ›`
                : 'Select a role to continue'}
            </Text>
          </Pressable>

          {/* Back link */}
          <Pressable
            onPress={() => navigation.navigate('WelcomeScreen')}
            style={s.backBtn}
          >
            <Text style={s.backText}>← Back to Welcome</Text>
          </Pressable>
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

// ─── Step Indicator Styles ────────────────────────────────────────────────────
const si = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginVertical: 24,
    paddingHorizontal: 8,
  },
  item: { alignItems: 'center', gap: 6, width: 72 },

  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: C.borderMid,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
  circleDone: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },

  check:     { fontFamily: F.bold, fontSize: 14, color: '#fff' },
  num:       { fontFamily: F.bold, fontSize: 14, color: C.textMuted },
  numActive: { color: '#fff' },
  numMuted:  { color: C.textMuted },

  label: {
    fontFamily: F.regular,
    fontSize: 10,
    color: C.textMuted,
    textAlign: 'center',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  labelActive: { color: C.primary, fontFamily: F.semiBold },
  labelDone:   { color: C.primary },

  dash: {
    flex: 1,
    height: 2,
    backgroundColor: C.border,
    marginTop: 17,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: C.borderMid,
  },
  dashDone: { borderColor: C.primary, backgroundColor: C.primary },
});

// ─── Role Card Styles ─────────────────────────────────────────────────────────
const rc = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: C.border,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: C.primary,
    backgroundColor: '#F0FBF8',
  },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },

  bubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleSelected: { backgroundColor: C.primaryLight },
  emoji: { fontSize: 26 },

  textWrap: { flex: 1 },
  title: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.textPrimary,
    marginBottom: 3,
  },
  titleSelected: { color: C.primary },
  desc: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: C.primary },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: C.primary,
  },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.surface },
  scroll: { paddingHorizontal: 24, paddingBottom: 48 },

  header: { paddingTop: 16, marginBottom: 4 },
  headerTitle: {
    fontFamily: F.extraBold,
    fontSize: 22,
    color: C.textPrimary,
  },
  headerSub: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },

  hero: { alignItems: 'center', marginVertical: 20 },
  heroTitle: {
    fontFamily: F.extraBold,
    fontSize: 26,
    color: C.textPrimary,
    marginBottom: 8,
  },
  heroSub: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  cards: { gap: 14, marginBottom: 32 },

  cta: {
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
    marginBottom: 16,
  },
  ctaDisabled: { backgroundColor: C.borderMid, shadowOpacity: 0 },
  ctaPressed:  { opacity: 0.88, transform: [{ scale: 0.98 }] },
  ctaText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.primaryText,
    letterSpacing: 0.3,
  },

  backBtn: { alignItems: 'center', paddingVertical: 8 },
  backText: { fontFamily: F.regular, fontSize: 14, color: C.textMuted },
});
