import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

export type FamilyTab = 'Home' | 'People' | 'Alerts' | 'Care';

export const FamilyBottomBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const tabs = [
    { name: 'Home', icon: 'home-outline' as const, iconActive: 'home' as const, screen: 'FamilyHomeTab' },
    { name: 'People', icon: 'people-outline' as const, iconActive: 'people' as const, screen: 'FamilyPeopleTab' },
    { name: 'Alerts', icon: 'notifications-outline' as const, iconActive: 'notifications' as const, screen: 'FamilyAlertsTab' },
    { name: 'Care', icon: 'heart-outline' as const, iconActive: 'heart' as const, screen: 'FamilyCareTab' },
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
                color={isActive ? '#0E7A67' : '#8A9592'}
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
    borderTopColor: '#E5E0D8',
    paddingBottom: 24, // for safe area
    paddingTop: 10,
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
    position: 'relative',
  },
  label: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#8A9592',
    marginTop: 4,
  },
  labelActive: {
    color: '#0E7A67',
    fontFamily: F.semiBold,
  },
  activeIndicator: {
    position: 'absolute',
    top: -10,
    width: 24,
    height: 3,
    backgroundColor: '#0E7A67',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
});
