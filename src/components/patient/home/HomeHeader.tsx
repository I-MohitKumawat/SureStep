
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerSOS } from '../../../services/geofenceService';
import { useTheme } from '../../../theme/ThemeContext';

interface HomeHeaderProps {
  patientId: string | null;

  // Retained for backward compatibility.
  // Settings cog is no longer displayed.
  showSettings?: boolean;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  patientId,
}) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const [triggering, setTriggering] = useState(false);

  const sosColor = isDark ? '#FCA5A5' : '#DC2626';

  const handleSosPress = () => {
    if (triggering) return;

    if (!patientId) {
      Alert.alert(
        'Unable to send SOS',
        'Please ensure you are signed in.'
      );
      return;
    }

    Alert.alert(
      'Emergency SOS',
      'Are you sure you want to send an emergency alert to your emergency contacts?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            setTriggering(true);

            try {
              await triggerSOS(patientId);

              Alert.alert(
                'SOS Sent',
                'Your emergency alert has been sent.'
              );
            } catch (err) {
              console.warn(
                '[HomeHeader] SOS trigger failed:',
                err
              );

              Alert.alert(
                'SOS Notice',
                'SOS signal could not be sent to server. Please dial emergency services directly.'
              );
            } finally {
              setTriggering(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-row items-center justify-between px-1 pb-3 pt-2">

      {/* SureStep branding */}
      <View className="mr-3 flex-1 flex-row items-center">

        {/* Brand icon */}
        <View
          className={`mr-3 h-12 w-12 items-center justify-center rounded-2xl ${
            isDark
              ? 'bg-[#234B3C]'
              : 'bg-[#0E7A67]'
          }`}
        >
          <Ionicons
            name="pulse-outline"
            size={28}
            color={isDark ? '#6EE7B7' : '#FFFFFF'}
          />
        </View>

        {/* Brand name and tagline */}
        <View className="flex-1">

          <Text
            className={`text-[28px] font-extrabold leading-8 tracking-tight ${
              isDark
                ? 'text-[#F0FDF4]'
                : 'text-[#124C3C]'
            }`}
            numberOfLines={1}
          >
            SureStep
          </Text>

          <Text
            className={`mt-0.5 text-[9px] font-semibold uppercase tracking-[1.5px] ${
              isDark
                ? 'text-[#A6BDB2]'
                : 'text-slate-500'
            }`}
          >
            A calmer tomorrow
          </Text>

        </View>
      </View>

      {/* Emergency SOS */}
      <Pressable
        onPress={handleSosPress}
        disabled={triggering}
        accessibilityRole="button"
        accessibilityLabel="Emergency SOS"
        accessibilityHint="Opens emergency alert confirmation"
        accessibilityState={{
          disabled: triggering,
          busy: triggering,
        }}
        className={`min-h-[48px] min-w-[92px] flex-row items-center justify-center rounded-2xl border px-4 py-3 active:opacity-70 ${
          isDark
            ? 'border-[#642C30] bg-[#381D20]'
            : 'border-red-200 bg-red-50'
        } ${triggering ? 'opacity-60' : ''}`}
      >
        {triggering ? (
          <ActivityIndicator
            size="small"
            color={sosColor}
          />
        ) : (
          <>
            <Ionicons
              name="call-outline"
              size={19}
              color={sosColor}
            />

            <Text
              className={`ml-2 text-sm font-extrabold tracking-wider ${
                isDark
                  ? 'text-red-300'
                  : 'text-red-600'
              }`}
            >
              SOS
            </Text>
          </>
        )}
      </Pressable>

    </View>
  );
};
