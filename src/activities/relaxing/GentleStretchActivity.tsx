import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { GameProps } from '../../games/gameProps';

export function GentleStretchActivity({ onDone, onScoreUpdate }: GameProps) {
  const parts = [
    { id: 'head',      icon: '🧠', label: 'Relax your forehead & jaw' },
    { id: 'shoulders', icon: '🫸', label: 'Drop your shoulders down' },
    { id: 'hands',     icon: '🤲', label: 'Unclench your hands' },
    { id: 'belly',     icon: '🫁', label: 'Let your belly soften' },
    { id: 'feet',      icon: '🦶', label: 'Feel your feet on the floor' },
  ];
  const [step, setStep] = useState(0);
  const done = step >= parts.length;
  const reset = () => setStep(0);
  const next = () => {
    const n = step + 1;
    onScoreUpdate(20);
    setStep(n);
    if (n >= parts.length) setTimeout(() => onDone(100), 300);
  };
  return (
    <View style={s.container}>
      <Text style={s.hint}>Focus on each part, breathe, then tap Ready.</Text>
      {!done ? (
        <View style={s.card}>
          <Text style={{ fontSize: 44 }}>{parts[step].icon}</Text>
          <Text style={s.label}>{parts[step].label}</Text>
        </View>
      ) : (
        <View style={s.card}>
          <Text style={{ fontSize: 44 }}>🌅</Text>
          <Text style={s.label}>Fully relaxed. Well done!</Text>
        </View>
      )}
      <View style={s.cycleRow}>
        {parts.map((_, i) => (
          <View key={i} style={[s.cycleDot, i < step && s.cycleDotDone]} />
        ))}
      </View>
      <Pressable onPress={next} disabled={done} style={({ pressed }) => [s.nextBtn, { opacity: done ? 0.4 : 1 }, pressed && { opacity: 0.85 }]}>
        <Text style={s.nextBtnText}>Ready ✓</Text>
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
  cycleRow: { flexDirection: 'row', gap: 8 },
  cycleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.borderMid },
  cycleDotDone: { backgroundColor: '#7C3AED' },
  nextBtn: { backgroundColor: '#7C3AED', borderRadius: 999, paddingVertical: 14, paddingHorizontal: 40 },
  nextBtnText: { fontFamily: F.extraBold, color: '#fff', fontSize: 16 },
  secBtn: { paddingVertical: 10, paddingHorizontal: 14 },
  secBtnText: { fontFamily: F.bold, color: '#7C3AED', fontSize: 13 },
});
