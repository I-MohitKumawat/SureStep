import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { ScheduleItem, type ScheduleItemData } from './ScheduleItem';

interface TodayScheduleProps {
  items: ScheduleItemData[];
  isSelfManaged: boolean;
  onManagePress: () => void;
  onItemPress: (item: ScheduleItemData) => void;
}

export const TodaySchedule: React.FC<TodayScheduleProps> = ({
  items,
  isSelfManaged,
  onManagePress,
  onItemPress,
}) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <View className="my-3">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3 px-1">
        <Text
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: isDark ? '#F5F7F6' : '#161E1C' }}
        >
          Today
        </Text>

        {/* Self-managed patient displays Manage, assisted does not */}
        {isSelfManaged && (
          <Pressable
            onPress={onManagePress}
            accessibilityRole="button"
            accessibilityLabel="Manage today routines"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <Text className="text-sm font-bold text-[#0E7A67] dark:text-[#b1f3da]">
              Manage
            </Text>
          </Pressable>
        )}
      </View>

      {/* Schedule Container Card */}
      <View className="rounded-[28px] p-2.5 border shadow-sm border-[#E5E0D8] dark:border-[#2C3835] bg-white dark:bg-[#1C2422]">
        {items.length > 0 ? (
          items.map((item, index) => (
            <ScheduleItem
              key={item.id}
              item={item}
              index={index}
              totalCount={items.length}
              onPress={onItemPress}
            />
          ))
        ) : (
          <View className="py-6 px-4 items-center justify-center">
            <Text
              className="text-sm font-medium text-center"
              style={{ color: isDark ? '#9EABA7' : '#52605D' }}
            >
              No routines or activities scheduled for today.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};
