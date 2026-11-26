import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CARD_SHADOW } from '../../../constants/caregiverDashboard';
import type { SafetyAlert } from '../../../services/safetyService';
import type { Patient } from '../../../types/caregiverDashboard.types';
import {
  getAlertTitle,
  hasValidPhoneNumber,
  resolveLocationFreshness,
} from '../../../utils/caregiverDashboardUtils';
import { Avatar } from '../../ui/Avatar';

export interface PatientAlertCardProps {
  patient: Patient;
  patientAlerts: SafetyAlert[];
  alertsAvailable: boolean;
  onOpenPatient: () => void;
  onCallPatient: () => void;
}

export const PatientAlertCard: React.FC<PatientAlertCardProps> = ({
  patient,
  patientAlerts,
  alertsAvailable,
  onOpenPatient,
  onCallPatient,
}) => {
  const alertTitle = getAlertTitle(patient, patientAlerts);
  const hasAlert = Boolean(alertTitle);
  const freshness = resolveLocationFreshness(patient);

  const needsAttention =
    hasAlert ||
    patient.overdueTasks > 0 ||
    freshness === 'UNAVAILABLE' ||
    freshness === 'STALE' ||
    patient.safetyState === 'APPROACHING';

  const safetyLabel = hasAlert
    ? alertTitle
    : !alertsAvailable
      ? 'Safety alerts unavailable'
      : freshness === 'UNAVAILABLE'
        ? 'Location unavailable — no current signal'
        : freshness === 'STALE'
          ? 'Last known location is stale'
          : patient.safetyState === 'APPROACHING'
            ? 'Approaching safety boundary'
            : patient.hasActiveSafeZone === false
              ? 'No Safe Zone configured'
              : 'No unresolved safety alerts';

  return (
    <View
      className={`rounded-[18px] border bg-white p-[14px] ${
        hasAlert ? 'border-red-300' : 'border-care-border'
      }`}
      style={CARD_SHADOW}
    >
      {/* Patient identity */}

      <Pressable
        onPress={onOpenPatient}
        accessibilityRole="button"
        className="flex-row items-center gap-[12px] active:opacity-70"
      >
        <Avatar name={patient.name} uri={patient.photoUrl} size={46} />

        <View className="flex-1">
          <Text className="font-inter-semibold text-[15px] text-care-ink">
            {patient.name}
          </Text>

          <Text className="mt-[3px] font-inter-regular text-[11px] text-care-muted">
            {patient.lastActivity}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#68766F" />
      </Pressable>

      {/* Safety status */}

      <View
        className={`mt-[12px] flex-row items-start gap-[8px] rounded-[10px] p-[10px] ${
          hasAlert
            ? 'bg-red-50'
            : needsAttention
              ? 'bg-amber-50'
              : 'bg-care-canvas'
        }`}
      >
        <Ionicons
          name={hasAlert ? 'warning-outline' : 'shield-outline'}
          size={19}
          color={
            hasAlert ? '#DC2626' : needsAttention ? '#B45309' : '#52605D'
          }
        />

        <Text
          className={`flex-1 font-inter-medium text-[12px] leading-[18px] ${
            hasAlert
              ? 'text-red-700'
              : needsAttention
                ? 'text-amber-800'
                : 'text-care-muted'
          }`}
        >
          {safetyLabel}
        </Text>
      </View>

      {/* Compact routine statistics */}

      {patient.tasksAvailable ? (
        <View className="mt-[12px] flex-row rounded-[12px] bg-care-canvas px-[8px] py-[12px]">
          <View className="flex-1 items-center">
            <Text className="font-inter-bold text-[19px] text-care-ink">
              {patient.completedTasks}/{patient.totalTasks}
            </Text>

            <Text className="mt-[3px] text-center font-inter-regular text-[10px] text-care-muted">
              Completed
            </Text>
          </View>

          <View className="w-px bg-care-border" />

          <View className="flex-1 items-center">
            <Text
              className={`font-inter-bold text-[19px] ${
                patient.overdueTasks > 0 ? 'text-red-700' : 'text-care-ink'
              }`}
            >
              {patient.overdueTasks}
            </Text>

            <Text className="mt-[3px] text-center font-inter-regular text-[10px] text-care-muted">
              Overdue
            </Text>
          </View>

          <View className="w-px bg-care-border" />

          <View className="flex-1 items-center">
            <Text className="font-inter-bold text-[19px] text-care-ink">
              {patient.ongoingTasks}
            </Text>

            <Text className="mt-[3px] text-center font-inter-regular text-[10px] text-care-muted">
              In progress
            </Text>
          </View>
        </View>
      ) : (
        <Text className="mt-[10px] font-inter-regular text-[12px] text-care-muted">
          Routine activity unavailable.
        </Text>
      )}

      {/* Patient actions */}

      <View className="mt-[12px] flex-row gap-[8px]">
        <Pressable
          onPress={onCallPatient}
          disabled={!hasValidPhoneNumber(patient.phone)}
          accessibilityRole="button"
          accessibilityLabel={`Call ${patient.name}`}
          accessibilityState={{
            disabled: !hasValidPhoneNumber(patient.phone),
          }}
          className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-[6px] rounded-[10px] bg-brand ${
            !hasValidPhoneNumber(patient.phone) ? 'opacity-40' : 'active:opacity-70'
          }`}
        >
          <Ionicons name="call-outline" size={17} color="#FFFFFF" />

          <Text className="font-inter-semibold text-[12px] text-white">
            Call patient
          </Text>
        </Pressable>

        <Pressable
          onPress={onOpenPatient}
          accessibilityRole="button"
          className="min-h-[44px] flex-1 flex-row items-center justify-center gap-[6px] rounded-[10px] border border-care-border bg-white active:opacity-70"
        >
          <Text className="font-inter-semibold text-[12px] text-brand-dark">
            View details
          </Text>

          <Ionicons name="chevron-forward" size={15} color="#0E7A67" />
        </Pressable>
      </View>
    </View>
  );
};
