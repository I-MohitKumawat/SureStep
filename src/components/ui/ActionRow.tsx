import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconTile } from './IconTile';

export interface ActionRowProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  count?: number;
}

export const ActionRow: React.FC<ActionRowProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  count,
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={title}
    className="min-h-[64px] flex-row items-center gap-[12px] py-[10px] active:opacity-70"
  >
    <IconTile icon={icon} />

    <View className="flex-1">
      <Text className="font-inter-semibold text-[14px] leading-[20px] text-care-ink">
        {title}
      </Text>

      {!!subtitle && (
        <Text className="mt-[3px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
          {subtitle}
        </Text>
      )}
    </View>

    {!!count && count > 0 && (
      <View className="min-w-[24px] items-center rounded-full bg-red-100 px-[8px] py-[4px]">
        <Text className="font-inter-semibold text-[12px] text-red-700">
          {count}
        </Text>
      </View>
    )}

    <Ionicons name="chevron-forward" size={17} color="#68766F" />
  </Pressable>
);
