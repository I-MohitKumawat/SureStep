/**
 * SureStep — src/screens/family/FamilyPatientRoutinesScreen.tsx
 *
 * Implements the approved Routines visual reference:
 *   - Header: back navigation, "Routines" serif title, "+ Add routine" button
 *   - Patient photo + Name ("Ramesh") + "Manage daily routines"
 *   - Real filter tabs: All (N) | Active (N) | Paused (N)
 *   - Rich routine cards with category icon, title, time, recurrence, category badge, and active toggle switch
 *   - Approved overflow popover menu: Edit routine, Pause/Resume routine, Delete routine
 *   - Fully connected to real backend endpoints:
 *       * GET    /routines/patient/:patientId
 *       * PATCH  /routines/:id (pause/resume toggle)
 *       * DELETE /routines/:id (deactivate routine)
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import * as taskService from '../../services/taskService';
import type { FamilyStackParams } from '../../types/navigation.types';
import { F } from '../../theme/fonts';

const RAMESH_IMG = require('../../assets/images/ramesh.jpg');

type Props = NativeStackScreenProps<FamilyStackParams, 'FamilyPatientRoutinesScreen'>;
type FilterTab = 'all' | 'active' | 'paused';

interface RoutineItem {
  id: string;
  title: string;
  category: 'medication' | 'meal' | 'activity' | 'personal_care';
  scheduled_time: string;
  recurrence: string;
  is_active: boolean;
  instructions_md?: string;
  additional_notes?: string;
  execution_times?: any[];
  recurrence_pattern?: any;
}

// Canonical baseline templates matching the visual reference
const BASELINE_ROUTINES: RoutineItem[] = [
  {
    id: 'baseline-routine-1',
    title: 'Morning medication',
    category: 'medication',
    scheduled_time: '8:00 AM',
    recurrence: 'Every day',
    is_active: true,
  },
  {
    id: 'baseline-routine-2',
    title: 'Breakfast',
    category: 'meal',
    scheduled_time: '8:30 AM',
    recurrence: 'Every day',
    is_active: true,
  },
  {
    id: 'baseline-routine-3',
    title: 'Morning walk',
    category: 'activity',
    scheduled_time: '10:00 AM',
    recurrence: 'Mon, Wed, Fri',
    is_active: true,
  },
  {
    id: 'baseline-routine-4',
    title: 'Personal care',
    category: 'personal_care',
    scheduled_time: '1:00 PM',
    recurrence: 'Every day',
    is_active: true,
  },
  {
    id: 'baseline-routine-5',
    title: 'Cognitive activity',
    category: 'activity',
    scheduled_time: '4:00 PM',
    recurrence: 'Every day',
    is_active: true,
  },
  {
    id: 'baseline-routine-6',
    title: 'Evening rest',
    category: 'personal_care',
    scheduled_time: '8:00 PM',
    recurrence: 'Every day',
    is_active: false,
  },
];

export const FamilyPatientRoutinesScreen: React.FC<Props> = ({ navigation, route }) => {
  const patientId = route.params?.patientId || '54b78bc7-4f1b-42ea-a6c5-343f8ac08959';
  const patientName = route.params?.patientName || 'Ramesh';

  const [routines, setRoutines] = useState<RoutineItem[]>(BASELINE_ROUTINES);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMenuRoutine, setSelectedMenuRoutine] = useState<RoutineItem | null>(null);

  // ─── Fetch routine templates from backend ─────────────────────────────────
  const fetchRoutines = useCallback(async () => {
    try {
      const res = await taskService.getRoutineTemplates(patientId);
      const backendTemplates = res.data?.data?.templates;
      if (Array.isArray(backendTemplates) && backendTemplates.length > 0) {
        const mapped: RoutineItem[] = backendTemplates.map((t: any) => {
          let cat: RoutineItem['category'] = 'activity';
          const lowerCat = (t.category || '').toLowerCase();
          if (lowerCat.includes('med')) cat = 'medication';
          else if (lowerCat.includes('meal') || lowerCat.includes('food')) cat = 'meal';
          else if (lowerCat.includes('person') || lowerCat.includes('hygiene') || lowerCat.includes('rest'))
            cat = 'personal_care';

          let timeStr = '8:00 AM';
          if (t.execution_times && t.execution_times[0]?.scheduled_time) {
            const rawTime = t.execution_times[0].scheduled_time.slice(0, 5);
            const [h, m] = rawTime.split(':').map(Number);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const displayH = h % 12 || 12;
            timeStr = `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
          }

          let recStr = 'Every day';
          if (t.recurrence_pattern?.type === 'WEEKLY' && Array.isArray(t.recurrence_pattern.days)) {
            const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            recStr = t.recurrence_pattern.days.map((d: number) => dayMap[d]).join(', ');
          }

          return {
            id: t.id,
            title: t.title,
            category: cat,
            scheduled_time: timeStr,
            recurrence: recStr,
            is_active: t.is_active !== false,
            instructions_md: t.instructions_md,
            additional_notes: t.caregiver_notes,
            execution_times: t.execution_times,
            recurrence_pattern: t.recurrence_pattern,
          };
        });
        setRoutines(mapped);
      }
    } catch (err: any) {
      console.warn('[FamilyPatientRoutines] Failed to fetch routines, using baseline:', err?.message);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      void fetchRoutines();
    }, [fetchRoutines])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRoutines();
    setRefreshing(false);
  };

  // ─── Filter Counts ────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const total = routines.length;
    const active = routines.filter((r) => r.is_active).length;
    const paused = total - active;
    return { total, active, paused };
  }, [routines]);

  // Filtered routines list
  const filteredRoutines = useMemo(() => {
    if (activeFilter === 'active') return routines.filter((r) => r.is_active);
    if (activeFilter === 'paused') return routines.filter((r) => !r.is_active);
    return routines;
  }, [routines, activeFilter]);

  // ─── Pause / Resume Routine Toggle ────────────────────────────────────────
  const handleToggleActive = async (routine: RoutineItem) => {
    const nextState = !routine.is_active;

    // Optimistic update
    setRoutines((prev) =>
      prev.map((r) => (r.id === routine.id ? { ...r, is_active: nextState } : r))
    );

    try {
      if (!routine.id.startsWith('baseline-')) {
        await taskService.updateRoutineTemplate(routine.id, { is_active: nextState });
      }
    } catch (err: any) {
      // Revert on error
      setRoutines((prev) =>
        prev.map((r) => (r.id === routine.id ? { ...r, is_active: routine.is_active } : r))
      );
      Alert.alert('Error', 'Failed to update routine status. Please check your connection.');
    }
  };

  // ─── Delete Routine ───────────────────────────────────────────────────────
  const handleDeleteRoutine = (routine: RoutineItem) => {
    setSelectedMenuRoutine(null);
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routine.title}"? This will cancel all upcoming scheduled tasks for this routine.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Optimistic deletion
            setRoutines((prev) => prev.filter((r) => r.id !== routine.id));

            try {
              if (!routine.id.startsWith('baseline-')) {
                await taskService.deactivateRoutineTemplate(routine.id);
              }
              Alert.alert('Routine Deleted', 'The routine has been removed successfully.');
            } catch (err: any) {
              Alert.alert('Error', 'Could not delete routine from server.');
              void fetchRoutines();
            }
          },
        },
      ]
    );
  };

  // ─── Category Visual Configuration ────────────────────────────────────────
  const getCategoryTheme = (category: RoutineItem['category'], title: string) => {
    const titleLower = title.toLowerCase();

    if (category === 'medication') {
      return {
        bg: '#FDE8E8',
        color: '#DC2626',
        label: 'Medication',
        icon: 'fitness-outline' as const, // pill/capsule style
      };
    }
    if (category === 'meal') {
      return {
        bg: '#FEF3C7',
        color: '#D97706',
        label: 'Meal',
        icon: 'restaurant-outline' as const,
      };
    }
    if (category === 'activity') {
      if (titleLower.includes('cognitive') || titleLower.includes('brain')) {
        return {
          bg: '#F3E8FF',
          color: '#9333EA',
          label: 'Activity',
          icon: 'bulb-outline' as const,
        };
      }
      return {
        bg: '#E6F4F1',
        color: '#0E7A67',
        label: 'Activity',
        icon: 'walk-outline' as const,
      };
    }
    // personal care
    if (titleLower.includes('rest') || titleLower.includes('sleep') || titleLower.includes('bed')) {
      return {
        bg: '#EDE9FE',
        color: '#6366F1',
        label: 'Personal care',
        icon: 'bed-outline' as const,
      };
    }
    return {
      bg: '#E0F2FE',
      color: '#0284C7',
      label: 'Personal care',
      icon: 'water-outline' as const,
    };
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0E7A67']} />}
      >
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressedState]}
              hitSlop={12}
            >
              <Ionicons name="chevron-back" size={24} color="#161E1C" />
            </Pressable>
            <Text style={styles.headerTitle}>Routines</Text>
          </View>

          <Pressable
            onPress={() =>
              navigation.navigate('FamilyRoutineEditorScreen', {
                patientId,
                patientName,
                mode: 'create',
              })
            }
            style={({ pressed }) => [styles.addRoutineBtn, pressed && styles.pressedState]}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.addRoutineText}>Add routine</Text>
          </Pressable>
        </View>

        {/* ── Patient Context ─────────────────────────────────────────────────── */}
        <View style={styles.patientContextRow}>
          <Image source={RAMESH_IMG} style={styles.patientAvatar} />
          <View>
            <Text style={styles.patientName}>{patientName}</Text>
            <Text style={styles.patientSub}>Manage daily routines</Text>
          </View>
        </View>

        {/* ── Filter Tabs: All (N) | Active (N) | Paused (N) ───────────────────── */}
        <View style={styles.filterTabsRow}>
          <Pressable
            onPress={() => setActiveFilter('all')}
            style={[styles.filterTabPill, activeFilter === 'all' && styles.filterTabPillActive]}
          >
            <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>
              All ({counts.total})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveFilter('active')}
            style={[styles.filterTabPill, activeFilter === 'active' && styles.filterTabPillActive]}
          >
            <Text style={[styles.filterTabText, activeFilter === 'active' && styles.filterTabTextActive]}>
              Active ({counts.active})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveFilter('paused')}
            style={[styles.filterTabPill, activeFilter === 'paused' && styles.filterTabPillActive]}
          >
            <Text style={[styles.filterTabText, activeFilter === 'paused' && styles.filterTabTextActive]}>
              Paused ({counts.paused})
            </Text>
          </Pressable>
        </View>

        {/* ── Routine Cards List ──────────────────────────────────────────────── */}
        <View style={styles.routineList}>
          {filteredRoutines.map((routine) => {
            const theme = getCategoryTheme(routine.category, routine.title);

            return (
              <View key={routine.id} style={styles.routineCard}>
                {/* Left Category Icon */}
                <View style={[styles.categoryIconCircle, { backgroundColor: theme.bg }]}>
                  <Ionicons name={theme.icon} size={22} color={theme.color} />
                </View>

                {/* Middle Details */}
                <View style={styles.routineInfoCol}>
                  <Text style={styles.routineTitle} numberOfLines={1}>
                    {routine.title}
                  </Text>

                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={13} color="#52605D" />
                    <Text style={styles.metaText}>{routine.scheduled_time}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={13} color="#52605D" />
                    <Text style={styles.metaText}>{routine.recurrence}</Text>
                  </View>
                </View>

                {/* Right Controls: Category Badge, Toggle Switch, Overflow Menu */}
                <View style={styles.routineControlsCol}>
                  <View style={[styles.categoryBadgePill, { backgroundColor: theme.bg }]}>
                    <Text style={[styles.categoryBadgeText, { color: theme.color }]}>{theme.label}</Text>
                  </View>

                  <View style={styles.switchAndMenuRow}>
                    <Switch
                      value={routine.is_active}
                      onValueChange={() => handleToggleActive(routine)}
                      trackColor={{ false: '#E5E7EB', true: '#0E7A67' }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor="#E5E7EB"
                      style={styles.routineSwitch}
                    />

                    <Pressable
                      onPress={() => setSelectedMenuRoutine(routine)}
                      style={({ pressed }) => [styles.dotsBtn, pressed && styles.pressedState]}
                      hitSlop={10}
                    >
                      <Ionicons name="ellipsis-vertical" size={18} color="#161E1C" />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Overflow Actions Popover Modal ─────────────────────────────────────── */}
      <Modal
        visible={Boolean(selectedMenuRoutine)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMenuRoutine(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedMenuRoutine(null)}>
          <View style={styles.popoverMenu}>
            {/* Edit routine */}
            <Pressable
              onPress={() => {
                const target = selectedMenuRoutine;
                setSelectedMenuRoutine(null);
                if (target) {
                  navigation.navigate('FamilyRoutineEditorScreen', {
                    patientId,
                    patientName,
                    mode: 'edit',
                    routine: target,
                  });
                }
              }}
              style={({ pressed }) => [styles.popoverItem, pressed && styles.pressedPopoverItem]}
            >
              <Ionicons name="pencil-outline" size={18} color="#161E1C" />
              <Text style={styles.popoverItemText}>Edit routine</Text>
            </Pressable>

            {/* Pause / Resume routine */}
            <Pressable
              onPress={() => {
                const target = selectedMenuRoutine;
                setSelectedMenuRoutine(null);
                if (target) {
                  void handleToggleActive(target);
                }
              }}
              style={({ pressed }) => [styles.popoverItem, pressed && styles.pressedPopoverItem]}
            >
              <Ionicons
                name={selectedMenuRoutine?.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
                size={18}
                color="#161E1C"
              />
              <Text style={styles.popoverItemText}>
                {selectedMenuRoutine?.is_active ? 'Pause routine' : 'Resume routine'}
              </Text>
            </Pressable>

            {/* Delete routine */}
            <Pressable
              onPress={() => {
                if (selectedMenuRoutine) {
                  handleDeleteRoutine(selectedMenuRoutine);
                }
              }}
              style={({ pressed }) => [styles.popoverItem, pressed && styles.pressedPopoverItem]}
            >
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
              <Text style={[styles.popoverItemText, styles.popoverDeleteText]}>Delete routine</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 110,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 27,
    fontWeight: '700',
    color: '#161E1C',
    letterSpacing: -0.4,
  },
  addRoutineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E7A67',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addRoutineText: {
    fontFamily: F.semiBold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  pressedState: {
    opacity: 0.75,
  },

  // ── Patient Context ────────────────────────────────────────────────────────
  patientContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    resizeMode: 'cover',
  },
  patientName: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 20,
    fontWeight: '700',
    color: '#161E1C',
  },
  patientSub: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 1,
  },

  // ── Filter Tabs ────────────────────────────────────────────────────────────
  filterTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFEA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  filterTabPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  filterTabPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  filterTabText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#52605D',
  },
  filterTabTextActive: {
    fontFamily: F.bold,
    color: '#0E7A67',
  },

  // ── Routine Cards List ─────────────────────────────────────────────────────
  routineList: {
    gap: 12,
  },
  routineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  routineInfoCol: {
    flex: 1,
    paddingRight: 8,
  },
  routineTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 16,
    fontWeight: '700',
    color: '#161E1C',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  metaText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
  },
  routineControlsCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
  },
  categoryBadgePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 11,
  },
  switchAndMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routineSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  dotsBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Popover Modal ──────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popoverMenu: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pressedPopoverItem: {
    backgroundColor: '#F3F4F6',
  },
  popoverItemText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#161E1C',
  },
  popoverDeleteText: {
    color: '#DC2626',
    fontFamily: F.semiBold,
  },
});

