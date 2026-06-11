/**
 * SureStep — src/components/shared/ReminderOverlay.tsx
 *
 * Full-screen overlay shown when a patient has an active reminder.
 * Rendered at PatientNavigator level (above all screens).
 * Controlled by ReminderContext.
 *
 * Actions:
 *   ✅ Complete  — marks done, dismisses overlay
 *   ⏰ Snooze    — 5 / 10 / 15 min options
 *   ✕  Skip     — marks skipped, dismisses overlay
 *
 * Escalation badge: shown when escalation_level > 0 (reminder has been
 * re-notified by the backend sweep engine).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReminders } from '../../context/ReminderContext';
import { C, patientC, SOS_RED } from '../../theme/colors';
import { F } from '../../theme/fonts';

const SNOOZE_OPTIONS = [5, 10, 15] as const;

export const ReminderOverlay: React.FC = () => {
  const { activeReminder, completeReminder, snoozeReminder, skipReminder } = useReminders();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);

  const scale   = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeReminder) {
      setShowSnoozeMenu(false);
      setLoadingAction(null);
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 280 }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale,   { toValue: 0.85, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0,    duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [activeReminder]);

  if (!activeReminder) return null;

  const isEscalated = activeReminder.escalation_level > 0;

  const handleComplete = async () => {
    setLoadingAction('complete');
    try {
      await completeReminder(activeReminder.id);
    } catch { /* already logged */ }
    setLoadingAction(null);
  };

  const handleSnooze = async (minutes: number) => {
    setShowSnoozeMenu(false);
    setLoadingAction(`snooze_${minutes}`);
    try {
      await snoozeReminder(activeReminder.id, minutes);
    } catch { /* already logged */ }
    setLoadingAction(null);
  };

  const handleSkip = async () => {
    setLoadingAction('skip');
    try {
      await skipReminder(activeReminder.id);
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

          {/* Snooze + Skip row */}
          <View style={styles.secondaryRow}>
            {/* Snooze */}
            <View style={styles.snoozeWrapper}>
              <Pressable
                style={({ pressed }) => [styles.snoozeBtn, pressed && styles.btnPressed]}
                onPress={() => setShowSnoozeMenu((v) => !v)}
                disabled={!!loadingAction}
              >
                <Ionicons name="time-outline" size={18} color={patientC.primary} />
                <Text style={styles.snoozeBtnText}>Snooze</Text>
                <Ionicons
                  name={showSnoozeMenu ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={patientC.primary}
                />
              </Pressable>

              {showSnoozeMenu && (
                <View style={styles.snoozeMenu}>
                  {SNOOZE_OPTIONS.map((min) => (
                    <Pressable
                      key={min}
                      style={({ pressed }) => [styles.snoozeOption, pressed && styles.btnPressed]}
                      onPress={() => handleSnooze(min)}
                    >
                      <Text style={styles.snoozeOptionText}>{min} min</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Skip */}
            <Pressable
              style={({ pressed }) => [styles.skipBtn, pressed && styles.btnPressed]}
              onPress={handleSkip}
              disabled={!!loadingAction}
            >
              <Text style={styles.skipBtnText}>
                {loadingAction === 'skip' ? 'Skipping…' : 'Skip'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
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
  snoozeWrapper: {
    flex: 1,
    position: 'relative',
  },
  snoozeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: patientC.soft,
    borderRadius: 14,
    paddingVertical: 14,
  },
  snoozeBtnText: {
    fontSize: 14,
    fontFamily: F.semiBold,
    color: patientC.primary,
  },
  snoozeMenu: {
    position: 'absolute',
    bottom: '110%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  snoozeOption: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  snoozeOptionText: {
    fontSize: 14,
    fontFamily: F.medium,
    color: patientC.primary,
    textAlign: 'center',
  },
  skipBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.skipBg,
    borderRadius: 14,
    paddingVertical: 14,
  },
  skipBtnText: {
    fontSize: 14,
    fontFamily: F.semiBold,
    color: C.textSecondary,
  },
  btnPressed: {
    opacity: 0.75,
  },
});
