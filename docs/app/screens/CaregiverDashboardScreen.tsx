import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import type { CaregiverSummaryTile } from '../api/reports';
import { fetchCaregiverSummaryTiles } from '../api/reports';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/RootNavigator';

type PatientStatus = CaregiverSummaryTile;
type Props = NativeStackScreenProps<HomeStackParamList, 'CaregiverDashboard'>;

export const CaregiverDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [patients, setPatients] = useState<PatientStatus[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const data = await fetchCaregiverSummaryTiles();
        if (!isMounted) return;
        setPatients(data);
      } catch (e) {
        if (!isMounted) return;
        setError('Unable to load caregiver summaries. Showing an empty list.');
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
  }, []);

  const listData = patients ?? [];

  return (
    <ScreenContainer style={styles.shell}>
      <Text style={styles.heading}>Caregiver dashboard</Text>
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading summaries…</Text>
        </View>
      )}
      {error && !loading && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const needsAttention = item.adherencePercent < 75 || item.hasRecentAlerts;
          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() =>
                navigation.navigate('PatientDetail', {
                  patientId: item.id,
                  name: item.name,
                  relationship: item.relationship,
                  adherencePercent: item.adherencePercent,
                  lastActivityLabel: item.lastActivityLabel,
                  hasRecentAlerts: item.hasRecentAlerts
                })
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.patientName}>{item.name}</Text>
                <Text style={needsAttention ? styles.statusIconWarning : styles.statusIconOkay}>
                  {needsAttention ? '❗' : '🟢'}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
      <View style={styles.footerBar}>
        <Pressable style={styles.footerTab}>
          <Text style={styles.footerTabActive}>Dashboard</Text>
        </Pressable>
        <Pressable style={styles.footerTab} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.footerTabText}>Settings</Text>
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
  heading: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    marginHorizontal: 16,
    marginTop: 12,
    color: '#111827'
  },
  subheading: {
    fontSize: 13,
    lineHeight: 18,
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
    paddingBottom: 96,
    paddingHorizontal: 16
  },
  card: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  cardPressed: {
    backgroundColor: '#eff6ff'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  statusIconOkay: {
    fontSize: 20
  },
  statusIconWarning: {
    fontSize: 20
  },
  footerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
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
    fontWeight: '700',
    color: '#2563eb'
  },
  footerTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280'
  }
});

