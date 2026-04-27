import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import { IconHome, IconFamily, IconActivity, IconSearch, IconProfile } from '../assets/icons/NavIcons';
import { useCaregiver } from '../context/caregiverContext';
import { ActivitiesIllustration } from '../assets/icons/ActivitiesIllustration';

type Props = NativeStackScreenProps<HomeStackParamList, 'PatientActivities'>;
type BottomTab = 'Home' | 'Family' | 'Activity' | 'Search';

type ActivityCard = {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
};

const activities: ActivityCard[] = [
  { id: 'games', icon: '🧩', title: 'Games' },
  { id: 'workout', icon: '🏋️', title: 'Workout' },
  { id: 'relaxing', icon: '🎵', title: 'Relaxing'},
];

export const PatientActivitiesScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab] = useState<BottomTab>('Activity');

  const { confirmedCaregiver } = useCaregiver();

  const onTabPress = (tab: BottomTab) => {
    if (tab === 'Home') navigation.navigate('PatientDashboard');
    if (tab === 'Family') navigation.navigate('PatientFamily');
    if (tab === 'Activity') navigation.navigate('PatientActivities');
    if (tab === 'Search') navigation.navigate('PatientDashboard');
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>WHAT DO YOU{"\n"}WANT TO DO{"\n"}TODAY?</Text>

        <View style={styles.cardsList}>
          {activities.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                if (item.id === 'games') navigation.navigate('PatientGames');
              }}
              style={({ pressed }) => [styles.activityCard, pressed && styles.pressed]}
            >
              <View style={styles.iconBubble}>
                <Text style={styles.cardIcon}>{item.icon}</Text>
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.subtitle ? <Text style={styles.cardSubtitle}>{item.subtitle}</Text> : null}
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.bottomBarBand}>
        <View style={styles.bottomBar}>
          {(['Home', 'Family'] as BottomTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent = tab === 'Home' ? IconHome : IconFamily;
            return (
              <Pressable key={tab} onPress={() => onTabPress(tab)} style={styles.bottomTab}>
                <View style={styles.bottomTabIconWrap}>
                  <IconComponent size={24} color={isActive ? C.primary : C.textMuted} strokeWidth={isActive ? 2.2 : 1.8} />
                </View>
                <Text style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}>{tab}</Text>
                {isActive ? <View style={styles.activeIndicator} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.fabSlot}>
          <Pressable style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
            <Text style={styles.fabSymbol}>!</Text>
          </Pressable>
        </View>

        <View style={styles.bottomBar}>
          {(['Activity', 'Search'] as BottomTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const IconComponent =
              tab === 'Search' && confirmedCaregiver ? IconProfile : tab === 'Activity' ? IconActivity : IconSearch;
            const label =
              tab === 'Search' && confirmedCaregiver
                ? confirmedCaregiver.name.split(' ')[0]
                : tab;
            return (
              <Pressable key={tab} onPress={() => onTabPress(tab)} style={styles.bottomTab}>
                <View style={[styles.activityActiveBg, isActive && tab === 'Activity' ? styles.activityActiveBgShown : null]} />
                <View style={styles.bottomTabIconWrap}>
                  <IconComponent size={24} color={isActive && tab === 'Activity' ? C.primaryText : isActive ? C.primary : C.textMuted} strokeWidth={isActive ? 2.2 : 1.8} />
                </View>
                <Text style={[
                  styles.bottomLabel,
                  isActive && styles.bottomLabelActive,
                  isActive && tab === 'Activity' ? styles.bottomLabelActivityActive : null,
                ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >{label}</Text>
                {isActive && tab !== 'Activity' ? <View style={styles.activeIndicator} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 84 },

  illustrationWrap: {
    alignItems: 'center',
    marginBottom: 6,
  },

  title: {
    textAlign: 'center',
    fontFamily: F.extraBold,
    fontSize: 20,
    lineHeight: 28,
    color: C.primaryDark,
    marginBottom: 12,
  },
  cardsList: { gap: 12 },
  activityCard: {
    backgroundColor: '#EAF0F0',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.border,
    minHeight: 100,
    paddingHorizontal: 22,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: { fontSize: 26 },
  cardTextCol: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontFamily: F.bold, fontSize: 32, color: C.textPrimary, lineHeight: 38 },
  cardSubtitle: { fontFamily: F.regular, fontSize: 12, color: C.textBody, marginTop: 3 },
  pressed: { opacity: 0.85 },
  bottomBarBand: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 76,
    backgroundColor: C.surface,
    borderTopWidth: 1, borderTopColor: C.border,
    flexDirection: 'row',
    alignItems: 'flex-end',
    overflow: 'visible',
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
    zIndex: 2,
  },
  activityActiveBg: {
    position: 'absolute',
    bottom: -2,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'transparent',
  },
  activityActiveBgShown: { backgroundColor: C.primary },
  bottomLabel: { fontFamily: F.medium, fontSize: 10, color: C.textMuted, letterSpacing: 0.3, zIndex: 2 },
  bottomLabelActive: { fontFamily: F.bold, color: C.primary },
  bottomLabelActivityActive: { color: C.primaryText },
  activeIndicator: {
    position: 'absolute', bottom: 0,
    width: 18, height: 2.5, borderRadius: 2,
    backgroundColor: C.primary,
  },
  fabSlot: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -34,
  },
  fab: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.38, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 10,
    borderWidth: 3, borderColor: C.surface,
  },
  fabPressed: { transform: [{ scale: 0.95 }] },
  fabSymbol: { fontFamily: F.extraBold, color: C.primaryText, fontSize: 22 },
});
