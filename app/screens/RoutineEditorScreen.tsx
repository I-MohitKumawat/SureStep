/**
 * RoutineEditorScreen.tsx
 * Create / edit a routine via backend/routines.ts (direct Supabase).
 * Throws on failure — no silent fallback.
 */
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { createRoutine, updateRoutine } from '../../backend/routines';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';

type Props = NativeStackScreenProps<HomeStackParamList, 'RoutineEditor'>;

export const RoutineEditorScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patientId, patientName, mode } = route.params;
  const routineForEdit = mode === 'edit' ? route.params.routine : undefined;

  const initialName     = React.useMemo(() => (mode === 'edit' && routineForEdit ? routineForEdit.name          : ''), [mode, routineForEdit]);
  const initialSchedule = React.useMemo(() => (mode === 'edit' && routineForEdit ? routineForEdit.scheduleLabel : ''), [mode, routineForEdit]);

  const [name,          setName]          = React.useState(initialName);
  const [scheduleLabel, setScheduleLabel] = React.useState(initialSchedule);
  const [saving,        setSaving]        = React.useState(false);

  const title = mode === 'edit' ? 'Edit Routine' : 'New Routine';

  const onSave = () => {
    const run = async () => {
      const trimmed  = name.trim();
      const schedule = scheduleLabel.trim();
      if (!trimmed) { Alert.alert('Missing name', 'Please enter a routine name.'); return; }

      setSaving(true);
      try {
        if (mode === 'edit' && routineForEdit) {
          await updateRoutine(routineForEdit.id, {
            name:          trimmed,
            isActive:      routineForEdit.isActive,
            scheduleLabel: schedule,
          });
        } else {
          await createRoutine({ patientId, name: trimmed, isActive: true, scheduleLabel: schedule });
        }
        navigation.goBack();
      } catch {
        Alert.alert('Save failed', 'Unable to save this routine. Please check your connection.');
      } finally {
        setSaving(false);
      }
    };
    void run();
  };

  return (
    <ScreenContainer>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.subheading}>For {patientName}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g., Morning routine"
          placeholderTextColor={C.textMuted}
          style={styles.input}
          autoCapitalize="sentences"
          returnKeyType="done"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Schedule</Text>
        <TextInput
          value={scheduleLabel}
          onChangeText={setScheduleLabel}
          placeholder="e.g., Every day · 7:30 AM"
          placeholderTextColor={C.textMuted}
          style={styles.input}
          autoCapitalize="sentences"
          returnKeyType="done"
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.saveButton, (pressed || saving) && styles.saveButtonPressed]}
        onPress={onSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save'}</Text>
      </Pressable>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading:   { fontFamily: F.bold, fontSize: 22, color: C.textPrimary, marginBottom: 4 },
  subheading:{ fontFamily: F.regular, fontSize: 13, color: C.textSecondary, marginBottom: 20 },

  field: { marginBottom: 16 },
  label: { fontFamily: F.semiBold, fontSize: 13, color: C.textBody, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: F.regular, fontSize: 15, color: C.textPrimary,
  },

  saveButton: {
    marginTop: 10, borderRadius: 14, backgroundColor: C.primary,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: C.primary, shadowOpacity: 0.26, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6,
  },
  saveButtonPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  saveButtonText:    { fontFamily: F.bold, color: C.primaryText, fontSize: 16 },
});
