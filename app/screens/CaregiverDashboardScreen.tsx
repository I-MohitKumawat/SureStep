import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import type { CaregiverSummaryTile } from '../api/reports';
import { fetchCaregiverSummaryTiles } from '../api/reports';

type PatientStatus = CaregiverSummaryTile;

export const CaregiverDashboardScreen: React.FC = () => {
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
    <ScreenContainer>
      <Text style={styles.heading}>Caregiver dashboard</Text>
      <Text style={styles.subheading}>
        Linked patients with a quick view of adherence and recent issues, backed by a
        `GET /reports/summary`-style summary client.
      </Text>
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
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.patientName}>{item.name}</Text>
                  <Text style={styles.relationship}>{item.relationship}</Text>
                </View>
                <View style={[styles.chip, needsAttention ? styles.chipWarning : styles.chipOkay]}>
                  <Text style={needsAttention ? styles.chipTextWarning : styles.chipTextOkay}>
                    {needsAttention ? 'Needs attention' : 'On track'}
                  </Text>
                </View>
              </View>

              <View style={styles.row}>
                <Text style={styles.metricLabel}>Adherence</Text>
                <Text style={styles.metricValue}>{item.adherencePercent}%</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.metricLabel}>Recent</Text>
                <Text style={styles.metricValue}>{item.lastActivityLabel}</Text>
              </View>

              {item.hasRecentAlerts && (
                <View style={styles.alertPill}>
                  <Text style={styles.alertPillText}>Recent alerts · review in Alert Center</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
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
    marginBottom: 8
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  relationship: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999
  },
  chipOkay: {
    backgroundColor: '#ecfdf3'
  },
  chipWarning: {
    backgroundColor: '#fef2f2'
  },
  chipTextOkay: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534'
  },
  chipTextWarning: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b91c1c'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280'
  },
  metricValue: {
    fontSize: 12,
    color: '#111827',
    maxWidth: '65%',
    textAlign: 'right'
  },
  alertPill: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#fef3c7'
  },
  alertPillText: {
    fontSize: 11,
    color: '#92400e'
  }
});

