import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../ui/Avatar';
import type { CaregiverTab } from '../../../types/caregiverDashboard.types';

export interface DashboardHeaderProps {
  activeTab: CaregiverTab;
  caregiverName: string;
  firstName: string;
  caregiverPhoto: string | null;
  professionalRole: string;
  notificationCount: number;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTab,
  caregiverName,
  firstName,
  caregiverPhoto,
  professionalRole,
  notificationCount,
  onOpenNotifications,
  onOpenProfile,
}) => (
  <View className="px-[16px] pt-[10px]">
    {/* Neutral top navigation */}

    <View className="mb-[14px] flex-row items-center justify-between">
      <Text className="font-inter-bold text-[20px] text-brand-dark">
        SureStep
      </Text>

      <Pressable
        onPress={onOpenNotifications}
        accessibilityRole="button"
        accessibilityLabel="Notification history"
        className="relative h-[44px] w-[44px] items-center justify-center rounded-full border border-care-border bg-white active:opacity-70"
      >
        <Ionicons name="notifications-outline" size={22} color="#254D51" />

        {notificationCount > 0 && (
          <View className="absolute right-[5px] top-[5px] h-[9px] w-[9px] rounded-full border border-white bg-red-500" />
        )}
      </Pressable>
    </View>

    {/* Inset profile card */}

    <Pressable
      onPress={onOpenProfile}
      accessibilityRole="button"
      accessibilityLabel="Edit professional profile"
      className="flex-row items-center gap-[12px] rounded-[20px] border border-[#C4E6E6] bg-[#D2F1F1] p-[16px] active:opacity-80"
    >
      <Avatar name={caregiverName} uri={caregiverPhoto} size={54} />

      <View className="flex-1">
        <Text className="font-inter-bold text-[21px] leading-[28px] text-[#254D51]">
          {activeTab === 'Home'
            ? `Hello, ${firstName}`
            : activeTab === 'Alerts'
              ? 'Notifications'
              : 'Settings'}
        </Text>

        <Text className="mt-[3px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
          {professionalRole}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={17} color="#256C78" />
    </Pressable>
  </View>
);
