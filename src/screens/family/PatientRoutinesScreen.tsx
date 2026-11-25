import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
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
  routineTime,
  routineFrequency,
  routineDays,
  type RoutineDefinition,
} from '../../services/routineService';
import type { FamilyStackParams } from '../../types/navigation.types';
import { useTheme } from '../../theme/ThemeContext';

type NavigationProp = NativeStackNavigationProp<FamilyStackParams>;
type ScreenRouteProp = RouteProp<FamilyStackParams, 'PatientRoutinesScreen'>;

type FilterTab = 'ALL' | 'ACTIVE' | 'PAUSED';

export const PatientRoutinesScreen: React.FC = () => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
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

  const [loadError, setLoadError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [busyIds, setBusyIds] = useState<string[]>([]);
  useEffect(() => setImageError(false), [currentPatient?.photo_url]);

  const loadRoutines = useCallback(async () => {
    try {
      const data = await fetchRoutineDefinitions(patientId);
      setRoutines(data);
      setLoadError(false);
    } catch (err) {
      console.warn('[PatientRoutines] Load failed:', err);
      setLoadError(true);
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
    if (busyIds.includes(routine.id)) return;
    setBusyIds(prev => [...prev, routine.id]);
    const nextActive = !routine.is_active;
    try {
      // Optimistic update
      setRoutines((prev) =>
        prev.map((r) => (r.id === routine.id ? { ...r, is_active: nextActive } : r))
      );
      await updateRoutineDefinition(patientId, routine.id, { isActive: nextActive });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error?.message || 'Failed to update routine status.');
      setRoutines(prev => prev.map(r => r.id === routine.id ? { ...r, is_active: routine.is_active } : r));
    } finally {
      setBusyIds(prev => prev.filter(id => id !== routine.id));
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
    if (c === 'EXERCISE' || c === 'ACTIVITY') {
      return { icon: 'walk', bg: '#D1FAE5', color: '#059669', label: 'Activity' };
    }
    if (c === 'HYGIENE' || c === 'PERSONAL_CARE') {
      return { icon: 'shower', bg: '#DBEAFE', color: '#2563EB', label: 'Personal care' };
    }
    if (c === 'APPOINTMENT') {
      return { icon: 'calendar-clock', bg: '#E0E7FF', color: '#4338CA', label: 'Appointment' };
    }
    return { icon: 'brain', bg: '#EDE9FE', color: '#7C3AED', label: 'Routine' };
  };

  const activeCount = routines.filter((r) => r.is_active).length;
  const pausedCount = routines.filter((r) => !r.is_active).length;

  const filteredRoutines = routines.filter((r) => {
    if (filter === 'ACTIVE') return r.is_active;
    if (filter === 'PAUSED') return !r.is_active;
    return true;
  });

  const primary = isDark ? '#6EE7B7' : '#0E7A67';
  const muted = isDark ? '#A6BDB2' : '#64748B';
  const heading = isDark ? 'text-[#F0FDF4]' : 'text-[#152D24]';
  const secondary = isDark ? 'text-[#A6BDB2]' : 'text-slate-500';
  const card = isDark ? 'border-[#30453B] bg-[#1B2924]' : 'border-[#DFE9E4] bg-white';
  const line = isDark ? 'bg-[#30453B]' : 'bg-[#E8EFEB]';
  const openCreate = () => navigation.navigate('PatientRoutineEditorScreen', {
    patientId, patientName, mode: 'create',
  });
  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'ALL', label: 'All', count: routines.length },
    { key: 'ACTIVE', label: 'Active', count: activeCount },
    { key: 'PAUSED', label: 'Paused', count: pausedCount },
  ];

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, paddingHorizontal: 0, paddingVertical: 0, backgroundColor: isDark ? '#101916' : '#F5F8F6' }}>
      <View className="w-full max-w-[760px] flex-1 self-center">
        <View className="flex-row items-center px-4 pb-4 pt-3">
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} className={`mr-3 h-11 w-11 items-center justify-center rounded-2xl border active:opacity-70 ${card}`}>
            <Ionicons name="arrow-back" size={22} color={primary} />
          </Pressable>
          <View className="mr-2 flex-1">
            <Text className={`text-2xl font-bold tracking-tight ${heading}`}>Routines</Text>
            <Text className={`mt-0.5 text-xs ${secondary}`}>Daily care management</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={openCreate} className="min-h-[44px] flex-row items-center justify-center rounded-xl bg-[#0E7A67] px-3 py-2 active:opacity-80">
            <Feather name="plus" size={18} color="white" />
            <Text className="ml-1 text-sm font-semibold text-white">Add routine</Text>
          </Pressable>
        </View>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={primary} colors={[primary]} />}>
          <View className="px-4 pb-10">
            <View className="mb-5 rounded-3xl bg-[#105C49] p-5">
              <View className="flex-row items-center">
                <View className="mr-4 h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-emerald-100">
                  {currentPatient?.photo_url && !imageError ? (
                    <Image source={{ uri: currentPatient.photo_url }} className="h-full w-full" onError={() => setImageError(true)} resizeMode="cover" />
                  ) : (
                    <Text className="text-2xl font-bold text-[#105C49]">{patientName.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'P'}</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold tracking-wider text-emerald-200">CARE PROFILE</Text>
                  <Text className="mt-1 text-xl font-bold text-white">{patientName}</Text>
                  <Text className="mt-1 text-sm text-emerald-100">Manage daily routines</Text>
                </View>
                <Ionicons name="heart-outline" size={25} color="#A7F3D0" />
              </View>
              <View className="my-4 h-px bg-[#387B6B]" />
              <View className="flex-row">
                {tabs.map((tab, index) => (
                  <View key={tab.key} className={`flex-1 items-center ${index > 0 ? 'border-l border-[#387B6B]' : ''}`}>
                    <Text className="text-2xl font-bold text-white">{loading ? '—' : tab.count}</Text>
                    <Text className="mt-1 text-xs text-emerald-100">{tab.key === 'ALL' ? 'Total routines' : tab.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View className={`mb-5 flex-row rounded-2xl p-1 ${isDark ? 'bg-[#20352C]' : 'bg-[#E8EEEA]'}`}>
              {tabs.map(tab => (
                <Pressable key={tab.key} onPress={() => setFilter(tab.key)} accessibilityRole="button" accessibilityState={{ selected: filter === tab.key }} className={`min-h-[44px] flex-1 items-center justify-center rounded-xl px-1 ${filter === tab.key ? (isDark ? 'bg-[#345648]' : 'bg-white') : ''}`}>
                  <Text className={`text-sm font-semibold ${filter === tab.key ? (isDark ? 'text-emerald-200' : 'text-[#0E6650]') : secondary}`}>{tab.label} ({tab.count})</Text>
                </Pressable>
              ))}
            </View>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className={`text-lg font-bold ${heading}`}>Routine list</Text>
              <Text className={`text-sm ${secondary}`}>{filteredRoutines.length} routines</Text>
            </View>
            {loading ? (
              <View className="items-center py-12"><ActivityIndicator size="large" color={primary} /><Text className={`mt-3 ${secondary}`}>Loading routines…</Text></View>
            ) : loadError ? (
              <View className={`items-center rounded-3xl border p-6 ${card}`}>
                <Ionicons name="cloud-offline-outline" size={36} color={muted} />
                <Text className={`mt-3 text-lg font-bold ${heading}`}>Couldn't load routines</Text>
                <Pressable onPress={handleRefresh} accessibilityRole="button" className="mt-4 rounded-xl bg-[#0E7A67] px-5 py-3"><Text className="font-semibold text-white">Try again</Text></Pressable>
              </View>
            ) : filteredRoutines.length === 0 ? (
              <View className={`items-center rounded-3xl border p-7 ${card}`}>
                <Ionicons name="clipboard-outline" size={38} color={primary} />
                <Text className={`mt-4 text-lg font-bold ${heading}`}>{routines.length ? 'No matching routines' : 'No routines yet'}</Text>
                <Text className={`mt-2 text-center text-sm ${secondary}`}>{routines.length ? 'Choose another filter to see your routines.' : 'Create a routine to help organize daily care.'}</Text>
                <Pressable accessibilityRole="button" onPress={routines.length ? () => setFilter('ALL') : openCreate} className="mt-5 rounded-xl bg-[#0E7A67] px-5 py-3"><Text className="font-semibold text-white">{routines.length ? 'View all routines' : 'Create routine'}</Text></Pressable>
              </View>
            ) : filteredRoutines.map(routine => {
              const theme = getCategoryTheme(routine.category);
              const days = routineDays(routine);
              const recurrence = routineFrequency(routine) === 'DAILY' ? 'Every day' : days.length === 5 && !days.includes(0) && !days.includes(6) ? 'Weekdays' : days.length === 2 && days.includes(0) && days.includes(6) ? 'Weekends' : days.length ? `Weekly on ${days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}` : 'Weekly';
              const busy = busyIds.includes(routine.id);
              return (
                <View key={routine.id} className={`mb-3 rounded-3xl border p-4 ${card}`}>
                  <View className="flex-row items-center">
                    <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: theme.bg }}>
                      <MaterialCommunityIcons name={theme.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']} size={24} color={theme.color} />
                    </View>
                    <View className="flex-1">
                      <Text className={`text-xs font-medium ${secondary}`}>{theme.label}</Text>
                      <Text className={`mt-1 text-lg font-bold ${heading}`}>{routine.title}</Text>
                    </View>
                    <Pressable onPress={() => setActiveMenuRoutine(routine)} disabled={busy} accessibilityRole="button" accessibilityLabel={`Actions for ${routine.title}`} className="h-11 w-11 items-center justify-center rounded-xl active:opacity-60">
                      <Ionicons name="ellipsis-vertical" size={21} color={muted} />
                    </Pressable>
                  </View>
                  <View className="mt-4 flex-row flex-wrap gap-x-4 gap-y-2">
                    <View className="flex-row items-center"><Ionicons name="time-outline" size={17} color={muted} /><Text className={`ml-1.5 text-sm font-medium ${secondary}`}>{routineTime(routine)}</Text></View>
                    <View className="flex-row items-center"><Ionicons name="calendar-outline" size={17} color={muted} /><Text className={`ml-1.5 text-sm ${secondary}`}>{recurrence}</Text></View>
                  </View>
                  <View className={`my-3 h-px ${line}`} />
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center"><View className={`mr-2 h-2.5 w-2.5 rounded-full ${routine.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} /><Text className={`text-sm font-semibold ${routine.is_active ? (isDark ? 'text-emerald-300' : 'text-emerald-700') : secondary}`}>{routine.is_active ? 'Active' : 'Paused'}</Text></View>
                    <View className="flex-row items-center">
                      {busy && <ActivityIndicator size="small" color={primary} />}
                      <Switch value={routine.is_active} disabled={busy} onValueChange={() => void handleToggleStatus(routine)} accessibilityLabel={`Enable ${routine.title}`} trackColor={{ false: '#94A3B8', true: '#0E7A67' }} thumbColor="#FFFFFF" />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
      <Modal visible={Boolean(activeMenuRoutine)} transparent animationType="slide" onRequestClose={() => setActiveMenuRoutine(null)}>
        <View className="flex-1 justify-end bg-black/50">
          <Pressable className="flex-1" onPress={() => setActiveMenuRoutine(null)} accessibilityLabel="Close routine actions" accessibilityRole="button" />
          <View accessibilityViewIsModal className={`w-full max-w-[560px] self-center rounded-t-3xl p-5 pb-8 ${isDark ? 'bg-[#1B2924]' : 'bg-white'}`}>
            <View className={`mb-5 h-1 w-10 self-center rounded-full ${isDark ? 'bg-[#52605D]' : 'bg-slate-300'}`} />
            <Text className={`text-xl font-bold ${heading}`}>{activeMenuRoutine?.title}</Text>
            <Text className={`mb-4 mt-1 text-sm ${secondary}`}>Manage this routine</Text>
            {([
              { icon: 'edit-2', label: 'Edit routine', action: () => { const r = activeMenuRoutine; setActiveMenuRoutine(null); if (r) navigation.navigate('PatientRoutineEditorScreen', { patientId, patientName, mode: 'edit', routine: r }); } },
              { icon: activeMenuRoutine?.is_active ? 'pause-circle' : 'play-circle', label: activeMenuRoutine?.is_active ? 'Pause routine' : 'Resume routine', action: () => { const r = activeMenuRoutine; setActiveMenuRoutine(null); if (r) void handleToggleStatus(r); } },
              { icon: 'trash-2', label: 'Delete routine', action: () => { if (activeMenuRoutine) handleDeleteRoutine(activeMenuRoutine); }, danger: true },
            ] as const).map(item => (
              <Pressable key={item.label} onPress={item.action} accessibilityRole="button" className="min-h-[56px] flex-row items-center rounded-xl px-2 py-3 active:opacity-60">
                <View className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${'danger' in item ? (isDark ? 'bg-[#381D20]' : 'bg-red-50') : (isDark ? 'bg-[#203E32]' : 'bg-[#E8F6EF]')}`}><Feather name={item.icon} size={19} color={'danger' in item ? (isDark ? '#FCA5A5' : '#DC2626') : primary} /></View>
                <Text className={`flex-1 text-base font-semibold ${'danger' in item ? (isDark ? 'text-red-300' : 'text-red-600') : heading}`}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={muted} />
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" onPress={() => setActiveMenuRoutine(null)} className={`mt-4 items-center rounded-xl border py-3 ${card}`}><Text className={`font-semibold ${heading}`}>Cancel</Text></Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};
