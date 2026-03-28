import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../../../packages/core/auth/AuthContext';
import { useTheme } from '../../../packages/ui/theme/ThemeProvider';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import type { PatientActivity, PatientProfile, PatientRoutine, RoutineStatus } from '../patient/mockState';
import {
  fetchPatientProfile,
  fetchTodayActivities,
  fetchTodayRoutines,
  getRoutineStatus,
  getRoutineTimeLabel,
  markRoutineDone,
  toggleActivity
} from '../patient/mockState';

type PatientTab = 'Today' | 'Profile';
type DayGroup = 'Morning' | 'Afternoon' | 'Evening';
type Props = NativeStackScreenProps<HomeStackParamList, 'PatientDashboard'>;

function groupForHour(hour: number): DayGroup {
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

function greetingLine(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <View style={styles.profileIcon}>
      <View style={[styles.profileHead, { borderColor: color }]} />
      <View style={[styles.profileBody, { borderColor: color }]} />
    </View>
  );
}

export const PatientRoleScreen: React.FC<Props> = ({ navigation }) => {
  const { logout } = useAuth();
  const theme = useTheme();

  const [tab, setTab] = React.useState<PatientTab>('Today');
  const [profile, setProfile] = React.useState<PatientProfile | null>(null);
  const [routines, setRoutines] = React.useState<PatientRoutine[] | null>(null);
  const [activities, setActivities] = React.useState<PatientActivity[] | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = async () => {
    setLoading(true);
    const [p, r, a] = await Promise.all([fetchPatientProfile(), fetchTodayRoutines(), fetchTodayActivities()]);
    setProfile(p);
    setRoutines(r);
    setActivities(a);
    setLoading(false);
  };

  React.useEffect(() => {
    void refresh();
  }, []);

  const routineGroups = React.useMemo(() => {
    const result: Record<DayGroup, Array<PatientRoutine & { status: RoutineStatus; timeLabel: string }>> = {
      Morning: [],
      Afternoon: [],
      Evening: []
    };
    const list = routines ?? [];
    list.forEach((rt) => {
      const scheduled = new Date(rt.scheduledAtIso);
      const group = groupForHour(scheduled.getHours());
      result[group].push({
        ...rt,
        status: getRoutineStatus(rt),
        timeLabel: getRoutineTimeLabel(rt)
      });
    });
    (Object.keys(result) as DayGroup[]).forEach((g) => {
      result[g].sort((a, b) => new Date(a.scheduledAtIso).getTime() - new Date(b.scheduledAtIso).getTime());
    });
    return result;
  }, [routines]);

  const orderedRoutines = React.useMemo(() => {
    const flat = (Object.keys(routineGroups) as DayGroup[]).flatMap((g) =>
      routineGroups[g].map((r) => ({ ...r, group: g }))
    );
    flat.sort((a, b) => new Date(a.scheduledAtIso).getTime() - new Date(b.scheduledAtIso).getTime());
    return flat;
  }, [routineGroups]);

  const nextRoutine = React.useMemo(() => {
    for (const r of orderedRoutines) {
      if (r.status !== 'completed') return r;
    }
    return null;
  }, [orderedRoutines]);

  const onMarkRoutineDone = async (routineId: string) => {
    await markRoutineDone(routineId);
    await refresh();
  };

  const onToggleActivity = async (activityId: string) => {
    await toggleActivity(activityId);
    await refresh();
  };

  const renderToday = () => {
    const routineCount = (routines ?? []).length;
    const activityCount = (activities ?? []).length;
    const displayName = profile?.name ?? 'there';
    const summaryLine =
      routineCount === 0 && activityCount === 0
        ? 'Nothing scheduled for today'
        : `${routineCount} ${routineCount === 1 ? 'routine' : 'routines'} · ${activityCount} ${activityCount === 1 ? 'activity' : 'activities'}`;

    const cardMissed = nextRoutine?.status === 'missed';

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={[styles.greeting, { color: theme.colors.textPrimary }]}>
            {greetingLine()}, {displayName}
          </Text>
          <Text style={[styles.summary, { color: theme.colors.textSecondary }]}>{summaryLine}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textPrimary }]}>Next routine</Text>

          {!nextRoutine ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {orderedRoutines.length === 0
                ? 'No routines scheduled.'
                : "You're all caught up for today."}
            </Text>
          ) : (
            <View
              style={[
                styles.nextCard,
                {
                  borderColor: theme.colors.borderSubtle,
                  backgroundColor: theme.colors.surface
                }
              ]}
            >
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                {nextRoutine.name}
              </Text>
              <Text style={[styles.cardTime, { color: theme.colors.textSecondary }]}>{nextRoutine.timeLabel}</Text>
              {cardMissed ? (
                <Text style={[styles.cardHint, { color: theme.colors.textSecondary }]}>
                  This time has passed — you can still mark it when you’re ready.
                </Text>
              ) : null}

              <Pressable
                onPress={() => onMarkRoutineDone(nextRoutine.id)}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: theme.colors.accent,
                    opacity: pressed ? 0.88 : 1
                  }
                ]}
              >
                <Text style={styles.primaryButtonLabel}>Mark as done</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textPrimary }]}>Activities</Text>

          {(activities ?? []).length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No activities today.</Text>
          ) : (
            (activities ?? []).map((a) => (
              <Pressable
                key={a.id}
                onPress={() => onToggleActivity(a.id)}
                style={[
                  styles.activityRow,
                  {
                    borderColor: theme.colors.borderSubtle,
                    backgroundColor: theme.colors.background
                  }
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: a.completed ? theme.colors.accent : theme.colors.borderSubtle,
                      backgroundColor: a.completed ? theme.colors.accent : 'transparent'
                    }
                  ]}
                >
                  {a.completed ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
                <View style={styles.activityTextCol}>
                  <Text
                    style={[styles.activityTitle, { color: theme.colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {a.name}
                  </Text>
                  {a.description ? (
                    <Text
                      style={[styles.activityMeta, { color: theme.colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {a.description}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    );
  };

  const renderProfile = () => {
    if (!profile) return null;
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <Text style={[styles.greeting, { color: theme.colors.textPrimary }]}>{profile.name}</Text>
          <Text style={[styles.summary, { color: theme.colors.textSecondary }]}>Your profile</Text>
        </View>

        <View
          style={[
            styles.profileCard,
            { borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surface }
          ]}
        >
          <View style={[styles.photoPlaceholder, { borderColor: theme.colors.borderSubtle }]} />
          <View style={styles.profileTextCol}>
            <Text style={[styles.profileName, { color: theme.colors.textPrimary }]}>{profile.name}</Text>
            <Text style={[styles.profileMeta, { color: theme.colors.textSecondary }]}>
              Caregiver: {profile.caregiverName}
            </Text>
            <Text style={[styles.profileMeta, { color: theme.colors.textSecondary }]}>
              Emergency: {profile.emergencyContact}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              borderColor: theme.colors.borderSubtle,
              backgroundColor: pressed ? theme.colors.surface : 'transparent'
            }
          ]}
        >
          <Text style={{ color: theme.colors.textPrimary }}>Back to main app</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              borderColor: theme.colors.borderSubtle,
              backgroundColor: pressed ? theme.colors.surface : 'transparent',
              marginTop: 12
            }
          ]}
        >
          <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>Settings</Text>
        </Pressable>
      </ScrollView>
    );
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.shell}>
      {loading ? (
        <View style={styles.loadingFill}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={[styles.loadingLabel, { color: theme.colors.textSecondary }]}>Loading…</Text>
        </View>
      ) : tab === 'Profile' ? (
        renderProfile()
      ) : (
        renderToday()
      )}

      <View
        style={[
          styles.tabBar,
          { borderTopColor: theme.colors.borderSubtle, backgroundColor: theme.colors.background }
        ]}
      >
        {(['Today', 'Profile'] as PatientTab[]).map((t) => {
          const active = tab === t;
          const color = active ? theme.colors.accent : theme.colors.textSecondary;
          return (
            <Pressable key={t} onPress={() => setTab(t)} style={styles.tabItem}>
              {t === 'Profile' ? <ProfileIcon color={color} /> : null}
              <Text style={[styles.tabLabel, { color }]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  loadingFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  loadingLabel: {
    marginTop: 10,
    fontSize: 13
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 96
  },
  headerBlock: {
    marginBottom: 8
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4
  },
  summary: {
    fontSize: 14,
    lineHeight: 20
  },
  section: {
    marginTop: 24
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20
  },
  nextCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 16
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4
  },
  cardTime: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8
  },
  cardHint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 4
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12
  },
  activityTextCol: {
    flex: 1,
    paddingLeft: 4
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2
  },
  activityMeta: {
    fontSize: 13,
    lineHeight: 18
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800'
  },
  profileCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12
  },
  photoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#f3f4f6'
  },
  profileTextCol: {
    flex: 1
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6
  },
  profileMeta: {
    fontSize: 13,
    lineHeight: 18
  },
  secondaryButton: {
    marginTop: 24,
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 18
  },
  tabItem: {
    alignItems: 'center',
    gap: 6,
    minWidth: 64
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700'
  },
  profileIcon: {
    width: 20,
    height: 20,
    alignItems: 'center'
  },
  profileHead: {
    width: 10,
    height: 10,
    borderRadius: 10,
    borderWidth: 2
  },
  profileBody: {
    width: 16,
    height: 10,
    borderRadius: 10,
    borderWidth: 2,
    marginTop: 2
  }
});
