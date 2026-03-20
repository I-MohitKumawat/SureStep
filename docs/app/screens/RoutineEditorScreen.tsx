import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { createRoutine, updateRoutine } from '../api/routines';

type Props = NativeStackScreenProps<HomeStackParamList, 'RoutineEditor'>;

export const RoutineEditorScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patientId, patientName, mode } = route.params;
  const routineForEdit = mode === 'edit' ? route.params.routine : undefined;

  const initialName = useMemo(
    () => (mode === 'edit' && routineForEdit ? routineForEdit.name : ''),
    [mode, routineForEdit]
  );
  const initialSchedule = useMemo(
    () => (mode === 'edit' && routineForEdit ? routineForEdit.scheduleLabel : ''),
    [mode, routineForEdit]
  );

  const [name, setName] = useState(initialName);
  const [scheduleLabel, setScheduleLabel] = useState(initialSchedule);

  const title = mode === 'edit' ? 'Edit routine' : 'New routine';

  const onSave = () => {
    const run = async () => {
      const trimmed = name.trim();
      if (!trimmed) {
        Alert.alert('Missing name', 'Please enter a routine name.');
        return;
      }
      const schedule = scheduleLabel.trim();
      try {
        if (mode === 'edit' && routineForEdit) {
          await updateRoutine(routineForEdit.id, {
            name: trimmed,
            isActive: routineForEdit.isActive,
            scheduleLabel: schedule
          });
        } else {
          await createRoutine({
            patientId,
            name: trimmed,
            isActive: true,
            scheduleLabel: schedule
          });
        }
        navigation.goBack();
      } catch (e) {
        Alert.alert('Save failed', 'Unable to save this routine right now.');
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
          style={styles.input}
          autoCapitalize="sentences"
          returnKeyType="done"
        />
      </View>

      <Pressable style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]} onPress={onSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </Pressable>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  subheading: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16
  },
  field: {
    marginBottom: 14
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827'
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#111827',
    paddingVertical: 12,
    alignItems: 'center'
  },
  saveButtonPressed: {
    backgroundColor: '#1f2937'
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  }
});

