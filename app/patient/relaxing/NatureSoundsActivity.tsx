import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { GameProps } from '../gameProps';

export function NatureSoundsActivity({ onDone, onScoreUpdate }: GameProps) {
  type Phase = 'inhale' | 'hold' | 'exhale';
  const [phase, setPhase] = useState<Phase>('inhale');
  const [cycles, setCycles] = useState(0);
  const total = 4;
  const reset = () => { setPhase('inhale'); setCycles(0); };
  const advance = () => {
    if (phase === 'inhale') { setPhase('hold'); return; }
    if (phase === 'hold') { setPhase('exhale'); return; }
    const next = cycles + 1;
    onScoreUpdate(25);
    setPhase('inhale');
    setCycles(next);
    if (next >= total) setTimeout(() => onDone(100), 300);
  };
  const bubbleSize = phase === 'inhale' ? 110 : phase === 'hold' ? 110 : 70;
  const bubbleColor = phase === 'inhale' ? '#C4B5FD' : phase === 'hold' ? '#A78BFA' : '#7C3AED';
  const phaseLabel = phase === 'inhale' ? 'Breathe In 😮‍💨' : phase === 'hold' ? 'Hold... ⏸' : 'Breathe Out 💨';
  const hint = phase === 'inhale' ? '4 counts' : phase === 'hold' ? '2 counts' : '6 counts';
  return (
    <View style={s.container}>
      <Text style={s.hint}>Follow the bubble. Tap to advance.</Text>
      <Pressable onPress={advance} style={[s.bubble, { width: bubbleSize, height: bubbleSize, borderRadius: bubbleSize / 2, backgroundColor: bubbleColor }]}>
        <Text style={{ fontSize: 30 }}>{phase === 'inhale' ? '🫧' : phase === 'hold' ? '⏸️' : '🌬️'}</Text>
      </Pressable>
      <Text style={s.direction}>{phaseLabel}</Text>
      <Text style={s.hint}>{hint}</Text>
      <View style={s.cycleRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[s.cycleDot, i < cycles && s.cycleDotDone]} />
        ))}
      </View>
      <Pressable onPress={reset} style={({ pressed }) => [s.secBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.secBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  hint: { fontFamily: F.medium, color: C.textSecondary, fontSize: 13, textAlign: 'center' },
  bubble: { alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  direction: { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary, textAlign: 'center' },
  cycleRow: { flexDirection: 'row', gap: 8, marginVertical: 6 },
  cycleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.borderMid },
  cycleDotDone: { backgroundColor: '#7C3AED' },
  secBtn: { paddingVertical: 10, paddingHorizontal: 14 },
  secBtnText: { fontFamily: F.bold, color: '#7C3AED', fontSize: 13 },
});
