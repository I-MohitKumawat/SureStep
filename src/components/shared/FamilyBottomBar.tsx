import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

export type FamilyTab = 'Home' | 'Map' | 'Alerts' | 'Messages' | 'Settings';

export const FamilyBottomBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const tabs = [
    { name: 'Home', icon: 'home-outline', iconActive: 'home', screen: 'FamilyFeedScreen' },
    { name: 'Map', icon: 'map-outline', iconActive: 'map', screen: 'FamilyMapScreen' },
    { name: 'Alerts', icon: 'notifications-outline', iconActive: 'notifications', screen: 'FamilyAlertsScreen' },
    { name: 'Messages', icon: 'chatbubble-outline', iconActive: 'chatbubble', screen: 'FamilyMessagesScreen' },
    { name: 'Settings', icon: 'settings-outline', iconActive: 'settings', screen: 'FamilySettingsScreen' },
  ] as const;

  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isActive = activeRouteName === tab.screen;
          const iconName = isActive ? tab.iconActive : tab.icon;

          return (
            <Pressable
              key={tab.name}
              style={styles.tab}
              onPress={() => {
                if (isActive) return;
                navigation.navigate(tab.screen);
              }}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={isActive ? C.primary : C.textMuted}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.name}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 24, // for safe area
    paddingTop: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
    position: 'relative',
  },
  label: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.textMuted,
    marginTop: 4,
  },
  labelActive: {
    color: C.primary,
    fontFamily: F.bold,
  },
  activeIndicator: {
    position: 'absolute',
    top: -10,
    width: 24,
    height: 3,
    backgroundColor: C.primary,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
});
