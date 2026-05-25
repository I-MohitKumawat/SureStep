import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useTasks } from '../../hooks/useTasks';
import type { Task as ContextTask, TaskStatus } from '../../hooks/useTasks';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import {
  IconHome,
  IconFamily,
  IconActivity,
  IconSearch,
  IconProfile,
} from '../../assets/icons/NavIcons';
import { CaregiverSearchView } from './CaregiverSearchView';
import type { CaregiverListing } from './CaregiverSearchView';
import { CaregiverDetailView } from './CaregiverDetailView';
import { useAuth } from '../../hooks/useAuth';
import { useCaregiver } from '../../hooks/useCaregiver';
import { AiFab } from '../../components/shared/AiAssistantFab';
import { writeLocationPing } from '../../utils/geofenceUtils';
import type { PatientStackParams } from '../../types/navigation.types';

type Props = NativeStackScreenProps<PatientStackParams, 'PatientHomeScreen'>;
type ActionState = 'done' | 'missed' | 'unsure' | null;
type BottomTab = 'Home' | 'Family' | 'Activity' | 'Search';

type Task = { id: string; title: string; time: string; icon?: string; state: ActionState };


// â”€â”€â”€ Task meta: derive icon, hint, duration from task title â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type TaskMeta = { emoji: string; hint: string; duration: string; detail: string; tip: string };

function getTaskMeta(title: string): TaskMeta {
  const t = title.toLowerCase();

  if (t.includes('med') || t.includes('pill') || t.includes('tablet')) {
    return {
      emoji: 'ðŸ’Š',
      hint: 'Before breakfast',
      duration: '5 mins',
      detail: 'Morning Medication',
      tip: 'Take 1 tablet of Amlodipine 5mg with a full glass of water. Always take at the same time each day. Do not skip doses â€” if you miss one, take it as soon as you remember unless it\'s almost time for the next dose.',
    };
  }
  if (t.includes('breakfast') || t.includes('meal') || t.includes('food') || t.includes('eat')) {
    return {
      emoji: 'ðŸ½ï¸',
      hint: 'After medication',
      duration: '20 mins',
      detail: 'Healthy Breakfast',
      tip: 'Have a balanced breakfast: oatmeal or whole-grain toast with fruit. Avoid high-sugar cereals. A good breakfast provides energy for morning activities and stabilises blood sugar throughout the day.',
    };
  }
  if (t.includes('walk') || t.includes('exercise') || t.includes('jog') || t.includes('step')) {
    return {
      emoji: 'ðŸš¶',
      hint: 'Morning exercise',
      duration: '30 mins',
      detail: 'Daily Walk',
      tip: 'Walk at a comfortable pace for 30 minutes. Wear supportive shoes and take water. If you feel dizzy or short of breath, stop and rest. A daily walk improves circulation, mood, and joint flexibility.',
    };
  }
  if (t.includes('water') || t.includes('drink') || t.includes('hydrat')) {
    return {
      emoji: 'ðŸ’§',
      hint: 'Stay hydrated',
      duration: '2 mins',
      detail: 'Hydration Check',
      tip: 'Drink at least 2 glasses of water with each check-in. Older adults are at higher risk of dehydration. Keep a bottle nearby and sip regularly throughout the day, even if you don\'t feel thirsty.',
    };
  }
  if (t.includes('sleep') || t.includes('nap') || t.includes('rest')) {
    return {
      emoji: 'ðŸ˜´',
      hint: 'Rest time',
      duration: '60 mins',
      detail: 'Rest / Nap Time',
      tip: 'Lie down in a comfortable, quiet room. A short nap of 20â€“30 minutes can boost alertness without affecting night sleep. Avoid napping after 3 PM if you have difficulty sleeping at night.',
    };
  }
  if (t.includes('blood') || t.includes('bp') || t.includes('pressure') || t.includes('sugar') || t.includes('glucose')) {
    return {
      emoji: 'ðŸ©º',
      hint: 'Health check',
      duration: '5 mins',
      detail: 'Health Monitoring',
      tip: 'Sit calmly for 5 minutes before measuring. Place the cuff on your upper arm at heart level. Record the reading in your health log. Alert your caregiver if sistolic is above 140 or below 90.',
    };
  }

  // Default fallback
  return {
    emoji: 'ðŸ“‹',
    hint: 'Daily task',
    duration: '15 mins',
    detail: title,
    tip: 'Complete this task as directed by your care team. If you have any questions or feel unwell, press the ! button below to alert your caregiver.',
  };
}

