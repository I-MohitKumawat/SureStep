import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
// Navigation types migrated to src/types/navigation.types.ts
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { getActivityById } from '../../activities/activityData';
import type { PatientStackParams } from '../../types/navigation.types';

type Props = NativeStackScreenProps<PatientStackParams, 'ActivityDetailScreen'>;

// Two simple checks â€” enough for safety without overwhelming the patient
const CHECKS = [
  { id: 'ready',       label: 'I feel comfortable and ready' },
  { id: 'no-stress',   label: 'I am calm and not feeling unwell' },
];

export const ActivityDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { activityId } = route.params;
  const activity = getActivityById(activityId);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  if (!activity) {
    return (
      <ScreenContainer edges={['top']} style={s.screen}>
        <Text style={{ color: C.textBody, padding: 24 }}>Activity not found.</Text>
      </ScreenContainer>
    );
  }

  const allChecked = CHECKS.every((c) => checked[c.id]);
  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const onPlay = () => {
    if (!allChecked) return;
    navigation.navigate('ActivityPlayScreen', { activityId: activity.id });
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={s.screen}>

      {/* Back */}
      <Pressable onPress={() => navigation.goBack()} style={s.backRow} hitSlop={10}>
        <Text style={s.backText}>â€¹  Back</Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Big banner */}
        <View style={[s.banner, { backgroundColor: activity.bgColor }]}>
          <Text style={s.bannerIcon}>{activity.icon}</Text>
          {/* Duration pill */}
          <View style={s.durPill}>
            <Text style={s.durText}>â±  {activity.durationMin} min</Text>
          </View>
        </View>

        {/* Title & description */}
        <View style={s.titleBlock}>
          <Text style={s.title}>{activity.title}</Text>
          <Text style={s.desc}>{activity.subtitle}</Text>
        </View>

        {/* How to play â€” single line instruction */}
        <View style={[s.howCard, { borderLeftColor: activity.color }]}>
          <Text style={s.howLabel}>How to play</Text>
          <Text style={s.howText}>{activity.instructions[0]}</Text>
        </View>

        {/* Safety checks */}
        <View style={s.safetyBlock}>
          <Text style={s.safetyLabel}>Before you start</Text>
          {CHECKS.map((c) => (
            <Pressable key={c.id} onPress={() => toggle(c.id)} style={s.checkRow}>
              <View style={[s.box, checked[c.id] && { backgroundColor: activity.color, borderColor: activity.color }]}>
                {checked[c.id] && <Text style={s.tick}>âœ“</Text>}
              </View>
              <Text style={s.checkLabel}>{c.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Play button */}
        <Pressable
          onPress={onPlay}
          disabled={!allChecked}
          style={({ pressed }) => [
            s.playBtn,
            { backgroundColor: allChecked ? activity.color : C.borderMid },
            pressed && { opacity: 0.88 },
          ]}
        >
          <Text style={s.playIcon}>â–¶</Text>
          <Text style={s.playText}>Start Activity</Text>
        </Pressable>

        {!allChecked && (
          <Text style={s.hint}>Tick both boxes above to continue.</Text>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  screen: { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },

  backRow: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  backText: { fontFamily: F.bold, fontSize: 17, color: C.primary },

  scroll: { paddingBottom: 24 },

  // Banner â€” large and iconic
  banner: {
    marginHorizontal: 16, borderRadius: 28,
    height: 200, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, position: 'relative', overflow: 'hidden',
  },
  bannerIcon: { fontSize: 80 },
  durPill: {
    position: 'absolute', bottom: 14, right: 14,
    backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  durText: { fontFamily: F.bold, fontSize: 12, color: '#fff' },

  // Title
  titleBlock: { paddingHorizontal: 20, marginBottom: 18 },
  title: { fontFamily: F.extraBold, fontSize: 26, color: C.textPrimary, marginBottom: 6 },
  desc:  { fontFamily: F.medium,    fontSize: 15, color: C.textSecondary, lineHeight: 22 },

  // How to play card
  howCard: {
    marginHorizontal: 16, marginBottom: 20,
    backgroundColor: C.surface,
    borderRadius: 18, borderWidth: 1, borderColor: C.border,
    borderLeftWidth: 4, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
  },
  howLabel: { fontFamily: F.extraBold, fontSize: 13, color: C.textPrimary, marginBottom: 6 },
  howText:  { fontFamily: F.medium,    fontSize: 14, color: C.textSecondary, lineHeight: 21 },

  // Safety checks
  safetyBlock: {
    marginHorizontal: 16, marginBottom: 24,
    backgroundColor: '#FFFBEB',
    borderRadius: 20, borderWidth: 1.5, borderColor: '#FDE68A',
    padding: 18,
  },
  safetyLabel: { fontFamily: F.extraBold, fontSize: 14, color: '#92400E', marginBottom: 14 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  box: {
    width: 28, height: 28, borderRadius: 8,
    borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  tick: { fontFamily: F.extraBold, fontSize: 15, color: '#fff' },
  checkLabel: { flex: 1, fontFamily: F.medium, fontSize: 15, color: C.textBody, lineHeight: 21 },

  // Play button â€” big, friendly, unmissable
  playBtn: {
    marginHorizontal: 16, borderRadius: 999,
    paddingVertical: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 16, elevation: 8,
    marginBottom: 10,
  },
  playIcon: { fontSize: 20, color: '#fff' },
  playText: { fontFamily: F.extraBold, fontSize: 20, color: '#fff' },
  hint: {
    textAlign: 'center', fontFamily: F.medium,
    fontSize: 12, color: C.textMuted, marginBottom: 4,
  },
});
