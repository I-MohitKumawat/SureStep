import React, { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Text,
  TextInput,
  View
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useTheme } from '../../theme/ThemeContext';
import { Feather } from '@expo/vector-icons';
import type { PatientStackParams } from '../../types/navigation.types';
import {
  createRoutineDefinition,
  updateRoutineDefinition,
  normalizeRoutineCategory,
  type RoutineCategory,
} from '../../services/routineService';

type Props = NativeStackScreenProps<PatientStackParams, 'PatientSelfRoutineEditorScreen'>;

const CATEGORIES = [
  { label: 'Medication', icon: 'activity' },
  { label: 'Meal', icon: 'coffee' },
  { label: 'Exercise', icon: 'zap' },
  { label: 'Hygiene', icon: 'droplet' },
  { label: 'Appointment', icon: 'calendar' },
];
const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const PatientSelfRoutineEditorScreen: React.FC<Props> = ({ route, navigation }) => {
  const { mode: themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const { patientId, patientName, mode } = route.params;
  const routine = mode === 'edit' ? route.params.routine : undefined;

  // ─── Form State ─────────────────────────────────────────────────────────────
  const [name, setName] = useState(mode === 'edit' && routine ? routine.title : '');
  const [category, setCategory] = useState(
    mode === 'edit' && routine ? routine.category || 'Medication' : 'Medication'
  );
  


  // Recurrence state (canonical schedule_pattern)
  const [recurrenceType, setRecurrenceType] = useState<'DAILY' | 'WEEKLY'>(
    mode === 'edit' && routine?.schedule_pattern?.frequency === 'WEEKLY' ? 'WEEKLY' : 'DAILY'
  );
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(
    mode === 'edit' && routine?.schedule_pattern?.daysOfWeek
      ? routine.schedule_pattern.daysOfWeek
      : [1, 2, 3, 4, 5]
  );

  // Scheduled times (canonical schedule_pattern.times; first value is the seed time)
  const [times, setTimes] = useState<string[]>(() => {
    if (mode !== 'edit' || !routine?.schedule_pattern) return [];
    const patternTimes = routine.schedule_pattern.times;
    if (Array.isArray(patternTimes) && patternTimes.length > 0) {
      return patternTimes.map((t: string) => t.slice(0, 5));
    }
    return routine.schedule_pattern.time ? [routine.schedule_pattern.time.slice(0, 5)] : [];
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerValue, setTimePickerValue] = useState(new Date());

  // Step-by-Step Custom Ordered Instructions State
  const [steps, setSteps] = useState<Array<{ text: string; photo_url?: string }>>(() => {
    if (mode === 'edit' && routine?.description) {
      try {
        const parsed = JSON.parse(routine.description);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) =>
            typeof item === 'string'
              ? { text: item }
              : { text: item.text ?? item.title ?? '', photo_url: item.photo_url }
          );
        }
      } catch {
        // Plain-text canonical description.
      }
      return [{ text: routine.description }];
    }
    return [{ text: '' }];
  });

  const [saving, setSaving] = useState(false);
  const screenTitle = mode === 'edit' ? 'Edit routine' : 'Create routine';
  const [webTime, setWebTime] = useState('08:00');

  // Toggle day selection for weekly recurrence
  const toggleDay = (dayIndex: number) => {
    setRecurrenceDays(prev => {
      if (prev.includes(dayIndex)) {
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== dayIndex);
      }
      return [...prev, dayIndex].sort();
    });
  };

  // Add a scheduled time using clock picker
  const handleTimeConfirm = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      const hours = String(selectedDate.getHours()).padStart(2, '0');
      const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      
      setTimes(prev => prev.includes(timeStr) ? prev : [...prev, timeStr].sort());
    }
  };

  // Remove a scheduled time
  const handleRemoveTime = (timeToRemove: string) => {
    setTimes(prev => prev.filter(t => t !== timeToRemove));
  };

  // Visual steps manipulations
  const handleAddStep = () => {
    setSteps(prev => [...prev, { text: '' }]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleStepTextChange = (text: string, index: number) => {
    setSteps(prev => prev.map((s, idx) => idx === index ? { ...s, text } : s));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    setSteps(prev => {
      const copy = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= copy.length) return prev;
      
      // Swap elements
      const temp = copy[index];
      copy[index] = copy[swapIndex];
      copy[swapIndex] = temp;
      return copy;
    });
  };

  const handlePickStepPhoto = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photos access to attach images to instruction steps.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      // aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const photoUri = result.assets[0].uri;
      setSteps(prev => prev.map((s, idx) => idx === index ? { ...s, photo_url: photoUri } : s));
    }
  };

  const handleRemoveStepPhoto = (index: number) => {
    setSteps(prev => prev.map((s, idx) => idx === index ? { ...s, photo_url: undefined } : s));
  };

  // Save the form
  const handleSave = async () => {
    if (saving) return;
    const cleanTitle = name.trim();
    if (!cleanTitle) {
      Alert.alert('Required Field', 'Please enter a routine title.');
      return;
    }

    if (times.length === 0) {
      Alert.alert('Required Field', 'Please schedule at least one execution time.');
      return;
    }

    if (recurrenceType === 'WEEKLY' && recurrenceDays.length === 0) {
      Alert.alert('Required Field', 'Please select at least one day.');
      return;
    }

    const activeSteps = steps.filter(s => s.text.trim() || s.photo_url);
    setSaving(true);

    const canonicalCategory: RoutineCategory = normalizeRoutineCategory(category);
    const description = activeSteps
      .map((step, index) => (step.photo_url ? `${index + 1}. ${step.text}` : step.text))
      .filter(Boolean)
      .join('\n');

    // Canonical routine definition payload. Multiple scheduled times are
    // preserved in schedule_pattern.times so occurrence materialization can
    // generate one occurrence per time.
    const payload = {
      title: cleanTitle,
      category: canonicalCategory,
      description: description || null,
      schedulePattern: {
        frequency: recurrenceType,
        time: times[0],
        times,
        ...(recurrenceType === 'WEEKLY' ? { daysOfWeek: recurrenceDays } : {}),
      },
    };

    try {
      if (mode === 'edit' && routine) {
        await updateRoutineDefinition(patientId, routine.id, payload);
        Alert.alert('Success', 'Routine definition updated successfully.');
      } else {
        await createRoutineDefinition(patientId, payload);
        Alert.alert('Success', 'New routine definition configured.');
      }
      navigation.goBack();
    } catch (err) {
      console.error('[PatientSelfRoutineEditor] Save failed:', err);
      Alert.alert('Error', 'Failed to save routine definition. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const primary = isDark ? '#6EE7B7' : '#0E7A67';
  const muted = isDark ? '#A6BDB2' : '#52605D';
  const ink = isDark ? 'text-[#F0FDF4]' : 'text-[#152D24]';
  const secondary = isDark ? 'text-[#A6BDB2]' : 'text-[#52605D]';
  const surface = isDark ? 'bg-[#1B2924] border-[#30453B]' : 'bg-white border-[#DFE9E4]';
  const soft = isDark ? 'bg-[#263A31] border-[#3D5A4D]' : 'bg-[#F6F8F7] border-[#DFE9E4]';
  const card = `mb-4 rounded-3xl border p-4 ${surface}`;
  const field = `min-h-[48px] rounded-xl border px-4 py-3 text-base ${soft} ${ink}`;
  const label = `mb-2 text-sm font-semibold ${ink}`;
  const action = `min-h-[44px] flex-row items-center justify-center rounded-xl px-3 py-2 active:opacity-70 ${isDark ? 'bg-[#203E32]' : 'bg-[#E8F6EF]'}`;
  const actionText = `font-semibold ${isDark ? 'text-emerald-200' : 'text-[#0E6650]'}`;
  const iconButton = `h-11 w-11 items-center justify-center rounded-xl active:opacity-70 ${soft}`;
  const sectionHeading = (icon: React.ComponentProps<typeof Feather>['name'], title: string, subtitle?: string) => (
    <View className="mb-4">
      <View className="flex-row items-center gap-2">
        <Feather name={icon} size={21} color={primary} />
        <Text className={`text-lg font-bold ${ink}`}>{title}</Text>
      </View>
      {!!subtitle && <Text className={`mt-2 text-sm leading-5 ${secondary}`}>{subtitle}</Text>}
    </View>
  );

  const addWebTime = () => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(webTime)) {
      Alert.alert('Invalid time', 'Enter a time in 24-hour HH:MM format.');
      return;
    }
    setTimes(prev => prev.includes(webTime) ? prev : [...prev, webTime].sort());
    setShowTimePicker(false);
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, paddingHorizontal: 0, paddingVertical: 0, backgroundColor: isDark ? '#101916' : '#F5F8F6' }}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className={`border-b px-4 py-3 ${surface}`}>
          <View className="mx-auto w-full max-w-[720px] flex-row items-center gap-3">
            <Pressable onPress={() => navigation.goBack()} disabled={saving} accessibilityRole="button" accessibilityLabel="Go back" className={iconButton}>
              <Feather name="arrow-left" size={24} color={primary} />
            </Pressable>
            <View className="flex-1">
              <Text className={`text-2xl font-bold tracking-tight ${ink}`}>{screenTitle}</Text>
              <Text className={`mt-0.5 text-sm ${secondary}`}>For {patientName}</Text>
            </View>
            <View className={iconButton}><Feather name="clipboard" size={22} color={primary} /></View>
          </View>
        </View>
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="mx-auto w-full max-w-[720px] px-4 pb-6 pt-4">
            <View className="mb-4 rounded-3xl bg-[#105C49] p-5">
              <Text className="text-xl font-bold text-white">Build a healthier day</Text>
              <Text className="mt-2 text-sm leading-5 text-emerald-100">Create a familiar routine, one step at a time.</Text>
            </View>
            <View className={card}>
              {sectionHeading('clipboard', 'Routine details')}
              <Text className={label}>Routine title</Text>
              <TextInput value={name} onChangeText={setName} placeholder="e.g. Morning medication" placeholderTextColor={muted} className={field} accessibilityLabel="Routine title" autoCapitalize="sentences" returnKeyType="next" />
              <Text className={`mt-5 ${label}`}>Category</Text>
              <TextInput value={category} onChangeText={setCategory} placeholder="Type or select a category" placeholderTextColor={muted} className={field} accessibilityLabel="Routine category" />
              <View className="mt-3 flex-row flex-wrap gap-2">
                {CATEGORIES.map(cat => {
                  const active = category.toLowerCase() === cat.label.toLowerCase();
                  return (
                    <Pressable key={cat.label} onPress={() => setCategory(cat.label)} accessibilityRole="button" accessibilityState={{ selected: active }} className={`min-w-[30%] flex-1 items-center justify-center rounded-xl border px-2 py-3 active:opacity-70 ${active ? (isDark ? 'border-emerald-400 bg-[#203E32]' : 'border-[#0E7A67] bg-[#E3F5EB]') : soft}`}>
                      <Feather name={cat.icon as React.ComponentProps<typeof Feather>['name']} size={23} color={active ? primary : muted} />
                      <Text className={`mt-2 text-center text-xs font-semibold ${active ? actionText : secondary}`}>{cat.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View className={card}>
              {sectionHeading('calendar', 'Schedule', 'Choose when this routine repeats.')}
              <View className={`flex-row gap-1 rounded-2xl border p-1 ${soft}`}>
                {(['DAILY', 'WEEKLY'] as const).map(freq => (
                  <Pressable key={freq} onPress={() => setRecurrenceType(freq)} accessibilityRole="button" accessibilityState={{ selected: recurrenceType === freq }} className={`min-h-[44px] flex-1 items-center justify-center rounded-xl ${recurrenceType === freq ? 'bg-[#0E7A67]' : ''}`}>
                    <Text className={`font-semibold ${recurrenceType === freq ? 'text-white' : secondary}`}>{freq === 'DAILY' ? 'Daily' : 'Weekly'}</Text>
                  </Pressable>
                ))}
              </View>
              {recurrenceType === 'WEEKLY' && (
                <View className="mt-4 flex-row flex-wrap gap-1.5">
                  {DAYS_SHORT.map((day, idx) => {
                    const active = recurrenceDays.includes(idx);
                    return <Pressable key={idx} onPress={() => toggleDay(idx)} accessibilityRole="button" accessibilityLabel={DAYS_FULL[idx]} accessibilityState={{ selected: active }} className={`h-11 min-w-[36px] flex-1 items-center justify-center rounded-xl border ${active ? 'border-[#0E7A67] bg-[#0E7A67]' : soft}`}><Text className={`text-sm font-semibold ${active ? 'text-white' : secondary}`}>{day}</Text></Pressable>;
                  })}
                </View>
              )}
              <View className={`my-5 h-px ${isDark ? 'bg-[#30453B]' : 'bg-[#DFE9E4]'}`} />
              <View className="flex-row flex-wrap items-center justify-between gap-2">
                <Text className={`text-base font-bold ${ink}`}>Scheduled times</Text>
                <Pressable onPress={() => { setTimePickerValue(new Date()); setShowTimePicker(true); }} accessibilityRole="button" className={action}>
                  <Feather name="plus" size={18} color={primary} /><Text className={`ml-1 ${actionText}`}>Add time</Text>
                </Pressable>
              </View>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {times.map(t => <View key={t} className={`flex-row items-center rounded-xl border pl-3 ${soft}`}><Feather name="clock" size={17} color={primary} /><Text className={`ml-2 font-semibold ${ink}`}>{t}</Text><Pressable onPress={() => handleRemoveTime(t)} accessibilityRole="button" accessibilityLabel={`Remove time ${t}`} className="h-11 w-11 items-center justify-center"><Feather name="x" size={19} color={muted} /></Pressable></View>)}
                {!times.length && <Text className={`text-sm ${secondary}`}>No scheduled times yet. Add at least one.</Text>}
              </View>
              {showTimePicker && (Platform.OS === 'web' ? (
                <View className="mt-4 gap-2">
                  <TextInput value={webTime} onChangeText={setWebTime} placeholder="HH:MM" placeholderTextColor={muted} accessibilityLabel="Time in 24-hour format" className={field} />
                  <View className="flex-row gap-2"><Pressable className={action} onPress={() => setShowTimePicker(false)}><Text className={actionText}>Cancel</Text></Pressable><Pressable className={action} onPress={addWebTime}><Text className={actionText}>Confirm time</Text></Pressable></View>
                </View>
              ) : Platform.OS === 'ios' ? (
                <View className="mt-3">
                  <DateTimePicker value={timePickerValue} mode="time" display="spinner" is24Hour themeVariant={isDark ? 'dark' : 'light'} onChange={(_, date) => { if (date) setTimePickerValue(date); }} />
                  <View className="flex-row gap-2"><Pressable className={action} onPress={() => setShowTimePicker(false)}><Text className={actionText}>Cancel</Text></Pressable><Pressable className={action} onPress={() => handleTimeConfirm({ type: 'set' }, timePickerValue)}><Text className={actionText}>Confirm time</Text></Pressable></View>
                </View>
              ) : <DateTimePicker value={timePickerValue} mode="time" display="default" is24Hour onChange={handleTimeConfirm} />)}
            </View>
            <View className={card}>
              {sectionHeading('list', 'Instruction steps', 'Add simple instructions in the correct order. Photos can help clarify each step.')}
              {steps.map((step, idx) => (
                <View key={idx} className={`mb-3 gap-3 rounded-2xl border p-3 ${soft}`}>
                  <View className="flex-row flex-wrap items-center gap-1">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-[#0E7A67]"><Text className="font-bold text-white">{idx + 1}</Text></View>
                    <Text className={`ml-1 flex-1 font-bold ${ink}`}>Step {idx + 1}</Text>
                    {idx > 0 && <Pressable onPress={() => handleMoveStep(idx, 'up')} accessibilityRole="button" accessibilityLabel={`Move step ${idx + 1} up`} className={iconButton}><Feather name="chevron-up" size={20} color={muted} /></Pressable>}
                    {idx < steps.length - 1 && <Pressable onPress={() => handleMoveStep(idx, 'down')} accessibilityRole="button" accessibilityLabel={`Move step ${idx + 1} down`} className={iconButton}><Feather name="chevron-down" size={20} color={muted} /></Pressable>}
                    {steps.length > 1 && <Pressable onPress={() => handleRemoveStep(idx)} accessibilityRole="button" accessibilityLabel={`Delete step ${idx + 1}`} className={iconButton}><Feather name="trash-2" size={19} color={isDark ? '#FCA5A5' : '#DC2626'} /></Pressable>}
                  </View>
                  <TextInput value={step.text} onChangeText={text => handleStepTextChange(text, idx)} placeholder="Describe this step..." placeholderTextColor={muted} accessibilityLabel={`Instruction for step ${idx + 1}`} multiline scrollEnabled={false} textAlignVertical="top" className={`min-h-[90px] rounded-xl border px-3 py-3 text-base ${surface} ${ink}`} />
                  {step.photo_url ? (
                    <View className="overflow-hidden rounded-xl">
                      <Image source={{ uri: step.photo_url }} className="h-44 w-full" resizeMode="cover" accessibilityLabel={`Reference photo for step ${idx + 1}`} />
                      <Pressable onPress={() => handleRemoveStepPhoto(idx)} accessibilityRole="button" className="mt-2 min-h-[44px] flex-row items-center justify-center gap-2 rounded-xl bg-red-600"><Feather name="trash-2" color="white" size={17} /><Text className="font-semibold text-white">Remove photo</Text></Pressable>
                    </View>
                  ) : <Pressable onPress={() => handlePickStepPhoto(idx)} accessibilityRole="button" accessibilityLabel={`Add reference photo to step ${idx + 1}`} className={`min-h-[48px] flex-row items-center justify-center gap-2 rounded-xl border border-dashed ${isDark ? 'border-emerald-500' : 'border-[#B8D9CB]'}`}><Feather name="image" size={19} color={primary} /><Text className={actionText}>Add reference photo</Text></Pressable>}
                </View>
              ))}
              <Pressable onPress={handleAddStep} accessibilityRole="button" className={action}><Feather name="plus-circle" size={20} color={primary} /><Text className={`ml-2 ${actionText}`}>Add another step</Text></Pressable>
            </View>
          </View>
        </ScrollView>
        <View className={`border-t px-4 py-3 ${surface}`}>
          <Pressable onPress={handleSave} disabled={saving} accessibilityRole="button" accessibilityState={{ disabled: saving, busy: saving }} className={`mx-auto min-h-[54px] w-full max-w-[720px] flex-row items-center justify-center gap-2 rounded-2xl bg-[#0E7A67] px-4 py-4 active:opacity-80 ${saving ? 'opacity-60' : ''}`}>
            {saving ? <ActivityIndicator color="white" /> : <Feather name="check-circle" size={21} color="white" />}
            <Text className="text-base font-bold text-white">{saving ? 'Saving...' : 'Save routine template'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};
