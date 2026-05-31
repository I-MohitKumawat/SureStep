import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, Alert, Image } from 'react-native';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';

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
import { PatientActivitiesView } from './PatientActivitiesScreen';
import { useAuth } from '../../hooks/useAuth';
import { useCaregiver } from '../../hooks/useCaregiver';
import { AiFab } from '../../components/shared/AiAssistantFab';
import { writeLocationPing } from '../../utils/geofenceUtils';
import type { PatientStackParams } from '../../types/navigation.types';

type Props = NativeStackScreenProps<PatientStackParams, 'PatientHomeScreen'>;
type ActionState = 'done' | 'missed' | 'unsure' | null;
type BottomTab = 'Home' | 'Family' | 'Activity' | 'Search';

type Task = {
  id: string;
  title: string;
  time: string;
  icon?: string;
  state: ActionState;
  instructionsMd?: string;
  description?: string;
};


// --- Task meta: derive icon, hint, duration from task title ------------------
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
      emoji: '🥣',
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
      emoji: '💤',
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

const statusColors: Record<'done' | 'unsure' | 'missed', string> = {
  done: C.primary,
  unsure: C.unsureBg,
  missed: C.skipBg,
};

const actionSpecs: Array<{ key: Exclude<ActionState, null>; icon: string; label?: string }> = [
  { key: 'done', icon: '👍', label: 'Done' },
  { key: 'unsure', icon: '❓' },
];



// --- Caregiver Profile Modal --------------------------------------------------
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
              <Text style={styles.detailCloseText}>✕</Text>
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

