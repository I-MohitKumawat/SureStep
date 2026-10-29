import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../../theme/ThemeContext';

export type ScheduleItemType = 'ROUTINE' | 'ACTIVITY';

export interface ScheduleItemData {
  id: string;
  type: ScheduleItemType;
  title: string;
  timeStr: string;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  isActive?: boolean;
  rawItem: any;
}

interface ScheduleItemProps {
  item: ScheduleItemData;
  index: number;
  totalCount: number;
  onPress: (item: ScheduleItemData) => void;
}

const ChevronRightIcon = ({ color = '#9EABA7', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Routine semantic icon: Solid dot when active, checkmark when completed, or hollow circle
const RoutineNodeIcon = ({
  isActive,
  isCompleted,
  isDark,
}: {
  isActive?: boolean;
  isCompleted?: boolean;
  isDark: boolean;
}) => {
  if (isActive) {
    return (
      <View className="w-3.5 h-3.5 rounded-full bg-[#0E7A67] dark:bg-[#14B8A6]" />
    );
  }
  if (isCompleted) {
    return (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke="#0E7A67" strokeWidth={2.2} fill={isDark ? '#1C2422' : '#FFFFFF'} />
        <Path d="M8 12l3 3 5-5" stroke="#0E7A67" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <View
      className="w-3.5 h-3.5 rounded-full border-2 border-[#9CA3AF] dark:border-[#52605D]"
      style={{ backgroundColor: isDark ? '#1C2422' : '#FFFFFF' }}
    />
  );
};

// Activity semantic icon: Play outline circle to distinguish from routine semantically
const ActivityNodeIcon = ({
  isActive,
  isCompleted,
  isDark,
}: {
  isActive?: boolean;
  isCompleted?: boolean;
  isDark: boolean;
}) => {
  const color = isActive ? '#0E7A67' : isCompleted ? '#0E7A67' : isDark ? '#52605D' : '#9CA3AF';
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} fill={isDark ? '#1C2422' : '#FFFFFF'} />
      <Path d="M10 8l6 4-6 4V8z" fill={color} />
    </Svg>
  );
};

export const ScheduleItem: React.FC<ScheduleItemProps> = ({
  item,
  index,
  totalCount,
  onPress,
}) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const isActive = item.isActive;
  const isCompleted = item.status === 'COMPLETED';

  const isFirst = index === 0;
  const isLast = index === totalCount - 1;
  const lineColor = isDark ? '#2C3835' : '#D8D4CC';

  return (
    <View className="relative">
      {/* Continuous Vertical Timeline Connector Line */}
      {totalCount > 1 && (
        <>
          {/* Top segment (from row top to node center) */}
          {!isFirst && (
            <View
              style={{
                position: 'absolute',
                left: 23,
                top: 0,
                bottom: '50%',
                width: 2,
                backgroundColor: lineColor,
                zIndex: 0,
              }}
            />
          )}
          {/* Bottom segment (from node center to row bottom) */}
          {!isLast && (
            <View
              style={{
                position: 'absolute',
                left: 23,
                top: '50%',
                bottom: 0,
                width: 2,
                backgroundColor: lineColor,
                zIndex: 0,
              }}
            />
          )}
        </>
      )}

      {/* Row Pressable */}
      <Pressable
        onPress={() => onPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title} at ${item.timeStr}`}
        className={`flex-row items-center justify-between py-3 px-2 rounded-2xl ${
          isActive
            ? 'bg-[#E6F4F1] dark:bg-[#16332D]'
            : 'bg-transparent'
        }`}
        style={({ pressed }) => [pressed && { opacity: 0.75 }]}
      >
        <View className="flex-row items-center flex-1 mr-2">
          {/* Node Column on Timeline Track */}
          <View className="w-8 items-center justify-center mr-2.5 z-10">
            {item.type === 'ACTIVITY' ? (
              <ActivityNodeIcon isActive={isActive} isCompleted={isCompleted} isDark={isDark} />
            ) : (
              <RoutineNodeIcon isActive={isActive} isCompleted={isCompleted} isDark={isDark} />
            )}
          </View>

          {/* Time (12h format e.g. 8:00 AM) */}
          <Text
            className={`text-sm w-20 mr-2 ${
              isActive
                ? 'font-bold text-[#0E7A67] dark:text-[#b1f3da]'
                : isDark
                ? 'font-medium text-[#9EABA7]'
                : 'font-semibold text-[#161E1C]'
            }`}
            numberOfLines={1}
          >
            {item.timeStr}
          </Text>

          {/* Title */}
          <Text
            className={`text-sm flex-1 ${
              isActive
                ? 'font-extrabold text-[#161E1C] dark:text-[#F5F7F6]'
                : isCompleted
                ? 'font-medium text-[#52605D] dark:text-[#9EABA7]'
                : isDark
                ? 'font-semibold text-[#F5F7F6]'
                : 'font-semibold text-[#161E1C]'
            }`}
            numberOfLines={1}
          >
            {item.title}
          </Text>
        </View>

        {/* Right chevron */}
        <ChevronRightIcon
          color={isActive ? (isDark ? '#b1f3da' : '#0E7A67') : isDark ? '#52605D' : '#9CA3AF'}
          size={16}
        />
      </Pressable>

      {/* Subtle Horizontal Divider between consecutive inactive items */}
      {!isLast && !isActive && (
        <View
          className="ml-12 border-b border-[#E5E0D8]/60 dark:border-[#2C3835]/80"
        />
      )}
    </View>
  );
};
