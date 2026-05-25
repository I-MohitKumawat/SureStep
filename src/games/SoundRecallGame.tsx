import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import { Audio } from 'expo-av';
import type { GameProps } from './gameProps';

async function playPattern(pattern: { hz: number; dur: number }[]) {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
    let delay = 0;
    for (const { hz, dur } of pattern) {
      setTimeout(async () => {
        try {
          const SR = 22050; const n = Math.floor(SR * dur); const ds = n * 2;
          const b = new ArrayBuffer(44 + ds); const v = new DataView(b);
          const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
          ws(0,'RIFF'); v.setUint32(4,36+ds,true); ws(8,'WAVE'); ws(12,'fmt ');
          v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true);
          v.setUint32(24,SR,true); v.setUint32(28,SR*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true);
          ws(36,'data'); v.setUint32(40,ds,true);
          for (let i = 0; i < n; i++) {
            const t = i/SR; const env = Math.min(1, Math.min(t/0.02,(dur-t)/0.1));
            v.setInt16(44+i*2, Math.round(Math.sin(2*Math.PI*hz*t)*env*28000), true);
          }
          const bytes = new Uint8Array(b); let bin=''; for(let i=0;i<bytes.length;i++) bin+=String.fromCharCode(bytes[i]);
          const { sound } = await Audio.Sound.createAsync({ uri: `data:audio/wav;base64,${btoa(bin)}` });
          await sound.playAsync();
          sound.setOnPlaybackStatusUpdate((st) => { if(st.isLoaded && st.didJustFinish) sound.unloadAsync(); });
        } catch(_) {}
      }, delay);
      delay += dur * 1000 + 80;
    }
  } catch(_) {}
}

const SOUND_PATTERNS: Record<string, { hz: number; dur: number }[]> = {
  doorbell: [{ hz: 587, dur: 0.25 }, { hz: 392, dur: 0.35 }],
  phone:    [{ hz: 659, dur: 0.1 }, { hz: 659, dur: 0.1 }, { hz: 659, dur: 0.1 }, { hz: 659, dur: 0.1 }],
  alarm:    [{ hz: 880, dur: 0.15 }, { hz: 440, dur: 0.15 }, { hz: 880, dur: 0.15 }, { hz: 440, dur: 0.15 }],
};

const RECALL_ROUNDS = [
  { clue: 'Doorbell', answer: 'doorbell', sound: 'doorbell', choices: [{ id: 'doorbell', icon: '🔔', label: 'Doorbell' }, { id: 'phone', icon: '📞', label: 'Phone' }, { id: 'alarm', icon: '⏰', label: 'Alarm' }] },
  { clue: 'Phone ringing', answer: 'phone', sound: 'phone', choices: [{ id: 'doorbell', icon: '🔔', label: 'Doorbell' }, { id: 'phone', icon: '📞', label: 'Phone' }, { id: 'alarm', icon: '⏰', label: 'Alarm' }] },
  { clue: 'Alarm clock', answer: 'alarm', sound: 'alarm', choices: [{ id: 'doorbell', icon: '🔔', label: 'Doorbell' }, { id: 'phone', icon: '📞', label: 'Phone' }, { id: 'alarm', icon: '⏰', label: 'Alarm' }] },
];

export function SoundRecallGame({ onDone, onScoreUpdate }: GameProps) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<null | 'correct' | 'wrong'>(null);

  const reset = () => { setRound(0); setScore(0); setFeedback(null); };

  const playClue = () => {
    const r = RECALL_ROUNDS[round];
    if (r) void playPattern(SOUND_PATTERNS[r.sound] ?? []);
  };

  const choose = (id: string) => {
    if (feedback) return;
    const correct = RECALL_ROUNDS[round]?.answer === id;
    const nextScore = score + (correct ? 1 : 0);
    if (correct) onScoreUpdate(33);
    setScore(nextScore);
    setFeedback(correct ? 'correct' : 'wrong');
    setTimeout(() => {
      const nextRound = round + 1;
      setFeedback(null);
      if (nextRound >= RECALL_ROUNDS.length) { setTimeout(() => onDone(Math.round(nextScore / RECALL_ROUNDS.length * 100)), 200); return; }
      setRound(nextRound);
    }, 700);
  };

  const current = RECALL_ROUNDS[round];
  return (
    <View>
      <View style={s.scoreRow}>
        <View style={s.badge}><Text style={s.badgeText}>⭐ Score: {score}/{RECALL_ROUNDS.length}</Text></View>
        <View style={s.badge}><Text style={s.badgeText}>Round {round + 1}/{RECALL_ROUNDS.length}</Text></View>
      </View>
      <Text style={s.hint}>Listen, then pick the matching picture.</Text>
      <Pressable onPress={playClue} style={({ pressed }) => [s.listenBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.listenIcon}>🔊</Text>
        <Text style={s.listenText}>Play: {current?.clue}</Text>
      </Pressable>
      <View style={s.choiceRow}>
        {current?.choices.map((c) => (
          <Pressable key={c.id} onPress={() => choose(c.id)} style={({ pressed }) => [s.choiceBtn, pressed && { opacity: 0.85 }]}>
            <Text style={s.choiceIcon}>{c.icon}</Text>
            <Text style={s.choiceText}>{c.label}</Text>
          </Pressable>
        ))}
      </View>
      {feedback === 'correct' && <Text style={s.success}>✅ Correct!</Text>}
      {feedback === 'wrong'   && <Text style={[s.success, { color: '#EF4444' }]}>❌ Try again!</Text>}
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
  listenBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primaryLight, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18, marginBottom: 12, alignSelf: 'center', borderWidth: 1.5, borderColor: C.primary },
  listenIcon: { fontSize: 20 },
  listenText: { fontFamily: F.bold, fontSize: 14, color: C.primaryDark },
  choiceRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  choiceBtn: { width: 88, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingVertical: 12, alignItems: 'center' },
  choiceIcon: { fontSize: 26 },
  choiceText: { marginTop: 6, fontFamily: F.bold, color: C.textPrimary, fontSize: 13 },
  success: { fontFamily: F.bold, color: C.primary, textAlign: 'center', marginTop: 10 },
  secBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 14, marginTop: 12 },
  secBtnText: { fontFamily: F.bold, color: C.primary, fontSize: 13 },
});
