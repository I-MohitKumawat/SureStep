import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SafetyAlert } from '../../../services/safetyService';
import type { Patient } from '../../../types/caregiverDashboard.types';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorState } from '../../ui/ErrorState';
import { LoadingState } from '../../ui/LoadingState';
import { SectionHeading } from '../../ui/SectionHeading';
import { CareRequestsCard } from './CareRequestsCard';
import { DashboardOverview } from './DashboardOverview';
import { PatientCard } from './PatientCard';
import { PatientSearchBar } from './PatientSearchBar';
import { UrgentAlertBanner } from './UrgentAlertBanner';

export interface CaregiverDashboardHomeTabProps {
  loading: boolean;
  error: string | null;
  patients: Patient[];
  filteredPatients: Patient[];
  activeAlerts: SafetyAlert[];
  alertsAvailable: boolean;
  urgentPatientCount: number;
  pendingCount: number | null;
  requestSubtitle: string;
  searchVisible: boolean;
  searchQuery: string;
  onToggleSearch: () => void;
  onChangeSearchQuery: (query: string) => void;
  onClearSearch: () => void;
  onPressAlertsTab: () => void;
  onOpenRequests: () => void;
  onRetry: () => void;
  onOpenPatient: (patient: Patient) => void;
  onCallPatient: (patient: Patient) => void;
  onOpenLocation: (patient: Patient) => void;
}

export const CaregiverDashboardHomeTab: React.FC<
  CaregiverDashboardHomeTabProps
> = ({
  loading,
  error,
  patients,
  filteredPatients,
  activeAlerts,
  alertsAvailable,
  urgentPatientCount,
  pendingCount,
  requestSubtitle,
  searchVisible,
  searchQuery,
  onToggleSearch,
  onChangeSearchQuery,
  onClearSearch,
  onPressAlertsTab,
  onOpenRequests,
  onRetry,
  onOpenPatient,
  onCallPatient,
  onOpenLocation,
}) => (
  <View className="gap-[14px] px-[16px] pb-[24px] pt-[14px]">
    <DashboardOverview
      loading={loading}
      hasError={Boolean(error)}
      patientCount={patients.length}
      alertsAvailable={alertsAvailable}
      activeAlertsCount={activeAlerts.length}
      urgentPatientCount={urgentPatientCount}
      onPressSafetyAlerts={onPressAlertsTab}
    />

    <UrgentAlertBanner
      urgentPatientCount={urgentPatientCount}
      onPress={onPressAlertsTab}
    />

    <CareRequestsCard
      subtitle={requestSubtitle}
      pendingCount={pendingCount}
      onPress={onOpenRequests}
    />

    {/* Patient section heading */}

    <View className="min-h-[36px] flex-row items-center justify-between">
      <SectionHeading title="My patients" />

      {patients.length > 0 && (
        <Pressable
          onPress={onToggleSearch}
          accessibilityRole="button"
          accessibilityLabel="Search patients"
          className="h-[44px] w-[44px] items-center justify-center rounded-[12px] border border-care-border bg-white active:opacity-70"
        >
          <Ionicons
            name={searchVisible ? 'close-outline' : 'search-outline'}
            size={22}
            color="#254D51"
          />
        </Pressable>
      )}
    </View>

    {/* Search */}

    {searchVisible && (
      <PatientSearchBar
        value={searchQuery}
        onChangeText={onChangeSearchQuery}
        onClear={onClearSearch}
      />
    )}

    {/* Loading state */}

    {loading && <LoadingState message="Loading patients..." />}

    {/* Friendly error */}

    {!!error && (
      <ErrorState
        title="Couldn't load patients"
        description={
          patients.length > 0
            ? 'Displayed information may be outdated.'
            : 'Please refresh to try again.'
        }
        actionLabel="Try again"
        onRetry={onRetry}
      />
    )}

    {/* Simple no-patient experience */}

    {!loading && !error && patients.length === 0 && (
      <EmptyState
        icon="people-outline"
        title="No patients yet"
        description="Your connected patients will appear here."
      />
    )}

    {/* Search results empty */}

    {!loading &&
      !error &&
      patients.length > 0 &&
      filteredPatients.length === 0 && (
        <EmptyState
          icon="search-outline"
          title="No matching patients"
          description="Try another name or phone number."
        />
      )}

    {/* Connected patients */}

    {filteredPatients.map((patient) => (
      <PatientCard
        key={patient.id}
        patient={patient}
        activeAlerts={activeAlerts.filter(
          (alert) => alert.patient_id === patient.id
        )}
        alertsAvailable={alertsAvailable}
        onPress={() => onOpenPatient(patient)}
        onCall={() => onCallPatient(patient)}
        onLocation={() => onOpenLocation(patient)}
      />
    ))}
  </View>
);
