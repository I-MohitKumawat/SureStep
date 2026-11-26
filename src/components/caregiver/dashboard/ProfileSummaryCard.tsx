import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CARD_CLASS, CARD_SHADOW } from '../../../constants/caregiverDashboard';
import type { IconName } from '../../../types/caregiverDashboard.types';
import { Avatar } from '../../ui/Avatar';

export interface ProfileSummaryCardProps {
  caregiverName: string;
  caregiverPhoto: string | null;
  professionalRole: string;
  caregiverPhone: string;
  visibilityIcon: IconName;
  visibilityLabel: string;
  onEditProfile: () => void;
}

export const ProfileSummaryCard: React.FC<ProfileSummaryCardProps> = ({
  caregiverName,
  caregiverPhoto,
  professionalRole,
  caregiverPhone,
  visibilityIcon,
  visibilityLabel,
  onEditProfile,
}) => (
  <View className={`${CARD_CLASS} p-[16px]`} style={CARD_SHADOW}>
    <View className="flex-row items-center gap-[12px]">
      <Avatar name={caregiverName} uri={caregiverPhoto} size={58} />

      <View className="flex-1">
        <Text className="font-inter-bold text-[17px] leading-[23px] text-care-ink">
          {caregiverName}
        </Text>

        <Text className="mt-[4px] font-inter-regular text-[12px] text-care-muted">
          {professionalRole}
        </Text>

        {!!caregiverPhone && (
          <Text className="mt-[4px] font-inter-medium text-[12px] text-care-muted">
            {caregiverPhone}
          </Text>
        )}
      </View>
    </View>

    <View className="mt-[12px] flex-row items-center gap-[8px] rounded-[12px] bg-care-canvas p-[12px]">
      <Ionicons name={visibilityIcon} size={19} color="#256C78" />

      <Text className="flex-1 font-inter-medium text-[12px] text-care-ink">
        {visibilityLabel}
      </Text>
    </View>

    <Pressable
      onPress={onEditProfile}
      accessibilityRole="button"
      className="mt-[12px] min-h-[44px] flex-row items-center justify-center gap-[8px] rounded-[12px] bg-care-selected active:opacity-70"
    >
      <Ionicons name="create-outline" size={18} color="#0E7A67" />

      <Text className="font-inter-semibold text-[13px] text-brand-dark">
        Edit professional profile
      </Text>
    </Pressable>
  </View>
);
