import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SafetyAlert } from '../../../services/safetyService';
import type { Patient } from '../../../types/caregiverDashboard.types';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorState } from '../../ui/ErrorState';
import { LoadingState } from '../../ui/LoadingState';
import { SectionHeading } from '../../ui/SectionHeading';
import { CareRequestsCard } from './CareRequestsCard';
import { PatientAlertCard } from './PatientAlertCard';

export interface CaregiverDashboardAlertsTabProps {
  loading: boolean;
  error: string | null;
  sortedPatients: Patient[];
  activeAlerts: SafetyAlert[];
  alertsAvailable: boolean;
  pendingCount: number | null;
  requestSubtitle: string;
  onOpenRequests: () => void;
  onOpenAlertFeed: () => void;
  onRetry: () => void;
  onOpenPatient: (patient: Patient) => void;
  onCallPatient: (patient: Patient) => void;
}

export const CaregiverDashboardAlertsTab: React.FC<
  CaregiverDashboardAlertsTabProps
> = ({
  loading,
  error,
  sortedPatients,
  activeAlerts,
  alertsAvailable,
  pendingCount,
  requestSubtitle,
  onOpenRequests,
  onOpenAlertFeed,
  onRetry,
  onOpenPatient,
  onCallPatient,
}) => (
  <View className="gap-[14px] px-[16px] pb-[24px] pt-[14px]">
    <CareRequestsCard
      subtitle={requestSubtitle}
      pendingCount={pendingCount}
      onPress={onOpenRequests}
    />

    <View className="flex-row items-center justify-between">
      <SectionHeading title="Patient safety" />

      <Pressable
        onPress={onOpenAlertFeed}
        accessibilityRole="button"
        className="min-h-[44px] justify-center"
      >
        <Text className="font-inter-semibold text-[12px] text-brand-dark">
          View all
        </Text>
      </Pressable>
    </View>

    {!!error && (
      <ErrorState
        title="Couldn't load patients"
        description={
          sortedPatients.length > 0
            ? 'Displayed information may be outdated.'
            : 'Please refresh to try again.'
        }
        actionLabel="Try again"
        onRetry={onRetry}
      />
    )}

    {!alertsAvailable && !loading && (
      <View className="flex-row items-start gap-[8px] rounded-[12px] border border-amber-200 bg-amber-50 p-[12px]">
        <Ionicons
          name="information-circle-outline"
          size={19}
          color="#B45309"
        />

        <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-amber-800">
          Safety alerts are unavailable. Pull down to refresh.
        </Text>
      </View>
    )}

    {loading && <LoadingState paddingVertical={24} />}

    {!loading && !error && sortedPatients.length === 0 && (
      <EmptyState
        icon="shield-outline"
        title="No patients connected"
        description="Patient notifications will appear here."
      />
    )}

    {/* Patient safety summaries */}

    {sortedPatients.map((patient) => (
      <PatientAlertCard
        key={patient.id}
        patient={patient}
        patientAlerts={activeAlerts.filter(
          (alert) => alert.patient_id === patient.id
        )}
        alertsAvailable={alertsAvailable}
        onOpenPatient={() => onOpenPatient(patient)}
        onCallPatient={() => onCallPatient(patient)}
      />
    ))}
  </View>
);
