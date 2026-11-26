import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CARD_SHADOW = {
  shadowColor: '#254D51',
  shadowOpacity: 0.05,
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowRadius: 6,
  elevation: 1,
};

export interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  neutral?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  neutral = false,
}) => (
  <View
    className="items-center rounded-[18px] border border-care-border bg-white px-[20px] py-[26px]"
    style={CARD_SHADOW}
  >
    <View
      className={`mb-[12px] h-[60px] w-[60px] items-center justify-center rounded-full ${
        neutral ? 'bg-[#EDF2F0]' : 'bg-[#E1F2F4]'
      }`}
    >
      <Ionicons
        name={icon}
        size={29}
        color={neutral ? '#68766F' : '#256C78'}
      />
    </View>

    <Text className="text-center font-inter-semibold text-[15px] leading-[22px] text-care-ink">
      {title}
    </Text>

    {!!description && (
      <Text className="mt-[6px] text-center font-inter-regular text-[12px] leading-[18px] text-care-muted">
        {description}
      </Text>
    )}

    {!!actionLabel && !!onAction && (
      <Pressable
        onPress={onAction}
        accessibilityRole="button"
        className="mt-[16px] min-h-[44px] flex-row items-center justify-center gap-[8px] rounded-[12px] bg-care-selected px-[24px] active:opacity-70"
      >
        <Ionicons name="refresh-outline" size={18} color="#0E7A67" />

        <Text className="font-inter-semibold text-[13px] text-brand-dark">
          {actionLabel}
        </Text>
      </Pressable>
    )}
  </View>
);
