import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import type { RoutineSummary } from '../api/routines';
import { fetchRoutinesForPatient } from '../api/routines';

type Props = NativeStackScreenProps<HomeStackParamList, 'RoutineManager'>;

export const RoutineManagerScreen: React.FC<Props> = ({ route }) => {
  const { patientId, patientName } = route.params;
  const [routines, setRoutines] = useState<RoutineSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const data = await fetchRoutinesForPatient(patientId);
        if (!isMounted) return;
        setRoutines(data);
      } catch (e) {
        if (!isMounted) return;
        setError('Unable to load routines. Showing an empty list.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  const listData = routines ?? [];

  return (
    <ScreenContainer>
      <Text style={styles.heading}>Routines</Text>
      <Text style={styles.subheading}>For {patientName}</Text>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading routines…</Text>
        </View>
      )}
      {error && !loading && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.routineName}>{item.name}</Text>
              <View style={[styles.chip, item.isActive ? styles.chipActive : styles.chipInactive]}>
                <Text style={item.isActive ? styles.chipTextActive : styles.chipTextInactive}>
                  {item.isActive ? 'Active' : 'Paused'}
                </Text>
              </View>
            </View>
            <Text style={styles.scheduleLabel}>{item.scheduleLabel}</Text>
          </View>
        )}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>No routines configured yet for this patient.</Text> : null
        }
      />

      <Text style={styles.footerNote}>Routine creation and editing will be added in later tasks.</Text>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  subheading: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#6b7280'
  },
  errorText: {
    fontSize: 13,
    color: '#b91c1c',
    marginBottom: 8
  },
  listContent: {
    paddingBottom: 16
  },
  card: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  routineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  scheduleLabel: {
    fontSize: 13,
    color: '#6b7280'
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999
  },
  chipActive: {
    backgroundColor: '#ecfdf3'
  },
  chipInactive: {
    backgroundColor: '#f3f4f6'
  },
  chipTextActive: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534'
  },
  chipTextInactive: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4b5563'
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8
  },
  footerNote: {
    marginTop: 12,
    fontSize: 12,
    color: '#9ca3af'
  }
});

