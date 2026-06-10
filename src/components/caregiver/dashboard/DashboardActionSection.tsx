import React from 'react';
import { View, Text, Pressable, Linking, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './dashboardStyles';

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
  const handleCall = async () => {
    const url = `tel:${patientPhone}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Call Patient',
          `Calling ${patientName} (${patientPhone}). tel: scheme not supported on this device. (Future VoIP call integration placeholder)`
        );
      }
    } catch (error) {
      console.warn('Failed to call patient:', error);
      Alert.alert(
        'Call Patient',
        `Calling ${patientName} (${patientPhone}). (Future VoIP call integration placeholder)`
      );
    }
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency Action',
      'Emergency response flow is not implemented yet. (Placeholder)'
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
