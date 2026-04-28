import React, { useCallback, useRef, useState } from 'react';
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

type Props = NativeStackScreenProps<HomeStackParamList, 'PatientRelaxing'>;
type BottomTab = 'Home' | 'Family' | 'Activity' | 'Search';

type RelaxCard = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  instructions: string;
};

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_SIDE_PADDING = 16;
const CARD_W = SCREEN_W - CARD_SIDE_PADDING * 2;

const relaxActivities: RelaxCard[] = [
  {
    id: 'music-listen',
    icon: '🎵',
    title: 'Listen & Feel',
    subtitle: 'Tune into calming music',
    instructions: 'Close your eyes and listen to the music in your mind. Let each note wash over you. There is nothing to do — just be.',
  },
  {
    id: 'nature-sounds',
    icon: '🌿',
    title: 'Nature Sounds',
    subtitle: 'Imagine a peaceful place',
    instructions: 'Picture a gentle stream or a quiet forest. Breathe slowly and imagine the sounds of nature around you.',
  },
  {
    id: 'hand-massage',
    icon: '🤲',
    title: 'Hand Massage',
    subtitle: 'Warm self-care for your hands',
    instructions: 'Rub your palms together gently to warm them. Then slowly massage each finger and the back of your hands.',
  },
  {
    id: 'gratitude',
    icon: '🌸',
    title: 'Gratitude Moment',
    subtitle: 'Think of three good things',
    instructions: 'Think of three things that made you smile today — big or small. Hold each one gently in your mind.',
  },
  {
    id: 'gentle-stretch',
    icon: '🌅',
    title: 'Gentle Stretch',
    subtitle: 'Easy stretches for comfort',
    instructions: 'Slowly reach your arms up, then out to the sides. Let gravity do the work — no forcing. Hold each position for a breath.',
  },
];

const Dot = ({ active }: { active: boolean }) => (
  <View style={[styles.dot, active && styles.dotActive]} />
);

// ─── Mini relaxing activities ──────────────────────────────────────────────────

// 1. Mood Check — pick how you feel, get a calming suggestion
function MusicListenActivity({ onDone }: { onDone: () => void }) {
  const moods = [
    { id: 'happy', icon: '😊', label: 'Happy', tip: 'Wonderful! Hum your favourite tune softly.' },
    { id: 'calm', icon: '😌', label: 'Calm', tip: 'Stay in this moment. Take a slow, deep breath.' },
    { id: 'tired', icon: '😴', label: 'Tired', tip: 'Rest your eyes for a moment. You deserve it.' },
    { id: 'anxious', icon: '😟', label: 'Anxious', tip: 'Breathe in for 4 counts, out for 6. You are safe.' },
  ];
  const [picked, setPicked] = useState<string | null>(null);
  const chosen = moods.find((m) => m.id === picked);
  const reset = () => setPicked(null);
  const pick = (id: string) => {
    setPicked(id);
    setTimeout(onDone, 2000);
  };
  return (
    <View style={styles.exContainer}>
      <Text style={styles.gameHint}>How are you feeling right now?</Text>
      <View style={styles.moodGrid}>
        {moods.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => pick(m.id)}
            style={[styles.moodBtn, picked === m.id && styles.moodBtnActive]}
          >
            <Text style={styles.moodIcon}>{m.icon}</Text>
            <Text style={styles.moodLabel}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
      {chosen && (
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>{chosen.tip}</Text>
        </View>
      )}
      {!picked && <Pressable onPress={reset} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}><Text style={styles.secondaryBtnText}>Restart</Text></Pressable>}
    </View>
  );
}

