import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { GameProps } from '../../games/gameProps';

export function HandMassageActivity({ onDone, onScoreUpdate }: GameProps) {
  const steps = [
    { label: 'Rub palms together', icon: '🤲' },
    { label: 'Massage right thumb', icon: '👍' },
    { label: 'Massage left thumb', icon: '👍' },
    { label: 'Gently squeeze each finger', icon: '✋' },
    { label: 'Stroke backs of both hands', icon: '🙌' },
  ];
  const [step, setStep] = useState(0);
  const done = step >= steps.length;
  const reset = () => setStep(0);
  const next = () => {
    const n = step + 1;
    onScoreUpdate(20);
    setStep(n);
    if (n >= steps.length) setTimeout(() => onDone(100), 300);
  };
  const progress = Math.min(step / steps.length, 1);
  return (
    <View style={s.container}>
      <Text style={s.hint}>Do each step slowly, then tap Next.</Text>
      {!done ? (
        <View style={s.card}>
          <Text style={{ fontSize: 40 }}>{steps[step].icon}</Text>
          <Text style={s.label}>{steps[step].label}</Text>
        </View>
      ) : (
        <View style={s.card}>
          <Text style={{ fontSize: 40 }}>✅</Text>
          <Text style={s.label}>Lovely work!</Text>
        </View>
      )}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${progress * 100}%` as any }]} />
      </View>
      <Text style={s.hint}>{step + (done ? 0 : 1)} / {steps.length}</Text>
      <Pressable onPress={next} disabled={done} style={({ pressed }) => [s.nextBtn, { opacity: done ? 0.4 : 1 }, pressed && { opacity: 0.85 }]}>
        <Text style={s.nextBtnText}>Next →</Text>
      </Pressable>
      <Pressable onPress={reset} style={({ pressed }) => [s.secBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.secBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  hint: { fontFamily: F.medium, color: C.textSecondary, fontSize: 13, textAlign: 'center' },
  card: { backgroundColor: '#EDE7F6', borderRadius: 20, padding: 18, alignItems: 'center', gap: 8, minWidth: 180 },
  label: { fontFamily: F.bold, fontSize: 14, color: '#5B21B6', textAlign: 'center' },
  progressBar: { width: '100%', height: 8, borderRadius: 4, backgroundColor: C.borderMid, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#7C3AED', borderRadius: 4 },
  nextBtn: { backgroundColor: '#7C3AED', borderRadius: 999, paddingVertical: 14, paddingHorizontal: 40 },
  nextBtnText: { fontFamily: F.extraBold, color: '#fff', fontSize: 16 },
  secBtn: { paddingVertical: 10, paddingHorizontal: 14 },
  secBtnText: { fontFamily: F.bold, color: '#7C3AED', fontSize: 13 },
});
