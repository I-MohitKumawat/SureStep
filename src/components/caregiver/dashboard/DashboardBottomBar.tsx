import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TABS } from '../../../constants/caregiverDashboard';
import type { CaregiverTab } from '../../../types/caregiverDashboard.types';

export interface DashboardBottomBarProps {
  activeTab: CaregiverTab;
  notificationCount: number;
  onSelectTab: (tab: CaregiverTab) => void;
}

export const DashboardBottomBar: React.FC<DashboardBottomBarProps> = ({
  activeTab,
  notificationCount,
  onSelectTab,
}) => (
  <View className="flex-row border-t border-care-border bg-white px-[6px] pb-[6px] pt-[6px]">
    {TABS.map((tab) => {
      const selected = activeTab === tab.id;

      return (
        <Pressable
          key={tab.id}
          onPress={() => onSelectTab(tab.id)}
          accessibilityRole="tab"
          accessibilityLabel={tab.label}
          accessibilityState={{
            selected,
          }}
          className="min-h-[58px] flex-1 items-center justify-center gap-[4px]"
        >
          <View
            className={`relative h-[34px] min-w-[64px] items-center justify-center rounded-full ${
              selected ? 'bg-care-selected' : 'bg-white'
            }`}
          >
            <Ionicons
              name={selected ? tab.activeIcon : tab.icon}
              size={22}
              color={selected ? '#0E7A67' : '#68766F'}
            />

            {tab.id === 'Alerts' && notificationCount > 0 && (
              <View className="absolute right-[4px] top-[-3px] min-w-[18px] items-center rounded-full bg-red-600 px-[4px] py-[2px]">
                <Text className="font-inter-semibold text-[10px] text-white">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Text>
              </View>
            )}
          </View>

          <Text
            className={`text-center text-[11px] ${
              selected
                ? 'font-inter-semibold text-brand-dark'
                : 'font-inter-medium text-care-muted'
            }`}
          >
            {tab.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);
