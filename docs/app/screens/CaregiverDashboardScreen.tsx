import React, { useEffect, useMemo, useState } from 'react';
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
import type { CaregiverSummaryTile } from '../api/reports';
import { fetchCaregiverSummaryTiles } from '../api/reports';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { useTheme } from '../../../packages/ui/theme/ThemeProvider';

type Props = NativeStackScreenProps<HomeStackParamList, 'CaregiverDashboard'>;

function greetingLine(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const CaregiverDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [patients, setPatients] = useState<CaregiverSummaryTile[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const data = await fetchCaregiverSummaryTiles();
        if (!isMounted) return;
        setPatients(data);
      } catch {
        if (!isMounted) return;
        setError('Unable to load summaries.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const list = patients ?? [];
    return {
      nextDue: list.filter((p) => p.statusGroup === 'next_due'),
      missed: list.filter((p) => p.statusGroup === 'missed'),
      completed: list.filter((p) => p.statusGroup === 'completed')
    };
  }, [patients]);

  const listData = patients ?? [];
  const summaryLine =
    listData.length === 0
      ? 'No patients linked yet'
      : `${listData.length} ${listData.length === 1 ? 'patient' : 'patients'} · overview`;

  const openPatient = (item: CaregiverSummaryTile) => {
    navigation.navigate('PatientDetail', {
      patientId: item.id,
      name: item.name,
      relationship: item.relationship,
      adherencePercent: item.adherencePercent,
      lastActivityLabel: item.lastActivityLabel,
      hasRecentAlerts: item.hasRecentAlerts
    });
  };

  const renderRow = (item: CaregiverSummaryTile) => (
    <Pressable
      key={item.id}
      onPress={() => openPatient(item)}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor: theme.colors.borderSubtle,
          backgroundColor: pressed ? theme.colors.surface : theme.colors.background
        }
      ]}
    >
      <View style={[styles.rowDot, { borderColor: theme.colors.borderSubtle }]} />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.rowMeta, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {item.lastActivityLabel}
        </Text>
      </View>
    </Pressable>
  );

  const renderSection = (title: string, items: CaregiverSummaryTile[]) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textPrimary }]}>{title}</Text>
        <View style={styles.sectionBody}>{items.map(renderRow)}</View>
      </View>
    );
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.shell}>
      <View style={styles.headerBlock}>
        <Text style={[styles.greeting, { color: theme.colors.textPrimary }]}>{greetingLine()}</Text>
        <Text style={[styles.summary, { color: theme.colors.textSecondary }]}>{summaryLine}</Text>
      </View>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading…</Text>
        </View>
      )}

      {error && !loading ? (
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>{error}</Text>
      ) : null}

      {!loading && !error ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {listData.length === 0 ? (
            <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>No patients to show.</Text>
          ) : (
            <>
              {renderSection('Next due', grouped.nextDue)}
              {renderSection('Missed', grouped.missed)}
              {renderSection('Completed', grouped.completed)}
            </>
          )}
        </ScrollView>
      ) : null}

      <View
        style={[
          styles.footerBar,
          { borderTopColor: theme.colors.borderSubtle, backgroundColor: theme.colors.background }
        ]}
      >
        <Pressable style={styles.footerTab} accessibilityRole="button">
          <Text style={[styles.footerTabActive, { color: theme.colors.accent }]}>Overview</Text>
        </Pressable>
        <Pressable style={styles.footerTab} onPress={() => navigation.navigate('Settings')}>
          <Text style={[styles.footerTabText, { color: theme.colors.textSecondary }]}>Settings</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  headerBlock: {
    paddingHorizontal: 16,
    paddingBottom: 8
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 13
  },
  errorText: {
    fontSize: 13,
    paddingHorizontal: 16,
    marginBottom: 8
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 96
  },
  empty: {
    fontSize: 14,
    marginTop: 8
  },
  section: {
    marginTop: 24
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12
  },
  sectionBody: {
    gap: 12
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth
  },
  rowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
    marginRight: 12
  },
  rowText: {
    flex: 1
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2
  },
  rowMeta: {
    fontSize: 13,
    lineHeight: 18
  },
  footerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: 18
  },
  footerTab: {
    minWidth: 96,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  footerTabActive: {
    fontSize: 12,
    fontWeight: '700'
  },
  footerTabText: {
    fontSize: 12,
    fontWeight: '700'
  }
});
