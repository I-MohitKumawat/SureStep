import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from './patientStyles';
import { getTaskMeta } from '../../utils/patientUtils';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

export type ActionState = 'done' | 'missed' | 'unsure' | 'overdue' | null;

export type Task = {
  id: string;
  title: string;
  time: string;
  icon?: string;
  state: ActionState;
  instructionsMd?: string;
  description?: string;
};

type Props = {
  task: Task;
  onUpdateStatus: (taskId: string, status: any) => void;
  onViewInstructions: (task: Task) => void;
};

export const RoutineCard: React.FC<Props> = ({
  task,
  onUpdateStatus,
  onViewInstructions,
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
