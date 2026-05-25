import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { GameProps } from '../../games/gameProps';

async function writeWavFile(notes: { hz: number; dur: number }[], fileId: string): Promise<string> {
  const SR = 11025;
  const totalSamples = notes.reduce((s, n) => s + Math.floor(SR * n.dur), 0);
  const dataSize = totalSamples * 2;
  const buf  = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buf);
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); ws(8, 'WAVE');
  ws(12, 'fmt '); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, SR, true); view.setUint32(28, SR * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  ws(36, 'data'); view.setUint32(40, dataSize, true);
  let off = 44;
  for (const { hz, dur } of notes) {
    const n = Math.floor(SR * dur);
    for (let i = 0; i < n; i++) {
      const t   = i / SR;
      const env = Math.min(1, Math.min(t / 0.03, (dur - t) / 0.1));
      const s   = Math.round((Math.sin(2 * Math.PI * hz * t) * 0.72 + Math.sin(4 * Math.PI * hz * t) * 0.14) * env * 26000);
      view.setInt16(off, s, true);
      off += 2;
    }
  }
  const bytes = new Uint8Array(buf);
  const CHUNK = 3072; let b64 = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    b64 += btoa(String.fromCharCode(...Array.from(bytes.subarray(i, i + CHUNK))));
  }
  const path = `${(FileSystem as any).cacheDirectory}surestep_${fileId}.wav`;
  await (FileSystem as any).writeAsStringAsync(path, b64, { encoding: (FileSystem as any).EncodingType.Base64 });
  return path;
}

type Song = { id: string; title: string; description: string; icon: string; colour: string; notes: { hz: number; dur: number }[] };

const SONGS: Song[] = [
  { id: 'morning-peace', title: 'Morning Peace', description: 'Soft C-major lullaby', icon: '🌅', colour: '#C4B5FD', notes: [{ hz: 261, dur: 0.6 }, { hz: 329, dur: 0.6 }, { hz: 392, dur: 0.6 }, { hz: 440, dur: 0.8 }, { hz: 392, dur: 0.5 }, { hz: 329, dur: 0.5 }, { hz: 261, dur: 0.6 }, { hz: 294, dur: 0.6 }, { hz: 261, dur: 1.0 }] },
  { id: 'ocean-breeze',  title: 'Ocean Breeze',  description: 'Gentle A-minor waves',  icon: '🌊', colour: '#67E8F9', notes: [{ hz: 220, dur: 0.7 }, { hz: 261, dur: 0.5 }, { hz: 329, dur: 0.7 }, { hz: 440, dur: 0.9 }, { hz: 392, dur: 0.5 }, { hz: 329, dur: 0.5 }, { hz: 261, dur: 0.7 }, { hz: 220, dur: 1.0 }] },
  { id: 'lullaby',       title: 'Gentle Lullaby', description: 'Warm G-major melody',  icon: '🌙', colour: '#FCD34D', notes: [{ hz: 392, dur: 0.5 }, { hz: 440, dur: 0.5 }, { hz: 493, dur: 0.6 }, { hz: 587, dur: 0.8 }, { hz: 493, dur: 0.5 }, { hz: 440, dur: 0.5 }, { hz: 392, dur: 0.6 }, { hz: 392, dur: 1.0 }] },
];

export function MusicListenActivity({ onDone, onScoreUpdate }: GameProps) {
  const [selected, setSelected] = useState<Song | null>(null);
  const [playing, setPlaying]   = useState(false);
  const soundRef = useRef<import('expo-av').Audio.Sound | null>(null);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch (_) {}
      soundRef.current = null;
    }
    setPlaying(false);
  }, []);

  const play = useCallback(async (song: Song) => {
    await stop();
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      const uri = await writeWavFile(song.notes, song.id);
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => { if (status.isLoaded && status.didJustFinish) void sound.replayAsync(); });
    } catch (e) { setPlaying(false); }
  }, [stop]);

  useEffect(() => () => { void stop(); }, [stop]);

  const selectSong = async (song: Song) => { setSelected(song); await play(song); onScoreUpdate(50); };
  const togglePlay = async () => { if (!selected) return; if (playing) await stop(); else await play(selected); };
  const bars = [0.4, 0.7, 1.0, 0.8, 0.6, 0.9, 0.5, 0.7, 1.0, 0.6];

  return (
    <View style={s.container}>
      <Text style={s.hint}>Choose a song and relax 🎧</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {SONGS.map((song) => (
          <Pressable key={song.id} onPress={() => void selectSong(song)}
            style={[s.songCard, { backgroundColor: song.colour }, selected?.id === song.id && s.songCardActive]}>
            <Text style={{ fontSize: 22 }}>{song.icon}</Text>
            <Text style={s.songTitle}>{song.title}</Text>
            <Text style={s.songDesc}>{song.description}</Text>
          </Pressable>
        ))}
      </View>
      {selected && (
        <>
          <Pressable onPress={() => void togglePlay()} style={[s.orb, { backgroundColor: selected.colour }]}>
            <Text style={s.orbIcon}>{playing ? '⏸' : '▶'}</Text>
          </Pressable>
          <View style={s.waveRow}>
            {bars.map((h, i) => (
              <View key={i} style={[s.waveBar, { height: playing ? 6 + h * 28 : 6, backgroundColor: selected.colour, opacity: playing ? (0.5 + h * 0.5) : 0.3 }]} />
            ))}
          </View>
          <Text style={s.hint}>{playing ? `♪ Now playing: ${selected.title}` : 'Tap ▶ to play'}</Text>
        </>
      )}
      <Pressable onPress={() => { void stop(); onScoreUpdate(50); onDone(100); }} style={({ pressed }) => [s.doneBtn, pressed && { opacity: 0.85 }]}>
        <Text style={s.doneBtnText}>Done listening ✓</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  hint: { fontFamily: F.medium, color: C.textSecondary, fontSize: 13, textAlign: 'center' },
  songCard: { flex: 1, borderRadius: 16, padding: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 4 },
  songCardActive: { borderWidth: 2.5, borderColor: '#5B21B6' },
  songTitle: { fontFamily: F.bold, fontSize: 10, color: '#1E1B4B', marginTop: 4, textAlign: 'center' },
  songDesc: { fontFamily: F.regular, fontSize: 8, color: '#3730A3', textAlign: 'center', marginTop: 2 },
  orb: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 8 },
  orbIcon: { fontSize: 28, color: '#fff' },
  waveRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 36 },
  waveBar: { width: 5, borderRadius: 3 },
  doneBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 14 },
  doneBtnText: { fontFamily: F.bold, color: '#7C3AED', fontSize: 13 },
});
