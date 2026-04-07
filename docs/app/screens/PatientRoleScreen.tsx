import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'PatientDashboard'>;
type ActionState = 'done' | 'missed' | 'unsure' | null;
type BottomTab = 'Home' | 'Family' | 'Activity' | 'Search';

type Task = {
  id: string;
  title: string;
  time: string;
  state: ActionState;
};

const statusColors: Record<Exclude<ActionState, null>, string> = {
  done: '#0E7A67',
  missed: '#E5EAF0',
  unsure: '#F5F2E0'
};

const actionSpecs: Array<{ key: Exclude<ActionState, null>; icon: string; label?: string }> = [
  { key: 'done', icon: '👍', label: 'Done' },
  { key: 'missed', icon: '👎', label: 'Skip' },
  { key: 'unsure', icon: '❔' }
];

const ActionButton = ({
  label,
  icon,
  selected,
  state,
  onPress
}: {
  label?: string;
  icon: string;
  selected: boolean;
  state: Exclude<ActionState, null>;
  onPress: () => void;
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: selected ? statusColors[state] : state === 'unsure' ? '#F6F1DB' : '#E8EDF3' },
        pressed ? { transform: [{ scale: 0.97 }] } : null
      ]}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      {label ? <Text style={[styles.actionText, selected && state === 'done' ? styles.actionTextDone : null]}>{label}</Text> : null}
    </Pressable>
  );
};

const RoutineCard = ({
  task,
  onStateChange
}: {
  task: Task;
  onStateChange: (id: string, state: Exclude<ActionState, null>) => void;
}) => {
  return (
    <View style={styles.mainRoutineCard}>
      <View style={styles.routineTop}>
        <View style={styles.routineIconWrap}>
          <Text style={styles.routineIcon}>💊</Text>
        </View>
        <View style={styles.routineTextWrap}>
          <Text style={styles.routineTaskTitle}>{task.title}</Text>
          <Text style={styles.routineTaskMeta}>{task.time} • Before breakfast</Text>
        </View>
      </View>
      <View style={styles.actionsRow}>
        {actionSpecs.map((spec) => (
          <ActionButton
            key={spec.key}
            icon={spec.icon}
            label={spec.label}
            state={spec.key}
            selected={task.state === spec.key}
            onPress={() => onStateChange(task.id, spec.key)}
          />
        ))}
      </View>
    </View>
  );
};

const UpNextCard = ({ task }: { task: Task }) => {
  return (
    <View style={styles.upNextCard}>
      <View style={styles.upNextTop}>
        <View style={styles.walkIconWrap}>
          <Text style={styles.walkIcon}>🚶</Text>
        </View>
        <View style={styles.upNextTextWrap}>
          <Text style={styles.upNextTaskTitle}>{task.title}</Text>
          <Text style={styles.upNextMeta}>{task.time} • 20 mins</Text>
        </View>
        <View style={styles.upNextHelpCircle}>
          <Text style={styles.upNextHelpText}>?</Text>
        </View>
      </View>
      <View style={styles.upNextDivider} />
      <Text style={styles.startsInText}>STARTS IN 45 MINS</Text>
    </View>
  );
};