const statusColors: Record<'done' | 'unsure' | 'missed', string> = {
  done: C.primary,
  unsure: C.unsureBg,
  missed: C.skipBg,
};

const actionSpecs: Array<{ key: Exclude<ActionState, null>; icon: string; label?: string }> = [
  { key: 'done', icon: 'ðŸ‘', label: 'Done' },
  { key: 'unsure', icon: 'â”' },
];

// â”€â”€â”€ Activity Tab Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Navigates immediately to the new enhanced PatientActivities hub.
// Renders a brief loading view while the navigation fires.
const ActivityTabContent = ({ onNavigate }: { onNavigate: () => void }) => {
  React.useEffect(() => {
    onNavigate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 32, marginBottom: 12 }}>ðŸ§©</Text>
      <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.textSecondary }}>Opening Activitiesâ€¦</Text>
    </View>
  );
};

// â”€â”€â”€ Caregiver Profile Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CaregiverProfileModal = ({
  visible,
  caregiver,
  onClose,
}: {
  visible: boolean;
  caregiver: CaregiverListing | null;
  onClose: () => void;
}) => {
  if (!caregiver) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.detailOverlay} onPress={onClose}>
        <Pressable style={styles.profileSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.detailHeader}>
            <Pressable onPress={onClose} style={styles.detailCloseBtn}>
              <Text style={styles.detailCloseText}>âœ•</Text>
            </Pressable>
          </View>

          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{caregiver.emoji}</Text>
          </View>

          <Text style={styles.caregiverTagline}>Your requested caregiver</Text>

          <Text style={styles.profileName}>{caregiver.name}</Text>
          <Text style={styles.profileSubtitle}>{caregiver.specialty}</Text>

          <View style={styles.detailDivider} />

          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Availability</Text>
            <Text style={styles.profileValue}>{caregiver.availability}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Location</Text>
            <Text style={styles.profileValue}>{caregiver.location}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Fee</Text>
            <Text style={styles.profileValue}>{caregiver.fee}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.detailDoneBtn, pressed && { opacity: 0.85 }]}
            onPress={onClose}
          >
            <Text style={styles.detailDoneBtnText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// â”€â”€â”€ Task Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          <View style={styles.detailHeader}>
            <Pressable onPress={onClose} style={styles.detailCloseBtn}>
              <Text style={styles.detailCloseText}>âœ•</Text>
            </Pressable>
          </View>

          <View style={styles.detailIllustration}>
            <Text style={styles.detailEmoji}>{meta.emoji}</Text>
          </View>

          <Text style={styles.detailTitle}>{meta.detail}</Text>
          <View style={styles.detailMetaRow}>
            <View style={styles.detailPill}>
              <Text style={styles.detailPillText}>ðŸ• {task.time}</Text>
            </View>
            <View style={styles.detailPill}>
              <Text style={styles.detailPillText}>â± {meta.duration}</Text>
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

// â”€â”€â”€ Action Button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        backgroundColor: selected ? statusColors[state] : state === 'unsure' ? C.unsureBg : C.skipBg,
      },
      pressed && { transform: [{ scale: 0.96 }] },
    ]}
  >
    <Text style={styles.actionIcon}>{icon}</Text>
    {label
      ? <Text style={[
        styles.actionText,
        selected && state === 'done' ? styles.actionTextDone : null,
      ]}>{label}</Text>
      : null
    }
  </Pressable>
);

