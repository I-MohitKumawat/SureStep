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

type Props = NativeStackScreenProps<HomeStackParamList, 'PatientWorkout'>;
type BottomTab = 'Home' | 'Family' | 'Activity' | 'Search';

type WorkoutCard = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  instructions: string;
};

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_SIDE_PADDING = 16;
const CARD_W = SCREEN_W - CARD_SIDE_PADDING * 2;

const workouts: WorkoutCard[] = [
  {
    id: 'chair-march',
    icon: '🪑',
    title: 'Chair March',
    subtitle: 'March in place while seated',
    instructions: 'Sit tall in your chair. Lift your right knee, then your left — like marching. Keep a steady rhythm.',
  },
  {
    id: 'arm-circles',
    icon: '💪',
    title: 'Arm Circles',
    subtitle: 'Stretch and strengthen shoulders',
    instructions: 'Extend both arms out to the sides. Make slow, large circles forward, then backward. Feel the gentle stretch.',
  },
  {
    id: 'heel-raises',
    icon: '🦶',
    title: 'Heel Raises',
    subtitle: 'Strengthen calves and balance',
    instructions: 'Stand behind a chair and hold the back lightly. Slowly rise onto your toes, then lower back down. Repeat gently.',
  },
  {
    id: 'neck-rolls',
    icon: '🧘',
    title: 'Neck Rolls',
    subtitle: 'Release tension in neck',
    instructions: 'Sit comfortably. Slowly tilt your head to the right, roll it forward, then to the left. Move gently and smoothly.',
  },
  {
    id: 'deep-breath',
    icon: '🌬️',
    title: 'Deep Breathing',
    subtitle: 'Calm the body and mind',
    instructions: 'Breathe in through your nose for 4 counts, hold for 2, breathe out slowly for 6 counts. Repeat 5 times.',
  },
];

const Dot = ({ active }: { active: boolean }) => (
  <View style={[styles.dot, active && styles.dotActive]} />
);

// ─── Mini workout exercises ────────────────────────────────────────────────────