// --- Task Detail Modal --------------------------------------------------------
const TaskDetailModal = () => null;
const _unused_TaskDetailModal = ({
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
              <Text style={styles.detailCloseText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.detailIllustration}>
            <Text style={styles.detailEmoji}>{meta.emoji}</Text>
          </View>

          <Text style={styles.detailTitle}>{meta.detail}</Text>
          <View style={styles.detailMetaRow}>
            <View style={styles.detailPill}>
              <Text style={styles.detailPillText}>🕒 {task.time}</Text>
            </View>
            <View style={styles.detailPill}>
              <Text style={styles.detailPillText}>⏳ {meta.duration}</Text>
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

// --- Routine Card -------------------------------------------------------------
const RoutineCard = ({
  task,
  onUpdateStatus,
  onViewInstructions,
}: {
  task: Task;
  onUpdateStatus: (taskId: string, status: 'done' | 'unsure' | 'pending') => void;
  onViewInstructions: (task: Task) => void;
}) => {
  const meta = getTaskMeta(task.title);
  const displayEmoji = task.icon ?? meta.emoji;
  const isDone = task.state === 'done';
  const isUnsure = task.state === 'unsure';

  return (
    <View style={[styles.mainRoutineCard, isDone && { borderColor: '#86EFAC', backgroundColor: '#F9FBF9' }]}>
      <View style={styles.routineTop}>
        <View style={styles.routineIconWrap}>
          <Text style={styles.routineIcon}>{displayEmoji}</Text>
        </View>
        <View style={styles.routineTextWrap}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={[styles.routineTaskTitle, isDone && { textDecorationLine: 'line-through', color: C.textMuted }]}>{task.title}</Text>
            {isDone && (
              <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
                <Text style={{ color: '#166534', fontSize: 10, fontFamily: F.bold }}>DONE</Text>
              </View>
            )}
            {isUnsure && (
              <View style={[styles.statusBadge, { backgroundColor: '#FFEDD5', borderColor: '#FDBA74' }]}>
                <Text style={{ color: '#9A3412', fontSize: 10, fontFamily: F.bold }}>UNSURE</Text>
              </View>
            )}
          </View>
          <Text style={styles.routineTaskMeta}>{task.time} · {meta.hint}</Text>
        </View>
      </View>

      {/* Patient actions: Done and Instructions */}
      <View style={styles.cardActionsRow}>
        <Pressable
          style={[styles.cardActionBtn, isDone && styles.cardActionBtnDone]}
          onPress={() => onUpdateStatus(task.id, isDone ? 'pending' : 'done')}
        >
          <Text style={[styles.cardActionBtnText, isDone && { color: C.primary }]}>
            {isDone ? '✓ Completed' : 'Mark Completed'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.cardActionBtn}
          onPress={() => onViewInstructions(task)}
        >
          <Text style={styles.cardActionBtnText}>
            📋 Instructions
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

// --- Bottom Tab Icon components -----------------------------------------------
type TabIconProps = { active: boolean };
const TAB_ICON_COMPONENTS: Record<BottomTab, React.FC<TabIconProps>> = {
  Home: ({ active }) => <IconHome size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Family: ({ active }) => <IconFamily size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Activity: ({ active }) => <IconActivity size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
  Search: ({ active }) => <IconSearch size={24} color={active ? C.primary : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />,
};

// --- Completed Tasks Modal ----------------------------------------------------
const CompletedTasksModal = () => null;
const _unused_CompletedTasksModal = ({
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
                      onPress={() => onUndo(task.id)}
                      style={({ pressed }) => [styles.undoBtn, pressed && { opacity: 0.7 }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.undoBtnText}>↩ Undo</Text>
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

// ─── Unlinked Caregiver Warning Modal ──────────────────────────────
const UnlinkedCaregiverModal = ({
  visible,
  onClose,
  onSearch,
}: {
  visible: boolean;
  onClose: () => void;
  onSearch: () => void;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.alertOverlay}>
      <View style={styles.alertCard}>
        <View style={styles.alertIconWrap}>
          <Text style={styles.alertIcon}>🤝</Text>
        </View>
        <Text style={styles.alertTitle}>Find a Caregiver</Text>
        <Text style={styles.alertMessage}>
          You don't have a confirmed caregiver linked yet. Would you like to search for an experienced caregiver nearby?
        </Text>
        <View style={styles.alertBtnRow}>
          <Pressable
            style={({ pressed }) => [styles.alertCancelBtn, pressed && styles.alertBtnPressed]}
            onPress={onClose}
          >
            <Text style={styles.alertCancelText}>Later</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.alertConfirmBtn, pressed && styles.alertBtnPressed]}
            onPress={onSearch}
          >
            <Text style={styles.alertConfirmText}>Search Nearby</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

// --- Visual Instructions Modal -----------------------------------------------
const TaskInstructionsModal = ({
  visible, task, onClose,
}: {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
}) => {
  if (!task) return null;
  const meta = getTaskMeta(task.title);
  const displayEmoji = task.icon ?? meta.emoji;

  const renderSteps = (instructionsMd: string | undefined) => {
    if (!instructionsMd) {
      return <Text style={styles.noStepsText}>No visual steps configured by caregiver.</Text>;
    }
    let steps: Array<{ text: string; photo_url?: string }> = [];
    try {
      if (instructionsMd.trim().startsWith('[')) {
        steps = JSON.parse(instructionsMd);
      } else {
        steps = [{ text: instructionsMd }];
      }
    } catch {
      steps = [{ text: instructionsMd }];
    }

    if (steps.length === 0 || (steps.length === 1 && !steps[0].text && !steps[0].photo_url)) {
      return <Text style={styles.noStepsText}>No visual steps configured by caregiver.</Text>;
    }

    return (
      <View style={styles.stepsContainer}>
        {steps.map((step, idx) => (
          <View key={idx} style={styles.stepRow}>
            <View style={styles.stepNumberCircle}>
              <Text style={styles.stepNumberText}>{idx + 1}</Text>
            </View>
            <View style={styles.stepContent}>
              {!!step.text && <Text style={styles.stepText}>{step.text}</Text>}
              {!!step.photo_url && (
                <Image
                  source={{ uri: step.photo_url }}
                  style={styles.stepPhoto}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.detailOverlay} onPress={onClose}>
        <Pressable
          style={[styles.detailSheet, { maxHeight: '85%', paddingBottom: 0 }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Fixed header */}
          <View style={styles.detailHeader}>
            <Pressable style={styles.detailCloseBtn} onPress={onClose}>
              <Text style={styles.detailCloseText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.detailIllustration}>
            <Text style={styles.detailEmoji}>{displayEmoji}</Text>
          </View>

          <Text style={styles.detailTitle}>{task.title}</Text>

          <View style={styles.detailMetaRow}>
            <View style={styles.detailPill}>
              <Text style={styles.detailPillText}>{task.time}</Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <Text style={styles.detailInstructionLabel}>VISUAL INSTRUCTION STEPS</Text>

          {/* Scrollable steps — grows to fill remaining sheet space */}
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 20 }}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            {renderSteps(task.instructionsMd)}
          </ScrollView>

          {/* Fixed footer button */}
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}>
            <Pressable
              style={({ pressed }) => [styles.detailDoneBtn, { marginHorizontal: 0 }, pressed && { opacity: 0.85 }]}
              onPress={onClose}
            >
              <Text style={styles.detailDoneBtnText}>Got it</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// --- Main Screen --------------------------------------------------------------
export const PatientHomeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { status, user } = useAuth();
  const { tasks, loadTasksForPatient, updateTaskStatus } = useTasks();
  const isFocused = useIsFocused();
  // Accept initialTab from route params (from Games/Activities/Family screens)
  const initialTab = (route.params as any)?.initialTab as BottomTab | undefined;
  const [activeTab, setActiveTab] = useState<BottomTab>(initialTab ?? 'Home');
  const [currentDateTime] = useState(new Date());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [helpTask, setHelpTask] = useState<Task | null>(null);
  const [viewingInstructionsTask, setViewingInstructionsTask] = useState<Task | null>(null);

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Caregiver search sub-view state ─────────────────────
  const [searchSubView, setSearchSubView] = useState<'list' | 'detail' | null>(null);
  const [viewingCaregiver, setViewingCaregiver] = useState<CaregiverListing | null>(null);
  const { confirmedCaregiver, setConfirmedCaregiver, reloadCaregiver, loading } = useCaregiver();

  // Patient phone comes from auth — no AsyncStorage needed
  const patientId = status === 'authenticated' ? user?.id : null;

  useEffect(() => {
    if (!patientId || !isFocused) return;
    void loadTasksForPatient(patientId);
    // Poll for updates every 10s — frequent enough to stay fresh,
    // but gives the optimistic update enough time to persist before the next fetch.
    const interval = setInterval(() => {
      void loadTasksForPatient(patientId);
    }, 10_000);
    return () => clearInterval(interval);
  }, [patientId, isFocused, loadTasksForPatient]);

  // Raw tasks from context, filtered strictly to this patient
  const patientTasks: Task[] = useMemo(
    () => patientId
      ? tasks.filter((t: ContextTask) => t.patientId === patientId).map((t: ContextTask) => ({
          id: t.id, title: t.title, time: t.time,
          icon: t.icon,
          state: t.status === 'pending' ? null : (t.status as ActionState),
          instructionsMd: t.instructionsMd,
          description: t.description,
        }))
      : [],
    [tasks, patientId],
  );

  const handleUpdateTaskStatus = useCallback(
    async (taskId: string, newStatus: 'done' | 'unsure' | 'pending') => {
      try {
        await updateTaskStatus(taskId, newStatus);
      } catch (err) {
        console.warn('Failed to update task status:', err);
      }
    },
    [updateTaskStatus],
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

  // -- Location publishing — write pings to Supabase so caregivers can see us --
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

  // Load confirmed caregiver on mount
  React.useEffect(() => {
    if (patientId) void reloadCaregiver(patientId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const hasAlertedRef = useRef(false);

  React.useEffect(() => {
    if (!loading && patientId) {
      if (!confirmedCaregiver && !hasAlertedRef.current) {
        hasAlertedRef.current = true;
        setShowWarningModal(true);
      }
    }
  }, [loading, confirmedCaregiver, patientId]);

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



  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>

      {/* -- Family tab ---------------------------------------------------- */}
      {activeTab === 'Family' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerCard}>
            <View>
              <Text style={styles.greetingOverline}>FAMILY</Text>
              <Text style={[styles.greetingName, { fontSize: 26 }]}>My Care Team</Text>
            </View>
          </View>
          {confirmedCaregiver && confirmedCaregiver.status === 'CONFIRMED' ? (
            <View style={styles.mainRoutineCard}>
              <Text style={[styles.sectionTitle, { marginBottom: 14, fontSize: 14, letterSpacing: 0.6 }]}>YOUR CAREGIVER</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Text style={{ fontSize: 36 }}>{confirmedCaregiver.emoji || '👩‍⚕️'}</Text>
                <View>
                  <Text style={{ fontFamily: F.bold, fontSize: 18, color: C.textPrimary }}>{confirmedCaregiver.name}</Text>
                  <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.textSecondary }}>{confirmedCaregiver.specialty}</Text>
                </View>
              </View>
            </View>
          ) : confirmedCaregiver && confirmedCaregiver.status === 'PENDING' ? (
            <View style={styles.mainRoutineCard}>
              <Text style={[styles.sectionTitle, { marginBottom: 14, fontSize: 14, letterSpacing: 0.6 }]}>PENDING REQUEST</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                <Text style={{ fontSize: 36 }}>⏳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: F.bold, fontSize: 18, color: C.textPrimary }}>{confirmedCaregiver.name}</Text>
                  <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.textSecondary }}>{confirmedCaregiver.specialty}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 1, borderRadius: 10, padding: 12 }}>
                <Text style={{ fontFamily: F.medium, fontSize: 13, color: '#92400E', lineHeight: 18 }}>
                  Waiting for caregiver to accept your request. We'll update your dashboard as soon as they confirm!
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.mainRoutineCard, { alignItems: 'center', paddingVertical: 32 }]}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>👨‍👩‍👧</Text>
              <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.textPrimary, textAlign: 'center', marginBottom: 6 }}>No caregiver linked yet</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.textSecondary, textAlign: 'center' }}>
                Go to the Search tab to find and link a caregiver.
              </Text>
            </View>
          )}
        </ScrollView>

      /* -- Activity tab — render activities list inline ----------- */
      ) : activeTab === 'Activity' ? (
        <PatientActivitiesView navigation={navigation} />

      ) : activeTab === 'Search' && confirmedCaregiver && confirmedCaregiver.status === 'CONFIRMED' ? (
        // -- Confirmed Caregiver Profile Card ---------------------------------
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerCard}>
            <View>
              <Text style={styles.greetingOverline}>YOUR CAREGIVER</Text>
              <Text style={[styles.greetingName, { fontSize: 28 }]}>{confirmedCaregiver.name}</Text>
              <Text style={styles.greetingDate}>{confirmedCaregiver.specialty}</Text>
            </View>
            <View style={[styles.caregiverTile, { backgroundColor: '#e8f5e9' }]}>
              <Text style={styles.caregiverIcon}>{confirmedCaregiver.emoji || '🧑‍⚕️'}</Text>
            </View>
          </View>

          <View style={[styles.mainRoutineCard, { marginBottom: 12 }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 14, fontSize: 14, letterSpacing: 0.6 }]}>CONTACT DETAILS</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 18, marginRight: 10 }}>📞</Text>
              <View>
                <Text style={{ fontFamily: F.medium, fontSize: 11, color: C.textSecondary }}>Phone Number</Text>
                <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.textPrimary }}>{confirmedCaregiver.id || 'Not available'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, marginRight: 10 }}>📍</Text>
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
          linkStatus={
            confirmedCaregiver?.id === viewingCaregiver.id
              ? (confirmedCaregiver.status || 'PENDING')
              : null
          }
          onBack={() => {
            if (confirmedCaregiver && confirmedCaregiver.status === 'CONFIRMED') {
              // Already requested/confirmed — back goes to Home, not the search list
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
            // Stay on the same detail screen and reload caregiver status
            if (patientId) {
              await reloadCaregiver(patientId, true);
            }
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
          {/* -- Header --------------------------------------------------- */}
          <View style={styles.headerCard}>
            <View>
              <Text style={styles.greetingOverline}>{getGreeting()},</Text>
              <Text style={styles.greetingName}>{displayName}</Text>
              <Text style={styles.greetingDate}>{formattedDate}</Text>
            </View>
            {confirmedCaregiver && confirmedCaregiver.status === 'CONFIRMED' && (
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

          {/* -- Location sharing status pill --------------------------- */}
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
                {locationStatus === 'sharing' ? '📡 Sharing location with caregiver' :
                 locationStatus === 'error'   ? '⚠️ Location sharing failed — re-run supabase_geofence_schema.sql' :
                                               '🔒 Location permission denied'}
              </Text>
            </View>
          )}

          {/* -- Your Routine ---------------------------------------------- */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitleIcon}>🕒</Text>
              <Text style={styles.sectionTitle}>Your Routine</Text>
            </View>
          </View>

          {patientTasks.length > 0 ? (
            <View style={{ gap: 12, marginBottom: 20 }}>
              {patientTasks.map((task) => (
                <RoutineCard
                  key={task.id}
                  task={task}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onViewInstructions={setViewingInstructionsTask}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No tasks assigned yet.</Text>
          )}

          {/* Modals rendered inside ScrollView so they're always present */}
          <UnlinkedCaregiverModal
            visible={showWarningModal}
            onClose={() => setShowWarningModal(false)}
            onSearch={() => {
              setShowWarningModal(false);
              setActiveTab('Search');
              setSearchSubView('list');
            }}
          />
          <TaskInstructionsModal
            visible={viewingInstructionsTask !== null}
            task={viewingInstructionsTask}
            onClose={() => setViewingInstructionsTask(null)}
          />
        </ScrollView>
      )}

      {/* -- Bottom Nav: Left 2 | FAB center | Right 2 ---------------- */}
      <View style={styles.bottomBarBand}>
        {/* Left tabs */}
        <View style={styles.bottomBar}>
          {(['Home', 'Family'] as BottomTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent = TAB_ICON_COMPONENTS[tab];
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}  // inline — no navigation.navigate()
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
              tab === 'Search' && confirmedCaregiver && confirmedCaregiver.status === 'CONFIRMED'
                ? IconProfile
                : TAB_ICON_COMPONENTS[tab];
            const label =
              tab === 'Search'
                ? (confirmedCaregiver && confirmedCaregiver.status === 'CONFIRMED' ? 'Caregiver Profile' : 'Search')
                : tab;
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  // All tabs render inline — no navigation.navigate()
                  setActiveTab(tab);
                  if (tab === 'Search') {
                    if (confirmedCaregiver && confirmedCaregiver.status === 'CONFIRMED') {
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

// --- Styles ------------------------------------------------------------------
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

  // -- Overlay/sheet ---------------------------------------------------------
  detailOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24,
  },
  detailSheet: {
    width: '100%', backgroundColor: C.bg,
    borderRadius: 28, paddingBottom: 28,
    flexDirection: 'column',
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

  // -- Caregiver profile modal ------------------------------------------------
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

  // -- Completed Tasks Modal --------------------------------------------------
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, maxHeight: '75%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontFamily: F.bold, fontSize: 18, color: C.textPrimary },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontFamily: F.bold, fontSize: 15, color: C.textMuted },

  // -- Undo button ------------------------------------------------------------
  undoBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    marginLeft: 8,
  },
  undoBtnText: { fontFamily: F.bold, fontSize: 12, color: C.textMuted },

  // -- Bottom nav -------------------------------------------------------------
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

  // Unlinked Caregiver custom dialog styles
  alertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  alertCard: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 24,
    width: '84%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },
  alertIconWrap: {
    backgroundColor: C.primaryLight,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  alertIcon: {
    fontSize: 28,
  },
  alertTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: C.textPrimary,
    marginBottom: 8,
  },
  alertMessage: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  alertBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  alertCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
  },
  alertCancelText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.textSecondary,
  },
  alertConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
  },
  alertConfirmText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  alertBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    borderRadius: 10,
  },
  cardActionBtnDone: {
    backgroundColor: '#E6F4EA',
    borderColor: '#86EFAC',
  },
  cardActionBtnUnsure: {
    backgroundColor: '#FFEDD5',
    borderColor: '#FDBA74',
  },
  cardActionBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.textSecondary,
  },
  noStepsText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
    fontStyle: 'italic',
  },
  stepsContainer: {
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepNumberCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontFamily: F.extraBold,
    fontSize: 10,
    color: C.textSecondary,
  },
  stepContent: {
    flex: 1,
    gap: 8,
  },
  stepText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textPrimary,
    lineHeight: 18,
  },
  stepPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
});
