import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import type { GameProps } from './gameProps';

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ColorSortGame({ onDone, onScoreUpdate }: GameProps) {
  const items = useMemo(() => shuffle([
    { id: 'r1', color: '#EF4444', label: 'Red' },
    { id: 'g1', color: '#22C55E', label: 'Green' },
    { id: 'b1', color: '#3B82F6', label: 'Blue' },
  ]), []);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);

  const reset = () => { setIdx(0); setScore(0); };

  const pick = (label: string) => {
    const current = items[idx];
    const correct = current?.label === label;
    const nextScore = score + (correct ? 1 : 0);
    if (correct) onScoreUpdate(33);
    const nextIdx = idx + 1;
    setScore(nextScore);
    setIdx(nextIdx);
    if (nextIdx >= items.length) setTimeout(() => onDone(Math.round(nextScore / items.length * 100)), 250);
  };

  const current = items[idx];
  const done = idx >= items.length;
  return (
    <View>
      <View style={s.scoreRow}>
        <View style={s.badge}><Text style={s.badgeText}>⭐ Score: {score}/{items.length}</Text></View>
        <View style={s.badge}><Text style={s.badgeText}>{done ? 'Done! 🎉' : `Q ${idx + 1}/${items.length}`}</Text></View>
      </View>
      <Text style={s.hint}>What colour is the dot?</Text>
      <View style={s.sortItem}>
        <View style={[s.colorDot, { backgroundColor: current?.color ?? C.borderMid }]} />
      </View>
      <View style={s.sortRow}>
        {['Red', 'Green', 'Blue'].map((l) => (
          <Pressable key={l} onPress={() => pick(l)} disabled={done} style={({ pressed }) => [s.sortBtn, pressed && { opacity: 0.85 }]}>
            <Text style={s.sortBtnText}>{l}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={reset} style={({ pressed }) => [s.secBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.secBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  scoreRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 10 },
  badge: { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontFamily: F.bold, fontSize: 12, color: C.primaryDark },
  hint: { fontFamily: F.medium, color: C.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  sortItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  colorDot: { width: 60, height: 60, borderRadius: 30 },
  sortRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  sortBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  sortBtnText: { fontFamily: F.bold, color: C.primaryDark, fontSize: 14 },
  secBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 14, marginTop: 12 },
  secBtnText: { fontFamily: F.bold, color: C.primary, fontSize: 13 },
});
