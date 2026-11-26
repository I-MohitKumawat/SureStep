import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CARD_CLASS, CARD_SHADOW } from '../../../constants/caregiverDashboard';

export interface DashboardOverviewProps {
  loading: boolean;
  hasError: boolean;
  patientCount: number;
  alertsAvailable: boolean;
  activeAlertsCount: number;
  urgentPatientCount: number;
  onPressSafetyAlerts: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  loading,
  hasError,
  patientCount,
  alertsAvailable,
  activeAlertsCount,
  urgentPatientCount,
  onPressSafetyAlerts,
}) => (
  <View
    className={`${CARD_CLASS} flex-row items-center p-[14px]`}
    style={CARD_SHADOW}
  >
    {/* Patient count */}

    <View className="flex-1 gap-[5px]">
      <View className="flex-row items-center gap-[9px]">
        <Ionicons name="people-outline" size={23} color="#256C78" />

        <Text className="font-inter-bold text-[26px] text-care-ink">
          {loading || hasError ? '—' : patientCount}
        </Text>
      </View>

      <Text className="font-inter-regular text-[11px] leading-[17px] text-care-muted">
        Patients under care
      </Text>
    </View>

    <View className="mx-[14px] h-[44px] w-px bg-care-border" />

    {/* Safety alert count */}

    <Pressable
      onPress={onPressSafetyAlerts}
      accessibilityRole="button"
      accessibilityLabel="View safety alerts"
      className="min-h-[44px] flex-1 gap-[5px] active:opacity-70"
    >
      <View className="flex-row items-center gap-[9px]">
        <Ionicons
          name="shield-outline"
          size={23}
          color={
            activeAlertsCount > 0 || urgentPatientCount > 0
              ? '#DC2626'
              : '#256C78'
          }
        />

        <Text
          className={`font-inter-bold text-[26px] ${
            activeAlertsCount > 0 || urgentPatientCount > 0
              ? 'text-red-700'
              : 'text-care-ink'
          }`}
        >
          {alertsAvailable ? activeAlertsCount : '—'}
        </Text>
      </View>

      <Text className="font-inter-regular text-[11px] leading-[17px] text-care-muted">
        Safety alerts
      </Text>
    </Pressable>
  </View>
);