// â”€â”€â”€ Routine Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const RoutineCard = ({
  task, onStateChange, onHelp,
}: {
  task: Task;
  onStateChange: (id: string, s: Exclude<ActionState, null>) => void;
  onHelp: (task: Task) => void;
}) => {
  const meta = getTaskMeta(task.title);
  const displayEmoji = task.icon ?? meta.emoji;
  return (
    <View style={styles.mainRoutineCard}>
      <View style={styles.routineTop}>
        <View style={styles.routineIconWrap}>
          <Text style={styles.routineIcon}>{displayEmoji}</Text>
        </View>
        <View style={styles.routineTextWrap}>
          <Text style={styles.routineTaskTitle}>{task.title}</Text>
          <Text style={styles.routineTaskMeta}>{task.time} Â· {meta.hint}</Text>
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
            onPress={() =>
              spec.key === 'unsure'
                ? onHelp(task)
                : onStateChange(task.id, spec.key)
            }
          />
        ))}
      </View>
    </View>
  );
};

// â”€â”€â”€ Bottom Tab Icon components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type TabIconProps = { active: boolean };
const TAB_ICON_COMPONENTS: Record<BottomTab, React.FC<TabIconProps>> = {
  Home: ({ active }) => <IconHome size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Family: ({ active }) => <IconFamily size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Activity: ({ active }) => <IconActivity size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Search: ({ active }) => <IconSearch size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
};

