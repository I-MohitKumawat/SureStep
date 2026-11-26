import React from 'react';
import { View } from 'react-native';
import { CARD_CLASS, CARD_SHADOW } from '../../../constants/caregiverDashboard';
import { ActionRow } from '../../ui/ActionRow';

export interface CareRequestsCardProps {
  subtitle: string;
  pendingCount: number | null;
  onPress: () => void;
}

export const CareRequestsCard: React.FC<CareRequestsCardProps> = ({
  subtitle,
  pendingCount,
  onPress,
}) => (
  <View className={`${CARD_CLASS} px-[12px]`} style={CARD_SHADOW}>
    <ActionRow
      title="Care requests"
      subtitle={subtitle}
      icon="mail-unread-outline"
      count={pendingCount ?? 0}
      onPress={onPress}
    />
  </View>
);
