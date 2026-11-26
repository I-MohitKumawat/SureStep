import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface UrgentAlertBannerProps {
  urgentPatientCount: number;
  onPress: () => void;
}

export const UrgentAlertBanner: React.FC<UrgentAlertBannerProps> = ({
  urgentPatientCount,
  onPress,
}) => {
  if (urgentPatientCount <= 0) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-[10px] rounded-[14px] border border-red-300 bg-red-50 p-[14px] active:opacity-70"
    >
      <Ionicons name="warning-outline" size={23} color="#DC2626" />

      <View className="flex-1">
        <Text className="font-inter-semibold text-[13px] text-red-700">
          Immediate attention required
        </Text>

        <Text className="mt-[3px] font-inter-regular text-[12px] leading-[18px] text-red-700">
          {`${urgentPatientCount} ${
            urgentPatientCount === 1 ? 'patient has' : 'patients have'
          } an urgent safety state`}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#DC2626" />
    </Pressable>
  );
};
