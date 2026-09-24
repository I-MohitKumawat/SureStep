import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { CaregiverDetailView } from './CaregiverDetailView';
import { useCaregiver } from '../../hooks/useCaregiver';
import {
  fetchCaregiverDiscoveryProfile,
  type CaregiverListing,
} from '../../services/relationshipService';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { PatientStackParams } from '../../types/navigation.types';

type Props = NativeStackScreenProps<PatientStackParams, 'CaregiverProfileScreen'>;

export const CaregiverProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const initialCaregiver = route.params?.caregiver;
  const caregiverId = initialCaregiver?.id || route.params?.caregiverId;
  const targetPatientId = route.params?.targetPatientId;
  const targetPatientName = route.params?.targetPatientName;

  const { caregivers } = useCaregiver();

  const [caregiver, setCaregiver] = useState<CaregiverListing | null>(initialCaregiver || null);
  const [loading, setLoading] = useState(!initialCaregiver && Boolean(caregiverId));
  const [error, setError] = useState<string | null>(null);

  // Authoritative detailed profile fetch
  useEffect(() => {
    let active = true;

    if (!caregiverId) {
      setError('No caregiver specified.');
      return;
    }

    const loadProfile = async () => {
      try {
        const profile = await fetchCaregiverDiscoveryProfile(caregiverId, targetPatientId);
        if (active && profile) {
          setCaregiver((prev: CaregiverListing | null) => ({
            ...(prev || {}),
            ...profile,
          }));
        }
      } catch (err: any) {
        console.warn('[CaregiverProfileScreen] Failed to fetch authoritative profile:', err);
        if (active && !initialCaregiver) {
          setError('Failed to load caregiver details.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [caregiverId, targetPatientId, initialCaregiver]);

  // Determine current relationship status if any
  const matchedCaregiver = caregiverId ? caregivers.find((c) => c.id === caregiverId) : null;
  const linkStatus = matchedCaregiver
    ? matchedCaregiver.status || 'CONFIRMED'
    : caregiver?.status || null;

  const handleBack = () => {
    navigation.goBack();
  };

  const handleConfirm = (c: CaregiverListing) => {
    (navigation as any).navigate('CareRequestScreen', {
      caregiver: c,
      targetPatientId,
      targetPatientName,
    });
  };

  if (loading && !caregiver) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Loading caregiver profile...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error && !caregiver) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={44} color="#EF4444" />
          <Text style={styles.errorTitle}>Profile Unavailable</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  if (!caregiver) {
    return null;
  }

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <View style={styles.container}>
        <CaregiverDetailView
          caregiver={caregiver}
          linkStatus={linkStatus}
          targetPatientId={targetPatientId}
          targetPatientName={targetPatientName}
          onBack={handleBack}
          onConfirm={handleConfirm}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 12,
  },
  errorTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: '#EF4444',
    marginTop: 12,
  },
  errorSubtitle: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  backButton: {
    marginTop: 18,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backButtonText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.textPrimary,
  },
});
