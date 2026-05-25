import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { GameProps } from '../../games/gameProps';

export function ChairMarchExercise({ onDone, onScoreUpdate }: GameProps) {
  const [count, setCount] = useState(0);
  const target = 10;
  const reset = () => setCount(0);
  const tap = () => {
    const next = count + 1;
    setCount(next);
    onScoreUpdate(10);
    if (next >= target) setTimeout(() => onDone(100), 300);
  };
  return (
    <View style={s.container}>
      <Text style={s.hint}>Tap the button each time you lift a knee.</Text>
      <View style={s.circle}>
        <Text style={s.num}>{count}</Text>
        <Text style={s.of}>/ {target}</Text>
      </View>
      <Pressable onPress={tap} style={({ pressed }) => [s.bigBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.bigBtnText}>🦵 Lift!</Text>
      </Pressable>
      <Pressable onPress={reset} style={({ pressed }) => [s.secBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.secBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

export function ArmCirclesExercise({ onDone, onScoreUpdate }: GameProps) {
  const [phase, setPhase] = useState<'forward' | 'backward' | 'done'>('forward');
  const [reps, setReps] = useState(0);
  const target = 5;
  const reset = () => { setPhase('forward'); setReps(0); };
  const tap = () => {
    if (phase === 'done') return;
    const next = reps + 1;
    onScoreUpdate(10);
    setReps(next);
    if (next >= target && phase === 'forward') { setPhase('backward'); setReps(0); return; }
    if (next >= target && phase === 'backward') { setPhase('done'); setTimeout(() => onDone(100), 300); }
  };
  return (
    <View style={s.container}>
      <Text style={s.hint}>
        {phase === 'forward' ? '🔄 Circle FORWARD' : phase === 'backward' ? '🔃 Circle BACKWARD' : '✅ Done!'}
      </Text>
      <View style={s.circle}>
        <Text style={s.num}>{reps}</Text>
        <Text style={s.of}>/ {target}</Text>
      </View>
      <Pressable onPress={tap} style={({ pressed }) => [s.bigBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.bigBtnText}>💪 Circle!</Text>
      </Pressable>
      <Pressable onPress={reset} style={({ pressed }) => [s.secBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.secBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

export function HeelRaisesExercise({ onDone, onScoreUpdate }: GameProps) {
  const [count, setCount] = useState(0);
  const target = 8;
  const reset = () => setCount(0);
  const tap = () => {
    const next = count + 1;
    setCount(next);
    onScoreUpdate(12);
    if (next >= target) setTimeout(() => onDone(100), 300);
  };
  return (
    <View style={s.container}>
      <Text style={s.hint}>Tap each time you rise onto your toes.</Text>
      <View style={s.circle}>
        <Text style={s.num}>{count}</Text>
        <Text style={s.of}>/ {target}</Text>
      </View>
      <Pressable onPress={tap} style={({ pressed }) => [s.bigBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.bigBtnText}>🦶 Rise!</Text>
      </Pressable>
      <Pressable onPress={reset} style={({ pressed }) => [s.secBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.secBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

export function NeckRollsExercise({ onDone, onScoreUpdate }: GameProps) {
  const directions = ['Right ➡️', 'Forward ⬇️', 'Left ⬅️'];
  const [step, setStep] = useState(0);
  const [round, setRound] = useState(0);
  const totalRounds = 3;
  const reset = () => { setStep(0); setRound(0); };
  const tap = () => {
    if (step < directions.length - 1) { setStep(step + 1); return; }
    onScoreUpdate(33);
    const nextRound = round + 1;
    setRound(nextRound);
    setStep(0);
    if (nextRound >= totalRounds) setTimeout(() => onDone(100), 300);
  };
  return (
    <View style={s.container}>
      <Text style={s.hint}>Follow the direction, then tap Next.</Text>
      <View style={s.circle}>
        <Text style={s.num}>{round + 1}</Text>
        <Text style={s.of}>/ {totalRounds}</Text>
      </View>
      <Text style={s.direction}>{directions[step]}</Text>
      <Pressable onPress={tap} style={({ pressed }) => [s.bigBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.bigBtnText}>Next →</Text>
      </Pressable>
      <Pressable onPress={reset} style={({ pressed }) => [s.secBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.secBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

export function DeepBreathingExercise({ onDone, onScoreUpdate }: GameProps) {
  const [rep, setRep] = useState(0);
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const target = 5;
  const reset = () => { setRep(0); setPhase('in'); };
  const tap = () => {
    if (phase === 'in') { setPhase('hold'); return; }
    if (phase === 'hold') { setPhase('out'); return; }
    const next = rep + 1;
    onScoreUpdate(20);
    setPhase('in');
    setRep(next);
    if (next >= target) setTimeout(() => onDone(100), 300);
  };
  const label = phase === 'in' ? '😮‍💨 Breathe In' : phase === 'hold' ? '⏸ Hold' : '💨 Breathe Out';
  return (
    <View style={s.container}>
      <Text style={s.hint}>Follow the breathing guide. Tap to advance.</Text>
      <View style={s.circle}>
        <Text style={s.num}>{rep}</Text>
        <Text style={s.of}>/ {target}</Text>
      </View>
      <Text style={s.direction}>{label}</Text>
      <Pressable onPress={tap} style={({ pressed }) => [s.bigBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.bigBtnText}>Tap</Text>
      </Pressable>
      <Pressable onPress={reset} style={({ pressed }) => [s.secBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.secBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', gap: 14 },
  hint: { fontFamily: F.medium, color: C.textSecondary, fontSize: 13, textAlign: 'center' },
  circle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  num: { fontFamily: F.extraBold, fontSize: 36, color: '#2E7D32' },
  of: { fontFamily: F.medium, fontSize: 13, color: '#558B2F' },
  direction: { fontFamily: F.extraBold, fontSize: 20, color: C.textPrimary, textAlign: 'center' },
  bigBtn: { backgroundColor: '#4CAF50', borderRadius: 999, paddingVertical: 16, paddingHorizontal: 48 },
  bigBtnText: { fontFamily: F.extraBold, color: '#fff', fontSize: 17 },
  secBtn: { paddingVertical: 10, paddingHorizontal: 14 },
  secBtnText: { fontFamily: F.bold, color: '#4CAF50', fontSize: 13 },
});