export const PatientRoleScreen: React.FC<Props> = () => {
  const [activeTab, setActiveTab] = useState<BottomTab>('Home');
  const [tasks, setTasks] = useState<Task[]>([
    { id: 'meds', title: 'Meds', time: '10:00 am', state: null },
    { id: 'walk', title: 'Daily Walk', time: '11:30 am', state: null },
    { id: 'breakfast', title: 'Breakfast', time: '09:00 am', state: null },
    { id: 'water', title: 'Hydration', time: '12:30 pm', state: null }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const findNextIndex = (fromIndex: number) => {
    if (tasks.length === 0) return 0;
    for (let step = 1; step <= tasks.length; step++) {
      const idx = (fromIndex + step) % tasks.length;
      if (tasks[idx]?.state !== 'done') return idx;
    }
    return fromIndex;
  };

  const routineTask = useMemo(() => tasks[currentIndex], [tasks, currentIndex]);
  const upNextTask = useMemo(() => tasks[findNextIndex(currentIndex)], [tasks, currentIndex]);
  const completedCount = useMemo(() => tasks.filter((t) => t.state === 'done').length, [tasks]);

  const updateTask = (taskId: string, state: Exclude<ActionState, null>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, state } : t)));
    if (taskId === tasks[currentIndex]?.id && (state === 'done' || state === 'missed')) {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => setCurrentIndex((i) => findNextIndex(i)), 220);
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.greetingOverline}>GOOD MORNING,</Text>
            <Text style={styles.greetingName}>Josh</Text>
            <Text style={styles.greetingDate}>Monday, 29 March</Text>
          </View>
          <View style={styles.weatherTile}>
            <Text style={styles.weatherSun}>☀️</Text>
            <Text style={styles.weatherTemp}>72°F</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>◷ Your Routine</Text>
          <Text style={styles.progressPill}>{`${completedCount} of ${tasks.length} completed`}</Text>
        </View>

        <RoutineCard task={routineTask} onStateChange={updateTask} />

        <Text style={styles.upNextTitle}>↻ Up Next</Text>
        <UpNextCard task={upNextTask} />
      </ScrollView>

      <View style={styles.bottomBarBand}>
        <View style={styles.bottomBar}>
          {(['Home', 'Family', 'Activity', 'Search'] as BottomTab[]).map((tab) => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.bottomTab}>
              <Text style={styles.bottomTabIcon}>
                {tab === 'Home' ? '🏠' : tab === 'Family' ? '👥' : tab === 'Activity' ? '〰️' : '🔍'}
              </Text>
              <Text style={[styles.bottomLabel, activeTab === tab ? styles.bottomLabelActive : null]}>{tab}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable style={({ pressed }) => [styles.fab, pressed ? styles.fabPressed : null]}>
        <Text style={styles.fabSymbol}>!</Text>
      </Pressable>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F5F7F7', paddingHorizontal: 0, paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 124 },
  headerCard: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#EAF0EF',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  greetingOverline: { color: '#0E7666', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  greetingName: { color: '#1F2937', fontSize: 46, fontWeight: '700', marginTop: -2 },
  greetingDate: { color: '#6B7280', fontSize: 16, fontWeight: '500', marginTop: -8 },
  weatherTile: { width: 72, height: 86, borderRadius: 16, backgroundColor: '#F8FAFA', alignItems: 'center', justifyContent: 'center' },
  weatherSun: { fontSize: 20 },
  weatherTemp: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  progressPill: {
    fontSize: 14,
    color: '#0E7666',
    fontWeight: '700',
    backgroundColor: '#E4F4EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  mainRoutineCard: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EAEC'
  },
  routineTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  routineIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#EAF6F2', alignItems: 'center', justifyContent: 'center' },
  routineIcon: { fontSize: 24 },
  routineTextWrap: { marginLeft: 12 },
  routineTaskTitle: { fontSize: 35, fontWeight: '700', color: '#111827' },
  routineTaskMeta: { marginTop: -4, fontSize: 16, color: '#6B7280', fontWeight: '500' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionButton: {
    minWidth: 88,
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionIcon: { fontSize: 24, marginRight: 6 },
  actionText: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  actionTextDone: { color: '#FFFFFF' },
  upNextTitle: { color: '#1F2937', marginTop: 14, marginBottom: 8, fontSize: 18, fontWeight: '700' },
  upNextCard: {
    borderRadius: 18,
    backgroundColor: '#F9FAFA',
    borderWidth: 1,
    borderColor: '#E6EAEC',
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  upNextTop: { flexDirection: 'row', alignItems: 'center' },
  walkIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  walkIcon: { fontSize: 24 },
  upNextTextWrap: { flex: 1, marginLeft: 12 },
  upNextTaskTitle: { fontSize: 16, color: '#111827', fontWeight: '700' },
  upNextMeta: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  upNextHelpCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E8EA', alignItems: 'center', justifyContent: 'center' },
  upNextHelpText: { color: '#9CA3AF', fontSize: 18, fontWeight: '700' },
  upNextDivider: { height: 1, backgroundColor: '#E5EAEC', marginVertical: 12 },
  startsInText: { textAlign: 'center', fontSize: 12, letterSpacing: 2, fontWeight: '700', color: '#9CA3AF' },
  bottomBarBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 92,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  bottomBar: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, paddingBottom: 8 },
  bottomTab: { alignItems: 'center', minWidth: 62, gap: 2, marginTop: 2 },
  bottomTabIcon: { fontSize: 28, color: '#4A4A52' },
  bottomLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  bottomLabelActive: { textDecorationLine: 'underline', fontWeight: '700', color: '#0E7666' },
  fab: {
    position: 'absolute',
    bottom: 34,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0E7A67',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E7A67',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 9
  },
  fabPressed: { transform: [{ scale: 0.96 }] },
  fabSymbol: { color: '#EFE6FF', fontSize: 28, fontWeight: '800', marginTop: -1 }
});
