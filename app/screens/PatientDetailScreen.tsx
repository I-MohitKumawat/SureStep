import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'PatientDetail'>;

export const PatientDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patientId, name, relationship, adherencePercent, lastActivityLabel, hasRecentAlerts } =
    route.params;

  return (
    <ScreenContainer>
      <Text style={styles.heading}>{name}</Text>
      <Text style={styles.subheading}>{relationship}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Patient ID</Text>
        <Text style={styles.value}>{patientId}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Adherence</Text>
        <Text style={styles.value}>{adherencePercent}%</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Recent</Text>
        <Text style={styles.value}>{lastActivityLabel}</Text>
      </View>

      {hasRecentAlerts && (
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>Recent alerts</Text>
          <Text style={styles.alertBody}>
            This patient has recent alerts. Review details in the Alert Center or related screens.
          </Text>
        </View>
      )}

      <View style={styles.actionsSection}>
        <Button
          title="Manage routines"
          onPress={() => navigation.navigate('RoutineManager', { patientId, patientName: name })}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  subheading: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16
  },
  section: {
    marginBottom: 12
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2
  },
  value: {
    fontSize: 15,
    color: '#111827'
  },
  alertBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b91c1c',
    marginBottom: 4
  },
  alertBody: {
    fontSize: 13,
    color: '#b91c1c'
  },
  actionsSection: {
    marginTop: 24
  }
});

