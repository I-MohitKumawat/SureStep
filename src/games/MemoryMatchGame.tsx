import React, { useState } from 'react';
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

type MemoryTile = { id: string; value: string; revealed: boolean; matched: boolean };

export function MemoryMatchGame({ onDone, onScoreUpdate }: GameProps) {
  const mkTiles = () => {
    const values = ['🍎', '🍌', '🍇', '🍊', '🍎', '🍌', '🍇', '🍊'];
    return shuffle(values).map((v, i) => ({ id: `t_${i}_${v}`, value: v, revealed: false, matched: false }));
  };
  const [tiles, setTiles] = useState<MemoryTile[]>(mkTiles);
  const [lock, setLock] = useState(false);
  const [moves, setMoves] = useState(0);

  const matched = tiles.filter((t) => t.matched).length / 2;
  const total   = tiles.length / 2;

  const reset = () => { setTiles(mkTiles()); setMoves(0); };

  const onTap = (id: string) => {
    if (lock) return;
    setTiles((prev) => {
      const t = prev.find((x) => x.id === id);
      if (!t || t.matched || t.revealed) return prev;
      const next = prev.map((x) => x.id === id ? { ...x, revealed: true } : x);
      const open = next.filter((x) => x.revealed && !x.matched);
      if (open.length === 2) {
        setMoves((m) => m + 1);
        const [a, b] = open;
        if (a.value === b.value) {
          onScoreUpdate(20);
          const withMatch = next.map((x) => (x.id === a.id || x.id === b.id) ? { ...x, matched: true } : x);
          if (withMatch.every((x) => x.matched)) setTimeout(() => onDone(100), 250);
          return withMatch;
        }
        setLock(true);
        setTimeout(() => {
          setTiles((curr) => curr.map((x) => (x.id === a.id || x.id === b.id) ? { ...x, revealed: false } : x));
          setLock(false);
        }, 650);
      }
      return next;
    });
  };

  return (
    <View>
      <View style={s.scoreRow}>
        <View style={s.badge}><Text style={s.badgeText}>🃏 Pairs: {matched}/{total}</Text></View>
        <View style={s.badge}><Text style={s.badgeText}>👆 Moves: {moves}</Text></View>
      </View>
      <Text style={s.hint}>Find all matching pairs!</Text>
      <View style={s.grid}>
        {tiles.map((t) => (
          <Pressable key={t.id} onPress={() => onTap(t.id)}
            style={({ pressed }) => [s.tile, (t.revealed || t.matched) && s.tileOpen, pressed && { opacity: 0.85 }]}>
            <Text style={s.tileText}>{(t.revealed || t.matched) ? t.value : '❓'}</Text>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  tile: { width: 78, height: 64, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  tileOpen: { backgroundColor: C.primaryLight, borderColor: C.primary },
  tileText: { fontSize: 22 },
  secBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 14, marginTop: 12 },
  secBtnText: { fontFamily: F.bold, color: C.primary, fontSize: 13 },
});
