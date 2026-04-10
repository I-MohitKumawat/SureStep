import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { useUserProfile } from '../context/userProfileContext';
import { useTasks } from '../context/taskContext';
import type { TaskStatus } from '../context/taskContext';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import {
  IconHome,
  IconFamily,
  IconActivity,
  IconSearch,
} from '../assets/icons/NavIcons';

type Props = NativeStackScreenProps<HomeStackParamList, 'PatientDashboard'>;
type ActionState = 'done' | 'missed' | 'unsure' | null;
type BottomTab = 'Home' | 'Family' | 'Activity' | 'Search';

type Task = { id: string; title: string; time: string; state: ActionState };

// ─── Task meta: derive icon, hint, duration from task title ──────────────────
type TaskMeta = { emoji: string; hint: string; duration: string; detail: string; tip: string };

function getTaskMeta(title: string): TaskMeta {
  const t = title.toLowerCase();

  if (t.includes('med') || t.includes('pill') || t.includes('tablet')) {
    return {
      emoji: '💊',
      hint: 'Before breakfast',
      duration: '5 mins',
      detail: 'Morning Medication',
      tip: 'Take 1 tablet of Amlodipine 5mg with a full glass of water. Always take at the same time each day. Do not skip doses — if you miss one, take it as soon as you remember unless it\'s almost time for the next dose.',
    };
  }
  if (t.includes('breakfast') || t.includes('meal') || t.includes('food') || t.includes('eat')) {
    return {
      emoji: '🍽️',
      hint: 'After medication',
      duration: '20 mins',
      detail: 'Healthy Breakfast',
      tip: 'Have a balanced breakfast: oatmeal or whole-grain toast with fruit. Avoid high-sugar cereals. A good breakfast provides energy for morning activities and stabilises blood sugar throughout the day.',
    };
  }
  if (t.includes('walk') || t.includes('exercise') || t.includes('jog') || t.includes('step')) {
    return {
      emoji: '🚶',
      hint: 'Morning exercise',
      duration: '30 mins',
      detail: 'Daily Walk',
      tip: 'Walk at a comfortable pace for 30 minutes. Wear supportive shoes and take water. If you feel dizzy or short of breath, stop and rest. A daily walk improves circulation, mood, and joint flexibility.',
    };
  }
  if (t.includes('water') || t.includes('drink') || t.includes('hydrat')) {
    return {
      emoji: '💧',
      hint: 'Stay hydrated',
      duration: '2 mins',
      detail: 'Hydration Check',
      tip: 'Drink at least 2 glasses of water with each check-in. Older adults are at higher risk of dehydration. Keep a bottle nearby and sip regularly throughout the day, even if you don\'t feel thirsty.',
    };
  }
  if (t.includes('sleep') || t.includes('nap') || t.includes('rest')) {
    return {
      emoji: '😴',
      hint: 'Rest time',
      duration: '60 mins',
      detail: 'Rest / Nap Time',
      tip: 'Lie down in a comfortable, quiet room. A short nap of 20–30 minutes can boost alertness without affecting night sleep. Avoid napping after 3 PM if you have difficulty sleeping at night.',
    };
  }
  if (t.includes('blood') || t.includes('bp') || t.includes('pressure') || t.includes('sugar') || t.includes('glucose')) {
    return {
      emoji: '🩺',
      hint: 'Health check',
      duration: '5 mins',
      detail: 'Health Monitoring',
      tip: 'Sit calmly for 5 minutes before measuring. Place the cuff on your upper arm at heart level. Record the reading in your health log. Alert your caregiver if sistolic is above 140 or below 90.',
    };
  }

  // Default fallback
  return {
    emoji: '📋',
    hint: 'Daily task',
    duration: '15 mins',
    detail: title,
    tip: 'Complete this task as directed by your care team. If you have any questions or feel unwell, press the ! button below to alert your caregiver.',
  };
}

const statusColors: Record<Exclude<ActionState, null>, string> = {
  done:   C.primary,
  missed: C.skipBg,
  unsure: C.unsureBg,
};

