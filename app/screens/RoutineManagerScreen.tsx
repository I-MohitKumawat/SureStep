import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';

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
    marginBottom: 14
  },
  heading: {
    fontFamily: F.bold,
    fontSize: 22,
    color: C.textPrimary,
    marginBottom: 2
  },
  subheading: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary
  },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonPressed: { opacity: 0.88 },
  primaryButtonText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.primaryText
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  loadingText: {
    marginLeft: 8,
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary
  },
  errorText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.error,
    marginBottom: 8
  },
  listContent: { paddingBottom: 16 },
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  routineName: {
    fontFamily: F.semiBold,
    fontSize: 16,
    color: C.textPrimary
  },
  cardActionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.primaryLight
  },
  secondaryButtonPressed: { opacity: 0.88 },
  secondaryButtonText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.primary
  },
  emptyText: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 12
  }
});