// 2. Breathing Bubble — expand / contract cycle
function NatureSoundsActivity({ onDone }: { onDone: () => void }) {
  type Phase = 'inhale' | 'hold' | 'exhale';
  const [phase, setPhase] = useState<Phase>('inhale');
  const [cycles, setCycles] = useState(0);
  const total = 4;
  const reset = () => { setPhase('inhale'); setCycles(0); };
  const advance = () => {
    if (phase === 'inhale') { setPhase('hold'); return; }
    if (phase === 'hold') { setPhase('exhale'); return; }
    const next = cycles + 1;
    setPhase('inhale');
    setCycles(next);
    if (next >= total) setTimeout(onDone, 300);
  };
  const bubbleSize = phase === 'inhale' ? 110 : phase === 'hold' ? 110 : 70;
  const bubbleColor = phase === 'inhale' ? '#C4B5FD' : phase === 'hold' ? '#A78BFA' : '#7C3AED';
  const phaseLabel = phase === 'inhale' ? 'Breathe In 😮‍💨' : phase === 'hold' ? 'Hold... ⏸' : 'Breathe Out 💨';
  const hint = phase === 'inhale' ? '4 counts' : phase === 'hold' ? '2 counts' : '6 counts';
  return (
    <View style={styles.exContainer}>
      <Text style={styles.gameHint}>Follow the bubble. Tap to advance.</Text>
      <Pressable onPress={advance} style={[styles.bubble, { width: bubbleSize, height: bubbleSize, borderRadius: bubbleSize / 2, backgroundColor: bubbleColor }]}>
        <Text style={styles.bubbleEmoji}>{phase === 'inhale' ? '🫧' : phase === 'hold' ? '⏸️' : '🌬️'}</Text>
      </Pressable>
      <Text style={styles.directionText}>{phaseLabel}</Text>
      <Text style={styles.gameHint}>{hint}</Text>
      <View style={styles.cycleRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.cycleDot, i < cycles && styles.cycleDotDone]} />
        ))}
      </View>
      <Pressable onPress={reset} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.secondaryBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

