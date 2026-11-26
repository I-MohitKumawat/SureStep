import React from 'react';
import { View, Text, Pressable, Linking, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './dashboardStyles';
import { normalizeCallablePhone } from '../../../utils/caregiverDashboardUtils';

interface DashboardActionSectionProps {
  patientName: string;
  patientPhone: string;
  onNavigateGeofenceMap: () => void;
}

export const DashboardActionSection: React.FC<DashboardActionSectionProps> = ({
  patientName,
  patientPhone,
  onNavigateGeofenceMap,
}) => {
  const sanitizedPhone = normalizeCallablePhone(patientPhone);
  const hasValidPhone = sanitizedPhone !== null;

  const handleCall = async () => {
    if (!sanitizedPhone) {
      Alert.alert(
        'Phone Unavailable',
        `No valid phone number is available for ${patientName}.`
      );
      return;
    }

    const url = `tel:${sanitizedPhone}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Dialer Unavailable',
          `Phone dialer is not available on this device. Patient number: ${sanitizedPhone}.`
        );
      }
    } catch (error) {
      console.warn('Failed to call patient:', error);
      Alert.alert('Unable to Call', 'Could not open the phone dialer.');
    }
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency Assistance',
      hasValidPhone
        ? `Contact ${patientName} (${sanitizedPhone}) immediately or call local emergency services if there is an active emergency.`
        : 'Call local emergency services immediately if there is an active emergency, and coordinate with the Care Circle.'
    );
  };

  return (
    <View style={styles.actionContainer}>
      {/* View Live Location Button */}
      <Pressable
        style={({ pressed }) => [
          styles.bottomActionBtn,
          styles.bottomActionBtnBlue,
          pressed && { opacity: 0.85 },
        ]}
        onPress={onNavigateGeofenceMap}
      >
        <Feather name="map-pin" size={24} color="#FFFFFF" style={styles.bottomActionIcon} />
        <Text style={[styles.bottomActionText, styles.bottomActionTextBlue]}>View Live Location</Text>
      </Pressable>

      {/* Call Patient Button */}
      <Pressable
        style={({ pressed }) => [
          styles.bottomActionBtn,
          styles.bottomActionBtnGray,
          !hasValidPhone && { opacity: 0.5 },
          pressed && { opacity: 0.85 },
        ]}
        onPress={handleCall}
      >
        <Feather name="phone" size={24} color="#1A1C1E" style={styles.bottomActionIcon} />
        <Text style={[styles.bottomActionText, styles.bottomActionTextGray]}>Call {patientName}</Text>
      </Pressable>

      {/* Emergency Button */}
      <Pressable
        style={({ pressed }) => [
          styles.bottomActionBtn,
          styles.bottomActionBtnPink,
          pressed && { opacity: 0.85 },
        ]}
        onPress={handleEmergency}
      >
        <Feather name="alert-triangle" size={24} color="#DC2626" style={styles.bottomActionIcon} />
        <Text style={[styles.bottomActionText, styles.bottomActionTextPink]}>Emergency</Text>
      </Pressable>
    </View>
  );
};
