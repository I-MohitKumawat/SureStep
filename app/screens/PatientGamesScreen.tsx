import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import { IconHome, IconFamily, IconActivity, IconSearch, IconProfile } from '../assets/icons/NavIcons';
import { useCaregiver } from '../context/caregiverContext';
import { AiFab } from '../components/AiFab';
import { Audio } from 'expo-av';

// ─── Play a tone pattern (for Sound Recall) ───────────────────────────────────
async function playPattern(pattern: { hz: number; dur: number }[]) {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
    let delay = 0;
    for (const { hz, dur } of pattern) {
      setTimeout(async () => {
        try {
          // Build single-note WAV inline
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

type Props = NativeStackScreenProps<HomeStackParamList, 'PatientGames'>;
type BottomTab = 'Home' | 'Family' | 'Activity' | 'Search';

type GameCard = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  instructions: string;
};

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_SIDE_PADDING = 16;
const CARD_W = SCREEN_W - CARD_SIDE_PADDING * 2;

const games: GameCard[] = [
  {
    id: 'memory-match',
    icon: '🃏',
    title: 'Memory Match',
    subtitle: 'Flip and find pairs',
    instructions: 'Tap two cards to flip them. If they match, they stay open. Try to find all pairs.',
  },
  {
    id: 'picture-puzzle',
    icon: '🧩',
    title: 'Picture Puzzle',
    subtitle: 'Complete the image',
    instructions: 'Drag simple pieces into place to complete the picture. Take it slow—there is no timer.',
  },
  {
    id: 'word-finder',
    icon: '🔤',
    title: 'Word Finder',
    subtitle: 'Find familiar words',
    instructions: 'Scan the letters and tap highlighted words. Start with short words and build confidence.',
  },
  {
    id: 'color-sort',
    icon: '🎨',
    title: 'Color Sort',
    subtitle: 'Sort by color',
    instructions: 'Drag items into the matching color box. This helps attention and hand–eye coordination.',
  },
  {
    id: 'sound-recall',
    icon: '🔔',
    title: 'Sound Recall',
    subtitle: 'Listen and choose',
    instructions: 'Listen to a sound and pick the matching picture. Repeat as needed—no pressure.',
  },
];

const Dot = ({ active }: { active: boolean }) => (
  <View style={[styles.dot, active && styles.dotActive]} />
);

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Mini games (simple, dementia-friendly) ───────────────────────────────────
type MemoryTile = { id: string; value: string; revealed: boolean; matched: boolean };
function MemoryMatchGame({ onDone }: { onDone: () => void }) {
  const [tiles, setTiles] = useState<MemoryTile[]>(() => {
    const values = ['🍎', '🍌', '🍇', '🍊', '🍎', '🍌', '🍇', '🍊'];
    return shuffle(values).map((v, i) => ({ id: `t_${i}_${v}`, value: v, revealed: false, matched: false }));
  });
  const [lock, setLock] = useState(false);
  const [moves, setMoves] = useState(0);

  const matched = tiles.filter((t) => t.matched).length / 2;
  const total   = tiles.length / 2;

  const reset = () => {
    const values = ['🍎', '🍌', '🍇', '🍊', '🍎', '🍌', '🍇', '🍊'];
    setTiles(shuffle(values).map((v, i) => ({ id: `t_${i}_${v}`, value: v, revealed: false, matched: false })));
    setMoves(0);
  };

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
          const matched = next.map((x) => (x.id === a.id || x.id === b.id) ? { ...x, matched: true } : x);
          if (matched.every((x) => x.matched)) setTimeout(onDone, 250);
          return matched;
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
      <View style={styles.scoreBadgeRow}>
        <View style={styles.scoreBadge}><Text style={styles.scoreBadgeText}>🃏 Pairs: {matched}/{total}</Text></View>
        <View style={styles.scoreBadge}><Text style={styles.scoreBadgeText}>👆 Moves: {moves}</Text></View>
      </View>
      <Text style={styles.gameHint}>Find all matching pairs!</Text>
      <View style={styles.grid}>
        {tiles.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => onTap(t.id)}
            style={({ pressed }) => [
              styles.tile,
              (t.revealed || t.matched) && styles.tileOpen,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.tileText}>{(t.revealed || t.matched) ? t.value : '❓'}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={reset} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.secondaryBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

function PicturePuzzleGame({ onDone }: { onDone: () => void }) {
  const [order, setOrder] = useState<number[]>(() => shuffle([1, 2, 3, 4]));
  const [picked, setPicked] = useState<number | null>(null);
  const [moves, setMoves]   = useState(0);

  const reset = () => { setOrder(shuffle([1, 2, 3, 4])); setPicked(null); setMoves(0); };

  const tap = (idx: number) => {
    if (picked === null) { setPicked(idx); return; }
    if (picked === idx)  { setPicked(null); return; }
    setMoves((m) => m + 1);
    setOrder((prev) => {
      const next = [...prev];
      [next[picked], next[idx]] = [next[idx], next[picked]];
      if (next.join(',') === '1,2,3,4') setTimeout(onDone, 250);
      return next;
    });
    setPicked(null);
  };

  const isSolved = order.join(',') === '1,2,3,4';
  return (
    <View>
      <View style={styles.scoreBadgeRow}>
        <View style={styles.scoreBadge}><Text style={styles.scoreBadgeText}>{isSolved ? '✅ Solved!' : '🔢 Arrange 1→4'}</Text></View>
        <View style={styles.scoreBadge}><Text style={styles.scoreBadgeText}>🔄 Swaps: {moves}</Text></View>
      </View>
      <Text style={styles.gameHint}>Tap two tiles to swap. Arrange in order.</Text>
      <View style={styles.puzzleGrid}>
        {order.map((n, idx) => (
          <Pressable
            key={`${n}_${idx}`}
            onPress={() => tap(idx)}
            style={({ pressed }) => [
              styles.puzzleTile,
              picked === idx && styles.puzzlePicked,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text style={styles.puzzleText}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={reset} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.secondaryBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

function WordFinderGame({ onDone }: { onDone: () => void }) {
  const target = 'HOME';
  const letters = ['H', 'O', 'M', 'E', 'A', 'T', 'S', 'R'];
  const [progress, setProgress] = useState('');

  const reset = () => setProgress('');

  const tap = (ch: string) => {
    const next = (progress + ch).slice(0, target.length);
    const shouldBe = target.slice(0, next.length);
    if (next !== shouldBe) {
      setProgress('');
      return;
    }
    setProgress(next);
    if (next === target) setTimeout(onDone, 250);
  };

  return (
    <View>
      <View style={styles.scoreBadgeRow}>
        <View style={styles.scoreBadge}><Text style={styles.scoreBadgeText}>📝 {progress.length}/{target.length} letters</Text></View>
        {progress === target && <View style={[styles.scoreBadge, { backgroundColor: '#D1FAE5' }]}><Text style={[styles.scoreBadgeText, { color: '#065F46' }]}>🎉 Correct!</Text></View>}
      </View>
      <Text style={styles.gameHint}>Tap letters in order to spell: <Text style={{ color: C.primary }}>{target}</Text></Text>
      <View style={styles.lettersRow}>
        {letters.map((ch) => (
          <Pressable key={ch} onPress={() => tap(ch)} style={({ pressed }) => [styles.letterBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.letterText}>{ch}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.progressPill}>
        <Text style={styles.progressText}>{progress.padEnd(target.length, '•')}</Text>
      </View>
      <Pressable onPress={reset} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.secondaryBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

function ColorSortGame({ onDone }: { onDone: () => void }) {
  const items = useMemo(() => shuffle([
    { id: 'r1', color: '#EF4444', label: 'Red' },
    { id: 'g1', color: '#22C55E', label: 'Green' },
    { id: 'b1', color: '#3B82F6', label: 'Blue' },
  ]), []);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);

  const reset = () => {
    setIdx(0);
    setScore(0);
  };

  const pick = (label: string) => {
    const current = items[idx];
    const nextScore = score + (current?.label === label ? 1 : 0);
    const nextIdx = idx + 1;
    setScore(nextScore);
    setIdx(nextIdx);
    if (nextIdx >= items.length) setTimeout(onDone, 250);
  };

  const current = items[idx];
  const done = idx >= items.length;
  return (
    <View>
      <View style={styles.scoreBadgeRow}>
        <View style={styles.scoreBadge}><Text style={styles.scoreBadgeText}>⭐ Score: {score}/{items.length}</Text></View>
        <View style={styles.scoreBadge}><Text style={styles.scoreBadgeText}>{done ? 'Done! 🎉' : `Q ${idx + 1}/${items.length}`}</Text></View>
      </View>
      <Text style={styles.gameHint}>What colour is the dot?</Text>
      <View style={styles.sortItem}>
        <View style={[styles.colorDot, { backgroundColor: current?.color ?? C.borderMid, width: 44, height: 44, borderRadius: 22 }]} />
      </View>
      <View style={styles.sortRow}>
        {['Red', 'Green', 'Blue'].map((l) => (
          <Pressable key={l} onPress={() => pick(l)} disabled={done} style={({ pressed }) => [styles.sortBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.sortBtnText}>{l}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={reset} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.secondaryBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

// ─── Sound patterns for each clue ────────────────────────────────────────────
const SOUND_PATTERNS: Record<string, { hz: number; dur: number }[]> = {
  doorbell: [{ hz: 587, dur: 0.25 }, { hz: 392, dur: 0.35 }],          // ding-dong
  phone:    [{ hz: 659, dur: 0.1 }, { hz: 659, dur: 0.1 }, { hz: 659, dur: 0.1 }, { hz: 659, dur: 0.1 }], // ring ring
  alarm:    [{ hz: 880, dur: 0.15 }, { hz: 440, dur: 0.15 }, { hz: 880, dur: 0.15 }, { hz: 440, dur: 0.15 }], // wee-woo
};

const RECALL_ROUNDS = [
  { clue: 'Doorbell', answer: 'doorbell', sound: 'doorbell', choices: [{ id: 'doorbell', icon: '🔔', label: 'Doorbell' }, { id: 'phone', icon: '📞', label: 'Phone' }, { id: 'alarm', icon: '⏰', label: 'Alarm' }] },
  { clue: 'Phone ringing', answer: 'phone', sound: 'phone', choices: [{ id: 'doorbell', icon: '🔔', label: 'Doorbell' }, { id: 'phone', icon: '📞', label: 'Phone' }, { id: 'alarm', icon: '⏰', label: 'Alarm' }] },
  { clue: 'Alarm clock',  answer: 'alarm', sound: 'alarm', choices: [{ id: 'doorbell', icon: '🔔', label: 'Doorbell' }, { id: 'phone', icon: '📞', label: 'Phone' }, { id: 'alarm', icon: '⏰', label: 'Alarm' }] },
];

function SoundRecallGame({ onDone }: { onDone: () => void }) {
  const [round, setRound]       = useState(0);
  const [score, setScore]       = useState(0);
  const [feedback, setFeedback] = useState<null | 'correct' | 'wrong'>(null);

  const reset = () => { setRound(0); setScore(0); setFeedback(null); };

  const playClue = () => {
    const r = RECALL_ROUNDS[round];
    if (r) void playPattern(SOUND_PATTERNS[r.sound] ?? []);
  };

  const choose = (id: string) => {
    if (feedback) return;
    const correct = RECALL_ROUNDS[round]?.answer === id;
    setScore((s) => s + (correct ? 1 : 0));
    setFeedback(correct ? 'correct' : 'wrong');
    setTimeout(() => {
      const nextRound = round + 1;
      setFeedback(null);
      if (nextRound >= RECALL_ROUNDS.length) { setTimeout(onDone, 200); return; }
      setRound(nextRound);
    }, 700);
  };

  const current = RECALL_ROUNDS[round];
  return (
    <View>
      <View style={styles.scoreBadgeRow}>
        <View style={styles.scoreBadge}><Text style={styles.scoreBadgeText}>⭐ Score: {score}/{RECALL_ROUNDS.length}</Text></View>
        <View style={styles.scoreBadge}><Text style={styles.scoreBadgeText}>Round {round + 1}/{RECALL_ROUNDS.length}</Text></View>
      </View>
      <Text style={styles.gameHint}>Listen, then pick the matching picture.</Text>
      {/* Play sound button */}
      <Pressable onPress={playClue} style={({ pressed }) => [styles.listenBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.listenBtnIcon}>🔊</Text>
        <Text style={styles.listenBtnText}>Play: {current?.clue}</Text>
      </Pressable>
      <View style={styles.choiceRow}>
        {current?.choices.map((c) => (
          <Pressable key={c.id} onPress={() => choose(c.id)} style={({ pressed }) => [styles.choiceBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.choiceIcon}>{c.icon}</Text>
            <Text style={styles.choiceText}>{c.label}</Text>
          </Pressable>
        ))}
      </View>
      {feedback === 'correct' && <Text style={styles.successText}>✅ Correct!</Text>}
      {feedback === 'wrong'   && <Text style={[styles.successText, { color: '#EF4444' }]}>❌ Try again!</Text>}
      <Pressable onPress={reset} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.secondaryBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

const PlayModal = ({
  visible,
  game,
  onClose,
}: {
  visible: boolean;
  game: GameCard | null;
  onClose: () => void;
}) => {
  const body = (() => {
    if (!game) return null;
    if (game.id === 'memory-match') return <MemoryMatchGame onDone={onClose} />;
    if (game.id === 'picture-puzzle') return <PicturePuzzleGame onDone={onClose} />;
    if (game.id === 'word-finder') return <WordFinderGame onDone={onClose} />;
    if (game.id === 'color-sort') return <ColorSortGame onDone={onClose} />;
    if (game.id === 'sound-recall') return <SoundRecallGame onDone={onClose} />;
    return null;
  })();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Pressable onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.modalIconBubble}>
            <Text style={styles.modalIcon}>{game?.icon ?? '🎮'}</Text>
          </View>
          <Text style={styles.modalTitle}>{game?.title ?? 'Game'}</Text>

          <View style={styles.gameArea}>
            {body}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export const PatientGamesScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab] = useState<BottomTab>('Activity');
  const [index, setIndex] = useState(0);
  const [playGame, setPlayGame] = useState<GameCard | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  const { confirmedCaregiver } = useCaregiver();

  const onTabPress = (tab: BottomTab) => {
    // All tabs are rendered inline in PatientRoleScreen — navigate back to it
    if (tab === 'Home')     navigation.navigate('PatientDashboard');
    if (tab === 'Family')   navigation.navigate('PatientDashboard', { initialTab: 'Family' } as any);
    if (tab === 'Activity') navigation.navigate('PatientDashboard', { initialTab: 'Activity' } as any);
    if (tab === 'Search')   navigation.navigate('PatientDashboard', { initialTab: 'Search' } as any);
  };

  const snapTo = useCallback((nextIdx: number) => {
    const clamped = Math.max(0, Math.min(nextIdx, games.length - 1));
    scrollRef.current?.scrollTo({ x: clamped * SCREEN_W, animated: true });
    setIndex(clamped);
  }, []);

  const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / SCREEN_W);
    setIndex(Math.max(0, Math.min(next, games.length - 1)));
  }, []);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <View style={styles.topRow}>
        <View style={styles.spacer} />
        <View style={styles.dots}>
          {games.map((g, i) => <Dot key={g.id} active={i === index} />)}
        </View>
      </View>

      <ScrollView
        ref={(r) => { scrollRef.current = r; }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        contentContainerStyle={styles.carouselContent}
      >
        {games.map((game) => (
          <View key={game.id} style={styles.page}>
            <View style={styles.card}>
              <View style={styles.cardIconBubble}>
                <Text style={styles.cardIcon}>{game.icon}</Text>
              </View>

              <View style={styles.cardTextArea}>
                <Text style={styles.cardTitle}>{game.title}</Text>
                <Text style={styles.cardSubtitle}>{game.subtitle}</Text>
              </View>

              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => {
                    const next = games.findIndex((g) => g.id === game.id) + 1;
                    snapTo(next);
                  }}
                  style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.skipBtnText}>Skip</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPlayGame(game)}
                  style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.primaryBtnText}>Play Now</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <PlayModal visible={playGame !== null} game={playGame} onClose={() => setPlayGame(null)} />

      <View style={styles.bottomBarBand}>
        <View style={styles.bottomBar}>
          {(['Home', 'Family'] as BottomTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent = tab === 'Home' ? IconHome : IconFamily;
            return (
              <Pressable key={tab} onPress={() => onTabPress(tab)} style={styles.bottomTab}>
                <View style={styles.bottomTabIconWrap}>
                  <IconComponent size={24} color={isActive ? C.primary : C.textMuted} strokeWidth={isActive ? 2.2 : 1.8} />
                </View>
                <Text style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}>{tab}</Text>
                {isActive ? <View style={styles.activeIndicator} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.fabSlot}>
          <AiFab />
        </View>

        <View style={styles.bottomBar}>
          {(['Activity', 'Search'] as BottomTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent =
              tab === 'Search' && confirmedCaregiver ? IconProfile : tab === 'Activity' ? IconActivity : IconSearch;
            const label =
              tab === 'Search' && confirmedCaregiver
                ? confirmedCaregiver.name.split(' ')[0]
                : tab;
            return (
              <Pressable key={tab} onPress={() => onTabPress(tab)} style={styles.bottomTab}>
                <View style={[styles.activityActiveBg, isActive && tab === 'Activity' ? styles.activityActiveBgShown : null]} />
                <View style={styles.bottomTabIconWrap}>
                  <IconComponent size={24} color={isActive && tab === 'Activity' ? C.primaryText : isActive ? C.primary : C.textMuted} strokeWidth={isActive ? 2.2 : 1.8} />
                </View>
                <Text style={[
                  styles.bottomLabel,
                  isActive && styles.bottomLabelActive,
                  isActive && tab === 'Activity' ? styles.bottomLabelActivityActive : null,
                ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >{label}</Text>
                {isActive && tab !== 'Activity' ? <View style={styles.activeIndicator} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },

  topRow: {
    paddingTop: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spacer: { width: 80 },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: C.borderMid },
  dotActive: { backgroundColor: C.primary },

  carouselContent: { paddingBottom: 110, flexGrow: 1 },
  page: { width: SCREEN_W, paddingHorizontal: CARD_SIDE_PADDING, flex: 1, justifyContent: 'center', paddingTop: 8 },
  card: {
    width: CARD_W,
    borderRadius: 28,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    elevation: 6,
    minHeight: 280,
    justifyContent: 'space-between',
  },
  cardIconBubble: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 6,
  },
  cardIcon: { fontSize: 38 },
  cardTextArea: { alignItems: 'center', marginTop: 12 },
  cardTitle: { fontFamily: F.extraBold, fontSize: 26, color: C.textPrimary, textAlign: 'center' },
  cardSubtitle: { fontFamily: F.medium, fontSize: 13, color: C.textSecondary, marginTop: 6, textAlign: 'center' },

  cardActions: {
    marginTop: 18,
    alignItems: 'center',
    gap: 12,
  },
  skipBtn: { paddingVertical: 10, paddingHorizontal: 10 },
  skipBtnText: { fontFamily: F.bold, color: C.textMuted, fontSize: 13 },
  primaryBtn: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: C.primary,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 8,
  },
  primaryBtnText: { fontFamily: F.extraBold, color: C.primaryText, fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  modalSheet: {
    width: '100%',
    backgroundColor: C.bg,
    borderRadius: 28,
    paddingBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 14 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontFamily: F.bold, fontSize: 15, color: C.textMuted },
  modalIconBubble: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  modalIcon: { fontSize: 42 },
  modalTitle: { fontFamily: F.extraBold, fontSize: 22, color: C.textPrimary, textAlign: 'center', paddingHorizontal: 18 },
  gameArea: { paddingHorizontal: 18, paddingBottom: 18 },

  // Score badges
  scoreBadgeRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 10 },
  scoreBadge: { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  scoreBadgeText: { fontFamily: F.bold, fontSize: 12, color: C.primaryDark },

  // Game shared UI
  gameHint: { fontFamily: F.medium, color: C.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  secondaryBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 14, marginTop: 12 },
  secondaryBtnText: { fontFamily: F.bold, color: C.primary, fontSize: 13 },
  successText: { fontFamily: F.bold, color: C.primary, textAlign: 'center', marginTop: 10 },

  // Memory match
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  tile: {
    width: 78,
    height: 64,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileOpen: { backgroundColor: C.primaryLight, borderColor: C.primary },
  tileText: { fontSize: 22 },

  // Puzzle
  puzzleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  puzzleTile: {
    width: 78,
    height: 64,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puzzlePicked: { borderColor: C.primary, backgroundColor: C.primaryLight },
  puzzleText: { fontFamily: F.extraBold, fontSize: 20, color: C.primaryDark },

  // Word finder
  lettersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  letterBtn: { width: 56, height: 48, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  letterText: { fontFamily: F.extraBold, color: C.textPrimary, fontSize: 16 },
  progressPill: { alignSelf: 'center', backgroundColor: C.primaryLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, marginTop: 12 },
  progressText: { fontFamily: F.bold, color: C.primaryDark, letterSpacing: 3 },

  // Color sort
  sortItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 },
  colorDot: { width: 22, height: 22, borderRadius: 11 },
  sortRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  sortBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  sortBtnText: { fontFamily: F.bold, color: C.primaryDark, fontSize: 13 },

  // Sound recall
  choiceRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  choiceBtn: { width: 88, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingVertical: 12, alignItems: 'center' },
  choiceIcon: { fontSize: 26 },
  choiceText: { marginTop: 6, fontFamily: F.bold, color: C.textPrimary, fontSize: 13 },

  // Sound Recall listen button
  listenBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.primaryLight, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18,
    marginBottom: 12, alignSelf: 'center',
    borderWidth: 1.5, borderColor: C.primary,
  },
  listenBtnIcon: { fontSize: 20 },
  listenBtnText: { fontFamily: F.bold, fontSize: 14, color: C.primaryDark },

  // Footer (copied from PatientActivitiesScreen)
  bottomBarBand: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 76,
    backgroundColor: C.surface,
    borderTopWidth: 1, borderTopColor: C.border,
    flexDirection: 'row',
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  bottomBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 8,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  bottomTabIconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    zIndex: 2,
  },
  activityActiveBg: {
    position: 'absolute',
    bottom: -2,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'transparent',
  },
  activityActiveBgShown: { backgroundColor: C.primary },
  bottomLabel: { fontFamily: F.medium, fontSize: 10, color: C.textMuted, letterSpacing: 0.3, zIndex: 2 },
  bottomLabelActive: { fontFamily: F.bold, color: C.primary },
  bottomLabelActivityActive: { color: C.primaryText },
  activeIndicator: {
    position: 'absolute', bottom: 0,
    width: 18, height: 2.5, borderRadius: 2,
    backgroundColor: C.primary,
  },
  fabSlot: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -40,
  },
  fab: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.38, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 10,
    borderWidth: 3, borderColor: C.surface,
  },
  fabPressed: { transform: [{ scale: 0.95 }] },
  fabSymbol: { fontFamily: F.extraBold, color: C.primaryText, fontSize: 22 },
});

