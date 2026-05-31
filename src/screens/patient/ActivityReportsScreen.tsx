import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
// Navigation types migrated to src/types/navigation.types.ts
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { getProfile, ALL_ACTIVITIES, ActivitySession, Activity } from '../../activities/activityData';
import type { PatientStackParams } from '../../types/navigation.types';

type Props = NativeStackScreenProps<PatientStackParams, 'ActivityReportsScreen'>;

export const ActivityReportsScreen: React.FC<Props> = ({ navigation }) => {
  const profile = getProfile();

  // Real session data only
  const today = new Date().toISOString().slice(0, 10);
  const todaysSessions = profile.sessions.filter((s: ActivitySession) => s.date === today && s.completed);
  const totalDone = profile.totalCompleted;

  // Which activities were done today
  const doneIds = new Set(todaysSessions.map((s: ActivitySession) => s.activityId));

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={s.screen}>

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={s.back}>â€¹  Back</Text>
        </Pressable>
        <Text style={s.title}>Report</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Today summary */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Today</Text>
          {todaysSessions.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>🌱</Text>
              <Text style={s.emptyText}>No activities done yet today.</Text>
              <Text style={s.emptyHint}>Tap an activity on the Activities screen to get started.</Text>
            </View>
          ) : (
            todaysSessions.map((session: ActivitySession) => {
              const activity = ALL_ACTIVITIES.find((a: Activity) => a.id === session.activityId);
              if (!activity) return null;
              return (
                <View key={session.activityId + session.date} style={s.sessionRow}>
                  <View style={[s.sessionIcon, { backgroundColor: activity.bgColor }]}>
                    <Text style={{ fontSize: 22 }}>{activity.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sessionName}>{activity.title}</Text>
                    <Text style={s.sessionMeta}>{activity.durationMin} min · Completed âœ“</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* All activities status */}
        <View style={s.card}>
          <Text style={s.cardTitle}>All Activities</Text>
          {ALL_ACTIVITIES.map((activity: Activity) => {
            const done = doneIds.has(activity.id);
            return (
              <View key={activity.id} style={s.actRow}>
                <View style={[s.actIcon, { backgroundColor: activity.bgColor }]}>
                  <Text style={{ fontSize: 20 }}>{activity.icon}</Text>
                </View>
                <Text style={s.actName}>{activity.title}</Text>
                <View style={[s.statusPill, done ? s.pillDone : s.pillPending]}>
                  <Text style={[s.statusText, done ? s.textDone : s.textPending]}>
                    {done ? 'âœ“ Done' : 'Not done'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Simple total */}
        <View style={[s.card, s.totalCard]}>
          <Text style={s.totalNum}>{totalDone}</Text>
          <Text style={s.totalLabel}>Activities completed all time</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  screen: { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10,
  },
  back:  { fontFamily: F.bold, fontSize: 17, color: C.primary },
  title: { fontFamily: F.extraBold, fontSize: 20, color: C.textPrimary },

  scroll: { paddingHorizontal: 16, paddingBottom: 24 },

  card: {
    backgroundColor: C.surface, borderRadius: 22, borderWidth: 1, borderColor: C.border,
    padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontFamily: F.extraBold, fontSize: 16, color: C.textPrimary, marginBottom: 14 },

  // Empty state
  emptyBox:  { alignItems: 'center', paddingVertical: 16 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontFamily: F.bold, fontSize: 15, color: C.textSecondary, marginBottom: 4 },
  emptyHint: { fontFamily: F.medium, fontSize: 12, color: C.textMuted, textAlign: 'center' },

  // Session row
  sessionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sessionIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sessionName: { fontFamily: F.bold, fontSize: 15, color: C.textPrimary },
  sessionMeta: { fontFamily: F.medium, fontSize: 12, color: C.textSecondary, marginTop: 2 },

  // Activity status row
  actRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  actIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actName: { flex: 1, fontFamily: F.bold, fontSize: 14, color: C.textPrimary },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillDone:    { backgroundColor: '#D1FAE5' },
  pillPending: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  statusText:  { fontFamily: F.bold, fontSize: 11 },
  textDone:    { color: '#065F46' },
  textPending: { color: C.textMuted },

  // Total card
  totalCard: { alignItems: 'center', paddingVertical: 24 },
  totalNum:  { fontFamily: F.extraBold, fontSize: 48, color: C.primary },
  totalLabel:{ fontFamily: F.medium, fontSize: 14, color: C.textSecondary, marginTop: 4 },
});
