/**
 * SureStep — src/components/shared/PatientBottomBar.tsx
 *
 * Persistent, stable bottom tab bar for the Patient experience.
 * Left 2 tabs: Home, Family
 * Center slot: Floating AI Assistant FAB
 * Right 2 tabs: Activities, Care Team
 */
import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { AiFab } from './AiAssistantFab';
import { IconHome, IconFamily, IconActivity, IconCareTeam } from '../../assets/icons/NavIcons';

export const PatientBottomBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const leftTabs = [
    { name: 'Home', screen: 'HomeTab', Icon: IconHome },
    { name: 'Family', screen: 'FamilyTab', Icon: IconFamily },
  ] as const;

  const rightTabs = [
    { name: 'Activities', screen: 'ActivitiesTab', Icon: IconActivity },
    { name: 'Care Team', screen: 'CareTeamTab', Icon: IconCareTeam },
  ] as const;

  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View style={styles.bottomBarBand}>
      {/* Left tabs */}
      <View style={styles.bottomBar}>
        {leftTabs.map((tab) => {
          const isActive = activeRouteName === tab.screen;
          const Icon = tab.Icon;

          return (
            <Pressable
              key={tab.screen}
              onPress={() => {
                if (!isActive) {
                  navigation.navigate(tab.screen);
                }
              }}
              style={styles.bottomTab}
              accessibilityRole="button"
              accessibilityLabel={tab.name}
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.bottomTabIconWrap}>
                <Icon size={24} color={isActive ? C.primary : C.textMuted} strokeWidth={isActive ? 2.2 : 1.8} />
              </View>
              <Text style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}>
                {tab.name}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>

      {/* Center FAB slot */}
      <View style={styles.fabSlot}>
        <AiFab />
      </View>

      {/* Right tabs */}
      <View style={styles.bottomBar}>
        {rightTabs.map((tab) => {
          const isActive = activeRouteName === tab.screen;
          const Icon = tab.Icon;

          return (
            <Pressable
              key={tab.screen}
              onPress={() => {
                if (!isActive) {
                  navigation.navigate(tab.screen);
                }
              }}
              style={styles.bottomTab}
              accessibilityRole="button"
              accessibilityLabel={tab.name}
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.bottomTabIconWrap}>
                <Icon size={24} color={isActive ? C.primary : C.textMuted} strokeWidth={isActive ? 2.2 : 1.8} />
              </View>
              <Text
                style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
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
  bottomBarBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 76,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: 'row',
    alignItems: 'flex-end',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 10,
    elevation: 10,
    zIndex: 100,
  },
  bottomBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 8,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  bottomTabIconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  bottomLabel: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.textMuted,
    letterSpacing: 0.3,
  },
  bottomLabelActive: {
    fontFamily: F.bold,
    color: C.primary,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 18,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: C.primary,
  },
  fabSlot: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -40,
  },
});
