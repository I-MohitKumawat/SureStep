import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Svg, { Circle, Path } from 'react-native-svg';
import { IconHome, IconFamily, IconCare } from '../../assets/icons/NavIcons';
import { useTheme } from '../../theme/ThemeContext';

const PlayCircleIcon = ({ size = 24, color = '#52605D', strokeWidth = 1.8 }: { size?: number; color?: string; strokeWidth?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M10 8l6 4-6 4V8z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const PatientBottomBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode } = useTheme();

  const tabs = [
    { name: 'Home', screen: 'HomeTab', Icon: IconHome },
    { name: 'My People', screen: 'FamilyTab', Icon: IconFamily },
    { name: 'Activities', screen: 'ActivitiesTab', Icon: PlayCircleIcon },
    { name: 'Care', screen: 'CareTab', Icon: IconCare },
  ] as const;

  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View
      className="border-t border-[#E5E0D8] dark:border-[#2C3835] bg-white dark:bg-[#1C2422]"
      style={{
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 8,
      }}
    >
      <View className="flex-row items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = activeRouteName === tab.screen;
          const Icon = tab.Icon;
          const activeColor = '#0E7A67';
          const inactiveColor = mode === 'dark' ? '#9EABA7' : '#52605D';
          const color = isActive ? activeColor : inactiveColor;

          return (
            <Pressable
              key={tab.screen}
              onPress={() => {
                if (!isActive) {
                  navigation.navigate(tab.screen);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={tab.name}
              accessibilityState={{ selected: isActive }}
              className="flex-1 items-center justify-center py-1"
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <View className="items-center justify-center mb-1">
                <Icon size={24} color={color} strokeWidth={isActive ? 2.2 : 1.8} />
              </View>
              <Text
                className={`text-[11px] tracking-tight ${
                  isActive
                    ? 'font-extrabold text-[#0E7A67] dark:text-[#b1f3da]'
                    : 'font-medium text-[#52605D] dark:text-[#9EABA7]'
                }`}
                numberOfLines={1}
              >
                {tab.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
