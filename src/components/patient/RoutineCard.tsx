import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from './patientStyles';
import { getTaskMeta } from '../../utils/patientUtils';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { Feather, Ionicons } from '@expo/vector-icons';

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

export function getTaskIconInfo(task: Task): { library: 'Feather' | 'Ionicons'; name: string } {
  const customIcon = task.icon?.trim();
  if (customIcon) {
    const isEmoji = /\p{Emoji}/u.test(customIcon) || customIcon.length <= 2;
    if (!isEmoji) {
      return { library: 'Feather', name: customIcon };
    }
  }

  const t = task.title.toLowerCase();
  if (t.includes('med') || t.includes('pill') || t.includes('tablet')) {
    return { library: 'Ionicons', name: 'medkit-outline' };
  }
  if (t.includes('breakfast') || t.includes('meal') || t.includes('food') || t.includes('eat') || t.includes('lunch') || t.includes('dinner')) {
    return { library: 'Ionicons', name: 'restaurant-outline' };
  }
  if (t.includes('walk') || t.includes('exercise') || t.includes('jog') || t.includes('step')) {
    return { library: 'Ionicons', name: 'walk-outline' };
  }
  if (t.includes('water') || t.includes('drink') || t.includes('hydrat')) {
    return { library: 'Ionicons', name: 'water-outline' };
  }
  if (t.includes('sleep') || t.includes('nap') || t.includes('rest')) {
    return { library: 'Ionicons', name: 'moon-outline' };
  }
  if (t.includes('blood') || t.includes('bp') || t.includes('pressure') || t.includes('sugar') || t.includes('glucose')) {
    return { library: 'Ionicons', name: 'pulse-outline' };
  }

  return { library: 'Ionicons', name: 'clipboard-outline' };
}

export const RoutineCard: React.FC<Props> = ({
  task,
  onUpdateStatus,
  onViewInstructions,
}) => {
  const meta = getTaskMeta(task.title);
  const iconInfo = getTaskIconInfo(task);
  const isDone = task.state === 'done';
  const isUnsure = task.state === 'unsure';

  return (
    <View style={[styles.mainRoutineCard, isDone && { borderColor: '#86EFAC', backgroundColor: '#F9FBF9' }]}>
      <View style={styles.routineTop}>
        <View style={styles.routineIconWrap}>
          {iconInfo.library === 'Feather' ? (
            <Feather name={iconInfo.name as any} size={22} color={C.primary} />
          ) : (
            <Ionicons name={iconInfo.name as any} size={22} color={C.primary} />
          )}
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
            Instructions
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