const actionSpecs: Array<{ key: Exclude<ActionState, null>; icon: string; label?: string }> = [
  { key: 'done',   icon: '👍', label: 'Done' },
  { key: 'missed', icon: '👎', label: 'Skip' },
  { key: 'unsure', icon: '❔' },
];

const SKIP_RED = '#EF4444';

// ─── Task Detail Modal ────────────────────────────────────────────────────────
const TaskDetailModal = ({
  visible, task, onClose,
}: {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
}) => {
  if (!task) return null;
  const meta = getTaskMeta(task.title);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.detailOverlay} onPress={onClose}>
        <Pressable style={styles.detailSheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.detailHeader}>
            <Pressable onPress={onClose} style={styles.detailCloseBtn}>
              <Text style={styles.detailCloseText}>✕</Text>
            </Pressable>
          </View>

          {/* Illustration */}
          <View style={styles.detailIllustration}>
            <Text style={styles.detailEmoji}>{meta.emoji}</Text>
          </View>

          {/* Content */}
          <Text style={styles.detailTitle}>{meta.detail}</Text>
          <View style={styles.detailMetaRow}>
            <View style={styles.detailPill}>
              <Text style={styles.detailPillText}>🕐 {task.time}</Text>
            </View>
            <View style={styles.detailPill}>
              <Text style={styles.detailPillText}>⏱ {meta.duration}</Text>
            </View>
            <View style={styles.detailPill}>
              <Text style={styles.detailPillText}>{meta.hint}</Text>
            </View>
          </View>

          <View style={styles.detailDivider} />
          <Text style={styles.detailInstructionLabel}>INSTRUCTIONS</Text>
          <Text style={styles.detailInstruction}>{meta.tip}</Text>

          <Pressable
            style={({ pressed }) => [styles.detailDoneBtn, pressed && { opacity: 0.85 }]}
            onPress={onClose}
          >
            <Text style={styles.detailDoneBtnText}>Got it</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── Action Button ────────────────────────────────────────────────────────────
const ActionButton = ({
  label, icon, selected, state, onPress,
}: {
  label?: string; icon: string; selected: boolean;
  state: Exclude<ActionState, null>; onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.actionButton,
      {
        backgroundColor:
          state === 'missed'
            ? selected ? SKIP_RED : `${SKIP_RED}30`
            : selected ? statusColors[state] : state === 'unsure' ? C.unsureBg : C.skipBg,
      },
      pressed && { transform: [{ scale: 0.96 }] },
    ]}
  >
    <Text style={styles.actionIcon}>{icon}</Text>
    {label
      ? <Text style={[
          styles.actionText,
          selected && state === 'done' ? styles.actionTextDone
            : state === 'missed' ? styles.actionTextSkip : null,
        ]}>{label}</Text>
      : null
    }
  </Pressable>
);

