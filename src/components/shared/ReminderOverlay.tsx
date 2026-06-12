/**
 * SureStep — src/components/shared/ReminderOverlay.tsx
 *
 * Full-screen overlay shown when a patient has an active reminder.
 * Rendered at PatientNavigator level (above all screens).
 * Controlled by ReminderContext.
 *
 * Actions:
 *   ✅ Complete  — marks done, dismisses overlay
 *   ⏰ Snooze    — snoozes for 5 minutes
 *   📖 Instructions — opens scrollable visual instructions modal
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useReminders } from '../../context/ReminderContext';
import { useTasks } from '../../context/TaskContext';
import { TaskInstructionsModal } from '../patient/TaskInstructionsModal';
import type { Task } from '../patient/RoutineCard';
import { C, patientC } from '../../theme/colors';
import { F } from '../../theme/fonts';

export const ReminderOverlay: React.FC = () => {
  const {
    activeReminder,
    completeReminder,
    snoozeReminder,
    showInstructionsOnOpen,
    setShowInstructionsOnOpen,
  } = useReminders();
  const { tasks } = useTasks();

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const scale   = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Alarm Sound and Vibration Management
  const soundRef = useRef<Audio.Sound | null>(null);
  const vibrationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAlarmEffects = useCallback(async () => {
    // Stop vibration
    Vibration.cancel();
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }

    // Stop audio
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (err) {
        console.warn('[AlarmEffects] Failed to stop/unload sound:', err);
      }
      soundRef.current = null;
    }
  }, []);

  const startAlarmEffects = useCallback(async () => {
    await stopAlarmEffects();

    // 1. Start Repeating Vibration
    const vibrationPattern = [1000, 1000]; // Vibrate 1s, pause 1s
    Vibration.vibrate(vibrationPattern, true);

    vibrationIntervalRef.current = setInterval(() => {
      Vibration.vibrate(vibrationPattern, true);
    }, 4000);

    // 2. Play Alarm Sound
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav' },
        { isLooping: true, volume: 1.0 }
      );
      soundRef.current = sound;
      await sound.playAsync();
    } catch (err) {
      console.warn('[AlarmEffects] Failed to load/play alarm sound:', err);
    }
  }, [stopAlarmEffects]);

  useEffect(() => {
    if (activeReminder) {
      setLoadingAction(null);
      void startAlarmEffects();

      if (showInstructionsOnOpen) {
        setShowInstructions(true);
        setShowInstructionsOnOpen(false);
      }

      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 280 }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      void stopAlarmEffects();

      Animated.parallel([
        Animated.timing(scale,   { toValue: 0.85, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0,    duration: 200, useNativeDriver: true }),
      ]).start();
    }

    return () => {
      void stopAlarmEffects();
    };
  }, [activeReminder, startAlarmEffects, stopAlarmEffects, scale, opacity]);

  if (!activeReminder) return null;

  const isEscalated = activeReminder.escalation_level > 0;
  const isRoutine = activeReminder.reference_type === 'ROUTINE';

  // Find corresponding task in task context
  const matchingTask = activeReminder.reference_id
    ? tasks.find((t) => t.id === activeReminder.reference_id)
    : null;

  // Build fallback task object for TaskInstructionsModal if needed
  const taskForInstructions: Task | null = matchingTask
    ? {
        id: matchingTask.id,
        title: matchingTask.title,
        time: matchingTask.time,
        icon: matchingTask.icon,
        state: matchingTask.status === 'pending' ? null : (matchingTask.status as any),
        instructionsMd: matchingTask.instructionsMd,
        description: matchingTask.description,
      }
    : {
        id: activeReminder.reference_id || activeReminder.id,
        title: activeReminder.title,
        time: new Date(activeReminder.scheduled_at).toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', hour12: true,
        }),
        icon: '🕒',
        state: null,
        instructionsMd: activeReminder.body || '',
        description: activeReminder.body || '',
      };

  const handleComplete = async () => {
    setLoadingAction('complete');
    try {
      await completeReminder(activeReminder.id);
    } catch { /* already logged */ }
    setLoadingAction(null);
  };

  const handleSnoozeDirect = async () => {
    setLoadingAction('snooze');
    try {
      await snoozeReminder(activeReminder.id, 5); // default to 5 minutes snooze
    } catch { /* already logged */ }
    setLoadingAction(null);
  };

  const scheduledTime = (() => {
    try {
      return new Date(activeReminder.scheduled_at).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
      });
    } catch { return ''; }
  })();

  return (
    <Modal
      visible={!!activeReminder}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
          {/* Escalation badge */}
          {isEscalated && (
            <View style={styles.escalationBadge}>
              <Ionicons name="alert-circle" size={14} color="#FFFFFF" />
              <Text style={styles.escalationText}>
                Reminder #{activeReminder.escalation_level + 1}
              </Text>
            </View>
          )}

          {/* Icon */}
          <View style={styles.iconRing}>
            <Ionicons name="alarm" size={36} color={patientC.primary} />
          </View>

          {/* Time */}
          {!!scheduledTime && (
            <Text style={styles.timeText}>{scheduledTime}</Text>
          )}

          {/* Title */}
          <Text style={styles.titleText}>{activeReminder.title}</Text>

          {/* Body */}
          {!!activeReminder.body && (
            <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.bodyText}>{activeReminder.body}</Text>
            </ScrollView>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Complete */}
          <Pressable
            style={({ pressed }) => [styles.completeBtn, pressed && styles.btnPressed]}
            onPress={handleComplete}
            disabled={!!loadingAction}
          >
            <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
            <Text style={styles.completeBtnText}>
              {loadingAction === 'complete' ? 'Completing…' : 'Complete'}
            </Text>
          </Pressable>

          {/* Snooze + Instructions row */}
          <View style={styles.secondaryRow}>
            {/* Snooze */}
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
              onPress={handleSnoozeDirect}
              disabled={!!loadingAction}
            >
              <Ionicons name="time-outline" size={18} color={patientC.primary} />
              <Text style={styles.secondaryBtnText}>
                {loadingAction === 'snooze' ? 'Snoozing…' : 'Snooze (5m)'}
              </Text>
            </Pressable>

            {/* View Instructions */}
            {isRoutine && (
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  { backgroundColor: patientC.soft },
                  pressed && styles.btnPressed
                ]}
                onPress={() => setShowInstructions(true)}
                disabled={!!loadingAction}
              >
                <Ionicons name="book-outline" size={18} color={patientC.primary} />
                <Text style={styles.secondaryBtnText}>Instructions</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Routine Instructions modal (rendered on top of overlay) */}
      {isRoutine && taskForInstructions && (
        <TaskInstructionsModal
          visible={showInstructions}
          task={taskForInstructions}
          onClose={() => setShowInstructions(false)}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  escalationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 4,
  },
  escalationText: {
    fontSize: 12,
    fontFamily: F.bold,
    color: '#FFFFFF',
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: patientC.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 13,
    fontFamily: F.medium,
    color: C.textSecondary,
  },
  titleText: {
    fontSize: 22,
    fontFamily: F.bold,
    color: C.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },
  bodyScroll: {
    maxHeight: 100,
    width: '100%',
  },
  bodyText: {
    fontSize: 14,
    fontFamily: F.regular,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: C.border,
    marginVertical: 4,
  },
  completeBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: patientC.primary,
    borderRadius: 18,
    paddingVertical: 16,
  },
  completeBtnText: {
    fontSize: 16,
    fontFamily: F.bold,
    color: '#FFFFFF',
  },
  secondaryRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: patientC.soft,
    borderRadius: 14,
    paddingVertical: 14,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: F.semiBold,
    color: patientC.primary,
  },
  btnPressed: {
    opacity: 0.75,
  },
});
