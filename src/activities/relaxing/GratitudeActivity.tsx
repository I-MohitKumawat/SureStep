import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { GameProps } from '../../games/gameProps';

export function GratitudeActivity({ onDone, onScoreUpdate }: GameProps) {
  const cards = [
    { front: '🎁', prompt: 'A gift I received — big or small' },
    { front: '❤️', prompt: 'Someone who cares for me' },
    { front: '🏡', prompt: 'A place that feels safe' },
    { front: '😄', prompt: 'A moment that made me laugh' },
    { front: '🌟', prompt: 'Something I am proud of' },
  ];
  const [flipped, setFlipped] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const reset = () => { setFlipped([]); setDone(false); };
  const flip = (i: number) => {
    if (flipped.includes(i)) return;
    const next = [...flipped, i];
    onScoreUpdate(20);
    setFlipped(next);
    if (next.length === cards.length) { setDone(true); setTimeout(() => onDone(100), 500); }
  };
  return (
    <View style={s.container}>
      <Text style={s.hint}>Tap each jar to reveal a gratitude prompt.</Text>
      <View style={s.jarRow}>
        {cards.map((c, i) => (
          <Pressable key={i} onPress={() => flip(i)} style={[s.jarCard, flipped.includes(i) && s.jarCardOpen]}>
            <Text style={{ fontSize: 22 }}>{flipped.includes(i) ? '🫙' : c.front}</Text>
            {flipped.includes(i) && <Text style={s.jarPrompt}>{c.prompt}</Text>}
          </Pressable>
        ))}
      </View>
      {done && <Text style={s.success}>Beautiful thoughts! 🌸</Text>}
      <Pressable onPress={reset} style={({ pressed }) => [s.secBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.secBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  hint: { fontFamily: F.medium, color: C.textSecondary, fontSize: 13, textAlign: 'center' },
  jarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  jarCard: { width: 72, minHeight: 72, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', padding: 6 },
  jarCardOpen: { backgroundColor: '#EDE7F6', borderColor: '#7C3AED' },
  jarPrompt: { fontFamily: F.medium, fontSize: 9, color: '#5B21B6', textAlign: 'center', marginTop: 4, lineHeight: 13 },
  success: { fontFamily: F.bold, color: '#7C3AED', textAlign: 'center' },
  secBtn: { paddingVertical: 10, paddingHorizontal: 14 },
  secBtnText: { fontFamily: F.bold, color: '#7C3AED', fontSize: 13 },
});
