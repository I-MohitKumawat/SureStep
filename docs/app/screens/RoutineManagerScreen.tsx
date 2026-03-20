import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import type { RoutineSummary } from '../api/routines';
import { fetchRoutinesForPatient } from '../api/routines';

type Props = NativeStackScreenProps<HomeStackParamList, 'RoutineManager'>;

export const RoutineManagerScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patientId, patientName } = route.params;
  const [routines, setRoutines] = useState<RoutineSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    let isMounted = true;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchRoutinesForPatient(patientId);
      if (!isMounted) return;
      setRoutines(data);
    } catch (e) {
      if (!isMounted) return;
      setError('Unable to load routines. Showing an empty list.');
      setRoutines([]);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const listData = routines ?? [];

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Routines</Text>
          <Text style={styles.subheading}>For {patientName}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          onPress={() =>
            navigation.navigate('RoutineEditor', { patientId, patientName, mode: 'create' })
          }
        >
          <Text style={styles.primaryButtonText}>New</Text>
        </Pressable>
      </View>

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
            <Text style={styles.routineName}>{item.name}</Text>
            <View style={styles.cardActionsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed
                ]}
                onPress={() =>
                  navigation.navigate('RoutineEditor', {
                    patientId,
                    patientName,
                    mode: 'edit',
                    routine: item
                  })
                }
              >
                <Text style={styles.secondaryButtonText}>Edit</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No routines configured yet for this patient.</Text>
          ) : null
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2
  },
  subheading: {
    fontSize: 13,
    color: '#6b7280'
  },
  primaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#111827'
  },
  primaryButtonPressed: {
    backgroundColor: '#1f2937'
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
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
  routineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  cardActionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#e5e7eb'
  },
  secondaryButtonPressed: {
    backgroundColor: '#d1d5db'
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827'
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8
  }
});

