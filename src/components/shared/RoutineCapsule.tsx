import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

import { type ViewStyle, type StyleProp } from 'react-native';

export type TaskCategory =
  | 'medication'
  | 'meal'
  | 'exercise'
  | 'walk'
  | 'appointment'
  | 'cognition'
  | 'therapy'
  | 'hygiene'
  | 'sleep'
  | 'custom';

export type TaskStatus = 'completed' | 'missed' | 'active' | 'upcoming';

export interface RoutineItemData {
  key: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  meta: string; // Time/description label
}

interface RoutineCapsuleProps {
  item: RoutineItemData;
  readOnly?: boolean;
  onSendReminder?: (key: string) => void;
  reminderSent?: boolean;
  style?: StyleProp<ViewStyle>;
}

const getCategoryIcon = (category: TaskCategory): string => {
  switch (category) {
    case 'medication':  return 'activity';
    case 'meal':        return 'coffee';
    case 'exercise':    return 'zap';
    case 'walk':        return 'compass';
    case 'appointment': return 'calendar';
    case 'cognition':   return 'award';
    case 'therapy':     return 'heart';
    case 'hygiene':     return 'droplet';
    case 'sleep':       return 'moon';
    case 'custom':      return 'clipboard';
    default:            return 'clipboard';
  }
};

export const RoutineCapsule: React.FC<RoutineCapsuleProps> = ({
  item,
  readOnly = false,
  onSendReminder,
  reminderSent = false,
  style,
}) => {
  let cardBg = '#FFFFFF';
  let cardBorder = '#E4E7EC';
  let titleColor = '#1A1C1E';
  let metaColor = '#707784';
  let dotColor = '#94A3B8';
  let circleBg = '#F1F5F9';
  let iconColor = '#64748B';
  let borderWidth = 1.5;

  if (item.status === 'completed') {
    cardBg = '#F0FDF4'; // light green
    cardBorder = '#BBF7D0';
    titleColor = '#065F46';
    metaColor = '#047857';
    dotColor = '#22C55E';
    circleBg = '#DCFCE7';
    iconColor = '#16A34A';
  } else if (item.status === 'missed') {
    cardBg = '#FFF7ED'; // light orange/amber
    cardBorder = '#FED7AA';
    titleColor = '#7C2D12';
    metaColor = '#C2410C';
    dotColor = '#F97316';
    circleBg = '#FFEDD5';
    iconColor = '#EA580C';
  } else if (item.status === 'active') {
    cardBg = '#ECFDF5'; // light teal/emerald
    cardBorder = '#A7F3D0';
    titleColor = '#064E3B';
    metaColor = '#047857';
    dotColor = '#10B981';
    circleBg = '#D1FAE5';
    iconColor = '#059669';
    borderWidth = 2.0; // thicker border to make active pop
  }

  const containerStyle = {
    backgroundColor: cardBg,
    borderColor: cardBorder,
    borderWidth: borderWidth,
  };

  return (
    <View style={[styles.routineCapsule, containerStyle, style]}>
      <View style={[styles.capsuleLeftIconContainer, { backgroundColor: circleBg }]}>
        <Feather name={getCategoryIcon(item.category) as any} size={20} color={iconColor} />
      </View>
      <View style={styles.routineCapsuleTextCol}>
        <Text style={[styles.routineCapsuleTitle, { color: titleColor }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.routineCapsuleMeta, { color: metaColor }]} numberOfLines={1}>
          {item.meta}
        </Text>
      </View>
      <View style={styles.capsuleRight}>
        <View style={[styles.capsuleStatusDot, { backgroundColor: dotColor }]} />
        {!readOnly && item.status !== 'completed' && onSendReminder && (
          <Pressable
            onPress={() => onSendReminder(item.key)}
            style={({ pressed }) => [styles.capsuleReminderBtn, pressed && { opacity: 0.72 }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name={reminderSent ? 'check' : 'bell'} size={14} color="#71717A" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  routineCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  capsuleLeftIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineCapsuleTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  routineCapsuleTitle: {
    fontFamily: F.bold,
    fontSize: 15,
  },
  routineCapsuleMeta: {
    fontFamily: F.medium,
    fontSize: 13,
    marginTop: 3,
  },
  capsuleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  capsuleStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  capsuleReminderBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