// 3. Hand Massage — timed steps with a visual progress bar
function HandMassageActivity({ onDone }: { onDone: () => void }) {
  const steps = [
    { label: 'Rub palms together', icon: '🤲' },
    { label: 'Massage right thumb', icon: '👍' },
    { label: 'Massage left thumb', icon: '👍' },
    { label: 'Gently squeeze each finger', icon: '✋' },
    { label: 'Stroke backs of both hands', icon: '🙌' },
  ];
  const [step, setStep] = useState(0);
  const done = step >= steps.length;
  const reset = () => setStep(0);
  const next = () => {
    const n = step + 1;
    setStep(n);
    if (n >= steps.length) setTimeout(onDone, 300);
  };
  const progress = Math.min(step / steps.length, 1);
  return (
    <View style={styles.exContainer}>
      <Text style={styles.gameHint}>Do each step slowly, then tap Next.</Text>
      {!done ? (
        <View style={styles.massageCard}>
          <Text style={{ fontSize: 40 }}>{steps[step].icon}</Text>
          <Text style={styles.massageLabel}>{steps[step].label}</Text>
        </View>
      ) : (
        <View style={styles.massageCard}>
          <Text style={{ fontSize: 40 }}>✅</Text>
          <Text style={styles.massageLabel}>Lovely work!</Text>
        </View>
      )}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
      </View>
      <Text style={styles.gameHint}>{step + (done ? 0 : 1)} / {steps.length}</Text>
      <Pressable onPress={next} disabled={done} style={({ pressed }) => [styles.bigTapBtn, { opacity: done ? 0.4 : 1 }, pressed && { opacity: 0.85 }]}>
        <Text style={styles.bigTapText}>Next →</Text>
      </Pressable>
      <Pressable onPress={reset} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.secondaryBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

// 4. Gratitude Jar — tap a card to reveal a prompt, then confirm
function GratitudeActivity({ onDone }: { onDone: () => void }) {
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
    setFlipped(next);
    if (next.length === cards.length) { setDone(true); setTimeout(onDone, 500); }
  };
  return (
    <View style={styles.exContainer}>
      <Text style={styles.gameHint}>Tap each jar to reveal a gratitude prompt.</Text>
      <View style={styles.jarRow}>
        {cards.map((c, i) => (
          <Pressable key={i} onPress={() => flip(i)} style={[styles.jarCard, flipped.includes(i) && styles.jarCardOpen]}>
            <Text style={{ fontSize: 22 }}>{flipped.includes(i) ? '🫙' : c.front}</Text>
            {flipped.includes(i) && <Text style={styles.jarPrompt}>{c.prompt}</Text>}
          </Pressable>
        ))}
      </View>
      {done && <Text style={styles.successText}>Beautiful thoughts! 🌸</Text>}
      <Pressable onPress={reset} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.secondaryBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

// 5. Body Scan — tap body parts from head to toe
function GentleStretchActivity({ onDone }: { onDone: () => void }) {
  const parts = [
    { id: 'head', icon: '🧠', label: 'Relax your forehead & jaw' },
    { id: 'shoulders', icon: '🫸', label: 'Drop your shoulders down' },
    { id: 'hands', icon: '🤲', label: 'Unclench your hands' },
    { id: 'belly', icon: '🫁', label: 'Let your belly soften' },
    { id: 'feet', icon: '🦶', label: 'Feel your feet on the floor' },
  ];
  const [step, setStep] = useState(0);
  const done = step >= parts.length;
  const reset = () => setStep(0);
  const next = () => {
    const n = step + 1;
    setStep(n);
    if (n >= parts.length) setTimeout(onDone, 300);
  };
  return (
    <View style={styles.exContainer}>
      <Text style={styles.gameHint}>Focus on each part, breathe, then tap Ready.</Text>
      {!done ? (
        <View style={styles.massageCard}>
          <Text style={{ fontSize: 44 }}>{parts[step].icon}</Text>
          <Text style={styles.massageLabel}>{parts[step].label}</Text>
        </View>
      ) : (
        <View style={styles.massageCard}>
          <Text style={{ fontSize: 44 }}>🌅</Text>
          <Text style={styles.massageLabel}>Fully relaxed. Well done!</Text>
        </View>
      )}
      <View style={styles.cycleRow}>
        {parts.map((_, i) => (
          <View key={i} style={[styles.cycleDot, i < step && styles.cycleDotDone]} />
        ))}
      </View>
      <Pressable onPress={next} disabled={done} style={({ pressed }) => [styles.bigTapBtn, { opacity: done ? 0.4 : 1 }, pressed && { opacity: 0.85 }]}>
        <Text style={styles.bigTapText}>Ready ✓</Text>
      </Pressable>
      <Pressable onPress={reset} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.secondaryBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

const RelaxModal = ({
  visible,
  activity,
  onClose,
}: {
  visible: boolean;
  activity: RelaxCard | null;
  onClose: () => void;
}) => {
  const body = (() => {
    if (!activity) return null;
    if (activity.id === 'music-listen') return <MusicListenActivity onDone={onClose} />;
    if (activity.id === 'nature-sounds') return <NatureSoundsActivity onDone={onClose} />;
    if (activity.id === 'hand-massage') return <HandMassageActivity onDone={onClose} />;
    if (activity.id === 'gratitude') return <GratitudeActivity onDone={onClose} />;
    if (activity.id === 'gentle-stretch') return <GentleStretchActivity onDone={onClose} />;
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
            <Text style={styles.modalIcon}>{activity?.icon ?? '🎵'}</Text>
          </View>
          <Text style={styles.modalTitle}>{activity?.title ?? 'Relax'}</Text>
          <View style={styles.gameArea}>{body}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export const PatientRelaxingScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab] = useState<BottomTab>('Activity');
  const [index, setIndex] = useState(0);
  const [playActivity, setPlayActivity] = useState<RelaxCard | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const { confirmedCaregiver } = useCaregiver();

  const onTabPress = (tab: BottomTab) => {
    if (tab === 'Home') navigation.navigate('PatientDashboard');
    if (tab === 'Family') navigation.navigate('PatientFamily');
    if (tab === 'Activity') navigation.navigate('PatientActivities');
    if (tab === 'Search') navigation.navigate('PatientDashboard');
  };

  const snapTo = useCallback((nextIdx: number) => {
    const clamped = Math.max(0, Math.min(nextIdx, relaxActivities.length - 1));
    scrollRef.current?.scrollTo({ x: clamped * SCREEN_W, animated: true });
    setIndex(clamped);
  }, []);

  const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / SCREEN_W);
    setIndex(Math.max(0, Math.min(next, relaxActivities.length - 1)));
  }, []);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <View style={styles.topRow}>
        <View style={styles.spacer} />
        <View style={styles.dots}>
          {relaxActivities.map((a, i) => <Dot key={a.id} active={i === index} />)}
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
        {relaxActivities.map((activity) => (
          <View key={activity.id} style={styles.page}>
            <View style={styles.card}>
              <View style={styles.cardIconBubble}>
                <Text style={styles.cardIcon}>{activity.icon}</Text>
              </View>
              <View style={styles.cardTextArea}>
                <Text style={styles.cardTitle}>{activity.title}</Text>
                <Text style={styles.cardSubtitle}>{activity.subtitle}</Text>
                <Text style={styles.cardInstructions}>{activity.instructions}</Text>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => {
                    const next = relaxActivities.findIndex((a) => a.id === activity.id) + 1;
                    snapTo(next);
                  }}
                  style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.skipBtnText}>Skip</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPlayActivity(activity)}
                  style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.primaryBtnText}>Begin</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <RelaxModal visible={playActivity !== null} activity={playActivity} onClose={() => setPlayActivity(null)} />

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
          <Pressable style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
            <Text style={styles.fabSymbol}>!</Text>
          </Pressable>
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
                <Text style={[styles.bottomLabel, isActive && styles.bottomLabelActive, isActive && tab === 'Activity' ? styles.bottomLabelActivityActive : null]}
                  numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
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
  topRow: { paddingTop: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spacer: { width: 80 },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: C.borderMid },
  dotActive: { backgroundColor: C.primary },
  carouselContent: { paddingBottom: 110, flexGrow: 1 },
  page: { width: SCREEN_W, paddingHorizontal: CARD_SIDE_PADDING, flex: 1, justifyContent: 'center', paddingTop: 8 },
  card: {
    width: CARD_W, borderRadius: 28, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border, paddingHorizontal: 20, paddingVertical: 18,
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 6 }, shadowRadius: 18, elevation: 6,
    minHeight: 320, justifyContent: 'space-between',
  },
  cardIconBubble: {
    width: 90, height: 90, borderRadius: 24, backgroundColor: '#EDE7F6',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 6,
  },
  cardIcon: { fontSize: 38 },
  cardTextArea: { alignItems: 'center', marginTop: 12 },
  cardTitle: { fontFamily: F.extraBold, fontSize: 26, color: C.textPrimary, textAlign: 'center' },
  cardSubtitle: { fontFamily: F.medium, fontSize: 13, color: C.textSecondary, marginTop: 6, textAlign: 'center' },
  cardInstructions: { fontFamily: F.regular, fontSize: 13, color: C.textBody, marginTop: 10, textAlign: 'center', lineHeight: 20 },
  cardActions: { marginTop: 18, alignItems: 'center', gap: 12 },
  skipBtn: { paddingVertical: 10, paddingHorizontal: 10 },
  skipBtnText: { fontFamily: F.bold, color: C.textMuted, fontSize: 13 },
  primaryBtn: {
    width: '100%', borderRadius: 999, backgroundColor: '#7C3AED',
    paddingVertical: 14, alignItems: 'center',
    shadowColor: '#7C3AED', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 8,
  },
  primaryBtnText: { fontFamily: F.extraBold, color: '#fff', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  modalSheet: {
    width: '100%', backgroundColor: C.bg, borderRadius: 28, paddingBottom: 22,
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 8 }, shadowRadius: 24, elevation: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 14 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontFamily: F.bold, fontSize: 15, color: C.textMuted },
  modalIconBubble: {
    width: 96, height: 96, borderRadius: 28, backgroundColor: '#EDE7F6',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 10, marginBottom: 14,
  },
  modalIcon: { fontSize: 42 },
  modalTitle: { fontFamily: F.extraBold, fontSize: 22, color: C.textPrimary, textAlign: 'center', paddingHorizontal: 18 },
  gameArea: { paddingHorizontal: 18, paddingBottom: 18 },
  gameHint: { fontFamily: F.medium, color: C.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  secondaryBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 14, marginTop: 12 },
  secondaryBtnText: { fontFamily: F.bold, color: '#7C3AED', fontSize: 13 },
  successText: { fontFamily: F.bold, color: '#7C3AED', textAlign: 'center', marginTop: 10 },
  exContainer: { alignItems: 'center', gap: 12 },
  countCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#EDE7F6',
    alignItems: 'center', justifyContent: 'center',
  },
  countNum: { fontFamily: F.extraBold, fontSize: 32, color: '#5B21B6' },
  countOf: { fontFamily: F.medium, fontSize: 12, color: '#7C3AED' },
  bigTapBtn: {
    backgroundColor: '#7C3AED', borderRadius: 999,
    paddingVertical: 14, paddingHorizontal: 40, marginTop: 4,
  },
  bigTapText: { fontFamily: F.extraBold, color: '#fff', fontSize: 16 },
  directionText: { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary, textAlign: 'center' },
  notesRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 8 },
  noteBtn: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: C.surface,
    borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center',
  },
  noteBtnActive: { backgroundColor: '#F5F3FF', borderColor: '#8B5CF6' },
  noteText: { fontSize: 28 },
  sceneRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  sceneBtn: {
    width: 100, borderRadius: 20, backgroundColor: C.surface, borderWidth: 2, borderColor: C.border,
    paddingVertical: 14, alignItems: 'center',
  },
  sceneBtnActive: { backgroundColor: '#F5F3FF', borderColor: '#8B5CF6' },
  sceneIcon: { fontSize: 30 },
  sceneLabel: { marginTop: 8, fontFamily: F.bold, color: C.textPrimary, fontSize: 12, textAlign: 'center' },
  // Mood grid
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 8 },
  moodBtn: { width: 72, borderRadius: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingVertical: 10, alignItems: 'center' },
  moodBtnActive: { backgroundColor: '#EDE7F6', borderColor: '#7C3AED' },
  moodIcon: { fontSize: 26 },
  moodLabel: { fontFamily: F.bold, color: C.textPrimary, fontSize: 11, marginTop: 4 },
  tipBox: { backgroundColor: '#EDE7F6', borderRadius: 16, padding: 12, marginTop: 8, marginHorizontal: 4 },
  tipText: { fontFamily: F.medium, fontSize: 13, color: '#5B21B6', textAlign: 'center', lineHeight: 20 },
  // Breathing bubble
  bubble: { alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  bubbleEmoji: { fontSize: 30 },
  cycleRow: { flexDirection: 'row', gap: 8, marginVertical: 6 },
  cycleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.borderMid },
  cycleDotDone: { backgroundColor: '#7C3AED' },
  // Massage / body-scan card
  massageCard: { backgroundColor: '#EDE7F6', borderRadius: 20, padding: 18, alignItems: 'center', gap: 8, marginVertical: 6, minWidth: 180 },
  massageLabel: { fontFamily: F.bold, fontSize: 14, color: '#5B21B6', textAlign: 'center' },
  // Progress bar
  progressBar: { width: '100%', height: 8, borderRadius: 4, backgroundColor: C.borderMid, overflow: 'hidden', marginVertical: 4 },
  progressFill: { height: '100%', backgroundColor: '#7C3AED', borderRadius: 4 },
  // Gratitude jar
  jarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 8 },
  jarCard: { width: 72, minHeight: 72, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', padding: 6 },
  jarCardOpen: { backgroundColor: '#EDE7F6', borderColor: '#7C3AED' },
  jarPrompt: { fontFamily: F.medium, fontSize: 9, color: '#5B21B6', textAlign: 'center', marginTop: 4, lineHeight: 13 },
  bottomBarBand: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 76,
    backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
    flexDirection: 'row', alignItems: 'flex-end', overflow: 'visible',
  },
  bottomBar: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingTop: 8, paddingBottom: 8 },
  bottomTab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, position: 'relative' },
  bottomTabIconWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 3, zIndex: 2 },
  activityActiveBg: { position: 'absolute', bottom: -2, width: 72, height: 72, borderRadius: 36, backgroundColor: 'transparent' },
  activityActiveBgShown: { backgroundColor: C.primary },
  bottomLabel: { fontFamily: F.medium, fontSize: 10, color: C.textMuted, letterSpacing: 0.3, zIndex: 2 },
  bottomLabelActive: { fontFamily: F.bold, color: C.primary },
  bottomLabelActivityActive: { color: C.primaryText },
  activeIndicator: { position: 'absolute', bottom: 0, width: 18, height: 2.5, borderRadius: 2, backgroundColor: C.primary },
  fabSlot: { width: 72, alignItems: 'center', justifyContent: 'flex-start', marginTop: -34 },
  fab: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.38, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 10,
    borderWidth: 3, borderColor: C.surface,
  },
  fabPressed: { transform: [{ scale: 0.95 }] },
  fabSymbol: { fontFamily: F.extraBold, color: C.primaryText, fontSize: 22 },
});
