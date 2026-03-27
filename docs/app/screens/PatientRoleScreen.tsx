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

type PatientTab = 'Home' | 'Profile';
type DayGroup = 'Morning' | 'Afternoon' | 'Evening';
type Props = NativeStackScreenProps<HomeStackParamList, 'PatientDashboard'>;

function groupForHour(hour: number): DayGroup {
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
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

  const [tab, setTab] = React.useState<PatientTab>('Home');
  const [profile, setProfile] = React.useState<PatientProfile | null>(null);
  const [routines, setRoutines] = React.useState<PatientRoutine[] | null>(null);
  const [activities, setActivities] = React.useState<PatientActivity[] | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [routineIndex, setRoutineIndex] = React.useState(0);

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

  React.useEffect(() => {
    if (orderedRoutines.length === 0) {
      if (routineIndex !== 0) setRoutineIndex(0);
      return;
    }
    if (routineIndex > orderedRoutines.length - 1) {
      setRoutineIndex(0);
    }
  }, [orderedRoutines.length, routineIndex]);

  const onMarkRoutineDone = async (routineId: string) => {
    await markRoutineDone(routineId);
    await refresh();
  };

  const onToggleActivity = async (activityId: string) => {
    await toggleActivity(activityId);
    await refresh();
  };

  const renderHome = () => {
    const routineCount = (routines ?? []).length;
    const activityCount = (activities ?? []).length;

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>Home</Text>
        <Text style={[styles.pageSubtitle, { color: theme.colors.textSecondary }]}>
          {routineCount} routines · {activityCount} activities
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Routines</Text>

          {orderedRoutines.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No routines scheduled.
            </Text>
          ) : (
            (() => {
              const current = orderedRoutines[routineIndex];
              const missed = current.status === 'missed';
              const completed = current.status === 'completed';
              const borderColor = missed ? '#fecaca' : theme.colors.borderSubtle;
              const bg = missed ? '#fef2f2' : theme.colors.surface;

              return (
                <View
                  style={[
                    styles.singleRoutineCard,
                    { borderColor, backgroundColor: bg, opacity: completed ? 0.7 : 1 }
                  ]}
                >
                  <View style={styles.singleRoutineHeader}>
                    <Text style={[styles.groupTitle, { color: theme.colors.textPrimary }]}>
                      {current.group}
                    </Text>
                    <Text style={[styles.groupMeta, { color: theme.colors.textSecondary }]}>
                      {routineIndex + 1} / {orderedRoutines.length}
                    </Text>
                  </View>

                  <Text style={[styles.itemTitle, { color: theme.colors.textPrimary }]}>{current.name}</Text>
                  <Text style={[styles.itemMeta, { color: theme.colors.textSecondary }]}>
                    {current.timeLabel}
                  </Text>

                  <View style={styles.singleRoutineActions}>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: completed ? '#ecfdf3' : missed ? '#fee2e2' : '#eff6ff',
                          borderColor: completed ? '#bbf7d0' : missed ? '#fecaca' : '#bfdbfe'
                        }
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: completed ? '#166534' : missed ? '#b91c1c' : '#1d4ed8' }
                        ]}
                      >
                        {current.status}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => onMarkRoutineDone(current.id)}
                      disabled={completed}
                      style={({ pressed }) => [
                        styles.devButton,
                        {
                          borderColor: theme.colors.borderSubtle,
                          backgroundColor: pressed ? theme.colors.background : theme.colors.surface,
                          opacity: completed ? 0.5 : 1
                        }
                      ]}
                    >
                      <Text style={{ color: theme.colors.textPrimary, fontWeight: '700', fontSize: 12 }}>
                        Mark done
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setRoutineIndex((i) => (i + 1) % orderedRoutines.length)}
                      style={({ pressed }) => [
                        styles.devButton,
                        {
                          borderColor: theme.colors.borderSubtle,
                          backgroundColor: pressed ? theme.colors.background : theme.colors.surface
                        }
                      ]}
                    >
                      <Text style={{ color: theme.colors.textPrimary, fontWeight: '700', fontSize: 12 }}>
                        Next
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })()
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Activities</Text>

          {(activities ?? []).length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No activities today.</Text>
          ) : (
            (activities ?? []).map((a) => (
              <Pressable
                key={a.id}
                onPress={() => onToggleActivity(a.id)}
                style={[
                  styles.activityCard,
                  {
                    borderColor: theme.colors.borderSubtle,
                    backgroundColor: a.completed ? '#ecfdf3' : theme.colors.surface
                  }
                ]}
              >
                <View style={styles.activityHeader}>
                  <Text style={[styles.activityTitle, { color: theme.colors.textPrimary }]}>{a.name}</Text>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: a.completed ? '#16a34a' : theme.colors.borderSubtle,
                        backgroundColor: a.completed ? '#16a34a' : 'transparent'
                      }
                    ]}
                  />
                </View>
                {a.description ? (
                  <Text style={[styles.activityDescription, { color: theme.colors.textSecondary }]}>
                    {a.description}
                  </Text>
                ) : null}
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
        <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>Profile</Text>

        <View style={[styles.profileCard, { borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surface }]}>
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
            styles.backToMain,
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
            styles.settingsInProfile,
            {
              borderColor: theme.colors.borderSubtle,
              backgroundColor: pressed ? theme.colors.surface : 'transparent'
            }
          ]}
        >
          <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>Settings</Text>
        </Pressable>
      </ScrollView>
    );
  };

  return (
    <ScreenContainer style={styles.shell}>
      {loading ? (
        <View style={styles.loadingFill}>
          <ActivityIndicator />
          <Text style={[styles.loadingLabel, { color: theme.colors.textSecondary }]}>Loading…</Text>
        </View>
      ) : tab === 'Profile' ? (
        renderProfile()
      ) : (
        renderHome()
      )}

      <View style={[styles.tabBar, { borderTopColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surface }]}>
        {(['Home', 'Profile'] as PatientTab[]).map((t) => {
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
    paddingTop: 12,
    paddingBottom: 96
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6
  },
  pageSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12
  },
  section: {
    marginTop: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10
  },
  groupCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    marginBottom: 12
  },
  singleRoutineCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12
  },
  singleRoutineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  singleRoutineActions: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center'
  },
  devButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  groupHeader: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  groupMeta: {
    fontSize: 12,
    fontWeight: '600'
  },
  groupBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10
  },
  emptyText: {
    fontSize: 13
  },
  itemRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemLeft: {
    flex: 1,
    paddingRight: 10
  },
  itemRight: {
    alignItems: 'flex-end'
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2
  },
  itemMeta: {
    fontSize: 12
  },
  statusPill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  activityCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  activityDescription: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth
  },
  profileCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
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
    fontWeight: '800',
    marginBottom: 6
  },
  profileMeta: {
    fontSize: 13,
    lineHeight: 18
  },
  backToMain: {
    marginTop: 16,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10
  },
  settingsInProfile: {
    marginTop: 12,
    alignSelf: 'flex-start',
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 12,
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

