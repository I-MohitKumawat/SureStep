import React from 'react';
import { View } from 'react-native';
import { CARD_CLASS, CARD_SHADOW } from '../../../constants/caregiverDashboard';
import type { IconName } from '../../../types/caregiverDashboard.types';
import { ActionRow } from '../../ui/ActionRow';
import { SectionHeading } from '../../ui/SectionHeading';
import { ProfileSummaryCard } from './ProfileSummaryCard';

const Divider = () => <View className="h-px bg-care-border" />;

export interface DashboardSettingsTabProps {
  caregiverName: string;
  caregiverPhoto: string | null;
  professionalRole: string;
  caregiverPhone: string;
  visibilityIcon: IconName;
  visibilityLabel: string;
  pendingCount: number | null;
  requestSubtitle: string;
  onOpenProfile: () => void;
  onOpenAccountSettings: () => void;
  onJoinCareCircle: () => void;
  onOpenRequests: () => void;
  onOpenNotificationSettings: () => void;
  onOpenNotificationHistory: () => void;
}

export const DashboardSettingsTab: React.FC<DashboardSettingsTabProps> = ({
  caregiverName,
  caregiverPhoto,
  professionalRole,
  caregiverPhone,
  visibilityIcon,
  visibilityLabel,
  pendingCount,
  requestSubtitle,
  onOpenProfile,
  onOpenAccountSettings,
  onJoinCareCircle,
  onOpenRequests,
  onOpenNotificationSettings,
  onOpenNotificationHistory,
}) => (
  <View className="gap-[14px] px-[16px] pb-[24px] pt-[14px]">
    {/* Profile details */}

    <ProfileSummaryCard
      caregiverName={caregiverName}
      caregiverPhoto={caregiverPhoto}
      professionalRole={professionalRole}
      caregiverPhone={caregiverPhone}
      visibilityIcon={visibilityIcon}
      visibilityLabel={visibilityLabel}
      onEditProfile={onOpenProfile}
    />

    {/* Account */}

    <SectionHeading title="Account" />

    <View className={`${CARD_CLASS} px-[14px] py-[4px]`} style={CARD_SHADOW}>
      <ActionRow
        title="Professional profile"
        subtitle="Skills, rates and availability"
        icon="person-outline"
        onPress={onOpenProfile}
      />

      <Divider />

      <ActionRow
        title="Account settings"
        subtitle="Manage your account"
        icon="settings-outline"
        onPress={onOpenAccountSettings}
      />
    </View>

    {/* Care connections */}

    <SectionHeading title="Care connections" />

    <View className={`${CARD_CLASS} px-[14px] py-[4px]`} style={CARD_SHADOW}>
      <ActionRow
        title="Join a Care Circle"
        subtitle="Enter an invitation code"
        icon="people-outline"
        onPress={onJoinCareCircle}
      />

      <Divider />

      <ActionRow
        title="Care requests"
        subtitle={requestSubtitle}
        icon="mail-outline"
        count={pendingCount ?? 0}
        onPress={onOpenRequests}
      />
    </View>

    {/* Preferences */}

    <SectionHeading title="Preferences" />

    <View className={`${CARD_CLASS} px-[14px] py-[4px]`} style={CARD_SHADOW}>
      <ActionRow
        title="Notification settings"
        subtitle="Manage notifications"
        icon="notifications-outline"
        onPress={onOpenNotificationSettings}
      />

      <Divider />

      <ActionRow
        title="Notification history"
        icon="time-outline"
        onPress={onOpenNotificationHistory}
      />
    </View>
  </View>
);
