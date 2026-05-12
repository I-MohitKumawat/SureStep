import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { GameProps } from '../gameProps';

export function WordFinderGame({ onDone, onScoreUpdate }: GameProps) {
  const target = 'HOME';
  const letters = ['H', 'O', 'M', 'E', 'A', 'T', 'S', 'R'];
  const [progress, setProgress] = useState('');
  const reset = () => setProgress('');

  const tap = (ch: string) => {
    const next = (progress + ch).slice(0, target.length);
    const shouldBe = target.slice(0, next.length);
    if (next !== shouldBe) { setProgress(''); return; }
    setProgress(next);
    if (next === target) {
      onScoreUpdate(100);
      setTimeout(() => onDone(100), 250);
    }
  };

  return (
    <View>
      <View style={s.scoreRow}>
        <View style={s.badge}><Text style={s.badgeText}>📝 {progress.length}/{target.length} letters</Text></View>
        {progress === target && <View style={[s.badge, { backgroundColor: '#D1FAE5' }]}><Text style={[s.badgeText, { color: '#065F46' }]}>🎉 Correct!</Text></View>}
      </View>
      <Text style={s.hint}>Tap letters in order to spell: <Text style={{ color: C.primary }}>{target}</Text></Text>
      <View style={s.lettersRow}>
        {letters.map((ch) => (
          <Pressable key={ch} onPress={() => tap(ch)} style={({ pressed }) => [s.letterBtn, pressed && { opacity: 0.85 }]}>
            <Text style={s.letterText}>{ch}</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.progressPill}>
        <Text style={s.progressText}>{progress.padEnd(target.length, '•')}</Text>
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
  lettersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  letterBtn: { width: 56, height: 48, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  letterText: { fontFamily: F.extraBold, color: C.textPrimary, fontSize: 16 },
  progressPill: { alignSelf: 'center', backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, marginTop: 12 },
  progressText: { fontFamily: F.bold, color: C.primaryDark, letterSpacing: 3 },
  secBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 14, marginTop: 12 },
  secBtnText: { fontFamily: F.bold, color: C.primary, fontSize: 13 },
});