function ChairMarchExercise({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0);
  const target = 10;
  const reset = () => setCount(0);
  const tap = () => {
    const next = count + 1;
    setCount(next);
    if (next >= target) setTimeout(onDone, 300);
  };
  return (
    <View style={styles.exContainer}>
      <Text style={styles.gameHint}>Tap the button each time you lift a knee.</Text>
      <View style={styles.countCircle}>
        <Text style={styles.countNum}>{count}</Text>
        <Text style={styles.countOf}>/ {target}</Text>
      </View>
      <Pressable onPress={tap} style={({ pressed }) => [styles.bigTapBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.bigTapText}>🦵 Lift!</Text>
      </Pressable>
      <Pressable onPress={reset} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.secondaryBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

function ArmCirclesExercise({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'forward' | 'backward' | 'done'>('forward');
  const [reps, setReps] = useState(0);
  const target = 5;
  const reset = () => { setPhase('forward'); setReps(0); };
  const tap = () => {
    if (phase === 'done') return;
    const next = reps + 1;
    setReps(next);
    if (next >= target && phase === 'forward') { setPhase('backward'); setReps(0); return; }
    if (next >= target && phase === 'backward') { setPhase('done'); setTimeout(onDone, 300); }
  };
  return (
    <View style={styles.exContainer}>
      <Text style={styles.gameHint}>
        {phase === 'forward' ? '🔄 Circle FORWARD' : phase === 'backward' ? '🔃 Circle BACKWARD' : '✅ Done!'}
      </Text>
      <View style={styles.countCircle}>
        <Text style={styles.countNum}>{reps}</Text>
        <Text style={styles.countOf}>/ {target}</Text>
      </View>
      <Pressable onPress={tap} style={({ pressed }) => [styles.bigTapBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.bigTapText}>💪 Circle!</Text>
      </Pressable>
      <Pressable onPress={reset} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.secondaryBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

function HeelRaisesExercise({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0);
  const target = 8;
  const reset = () => setCount(0);
  const tap = () => {
    const next = count + 1;
    setCount(next);
    if (next >= target) setTimeout(onDone, 300);
  };
  return (
    <View style={styles.exContainer}>
      <Text style={styles.gameHint}>Tap each time you rise onto your toes.</Text>
      <View style={styles.countCircle}>
        <Text style={styles.countNum}>{count}</Text>
        <Text style={styles.countOf}>/ {target}</Text>
      </View>
      <Pressable onPress={tap} style={({ pressed }) => [styles.bigTapBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.bigTapText}>🦶 Rise!</Text>
      </Pressable>
      <Pressable onPress={reset} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.secondaryBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

function NeckRollsExercise({ onDone }: { onDone: () => void }) {
  const directions = ['Right ➡️', 'Forward ⬇️', 'Left ⬅️'];
  const [step, setStep] = useState(0);
  const [round, setRound] = useState(0);
  const totalRounds = 3;
  const reset = () => { setStep(0); setRound(0); };
  const tap = () => {
    if (step < directions.length - 1) { setStep(step + 1); return; }
    const nextRound = round + 1;
    setRound(nextRound);
    setStep(0);
    if (nextRound >= totalRounds) setTimeout(onDone, 300);
  };
  return (
    <View style={styles.exContainer}>
      <Text style={styles.gameHint}>Follow the direction, then tap Next.</Text>
      <View style={styles.countCircle}>
        <Text style={styles.countNum}>{round + 1}</Text>
        <Text style={styles.countOf}>/ {totalRounds}</Text>
      </View>
      <Text style={styles.directionText}>{directions[step]}</Text>
      <Pressable onPress={tap} style={({ pressed }) => [styles.bigTapBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.bigTapText}>Next →</Text>
      </Pressable>
      <Pressable onPress={reset} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.secondaryBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

function DeepBreathingExercise({ onDone }: { onDone: () => void }) {
  const [rep, setRep] = useState(0);
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const target = 5;
  const reset = () => { setRep(0); setPhase('in'); };
  const tap = () => {
    if (phase === 'in') { setPhase('hold'); return; }
    if (phase === 'hold') { setPhase('out'); return; }
    const next = rep + 1;
    setPhase('in');
    setRep(next);
    if (next >= target) setTimeout(onDone, 300);
  };
  const label = phase === 'in' ? '😮‍💨 Breathe In' : phase === 'hold' ? '⏸ Hold' : '💨 Breathe Out';
  return (
    <View style={styles.exContainer}>
      <Text style={styles.gameHint}>Follow the breathing guide. Tap to advance.</Text>
      <View style={styles.countCircle}>
        <Text style={styles.countNum}>{rep}</Text>
        <Text style={styles.countOf}>/ {target}</Text>
      </View>
      <Text style={styles.directionText}>{label}</Text>
      <Pressable onPress={tap} style={({ pressed }) => [styles.bigTapBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.bigTapText}>Tap</Text>
      </Pressable>
      <Pressable onPress={reset} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}>
        <Text style={styles.secondaryBtnText}>Restart</Text>
      </Pressable>
    </View>
  );
}

const StartModal = ({
  visible,
  workout,
  onClose,
}: {
  visible: boolean;
  workout: WorkoutCard | null;
  onClose: () => void;
}) => {
  const body = (() => {
    if (!workout) return null;
    if (workout.id === 'chair-march') return <ChairMarchExercise onDone={onClose} />;
    if (workout.id === 'arm-circles') return <ArmCirclesExercise onDone={onClose} />;
    if (workout.id === 'heel-raises') return <HeelRaisesExercise onDone={onClose} />;
    if (workout.id === 'neck-rolls') return <NeckRollsExercise onDone={onClose} />;
    if (workout.id === 'deep-breath') return <DeepBreathingExercise onDone={onClose} />;
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
            <Text style={styles.modalIcon}>{workout?.icon ?? '🏋️'}</Text>
          </View>
          <Text style={styles.modalTitle}>{workout?.title ?? 'Workout'}</Text>
          <View style={styles.gameArea}>{body}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export const PatientWorkoutScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab] = useState<BottomTab>('Activity');
  const [index, setIndex] = useState(0);
  const [playWorkout, setPlayWorkout] = useState<WorkoutCard | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const { confirmedCaregiver } = useCaregiver();

  const onTabPress = (tab: BottomTab) => {
    if (tab === 'Home') navigation.navigate('PatientDashboard');
    if (tab === 'Family') navigation.navigate('PatientFamily');
    if (tab === 'Activity') navigation.navigate('PatientActivities');
    if (tab === 'Search') navigation.navigate('PatientDashboard');
  };

  const snapTo = useCallback((nextIdx: number) => {
    const clamped = Math.max(0, Math.min(nextIdx, workouts.length - 1));
    scrollRef.current?.scrollTo({ x: clamped * SCREEN_W, animated: true });
    setIndex(clamped);
  }, []);

  const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / SCREEN_W);
    setIndex(Math.max(0, Math.min(next, workouts.length - 1)));
  }, []);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <View style={styles.topRow}>
        <View style={styles.spacer} />
        <View style={styles.dots}>
          {workouts.map((w, i) => <Dot key={w.id} active={i === index} />)}
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
        {workouts.map((workout) => (
          <View key={workout.id} style={styles.page}>
            <View style={styles.card}>
              <View style={styles.cardIconBubble}>
                <Text style={styles.cardIcon}>{workout.icon}</Text>
              </View>
              <View style={styles.cardTextArea}>
                <Text style={styles.cardTitle}>{workout.title}</Text>
                <Text style={styles.cardSubtitle}>{workout.subtitle}</Text>
                <Text style={styles.cardInstructions}>{workout.instructions}</Text>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => {
                    const next = workouts.findIndex((w) => w.id === workout.id) + 1;
                    snapTo(next);
                  }}
                  style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.skipBtnText}>Skip</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPlayWorkout(workout)}
                  style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.primaryBtnText}>Start Now</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <StartModal visible={playWorkout !== null} workout={playWorkout} onClose={() => setPlayWorkout(null)} />

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
    width: 90, height: 90, borderRadius: 24, backgroundColor: '#E8F5E9',
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
    width: '100%', borderRadius: 999, backgroundColor: '#4CAF50',
    paddingVertical: 14, alignItems: 'center',
    shadowColor: '#4CAF50', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 8,
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
    width: 96, height: 96, borderRadius: 28, backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 10, marginBottom: 14,
  },
  modalIcon: { fontSize: 42 },
  modalTitle: { fontFamily: F.extraBold, fontSize: 22, color: C.textPrimary, textAlign: 'center', paddingHorizontal: 18 },
  gameArea: { paddingHorizontal: 18, paddingBottom: 18 },
  gameHint: { fontFamily: F.medium, color: C.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  secondaryBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 14, marginTop: 12 },
  secondaryBtnText: { fontFamily: F.bold, color: '#4CAF50', fontSize: 13 },
  exContainer: { alignItems: 'center', gap: 12 },
  countCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center',
  },
  countNum: { fontFamily: F.extraBold, fontSize: 32, color: '#2E7D32' },
  countOf: { fontFamily: F.medium, fontSize: 12, color: '#558B2F' },
  bigTapBtn: {
    backgroundColor: '#4CAF50', borderRadius: 999,
    paddingVertical: 14, paddingHorizontal: 40, marginTop: 4,
  },
  bigTapText: { fontFamily: F.extraBold, color: '#fff', fontSize: 16 },
  directionText: { fontFamily: F.extraBold, fontSize: 20, color: C.textPrimary, textAlign: 'center' },
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