// ─── Routine Card ─────────────────────────────────────────────────────────────
const RoutineCard = ({
  task, onStateChange, onHelp,
}: {
  task: Task;
  onStateChange: (id: string, s: Exclude<ActionState, null>) => void;
  onHelp: (task: Task) => void;
}) => {
  const meta = getTaskMeta(task.title);
  return (
    <View style={styles.mainRoutineCard}>
      <View style={styles.routineTop}>
        <View style={styles.routineIconWrap}>
          <Text style={styles.routineIcon}>{meta.emoji}</Text>
        </View>
        <View style={styles.routineTextWrap}>
          <Text style={styles.routineTaskTitle}>{task.title}</Text>
          <Text style={styles.routineTaskMeta}>{task.time} · {meta.hint}</Text>
        </View>
        {/* Question mark help button */}
        <Pressable
          onPress={() => onHelp(task)}
          style={({ pressed }) => [styles.helpCircle, pressed && { opacity: 0.7 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.helpCircleText}>?</Text>
        </Pressable>
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

// ─── Up Next Card ─────────────────────────────────────────────────────────────
const UpNextCard = ({
  task, onHelp,
}: {
  task: Task;
  onHelp: (task: Task) => void;
}) => {
  const meta = getTaskMeta(task.title);
  return (
    <View style={styles.upNextCard}>
      <View style={styles.upNextTop}>
        <View style={styles.upNextIconWrap}>
          <Text style={styles.upNextIconText}>{meta.emoji}</Text>
        </View>
        <View style={styles.upNextTextWrap}>
          <Text style={styles.upNextTaskTitle}>{task.title}</Text>
          <Text style={styles.upNextMeta}>{task.time} · {meta.duration}</Text>
        </View>
        <Pressable
          onPress={() => onHelp(task)}
          style={({ pressed }) => [styles.helpCircle, pressed && { opacity: 0.7 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.helpCircleText}>?</Text>
        </Pressable>
      </View>
      <View style={styles.upNextDivider} />
      <Text style={styles.startsInText}>STARTS AT {task.time} · {meta.duration.toUpperCase()}</Text>
    </View>
  );
};

// ─── Bottom Tab Icon components ───────────────────────────────────────────────
type TabIconProps = { active: boolean };
const TAB_ICON_COMPONENTS: Record<BottomTab, React.FC<TabIconProps>> = {
  Home:     ({ active }) => <IconHome     size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Family:   ({ active }) => <IconFamily   size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Activity: ({ active }) => <IconActivity size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Search:   ({ active }) => <IconSearch   size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
};

// ─── Completed Tasks Modal ────────────────────────────────────────────────────
const CompletedTasksModal = ({
  visible, tasks, onUndo, onClose, onHelp,
}: {
  visible: boolean;
  tasks: Task[];
  onUndo: (id: string) => void;
  onClose: () => void;
  onHelp: (task: Task) => void;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalSheet}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Completed Tasks</Text>
          <Pressable onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseText}>✕</Text>
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {tasks.length === 0 ? (
            <Text style={styles.emptyText}>No completed tasks yet.</Text>
          ) : (
            tasks.map((task) => {
              const meta = getTaskMeta(task.title);
              return (
                <View key={task.id} style={styles.mainRoutineCard}>
                  <View style={styles.routineTop}>
                    <View style={styles.routineIconWrap}>
                      <Text style={styles.routineIcon}>{meta.emoji}</Text>
                    </View>
                    <View style={styles.routineTextWrap}>
                      <Text style={styles.routineTaskTitle}>{task.title}</Text>
                      <Text style={styles.routineTaskMeta}>{task.time} · Completed ✓</Text>
                    </View>
                    <Pressable
                      onPress={() => onHelp(task)}
                      style={({ pressed }) => [styles.helpCircle, pressed && { opacity: 0.7 }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.helpCircleText}>?</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.undoButton, pressed && { opacity: 0.78 }]}
                    onPress={() => onUndo(task.id)}
                  >
                    <Text style={styles.undoButtonText}>↩ Undo Done</Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const PatientRoleScreen: React.FC<Props> = ({ navigation }) => {
  const { profile } = useUserProfile();
  const { tasks, updateTaskStatus } = useTasks();
  const [activeTab, setActiveTab] = useState<BottomTab>('Home');
  const [currentDateTime] = useState(new Date());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [helpTask, setHelpTask] = useState<Task | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patientId = 'p1';

  // Raw tasks from context, in their stored order (which is time-ordered)
  const patientTasks = useMemo(
    () => tasks.filter((t) => t.patientId === patientId).map((t) => ({
      id: t.id, title: t.title, time: t.time,
      state: t.status === 'pending' ? null : (t.status as ActionState),
    })),
    [tasks],
  );

  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const getGreeting = () => {
    const h = currentDateTime.getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  const displayName = profile?.fullName ?? 'You';



  const routineTask    = useMemo(() => patientTasks[currentIndex] ?? patientTasks[0], [patientTasks, currentIndex]);
  const completedTasks = useMemo(() => patientTasks.filter((t) => t.state === 'done'), [patientTasks]);
  const completedCount = completedTasks.length;
  const allTasksDone   = useMemo(
    () => patientTasks.length > 0 && patientTasks.every((t) => t.state === 'done'),
    [patientTasks],
  );

  // UpNext: only show when there are ≥2 undone tasks and the next differs from current
  const upNextTask = useMemo(() => {
    if (allTasksDone) return null;
    const undoneTasks = patientTasks.filter((t) => t.state !== 'done' && t.state !== 'missed');
    if (undoneTasks.length < 2) return null;
    return undoneTasks.find((t) => t.id !== routineTask?.id) ?? null;
  }, [patientTasks, allTasksDone, routineTask]);

  // ── Single-click advance ─────────────────────────────────────────────────
  // We track a local "pending index" rather than relying on stale patientTasks.
  // When Done or Skip is tapped we immediately step to the next undone index
  // using the CURRENT patientTasks list plus the just-applied state change.
  const updateTask = useCallback((taskId: string, state: Exclude<ActionState, null>) => {
    void updateTaskStatus(taskId, state as TaskStatus);

    // Only advance if it's the current card AND it's a conclusive action
    if (taskId !== routineTask?.id) return;
    if (state !== 'done' && state !== 'missed') return;

    // Build synthetic updated list to find the next undone index immediately
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      setCurrentIndex((prevIdx) => {
        // Look for next undone task after prevIdx (wrap-inclusive)
        const len = patientTasks.length;
        for (let step = 1; step < len; step++) {
          const idx = (prevIdx + step) % len;
          const t = patientTasks[idx];
          // Skip already-done/missed tasks (including the one we just acted on)
          if (t && t.state !== 'done' && t.state !== 'missed' && t.id !== taskId) return idx;
        }
        // Nothing left — stay at current
        return prevIdx;
      });
    }, 0); // 0ms — executed after React flushes the state update
  }, [routineTask, patientTasks, updateTaskStatus]);

  // ── Undo: restore task to pending and move currentIndex to its time position ─
  const undoTask = useCallback((taskId: string) => {
    void updateTaskStatus(taskId, 'pending' as TaskStatus);
    // Find the time-ordered index of this task and jump back to it
    const idx = patientTasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) setCurrentIndex(idx);
    setShowCompletedModal(false);
  }, [patientTasks, updateTaskStatus]);

  const openHelp = useCallback((task: Task) => setHelpTask(task), []);
  const closeHelp = useCallback(() => setHelpTask(null), []);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.greetingOverline}>{getGreeting()},</Text>
            <Text style={styles.greetingName}>{displayName}</Text>
            <Text style={styles.greetingDate}>{formattedDate}</Text>
          </View>
          <View style={styles.weatherTile}>
            <Text style={styles.weatherSun}>☀️</Text>
            <Text style={styles.weatherTemp}>72°F</Text>
          </View>
        </View>

        {/* ── Your Routine ────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitleIcon}>🕐</Text>
            <Text style={styles.sectionTitle}>Your Routine</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.progressPillWrap, pressed && { opacity: 0.75 }]}
            onPress={() => completedCount > 0 && setShowCompletedModal(true)}
          >
            <Text style={styles.progressPill}>
              {allTasksDone ? 'All done! 🎉' : `${completedCount} of ${patientTasks.length} completed`}
            </Text>
          </Pressable>
        </View>

        {patientTasks.length > 0 ? (
          <>
            <RoutineCard task={routineTask} onStateChange={updateTask} onHelp={openHelp} />

            {upNextTask && (
              <>
                <View style={styles.upNextHeader}>
                  <Text style={styles.upNextIcon}>↻</Text>
                  <Text style={styles.upNextTitle}>Up Next</Text>
                </View>
                <UpNextCard task={upNextTask} onHelp={openHelp} />
              </>
            )}
          </>
        ) : (
          <Text style={styles.emptyText}>No tasks assigned yet.</Text>
        )}

        {/* Modals rendered inside ScrollView so they're always present */}
        <CompletedTasksModal
          visible={showCompletedModal}
          tasks={completedTasks}
          onUndo={undoTask}
          onClose={() => setShowCompletedModal(false)}
          onHelp={openHelp}
        />
        <TaskDetailModal
          visible={helpTask !== null}
          task={helpTask}
          onClose={closeHelp}
        />
      </ScrollView>

      {/* ── Bottom Nav: Left 2 | FAB center | Right 2 ──────────────── */}
      <View style={styles.bottomBarBand}>
        {/* Left tabs */}
        <View style={styles.bottomBar}>
          {(['Home', 'Family'] as BottomTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent = TAB_ICON_COMPONENTS[tab];
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  setActiveTab(tab);
                  if (tab === 'Family') navigation.navigate('PatientFamily');
                }}
                style={styles.bottomTab}
              >
                <View style={styles.bottomTabIconWrap}>
                  <IconComponent active={isActive} />
                </View>
                <Text style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}>{tab}</Text>
                {isActive && <View style={styles.activeIndicator} />}
              </Pressable>
            );
          })}
        </View>

        {/* Center FAB slot */}
        <View style={styles.fabSlot}>
          <Pressable style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
            <Text style={styles.fabSymbol}>!</Text>
          </Pressable>
        </View>

        {/* Right tabs */}
        <View style={styles.bottomBar}>
          {(['Activity', 'Search'] as BottomTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent = TAB_ICON_COMPONENTS[tab];
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  setActiveTab(tab);
                  if (tab === 'Activity') navigation.navigate('PatientActivities');
                }}
                style={styles.bottomTab}
              >
                <View style={styles.bottomTabIconWrap}>
                  <IconComponent active={isActive} />
                </View>
                <Text style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}>{tab}</Text>
                {isActive && <View style={styles.activeIndicator} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScreenContainer>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 110 },

  // Header card
  headerCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.headerBg,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingOverline: { fontFamily: F.bold, color: C.textLabel, fontSize: 12, letterSpacing: 1.2 },
  greetingName:     { fontFamily: F.extraBold, color: C.textPrimary, fontSize: 40, marginTop: -2 },
  greetingDate:     { fontFamily: F.medium, color: C.textSecondary, fontSize: 14, marginTop: 0 },
  weatherTile: {
    width: 68, height: 80, borderRadius: 16, backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  weatherSun:  { fontSize: 22 },
  weatherTemp: { fontFamily: F.bold, fontSize: 16, color: C.textPrimary, marginTop: 4 },

  // Section header
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitleIcon: { fontSize: 18 },
  sectionTitle:     { fontFamily: F.bold, fontSize: 17, color: C.textPrimary },
  progressPillWrap: { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  progressPill:     { fontFamily: F.bold, fontSize: 13, color: C.primary },

  // Routine card
  mainRoutineCard: {
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    marginBottom: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  routineTop:       { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  routineIconWrap:  { width: 50, height: 50, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  routineIcon:      { fontSize: 22 },
  routineTextWrap:  { marginLeft: 12, flex: 1 },
  routineTaskTitle: { fontFamily: F.bold, fontSize: 20, color: C.textPrimary },
  routineTaskMeta:  { fontFamily: F.medium, fontSize: 14, color: C.textSecondary, marginTop: 2 },
  actionsRow:  { flexDirection: 'row', gap: 10 },
  actionButton: {
    minWidth: 90, height: 48, borderRadius: 14,
    paddingHorizontal: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
  },
  actionIcon:     { fontSize: 20, marginRight: 6 },
  actionText:     { fontFamily: F.bold, fontSize: 15, color: C.textBody },
  actionTextDone: { color: C.primaryText },
  actionTextSkip: { color: '#fff' },

  // Help / question-mark button (shared by Routine, UpNext, Completed modal)
  helpCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 6,
  },
  helpCircleText: { fontFamily: F.bold, color: C.primary, fontSize: 16 },

  // Up Next
  upNextHeader:  { flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 10, gap: 6 },
  upNextIcon:    { fontSize: 18, color: C.primary },
  upNextTitle:   { fontFamily: F.bold, fontSize: 17, color: C.textPrimary },
  upNextCard: {
    borderRadius: 18, backgroundColor: C.surfaceAlt,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 14,
    shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 1,
  },
  upNextTop:      { flexDirection: 'row', alignItems: 'center' },
  upNextIconWrap: { width: 46, height: 46, borderRadius: 13, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  upNextIconText: { fontSize: 22 },
  upNextTextWrap: { flex: 1, marginLeft: 12 },
  upNextTaskTitle: { fontFamily: F.bold, fontSize: 15, color: C.textPrimary },
  upNextMeta:      { fontFamily: F.regular, fontSize: 13, color: C.textSecondary, marginTop: 2 },
  upNextDivider:   { height: 1, backgroundColor: C.border, marginVertical: 12 },
  startsInText:    { fontFamily: F.bold, textAlign: 'center', fontSize: 11, letterSpacing: 2, color: C.textMuted },

  emptyText: { fontFamily: F.regular, fontSize: 15, color: C.textSecondary, textAlign: 'center', marginTop: 24, fontStyle: 'italic' },

  // ── Task Detail Modal ──────────────────────────────────────────────────────
  detailOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24,
  },
  detailSheet: {
    width: '100%', backgroundColor: C.bg,
    borderRadius: 28, paddingBottom: 28,
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 8 }, shadowRadius: 24, elevation: 20,
  },
  detailHeader: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: 16, paddingTop: 14, marginBottom: 0,
  },
  detailCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
  },
  detailCloseText: { fontFamily: F.bold, fontSize: 15, color: C.textMuted },
  detailIllustration: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 16,
  },
  detailEmoji:   { fontSize: 46 },
  detailTitle:   { fontFamily: F.extraBold, fontSize: 22, color: C.textPrimary, textAlign: 'center', paddingHorizontal: 20, marginBottom: 12 },
  detailMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', paddingHorizontal: 16, marginBottom: 16 },
  detailPill: {
    backgroundColor: C.primaryLight, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  detailPillText:          { fontFamily: F.semiBold, fontSize: 12, color: C.primary },
  detailDivider:           { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 14 },
  detailInstructionLabel:  { fontFamily: F.bold, fontSize: 11, letterSpacing: 1.2, color: C.textMuted, paddingHorizontal: 20, marginBottom: 8 },
  detailInstruction:       { fontFamily: F.regular, fontSize: 14, color: C.textSecondary, lineHeight: 22, paddingHorizontal: 20, marginBottom: 24 },
  detailDoneBtn: {
    marginHorizontal: 20, borderRadius: 14, backgroundColor: C.primary,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: C.primary, shadowOpacity: 0.28, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6,
  },
  detailDoneBtnText: { fontFamily: F.bold, fontSize: 16, color: C.primaryText },

  // ── Completed Tasks Modal ──────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, maxHeight: '75%',
  },
  modalHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle:     { fontFamily: F.bold, fontSize: 18, color: C.textPrimary },
  modalCloseBtn:  { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontFamily: F.bold, fontSize: 15, color: C.textMuted },
  undoButton: {
    marginTop: 8, borderRadius: 10,
    backgroundColor: C.primaryLight,
    paddingVertical: 10, alignItems: 'center',
  },
  undoButtonText: { fontFamily: F.bold, fontSize: 14, color: C.primary },

  // ── Bottom nav ─────────────────────────────────────────────────────────────
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
  },
  bottomLabel:       { fontFamily: F.medium, fontSize: 10, color: C.textMuted, letterSpacing: 0.3 },
  bottomLabelActive: { fontFamily: F.bold, color: C.primary },
  activeIndicator: {
    position: 'absolute', bottom: 0,
    width: 18, height: 2.5, borderRadius: 2,
    backgroundColor: C.primary,
  },

  // FAB
  fabSlot: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    marginTop: -34,
  },
  fab: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.38, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 10,
    borderWidth: 3, borderColor: C.surface,
  },
  fabPressed: { transform: [{ scale: 0.95 }] },
  fabSymbol:  { fontFamily: F.extraBold, color: C.primaryText, fontSize: 22 },
});
