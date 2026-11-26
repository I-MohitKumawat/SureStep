/**
 * SureStep — src/screens/caregiver/CaregiverDashboardScreen.tsx
 * Caregiver dashboard — Ocean theme, NativeWind UI.
 */

import React from 'react';
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CaregiverDashboardAlertsTab } from '../../components/caregiver/dashboard/CaregiverDashboardAlertsTab';
import { CaregiverDashboardHomeTab } from '../../components/caregiver/dashboard/CaregiverDashboardHomeTab';
import { DashboardBottomBar } from '../../components/caregiver/dashboard/DashboardBottomBar';
import { DashboardHeader } from '../../components/caregiver/dashboard/DashboardHeader';
import { DashboardSettingsTab } from '../../components/caregiver/dashboard/DashboardSettingsTab';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useCaregiverDashboard } from '../../hooks/useCaregiverDashboard';
import type { Patient } from '../../types/caregiverDashboard.types';
import type { CaregiverStackParams } from '../../types/navigation.types';
import { normalizeCallablePhone } from '../../utils/caregiverDashboardUtils';

type Props = NativeStackScreenProps<
  CaregiverStackParams,
  'CaregiverTriageScreen'
>;

export const CaregiverDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const {
    activeTab,
    setActiveTab,
    patients,
    sortedPatients,
    filteredPatients,
    activeAlerts,
    pendingCount,
    loading,
    refreshing,
    error,
    alertsAvailable,
    urgentPatientCount,
    notificationCount,
    caregiverName,
    firstName,
    caregiverPhoto,
    caregiverPhone,
    professionalRole,
    visibilityLabel,
    visibilityIcon,
    requestSubtitle,
    searchQuery,
    setSearchQuery,
    searchVisible,
    toggleSearch,
    clearSearch,
    refreshAll,
    handleRefresh,
  } = useCaregiverDashboard();

  /* ===================================================
     NAVIGATION
  =================================================== */

  const openRequests = () => {
    navigation.navigate('CareRequestsListScreen', {
      initialTab: 'PENDING',
    });
  };

  const openProfile = () => {
    navigation.navigate('CaregiverProfileEditScreen');
  };

  const openPatient = (patient: Patient) => {
    navigation.navigate('CaregiverPatientDetailScreen', {
      patientId: patient.id,
      patientName: patient.name,
    });
  };

  const openLocation = (patient: Patient) => {
    navigation.navigate('CaregiverPatientMapScreen', {
      patientId: patient.id,
      patientName: patient.name,
    });
  };

  const callPatient = async (patient: Patient) => {
    const sanitized = normalizeCallablePhone(patient.phone);

    if (!sanitized) {
      Alert.alert(
        'Phone unavailable',
        'No valid phone number is available for this patient.'
      );
      return;
    }

    try {
      await Linking.openURL(`tel:${sanitized}`);
    } catch {
      Alert.alert(
        'Unable to call',
        'The phone dialer could not be opened.'
      );
    }
  };

  const joinCareCircle = () => {
    navigation.navigate('JoinCareCircleScreen');
  };

  /* ===================================================
     MAIN RENDER
  =================================================== */

  return (
    <ScreenContainer
      edges={['top', 'bottom', 'left', 'right']}
      style={{
        flex: 1,
        paddingHorizontal: 0,
        paddingVertical: 0,
        backgroundColor: '#F5F8F7',
      }}
    >
      <View className="flex-1 bg-[#F5F8F7]">
        <ScrollView
          key={activeTab}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          alwaysBounceVertical={activeTab !== 'Settings'}
          refreshControl={
            activeTab !== 'Settings' ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#0E7A67"
                colors={['#0E7A67']}
              />
            ) : undefined
          }
        >
          <DashboardHeader
            activeTab={activeTab}
            caregiverName={caregiverName}
            firstName={firstName}
            caregiverPhoto={caregiverPhoto}
            professionalRole={professionalRole}
            notificationCount={notificationCount}
            onOpenNotifications={() =>
              navigation.navigate('NotificationHistoryScreen')
            }
            onOpenProfile={openProfile}
          />

          {activeTab === 'Home' && (
            <CaregiverDashboardHomeTab
              loading={loading}
              error={error}
              patients={patients}
              filteredPatients={filteredPatients}
              activeAlerts={activeAlerts}
              alertsAvailable={alertsAvailable}
              urgentPatientCount={urgentPatientCount}
              pendingCount={pendingCount}
              requestSubtitle={requestSubtitle}
              searchVisible={searchVisible}
              searchQuery={searchQuery}
              onToggleSearch={toggleSearch}
              onChangeSearchQuery={setSearchQuery}
              onClearSearch={clearSearch}
              onPressAlertsTab={() => setActiveTab('Alerts')}
              onOpenRequests={openRequests}
              onRetry={() => void refreshAll()}
              onOpenPatient={openPatient}
              onCallPatient={(patient) => void callPatient(patient)}
              onOpenLocation={openLocation}
            />
          )}

          {activeTab === 'Alerts' && (
            <CaregiverDashboardAlertsTab
              loading={loading}
              error={error}
              sortedPatients={sortedPatients}
              activeAlerts={activeAlerts}
              alertsAvailable={alertsAvailable}
              pendingCount={pendingCount}
              requestSubtitle={requestSubtitle}
              onOpenRequests={openRequests}
              onOpenAlertFeed={() =>
                navigation.navigate('CaregiverAlertFeedScreen')
              }
              onRetry={() => void refreshAll()}
              onOpenPatient={openPatient}
              onCallPatient={(patient) => void callPatient(patient)}
            />
          )}

          {activeTab === 'Settings' && (
            <DashboardSettingsTab
              caregiverName={caregiverName}
              caregiverPhoto={caregiverPhoto}
              professionalRole={professionalRole}
              caregiverPhone={caregiverPhone}
              visibilityIcon={visibilityIcon}
              visibilityLabel={visibilityLabel}
              pendingCount={pendingCount}
              requestSubtitle={requestSubtitle}
              onOpenProfile={openProfile}
              onOpenAccountSettings={() =>
                navigation.navigate('CaregiverSettingsScreen')
              }
              onJoinCareCircle={joinCareCircle}
              onOpenRequests={openRequests}
              onOpenNotificationSettings={() =>
                navigation.navigate('NotificationSettingsScreen')
              }
              onOpenNotificationHistory={() =>
                navigation.navigate('NotificationHistoryScreen')
              }
            />
          )}
        </ScrollView>

        <DashboardBottomBar
          activeTab={activeTab}
          notificationCount={notificationCount}
          onSelectTab={setActiveTab}
        />
      </View>
    </ScreenContainer>
  );
};
