import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CARD_SHADOW } from '../../../constants/caregiverDashboard';
import type { SafetyAlert } from '../../../services/safetyService';
import type { Patient } from '../../../types/caregiverDashboard.types';
import {
  formatTime,
  getAge,
  getAlertTitle,
  getBatteryColor,
  getBatteryIcon,
  getLocationLabel,
  hasValidPhoneNumber,
  resolveLocationFreshness,
} from '../../../utils/caregiverDashboardUtils';
import { Avatar } from '../../ui/Avatar';

export interface PatientCardProps {
  patient: Patient;
  activeAlerts: SafetyAlert[];
  alertsAvailable: boolean;
  onPress: () => void;
  onCall: () => void;
  onLocation: () => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  activeAlerts,
  alertsAvailable,
  onPress,
  onCall,
  onLocation,
}) => {
  const age = getAge(patient.dateOfBirth);
  const alertTitle = getAlertTitle(patient, activeAlerts);
  const hasAlert = Boolean(alertTitle);
  const freshness = resolveLocationFreshness(patient);
  const offline = freshness === 'UNAVAILABLE';

  return (
    <View
      className={`overflow-hidden rounded-[18px] border bg-white ${
        hasAlert ? 'border-red-300' : 'border-care-border'
      }`}
      style={CARD_SHADOW}
    >
      {/* Safety notification */}

      {hasAlert && (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          className="flex-row items-start gap-[8px] border-b border-red-200 bg-red-50 px-[14px] py-[10px]"
        >
          <Ionicons name="warning-outline" size={18} color="#DC2626" />

          <Text className="flex-1 font-inter-semibold text-[12px] leading-[18px] text-red-700">
            {alertTitle}
          </Text>
        </Pressable>
      )}

      <View className="p-[14px]">
        {/* Patient identity */}

        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`View ${patient.name}`}
          className="min-h-[54px] flex-row items-center gap-[12px] active:opacity-70"
        >
          <Avatar name={patient.name} uri={patient.photoUrl} size={48} />

          <View className="flex-1">
            <Text className="font-inter-semibold text-[15px] leading-[21px] text-care-ink">
              {patient.name}
            </Text>

            {age !== null && (
              <Text className="mt-[2px] font-inter-regular text-[11px] text-care-muted">
                {age} years old
              </Text>
            )}

            <View className="mt-[4px] flex-row items-start gap-[4px]">
              <Ionicons name="location-outline" size={14} color="#68766F" />

              <Text className="flex-1 font-inter-medium text-[12px] leading-[18px] text-care-muted">
                {getLocationLabel(patient)}
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={17} color="#68766F" />
        </Pressable>

        {/* Device information */}

        <View className="mt-[12px] flex-row flex-wrap items-center justify-between gap-[8px] rounded-[10px] bg-care-canvas px-[10px] py-[10px]">
          <View className="flex-row items-center gap-[5px]">
            <Ionicons
              name={getBatteryIcon(offline ? null : patient.batteryPct)}
              size={17}
              color={getBatteryColor(offline ? null : patient.batteryPct)}
            />

            <Text className="font-inter-medium text-[11px] text-care-muted">
              {offline
                ? 'Unavailable'
                : patient.batteryPct !== null
                  ? `${patient.batteryPct}%`
                  : 'Unknown'}
            </Text>
          </View>

          <View className="flex-row items-center gap-[5px]">
            <Ionicons name="cellular-outline" size={16} color="#52605D" />

            <Text className="font-inter-medium text-[11px] text-care-muted">
              {offline ? 'Offline' : patient.networkStatus || 'Unknown'}
            </Text>
          </View>

          <View className="flex-row items-center gap-[5px]">
            <Ionicons name="time-outline" size={16} color="#52605D" />

            <Text className="font-inter-medium text-[11px] text-care-muted">
              {formatTime(patient.lastPingAt)}
            </Text>
          </View>
        </View>

        {!alertsAvailable && !hasAlert && (
          <Text className="mt-[10px] font-inter-medium text-[12px] text-amber-700">
            Safety alert feed unavailable.
          </Text>
        )}

        {patient.safetyState === 'APPROACHING' && !hasAlert && (
          <Text className="mt-[10px] font-inter-medium text-[12px] text-amber-700">
            Approaching a safety boundary
          </Text>
        )}

        {!patient.tasksAvailable && (
          <Text className="mt-[10px] font-inter-regular text-[12px] text-care-muted">
            Routine information unavailable.
          </Text>
        )}

        {patient.tasksAvailable && patient.totalTasks === 0 && (
          <Text className="mt-[10px] font-inter-regular text-[12px] text-care-muted">
            No routines scheduled today.
          </Text>
        )}

        {patient.tasksAvailable && patient.overdueTasks > 0 && (
          <View className="mt-[10px] flex-row items-center gap-[6px]">
            <Ionicons name="time-outline" size={16} color="#B45309" />

            <Text className="font-inter-medium text-[12px] text-amber-700">
              {patient.overdueTasks} overdue routines
            </Text>
          </View>
        )}

        {/* Quick actions */}

        <View className="mt-[12px] flex-row gap-[8px]">
          <Pressable
            onPress={onLocation}
            accessibilityRole="button"
            accessibilityLabel={`View location of ${patient.name}`}
            className="min-h-[44px] flex-1 flex-row items-center justify-center gap-[6px] rounded-[10px] bg-care-selected px-[8px] active:opacity-70"
          >
            <Ionicons name="location-outline" size={18} color="#0E7A67" />

            <Text className="shrink font-inter-semibold text-[12px] text-brand-dark">
              Live location
            </Text>
          </Pressable>

          <Pressable
            onPress={onCall}
            disabled={!hasValidPhoneNumber(patient.phone)}
            accessibilityRole="button"
            accessibilityLabel={`Call ${patient.name}`}
            accessibilityState={{
              disabled: !hasValidPhoneNumber(patient.phone),
            }}
            className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-[6px] rounded-[10px] border border-care-border bg-white px-[8px] ${
              !hasValidPhoneNumber(patient.phone) ? 'opacity-40' : 'active:opacity-70'
            }`}
          >
            <Ionicons name="call-outline" size={17} color="#0E7A67" />

            <Text className="font-inter-semibold text-[12px] text-brand-dark">
              Call
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
