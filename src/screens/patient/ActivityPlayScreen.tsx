import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
// Navigation types migrated to src/types/navigation.types.ts
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { getActivityById, recordSession, type Activity } from '../../activities/activityData';

// Import game/exercise implementations from src/games and src/activities
import { MemoryMatchGame }       from '../../games/MemoryMatchGame';
import { PicturePuzzleGame }     from '../../games/PicturePuzzleGame';
import { WordFinderGame }        from '../../games/WordFinderGame';
import { MusicListenActivity }   from '../../activities/relaxing/MusicListenActivity';
import { NatureSoundsActivity }  from '../../activities/relaxing/NatureSoundsActivity';
import { GratitudeActivity }     from '../../activities/relaxing/GratitudeActivity';
import { ChairMarchExercise }    from '../../activities/workout/ChairMarchExercise';
import { ArmCirclesExercise }    from '../../activities/workout/ArmCirclesExercise';
import { NeckRollsExercise }     from '../../activities/workout/NeckRollsExercise';
import type { PatientStackParams } from '../../types/navigation.types';

type Props = NativeStackScreenProps<PatientStackParams, 'ActivityPlayScreen'>;

// â”€â”€â”€ HUD (top bar during gameplay) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function HUD({
  activity, score, maxScore, timeLeft, totalTime, paused, onPause, onExit,
}: {
  activity: Activity; score: number; maxScore: number;
  timeLeft: number; totalTime: number; paused: boolean;
  onPause: () => void; onExit: () => void;
}) {
  const pct       = totalTime > 0 ? Math.max(0, timeLeft / totalTime) : 1;
  const timeColor = timeLeft <= 30 ? '#EF4444' : timeLeft <= 60 ? '#F59E0B' : C.primary;

  return (
    <View style={hud.container}>
      {/* Top row: exit — title — pause */}
      <View style={hud.topRow}>
        <Pressable onPress={onExit} style={hud.iconBtn} hitSlop={10}>
          <Text style={hud.iconBtnText}>❌</Text>
        </Pressable>
        <Text style={hud.title} numberOfLines={1}>{activity.title}</Text>
        <Pressable onPress={onPause} style={hud.iconBtn} hitSlop={10}>
          <Text style={hud.iconBtnText}>{paused ? 'â–¶' : 'â¸'}</Text>
        </Pressable>
      </View>

      {/* Timer progress bar */}
      <View style={hud.bar}>
        <View style={[hud.barFill, { width: `${pct * 100}%` as any, backgroundColor: timeColor }]} />
      </View>

      {/* Score + timer */}
      <View style={hud.statsRow}>
        <View style={hud.scoreBox}>
          <Text style={hud.scoreLabel}>Score</Text>
          <Text style={hud.scoreVal}>{score}</Text>
        </View>
        <View style={[hud.timerBox, { borderColor: timeColor }]}>
          <Text style={[hud.timerText, { color: timeColor }]}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const hud = StyleSheet.create({
  container: {
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 3,
  },
  topRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconBtn:      { width: 34, height: 34, borderRadius: 17, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  iconBtnText:  { fontSize: 14, color: C.textPrimary },
  title:        { flex: 1, fontFamily: F.extraBold, fontSize: 16, color: C.textPrimary, textAlign: 'center', marginHorizontal: 8 },
  bar:          { height: 6, borderRadius: 3, backgroundColor: C.border, overflow: 'hidden', marginBottom: 10 },
  barFill:      { height: '100%', borderRadius: 3 },
  statsRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreBox:     { alignItems: 'center' },
  scoreLabel:   { fontFamily: F.medium, fontSize: 10, color: C.textMuted },
  scoreVal:     { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary },
  timerBox:     { borderWidth: 2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  timerText:    { fontFamily: F.extraBold, fontSize: 16 },
});

// â”€â”€â”€ Result overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ResultOverlay({
  score, onRestart, onExit,
}: {
  score: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1, useNativeDriver: true, tension: 60, friction: 8,
    }).start();
  }, [scaleAnim]);

  return (
    <Modal transparent animationType="fade" visible>
      <View style={res.overlay}>
        <Animated.View style={[res.card, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={res.emoji}>🎉</Text>
          <Text style={res.heading}>Amazing Work!</Text>
          <View style={res.scoreBox}>
            <Text style={res.scoreNum}>{score}</Text>
            <Text style={res.scoreLabel}>Your Score</Text>
          </View>
          {/* Single restart button */}
          <Pressable onPress={onRestart} style={res.restartBtn}>
            <Text style={res.restartText}>â†º  Play Again</Text>
          </Pressable>
          <Pressable onPress={onExit} style={res.exitBtn}>
            <Text style={res.exitText}>â† Back to Activities</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const res = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card:        { width: '100%', backgroundColor: C.surface, borderRadius: 28, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 8 }, shadowRadius: 24, elevation: 20 },
  emoji:       { fontSize: 60, marginBottom: 10 },
  heading:     { fontFamily: F.extraBold, fontSize: 28, color: C.textPrimary, marginBottom: 18 },
  scoreBox:    { backgroundColor: C.primaryLight, borderRadius: 20, paddingHorizontal: 32, paddingVertical: 16, alignItems: 'center', marginBottom: 24 },
  scoreNum:    { fontFamily: F.extraBold, fontSize: 44, color: C.primary },
  scoreLabel:  { fontFamily: F.medium, fontSize: 13, color: C.primary, marginTop: 2 },
  restartBtn:  { width: '100%', backgroundColor: C.primary, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  restartText: { fontFamily: F.extraBold, color: '#fff', fontSize: 16 },
  exitBtn:     { paddingVertical: 10 },
  exitText:    { fontFamily: F.bold, color: C.textSecondary, fontSize: 14 },
});

// â”€â”€â”€ Pause overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PauseOverlay({ onResume, onExit }: { onResume: () => void; onExit: () => void }) {
  return (
    <Modal transparent animationType="fade" visible>
      <View style={pause.overlay}>
        <View style={pause.card}>
          <Text style={pause.emoji}>â¸</Text>
          <Text style={pause.title}>Paused</Text>
          <Text style={pause.hint}>Take a breath — you're doing great!</Text>
          <Pressable onPress={onResume} style={pause.resumeBtn}>
            <Text style={pause.resumeText}>â–¶  Resume</Text>
          </Pressable>
          <Pressable onPress={onExit} style={pause.exitBtn}>
            <Text style={pause.exitText}>Exit Activity</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const pause = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card:       { width: '100%', backgroundColor: C.surface, borderRadius: 24, padding: 28, alignItems: 'center' },
  emoji:      { fontSize: 40, marginBottom: 6 },
  title:      { fontFamily: F.extraBold, fontSize: 24, color: C.textPrimary, marginBottom: 6 },
  hint:       { fontFamily: F.medium, fontSize: 14, color: C.textSecondary, marginBottom: 24, textAlign: 'center' },
  resumeBtn:  { width: '100%', backgroundColor: C.primary, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  resumeText: { fontFamily: F.extraBold, color: '#fff', fontSize: 16 },
  exitBtn:    { paddingVertical: 10 },
  exitText:   { fontFamily: F.bold, color: '#EF4444', fontSize: 14 },
});

// â”€â”€â”€ Main screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const ActivityPlayScreen: React.FC<Props> = ({ navigation, route }) => {
  const { activityId } = route.params;
  const activity = getActivityById(activityId);

  const TOTAL_TIME = (activity?.durationMin ?? 5) * 60;
  const MAX_SCORE  = 100;

  const [score,      setScore]      = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(TOTAL_TIME);
  const [paused,     setPaused]     = useState(false);
  const [result,     setResult]     = useState<'none' | 'done'>('none');
  const [restartKey, setRestartKey] = useState(0);
  const startRef = useRef(Date.now());

  // Countdown timer
  useEffect(() => {
    if (paused || result !== 'none') return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); setResult('done'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [paused, result, restartKey]);

  const handleDone = useCallback((finalScore?: number) => {
    const s = finalScore ?? score;
    const elapsed = Math.round((Date.now() - startRef.current) / 1000);
    recordSession({ activityId, score: s, xpEarned: 0, completed: true, durationSec: elapsed });
    setScore(s);
    setResult('done');
  }, [activityId, score]);

  const handleScoreUpdate = useCallback((pts: number) => {
    setScore((s) => Math.min(s + pts, MAX_SCORE));
  }, []);

  const restart = () => {
    setScore(0);
    setTimeLeft(TOTAL_TIME);
    setPaused(false);
    setResult('none');
    startRef.current = Date.now();
    setRestartKey((k) => k + 1);
  };

  // "Back to Activities" goes back to patient home screen with Activity tab preselected
  const exitToActivities = () => navigation.navigate('PatientHomeScreen', { initialTab: 'Activity' });

  if (!activity) {
    return (
      <ScreenContainer edges={['top']} style={{ backgroundColor: C.bg }}>
        <Text style={{ padding: 24, color: C.textBody }}>Activity not found.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {/* HUD */}
      <HUD
        activity={activity}
        score={score}
        maxScore={MAX_SCORE}
        timeLeft={timeLeft}
        totalTime={TOTAL_TIME}
        paused={paused}
        onPause={() => setPaused((p) => !p)}
        onExit={exitToActivities}
      />

      {/* Game content */}
      <ScrollView contentContainerStyle={styles.gameContent} showsVerticalScrollIndicator={false}>
        <GameBody
          key={restartKey}
          activity={activity}
          onDone={handleDone}
          onScoreUpdate={handleScoreUpdate}
          paused={paused}
        />
      </ScrollView>

      {/* Pause overlay */}
      {paused && result === 'none' && (
        <PauseOverlay onResume={() => setPaused(false)} onExit={exitToActivities} />
      )}

      {/* Result overlay */}
      {result !== 'none' && (
        <ResultOverlay
          score={score}
          onRestart={restart}
          onExit={exitToActivities}
        />
      )}
    </ScreenContainer>
  );
};

// â”€â”€â”€ Game body router — maps new activity IDs to components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function GameBody({
  activity, onDone, onScoreUpdate, paused,
}: {
  activity: Activity;
  onDone: (score?: number) => void;
  onScoreUpdate: (pts: number) => void;
  paused: boolean;
}) {
  const props = { onDone, onScoreUpdate, paused };

  switch (activity.id) {
    // Games
    case 'memory-match':       return <MemoryMatchGame    {...props} />;
    case 'word-search':        return <WordFinderGame      {...props} />;
    case 'jigsaw-puzzle':      return <PicturePuzzleGame   {...props} />;
    // Workout
    case 'sit-and-step':       return <ChairMarchExercise  {...props} />;
    case 'spin-and-strengthen':return <ArmCirclesExercise  {...props} />;
    case 'neck-relief':        return <NeckRollsExercise   {...props} />;
    // Relaxing
    case 'music-listen':       return <MusicListenActivity {...props} />;
    case 'meditation':         return <GratitudeActivity   {...props} />;
    case 'breathing-exercise': return <NatureSoundsActivity {...props} />;
    default: return (
      <View style={{ padding: 32, alignItems: 'center' }}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🌟</Text>
        <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.textSecondary, textAlign: 'center' }}>
          Activity coming soon!
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen:      { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },
  gameContent: { padding: 20, paddingBottom: 40 },
});
