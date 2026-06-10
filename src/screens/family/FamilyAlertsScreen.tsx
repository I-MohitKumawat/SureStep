/**
 * FamilyAlertsScreen — Reuses the caregiver alert dashboard with role context.
 */
import React from 'react';
import { useFamilyContext } from '../../context/FamilyContext';
import { CaregiverPatientAlertsScreen } from '../caregiver/CaregiverPatientAlertsScreen';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

export const FamilyAlertsScreen: React.FC<any> = (props) => {
  const { patient, careCircle, profile, isLoading } = useFamilyContext();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No patient linked yet.</Text>
      </View>
    );
  }

  // Find the family member's own relationship tier to pass resolve permission
  const myMember = careCircle.find(m => m.id === profile?.user_id);
  const relationshipType = myMember?.relationship_type ?? 'FAMILY_CLOSE';

  // Clone route object to pass params
  const clonedRoute = {
    ...props.route,
    params: {
      patientId: patient.id,
      patientName: patient.name,
      relationshipType,
    },
  };

  return <CaregiverPatientAlertsScreen {...props} route={clonedRoute} />;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 24,
  },
  errorText: {
    fontFamily: F.medium,
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
});
