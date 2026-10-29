/**
 * SureStep — src/screens/family/PatientRoutinesScreen.tsx
 * Visual source of truth: Calm Healthcare Routine Manager UI.png
 *
 * Implements Routine Manager for Family:
 *   - Header: Back arrow, "Routines", "+ Add routine" button
 *   - Patient card: Avatar, Name, "Manage daily routines"
 *   - Filter tabs: All (N) | Active (N) | Paused (N)
 *   - Routine Cards: Category icon, Title, Category badge, Time, Recurrence, Switch toggle, 3-dots menu
 *   - Actions: Edit routine, Pause/Resume routine, Delete routine
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useFamilyContext } from '../../context/FamilyContext';
import {
  fetchRoutineDefinitions,
  updateRoutineDefinition,
  deleteRoutineDefinition,
  type RoutineDefinition,
} from '../../services/routineService';
import type { FamilyStackParams } from '../../types/navigation.types';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

type NavigationProp = NativeStackNavigationProp<FamilyStackParams>;
type ScreenRouteProp = RouteProp<FamilyStackParams, 'PatientRoutinesScreen'>;

type FilterTab = 'ALL' | 'ACTIVE' | 'PAUSED';

export const PatientRoutinesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { patientId } = route.params;

  const { patients } = useFamilyContext();
  const currentPatient = patients.find((p) => p.id === patientId);
  const patientName = currentPatient?.name || route.params.patientName || 'Patient';

  const [routines, setRoutines] = useState<RoutineDefinition[]>([]);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeMenuRoutine, setActiveMenuRoutine] = useState<RoutineDefinition | null>(null);

  const loadRoutines = useCallback(async () => {
    try {
      const data = await fetchRoutineDefinitions(patientId);
      setRoutines(data);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      void loadRoutines();
    });
    void loadRoutines();
    return unsubscribe;
  }, [navigation, loadRoutines]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRoutines();
    setRefreshing(false);
  };

  const handleToggleStatus = async (routine: RoutineDefinition) => {
    const nextStatus = routine.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      // Optimistic update
      setRoutines((prev) =>
        prev.map((r) => (r.id === routine.id ? { ...r, status: nextStatus } : r))
      );
      await updateRoutineDefinition(patientId, routine.id, { status: nextStatus });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error?.message || 'Failed to update routine status.');
      void loadRoutines();
    }
  };

  const handleDeleteRoutine = (routine: RoutineDefinition) => {
    setActiveMenuRoutine(null);
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routine.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRoutineDefinition(patientId, routine.id);
              setRoutines((prev) => prev.filter((r) => r.id !== routine.id));
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error?.message || 'Failed to delete routine.');
            }
          },
        },
      ]
    );
  };

  const getCategoryTheme = (cat: string) => {
    const c = (cat || '').toUpperCase();
    if (c === 'MEDICATION') {
      return { icon: 'pill', bg: '#FEE2E2', color: '#DC2626', label: 'Medication' };
    }
    if (c === 'MEAL') {
      return { icon: 'food-fork-drink', bg: '#FEF3C7', color: '#D97706', label: 'Meal' };
    }
    if (c === 'ACTIVITY') {
      return { icon: 'walk', bg: '#D1FAE5', color: '#059669', label: 'Activity' };
    }
    if (c === 'HYGIENE' || c === 'PERSONAL_CARE') {
      return { icon: 'shower', bg: '#DBEAFE', color: '#2563EB', label: 'Personal care' };
    }
    return { icon: 'brain', bg: '#EDE9FE', color: '#7C3AED', label: 'Routine' };
  };

  const activeCount = routines.filter((r) => r.status === 'ACTIVE').length;
  const pausedCount = routines.filter((r) => r.status === 'PAUSED').length;

  const filteredRoutines = routines.filter((r) => {
    if (filter === 'ACTIVE') return r.status === 'ACTIVE';
    if (filter === 'PAUSED') return r.status === 'PAUSED';
    return true;
  });

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color="#161E1C" />
        </Pressable>

        <Text style={styles.headerTitle}>Routines</Text>

        <Pressable
          style={styles.addRoutineBtn}
          onPress={() =>
            navigation.navigate('PatientRoutineEditorScreen', {
              patientId,
              patientName,
              mode: 'create',
            })
          }
        >
          <Feather name="plus-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.addRoutineBtnText}>Add routine</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Patient Summary Card */}
        <View style={styles.patientSummaryCard}>
          {currentPatient?.photo_url ? (
            <Image source={{ uri: currentPatient.photo_url }} style={styles.patientAvatar} />
          ) : (
            <View style={styles.patientAvatarFallback}>
              <Text style={styles.patientAvatarInitial}>{patientName[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.patientMeta}>
            <Text style={styles.patientName}>{patientName}</Text>
            <Text style={styles.patientSub}>Manage daily routines</Text>
          </View>
        </View>

        {/* ─── Filter Tabs ─────────────────────────────────────────────────── */}
        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterPill, filter === 'ALL' && styles.filterPillActive]}
            onPress={() => setFilter('ALL')}
          >
            <Text style={[styles.filterPillText, filter === 'ALL' && styles.filterPillTextActive]}>
              All ({routines.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterPill, filter === 'ACTIVE' && styles.filterPillActive]}
            onPress={() => setFilter('ACTIVE')}
          >
            <Text style={[styles.filterPillText, filter === 'ACTIVE' && styles.filterPillTextActive]}>
              Active ({activeCount})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterPill, filter === 'PAUSED' && styles.filterPillActive]}
            onPress={() => setFilter('PAUSED')}
          >
            <Text style={[styles.filterPillText, filter === 'PAUSED' && styles.filterPillTextActive]}>
              Paused ({pausedCount})
            </Text>
          </Pressable>
        </View>

        {/* ─── Routine Cards List ──────────────────────────────────────────── */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : filteredRoutines.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No routines found for this filter.</Text>
          </View>
        ) : (
          filteredRoutines.map((routine) => {
            const theme = getCategoryTheme(routine.category);
            const isActive = routine.status === 'ACTIVE';

            return (
              <View key={routine.id} style={styles.routineCard}>
                <View style={styles.routineMainRow}>
                  {/* Category Icon */}
                  <View style={[styles.categoryIconCircle, { backgroundColor: theme.bg }]}>
                    <MaterialCommunityIcons name={theme.icon as any} size={22} color={theme.color} />
                  </View>

                  {/* Routine Information */}
                  <View style={styles.routineMeta}>
                    <View style={styles.routineTitleRow}>
                      <Text style={styles.routineTitle}>{routine.title}</Text>
                      <View style={[styles.categoryBadge, { backgroundColor: theme.bg }]}>
                        <Text style={[styles.categoryBadgeText, { color: theme.color }]}>
                          {theme.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.routineTimeRow}>
                      <Ionicons name="time-outline" size={14} color="#52605D" style={{ marginRight: 4 }} />
                      <Text style={styles.routineTimeText}>{routine.scheduled_time || '8:00 AM'}</Text>
                    </View>

                    <View style={styles.routineRepeatRow}>
                      <Ionicons name="calendar-outline" size={14} color="#52605D" style={{ marginRight: 4 }} />
                      <Text style={styles.routineRepeatText}>
                        {routine.recurrence_pattern || 'Every day'}
                      </Text>
                    </View>
                  </View>

                  {/* Switch Toggle */}
                  <Switch
                    value={isActive}
                    onValueChange={() => handleToggleStatus(routine)}
                    trackColor={{ false: '#E5E7EB', true: '#6EE7B7' }}
                    thumbColor={isActive ? '#0E7A67' : '#9CA3AF'}
                  />

                  {/* 3-dots Menu Button */}
                  <Pressable
                    style={styles.moreBtn}
                    onPress={() => setActiveMenuRoutine(routine)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ─── 3-dots Context Menu Modal ────────────────────────────────────── */}
      <Modal
        visible={Boolean(activeMenuRoutine)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveMenuRoutine(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setActiveMenuRoutine(null)}>
          <View style={styles.menuContainer}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                const r = activeMenuRoutine;
                setActiveMenuRoutine(null);
                if (r) {
                  navigation.navigate('PatientRoutineEditorScreen', {
                    patientId,
                    patientName,
                    mode: 'edit',
                    routine: r,
                  });
                }
              }}
            >
              <Feather name="edit-2" size={16} color="#161E1C" style={{ marginRight: 12 }} />
              <Text style={styles.menuItemText}>Edit routine</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                if (activeMenuRoutine) {
                  void handleToggleStatus(activeMenuRoutine);
                  setActiveMenuRoutine(null);
                }
              }}
            >
              <Feather
                name={activeMenuRoutine?.status === 'ACTIVE' ? 'pause-circle' : 'play-circle'}
                size={16}
                color="#161E1C"
                style={{ marginRight: 12 }}
              />
              <Text style={styles.menuItemText}>
                {activeMenuRoutine?.status === 'ACTIVE' ? 'Pause routine' : 'Resume routine'}
              </Text>
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                if (activeMenuRoutine) {
                  handleDeleteRoutine(activeMenuRoutine);
                }
              }}
            >
              <Feather name="trash-2" size={16} color="#EF4444" style={{ marginRight: 12 }} />
              <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Delete routine</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FAF8F5',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: F.extraBold,
    fontSize: 22,
    color: '#161E1C',
    flex: 1,
    marginLeft: 8,
  },
  addRoutineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E7A67',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  addRoutineBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  patientSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
    marginBottom: 16,
  },
  patientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  patientAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  patientAvatarInitial: {
    fontFamily: F.bold,
    fontSize: 20,
    color: '#0E7A67',
  },
  patientMeta: {
    flex: 1,
  },
  patientName: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#161E1C',
  },
  patientSub: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 2,
  },

  // ─── Filter Tabs ───────────────────────────────────────────────────────────
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterPillActive: {
    backgroundColor: '#E6F4F1',
  },
  filterPillText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#4B5563',
  },
  filterPillTextActive: {
    fontFamily: F.bold,
    color: '#0E7A67',
  },

  // ─── Routine Cards ─────────────────────────────────────────────────────────
  routineCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  routineMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  routineMeta: {
    flex: 1,
  },
  routineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
    marginBottom: 4,
  },
  routineTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#161E1C',
    flex: 1,
  },
  categoryBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginLeft: 6,
  },
  categoryBadgeText: {
    fontFamily: F.bold,
    fontSize: 11,
  },
  routineTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  routineTimeText: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: '#52605D',
  },
  routineRepeatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  routineRepeatText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
  },
  moreBtn: {
    padding: 6,
    marginLeft: 6,
  },
  loadingContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#52605D',
  },

  // ─── Modal Context Menu ────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontFamily: F.medium,
    fontSize: 15,
    color: '#161E1C',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
});
