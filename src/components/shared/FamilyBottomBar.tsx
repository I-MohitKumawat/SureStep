import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { F } from '../../theme/fonts';

export type FamilyTab = 'Home' | 'People' | 'Alerts' | 'Care';

export const FamilyBottomBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const tabs = [
    { name: 'Home', icon: 'home-outline', iconActive: 'home', screen: 'HomeTab' },
    { name: 'People', icon: 'people-outline', iconActive: 'people', screen: 'PeopleTab' },
    { name: 'Alerts', icon: 'notifications-outline', iconActive: 'notifications', screen: 'AlertsTab' },
    { name: 'Care', icon: 'heart-outline', iconActive: 'heart', screen: 'CareTab' },
  ] as const;

  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isActive =
            activeRouteName === tab.screen ||
            (tab.screen === 'HomeTab' && (activeRouteName === 'FamilyFeedScreen' || activeRouteName === 'FamilyHomeScreen')) ||
            (tab.screen === 'PeopleTab' && activeRouteName === 'FamilyPeopleScreen') ||
            (tab.screen === 'AlertsTab' && activeRouteName === 'FamilyAlertsScreen') ||
            (tab.screen === 'CareTab' && activeRouteName === 'CareRequestsListScreen');

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
                size={24}
                color={isActive ? '#0E7A67' : '#52605D'}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.name}
              </Text>
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
    borderTopColor: '#E5E0D8',
    paddingBottom: 20, // for safe area
    paddingTop: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
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
  },
  label: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#52605D',
    marginTop: 4,
  },
  labelActive: {
    color: '#0E7A67',
    fontFamily: F.bold,
  },
});