// â”€â”€â”€ Completed Tasks Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CompletedTasksModal = ({
  visible, tasks, onClose, onUndo,
}: {
  visible: boolean;
  tasks: Task[];
  onClose: () => void;
  onUndo: (taskId: string) => void;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalSheet}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Completed Tasks</Text>
          <Pressable onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseText}>âœ•</Text>
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
                      <Text style={styles.routineTaskMeta}>{task.time} Â· Completed âœ“</Text>
                    </View>
                    <Pressable
                      onPress={() => onUndo(task.id)}
                      style={({ pressed }) => [styles.undoBtn, pressed && { opacity: 0.7 }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.undoBtnText}>â†© Undo</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// â”€â”€â”€ Main Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const PatientHomeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { status, user } = useAuth();
  const { tasks, updateTaskStatus } = useTasks();
  // Accept initialTab from route params (from Games/Activities/Family screens)
  const initialTab = (route.params as any)?.initialTab as BottomTab | undefined;
  const [activeTab, setActiveTab] = useState<BottomTab>(initialTab ?? 'Home');
  const [currentDateTime] = useState(new Date());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [helpTask, setHelpTask] = useState<Task | null>(null);

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Caregiver search sub-view state ─────────────────────
  const [searchSubView, setSearchSubView] = useState<'list' | 'detail' | null>(null);
  const [viewingCaregiver, setViewingCaregiver] = useState<CaregiverListing | null>(null);
  const { confirmedCaregiver, setConfirmedCaregiver, reloadCaregiver } = useCaregiver();

  // Patient phone comes from auth — no AsyncStorage needed
  const patientId = status === 'authenticated' ? user?.id : null;

  // Raw tasks from context, filtered strictly to this patient
  const patientTasks: Task[] = useMemo(
    () => patientId
      ? tasks.filter((t: ContextTask) => t.patientId === patientId).map((t: ContextTask) => ({
          id: t.id, title: t.title, time: t.time,
          icon: t.icon,
          state: t.status === 'pending' ? null : (t.status as ActionState),
        }))
      : [],
    [tasks, patientId],
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

  // Name comes from user object
  const displayName = user?.name ?? 'You';

  // â”€â”€ Location publishing â€” write pings to Supabase so caregivers can see us â”€â”€
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const [locationStatus, setLocationStatus] = React.useState<'idle' | 'sharing' | 'error' | 'denied'>('idle');

  useEffect(() => {
    if (!patientId) return;
    let active = true;

    const startPublishing = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || !active) {
          if (active) setLocationStatus('denied');
          return;
        }

        // Write first ping immediately
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (active) {
          await writeLocationPing({
            patientId,
            coords: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
            accuracyM: loc.coords.accuracy ?? undefined,
            source: 'foreground',
          });
          if (active) setLocationStatus('sharing');
        }

        // Then watch and write every 30 s or every 10 m of movement
        locationSubRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 30_000, distanceInterval: 10 },
          async (l) => {
            if (!active) return;
            try {
              await writeLocationPing({
                patientId,
                coords: { latitude: l.coords.latitude, longitude: l.coords.longitude },
                accuracyM: l.coords.accuracy ?? undefined,
                source: 'foreground',
              });
              if (active) setLocationStatus('sharing');
            } catch {
              if (active) setLocationStatus('error');
            }
          },
        );
      } catch (err) {
        console.warn('[PatientRoleScreen] location publish error:', err);
        if (active) setLocationStatus('error');
      }
    };

    void startPublishing();
    return () => {
      active = false;
      locationSubRef.current?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Load confirmed caregiver from Supabase on mount (via caregiverContext)
  React.useEffect(() => {
    if (patientId) void reloadCaregiver(patientId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const nextActionableIndex = useMemo(() => {
    const len = patientTasks.length;
    if (len === 0) return 0;

    const start = Math.max(0, Math.min(currentIndex, len - 1));
    for (let step = 0; step < len; step++) {
      const idx = (start + step) % len;
      const t = patientTasks[idx];
      if (t && t.state !== 'done' && t.state !== 'missed') return idx;
    }
    return start;
  }, [patientTasks, currentIndex]);

  const routineTask = useMemo(
    () => patientTasks[nextActionableIndex] ?? patientTasks[0],
    [patientTasks, nextActionableIndex],
  );
  const completedTasks = useMemo(() => patientTasks.filter((t) => t.state === 'done'), [patientTasks]);
  const completedCount = completedTasks.length;
  const allTasksDone = useMemo(
    () => patientTasks.length > 0 && patientTasks.every((t) => t.state === 'done'),
    [patientTasks],
  );

  // â”€â”€ Single-click advance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // We track a local "pending index" rather than relying on stale patientTasks.
  // When Done or Skip is tapped we immediately step to the next undone index
  // using the CURRENT patientTasks list plus the just-applied state change.
  const updateTask = useCallback((taskId: string, state: Exclude<ActionState, null>) => {
    void updateTaskStatus(taskId, state as TaskStatus);

    // Only advance if it's the current card AND it's a conclusive action
    if (taskId !== routineTask?.id) return;
    if (state !== 'done') return;

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
        // Nothing left â€” stay at current
        return prevIdx;
      });
    }, 0); // 0ms â€” executed after React flushes the state update
  }, [routineTask, patientTasks, updateTaskStatus]);

  // â”€â”€ Undo: restore task to pending and move currentIndex to its time position â”€
  const openHelp = useCallback((task: Task) => setHelpTask(task), []);
  const closeHelp = useCallback(() => setHelpTask(null), []);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>

      {/* â”€â”€ Family tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === 'Family' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerCard}>
            <View>
              <Text style={styles.greetingOverline}>FAMILY</Text>
              <Text style={[styles.greetingName, { fontSize: 26 }]}>My Care Team</Text>
            </View>
          </View>
          {confirmedCaregiver ? (
            <View style={styles.mainRoutineCard}>
              <Text style={[styles.sectionTitle, { marginBottom: 14, fontSize: 14, letterSpacing: 0.6 }]}>YOUR CAREGIVER</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Text style={{ fontSize: 36 }}>{confirmedCaregiver.emoji || 'ðŸ§‘â€âš•ï¸'}</Text>
                <View>
                  <Text style={{ fontFamily: F.bold, fontSize: 18, color: C.textPrimary }}>{confirmedCaregiver.name}</Text>
                  <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.textSecondary }}>{confirmedCaregiver.specialty}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.mainRoutineCard, { alignItems: 'center', paddingVertical: 32 }]}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>ðŸ‘¨â€ðŸ‘©â€ðŸ‘§</Text>
              <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.textPrimary, textAlign: 'center', marginBottom: 6 }}>No caregiver linked yet</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
                Go to the Search tab to find and link a caregiver.
              </Text>
            </View>
          )}
        </ScrollView>

      /* â”€â”€ Activity tab â€” navigate to the Activity Hub screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
      ) : activeTab === 'Activity' ? (
        <ActivityTabContent onNavigate={() => navigation.navigate('PatientActivitiesScreen')} />

      ) : activeTab === 'Search' && confirmedCaregiver ? (
        // â”€â”€ Confirmed Caregiver Profile Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerCard}>
            <View>
              <Text style={styles.greetingOverline}>YOUR CAREGIVER</Text>
              <Text style={[styles.greetingName, { fontSize: 28 }]}>{confirmedCaregiver.name}</Text>
              <Text style={styles.greetingDate}>{confirmedCaregiver.specialty}</Text>
            </View>
            <View style={[styles.caregiverTile, { backgroundColor: '#e8f5e9' }]}>
              <Text style={styles.caregiverIcon}>{confirmedCaregiver.emoji || 'ðŸ§‘â€âš•ï¸'}</Text>
            </View>
          </View>

          <View style={[styles.mainRoutineCard, { marginBottom: 12 }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 14, fontSize: 14, letterSpacing: 0.6 }]}>CONTACT DETAILS</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 18, marginRight: 10 }}>ðŸ“ž</Text>
              <View>
                <Text style={{ fontFamily: F.medium, fontSize: 11, color: C.textSecondary }}>Phone Number</Text>
                <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.textPrimary }}>{confirmedCaregiver.id || 'Not available'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, marginRight: 10 }}>ðŸ“</Text>
              <View>
                <Text style={{ fontFamily: F.medium, fontSize: 11, color: C.textSecondary }}>Location</Text>
                <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.textPrimary }}>{confirmedCaregiver.location || 'Bangalore, India'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.mainRoutineCard}>
            <Text style={[styles.sectionTitle, { marginBottom: 8, fontSize: 14, letterSpacing: 0.6 }]}>BIO</Text>
            <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.textSecondary, lineHeight: 20 }}>
              {confirmedCaregiver.bio || 'No bio available.'}
            </Text>
          </View>
        </ScrollView>
      ) : activeTab === 'Search' && searchSubView === 'detail' && viewingCaregiver ? (
        <CaregiverDetailView
          caregiver={viewingCaregiver}
          isConfirmed={confirmedCaregiver?.id === viewingCaregiver.id}
          onBack={() => {
            if (confirmedCaregiver) {
              // Already confirmed â€” back goes to Home, not the search list
              setActiveTab('Home');
              setSearchSubView(null);
              setViewingCaregiver(null);
            } else {
              setSearchSubView('list');
              setViewingCaregiver(null);
            }
          }}
          onConfirm={async (c) => {
            // Pass patient name so it's written to Supabase at confirm time
            await setConfirmedCaregiver(c, patientId ?? '', displayName);
            // Dismiss entire search flow â€” return to Home
            setActiveTab('Home');
            setSearchSubView(null);
            setViewingCaregiver(null);
          }}
        />
      ) : activeTab === 'Search' ? (
        <CaregiverSearchView
          onSelect={(c) => {
            setViewingCaregiver(c);
            setSearchSubView('detail');
          }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={styles.headerCard}>
            <View>
              <Text style={styles.greetingOverline}>{getGreeting()},</Text>
              <Text style={styles.greetingName}>{displayName}</Text>
              <Text style={styles.greetingDate}>{formattedDate}</Text>
            </View>
            {confirmedCaregiver && (
              <Pressable
                onPress={() => {
                  setViewingCaregiver(confirmedCaregiver);
                  setSearchSubView('detail');
                  setActiveTab('Search');
                }}
                style={({ pressed }) => [styles.caregiverTile, pressed && { opacity: 0.82 }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.caregiverIcon}>{confirmedCaregiver.emoji}</Text>
                <Text style={styles.caregiverTileLabel} numberOfLines={2}>{confirmedCaregiver.name.split(' ')[0]}</Text>
              </Pressable>
            )}
          </View>

          {/* â”€â”€ Location sharing status pill â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {locationStatus !== 'idle' && (
            <View style={[
              styles.locStatusPill,
              locationStatus === 'sharing' && { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
              locationStatus === 'error'   && { backgroundColor: '#FEF2F2', borderColor: '#EF4444' },
              locationStatus === 'denied'  && { backgroundColor: '#F3F4F6', borderColor: '#9CA3AF' },
            ]}>
              <Text style={[
                styles.locStatusText,
                locationStatus === 'sharing' && { color: '#065F46' },
                locationStatus === 'error'   && { color: '#991B1B' },
                locationStatus === 'denied'  && { color: '#6B7280' },
              ]}>
                {locationStatus === 'sharing' ? 'ðŸ“¡ Sharing location with caregiver' :
                 locationStatus === 'error'   ? 'âš ï¸ Location sharing failed â€” re-run supabase_geofence_schema.sql' :
                                               'ðŸ”’ Location permission denied'}
              </Text>
            </View>
          )}

          {/* â”€â”€ Your Routine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitleIcon}>ðŸ•</Text>
              <Text style={styles.sectionTitle}>Your Routine</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.progressPillWrap, pressed && { opacity: 0.75 }]}
              onPress={() => completedCount > 0 && setShowCompletedModal(true)}
            >
              <Text style={styles.progressPill}>
                {allTasksDone ? 'All done! ðŸŽ‰' : `${completedCount} of ${patientTasks.length} completed`}
              </Text>
            </Pressable>
          </View>

          {patientTasks.length > 0 ? (
            <>
              <RoutineCard task={routineTask} onStateChange={updateTask} onHelp={openHelp} />
            </>
          ) : (
            <Text style={styles.emptyText}>No tasks assigned yet.</Text>
          )}

          {/* Modals rendered inside ScrollView so they're always present */}
          <CompletedTasksModal
            visible={showCompletedModal}
            tasks={completedTasks}
            onClose={() => setShowCompletedModal(false)}
            onUndo={(id) => void updateTaskStatus(id, 'pending')}
          />
          <TaskDetailModal
            visible={helpTask !== null}
            task={helpTask}
            onClose={closeHelp}
          />
        </ScrollView>
      )}

      {/* â”€â”€ Bottom Nav: Left 2 | FAB center | Right 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={styles.bottomBarBand}>
        {/* Left tabs */}
        <View style={styles.bottomBar}>
          {(['Home', 'Family'] as BottomTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent = TAB_ICON_COMPONENTS[tab];
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}  // inline â€” no navigation.navigate()
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
          <AiFab />
        </View>

        {/* Right tabs */}
        <View style={styles.bottomBar}>
          {(['Activity', 'Search'] as BottomTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent =
              tab === 'Search' && confirmedCaregiver
                ? IconProfile
                : TAB_ICON_COMPONENTS[tab];
            const label =
              tab === 'Search'
                ? confirmedCaregiver ? 'Caregiver Profile' : 'Search'
                : tab;
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  // All tabs render inline â€” no navigation.navigate()
                  setActiveTab(tab);
                  if (tab === 'Search') {
                    if (confirmedCaregiver) {
                      setViewingCaregiver(confirmedCaregiver);
                      setSearchSubView('detail');
                    } else {
                      setSearchSubView('list');
                    }
                  }
                }}
                style={styles.bottomTab}
              >
                <View style={styles.bottomTabIconWrap}>
                  <IconComponent active={isActive} />
                </View>
                <Text
                  style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {label}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScreenContainer>
  );
};

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const styles = StyleSheet.create({
  screen: { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 110 },

  // Header card
  headerCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.headerBg,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locStatusPill: {
    borderRadius: 10, borderWidth: 1, marginBottom: 12,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  locStatusText: { fontFamily: F.medium, fontSize: 12 },
  greetingOverline: { fontFamily: F.bold, color: C.textLabel, fontSize: 12, letterSpacing: 1.2 },
  greetingName: { fontFamily: F.extraBold, color: C.textPrimary, fontSize: 40, marginTop: -2 },
  greetingDate: { fontFamily: F.medium, color: C.textSecondary, fontSize: 14, marginTop: 0 },
  caregiverTile: {
    width: 68, height: 80, borderRadius: 16, backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: C.border,
  },
  caregiverIcon: { fontSize: 26 },
  caregiverTileLabel: {
    fontFamily: F.bold,
    fontSize: 9,
    color: C.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitleIcon: { fontSize: 18 },
  sectionTitle: { fontFamily: F.bold, fontSize: 17, color: C.textPrimary },
  progressPillWrap: { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  progressPill: { fontFamily: F.bold, fontSize: 13, color: C.primary },

  // Routine card
  mainRoutineCard: {
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    marginBottom: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  routineTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  routineIconWrap: { width: 50, height: 50, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  routineIcon: { fontSize: 22 },
  routineTextWrap: { marginLeft: 12, flex: 1 },
  routineTaskTitle: { fontFamily: F.bold, fontSize: 20, color: C.textPrimary },
  routineTaskMeta: { fontFamily: F.medium, fontSize: 14, color: C.textSecondary, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionButton: {
    minWidth: 90, height: 48, borderRadius: 14,
    paddingHorizontal: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
  },
  actionIcon: { fontSize: 20, marginRight: 6 },
  actionText: { fontFamily: F.bold, fontSize: 15, color: C.textBody },
  actionTextDone: { color: C.primaryText },
  actionTextSkip: { color: '#fff' },

  emptyText: { fontFamily: F.regular, fontSize: 15, color: C.textSecondary, textAlign: 'center', marginTop: 24, fontStyle: 'italic' },

  // Help / question-mark button
  helpCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FEF9C3',
    borderWidth: 1.5, borderColor: '#F59E0B',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 6,
  },
  helpCircleText: { fontFamily: F.bold, color: '#B45309', fontSize: 16 },

  // â”€â”€ Overlay/sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  detailEmoji: { fontSize: 46 },
  detailTitle: { fontFamily: F.extraBold, fontSize: 22, color: C.textPrimary, textAlign: 'center', paddingHorizontal: 20, marginBottom: 12 },
  detailMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', paddingHorizontal: 16, marginBottom: 16 },
  detailPill: {
    backgroundColor: C.primaryLight, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  detailPillText: { fontFamily: F.semiBold, fontSize: 12, color: C.primary },
  detailDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 14 },
  detailInstructionLabel: { fontFamily: F.bold, fontSize: 11, letterSpacing: 1.2, color: C.textMuted, paddingHorizontal: 20, marginBottom: 8 },
  detailInstruction: { fontFamily: F.regular, fontSize: 14, color: C.textSecondary, lineHeight: 22, paddingHorizontal: 20, marginBottom: 24 },
  detailDoneBtn: {
    marginHorizontal: 20, borderRadius: 14, backgroundColor: C.primary,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: C.primary, shadowOpacity: 0.28, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6,
  },
  detailDoneBtnText: { fontFamily: F.bold, fontSize: 16, color: C.primaryText },

  // â”€â”€ Caregiver profile modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  profileSheet: {
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
  profileAvatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  profileAvatarText: { fontSize: 44 },
  caregiverTagline: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: -2,
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  profileName: {
    fontFamily: F.extraBold,
    fontSize: 22,
    color: C.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  profileSubtitle: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  profileLabel: { fontFamily: F.bold, fontSize: 13, color: C.textMuted },
  profileValue: { fontFamily: F.medium, fontSize: 13, color: C.textPrimary },

  // â”€â”€ Completed Tasks Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, maxHeight: '75%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontFamily: F.bold, fontSize: 18, color: C.textPrimary },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontFamily: F.bold, fontSize: 15, color: C.textMuted },

  // â”€â”€ Undo button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  undoBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    marginLeft: 8,
  },
  undoBtnText: { fontFamily: F.bold, fontSize: 12, color: C.textMuted },

  // â”€â”€ Bottom nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  bottomLabel: { fontFamily: F.medium, fontSize: 10, color: C.textMuted, letterSpacing: 0.3 },
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
