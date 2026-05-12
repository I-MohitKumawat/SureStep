import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { GameProps } from '../gameProps';

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PicturePuzzleGame({ onDone, onScoreUpdate }: GameProps) {
  const [order, setOrder] = useState<number[]>(() => shuffle([1, 2, 3, 4]));
  const [picked, setPicked] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);

  const reset = () => { setOrder(shuffle([1, 2, 3, 4])); setPicked(null); setMoves(0); };

  const tap = (idx: number) => {
    if (picked === null) { setPicked(idx); return; }
    if (picked === idx) { setPicked(null); return; }
    setMoves((m) => m + 1);
    setOrder((prev) => {
      const next = [...prev];
      [next[picked], next[idx]] = [next[idx], next[picked]];
      if (next.join(',') === '1,2,3,4') { onScoreUpdate(100); setTimeout(() => onDone(100), 250); }
      return next;
    });
    setPicked(null);
  };

  const isSolved = order.join(',') === '1,2,3,4';
  return (
    <View>
      <View style={s.scoreRow}>
        <View style={s.badge}><Text style={s.badgeText}>{isSolved ? '✅ Solved!' : '🔢 Arrange 1→4'}</Text></View>
        <View style={s.badge}><Text style={s.badgeText}>🔄 Swaps: {moves}</Text></View>
      </View>
      <Text style={s.hint}>Tap two tiles to swap. Arrange in order.</Text>
      <View style={s.puzzleGrid}>
        {order.map((n, idx) => (
          <Pressable key={`${n}_${idx}`} onPress={() => tap(idx)}
            style={({ pressed }) => [s.tile, picked === idx && s.tilePicked, pressed && { opacity: 0.9 }]}>
            <Text style={s.tileText}>{n}</Text>
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
  puzzleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  tile: { width: 78, height: 64, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  tilePicked: { borderColor: C.primary, backgroundColor: C.primaryLight },
  tileText: { fontFamily: F.extraBold, fontSize: 20, color: C.primaryDark },
  secBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 14, marginTop: 12 },
  secBtnText: { fontFamily: F.bold, color: C.primary, fontSize: 13 },
});
