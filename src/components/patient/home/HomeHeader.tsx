import React, { useState } from 'react';
import { Alert, Platform, Pressable, Text, View, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { triggerSOS } from '../../../services/geofenceService';
import { useTheme } from '../../../theme/ThemeContext';
import { IconSettings } from '../../../assets/icons/NavIcons';
import type { PatientStackParams } from '../../../types/navigation.types';

interface HomeHeaderProps {
  patientId: string | null;
  showSettings?: boolean;
}

const SosPhoneIcon = ({ color = '#DC2626', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const HomeHeader: React.FC<HomeHeaderProps> = ({ patientId, showSettings = true }) => {
  const navigation = useNavigation<NativeStackNavigationProp<PatientStackParams>>();
  const { mode } = useTheme();
  const [triggering, setTriggering] = useState(false);

  const isDark = mode === 'dark';
  const brandColor = isDark ? '#FFFFFF' : '#0E7A67';
  const subtitleColor = isDark ? '#9EABA7' : '#52605D';
  const settingsIconColor = isDark ? '#9EABA7' : '#52605D';
  const sosBg = isDark ? '#3D1414' : '#FEE2E2';
  const sosBorder = isDark ? '#5A2020' : '#FECACA';
  const sosTextColor = isDark ? '#EF4444' : '#DC2626';

  const handleSosPress = () => {
    if (!patientId) {
      Alert.alert('Unable to send SOS', 'Please ensure you are signed in.');
      return;
    }

    Alert.alert(
      'Emergency SOS',
      'Are you sure you want to send an emergency alert to your emergency contacts?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            setTriggering(true);
            try {
              await triggerSOS(patientId);
              Alert.alert('SOS Sent', 'Your emergency alert has been sent.');
            } catch (err: any) {
              console.warn('[HomeHeader] SOS trigger failed:', err);
              Alert.alert('SOS Notice', 'SOS signal could not be sent to server. Please dial emergency services directly.');
            } finally {
              setTriggering(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-row items-center justify-between pt-1 pb-3 px-1">
      {/* SureStep Branding */}
      <View>
        <Text
          className="text-3xl font-bold tracking-tight"
          style={{
            color: brandColor,
            fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
          }}
        >
          SureStep
        </Text>
        <Text
          className="text-[9.5px] font-semibold mt-0.5 uppercase"
          style={{
            color: subtitleColor,
            letterSpacing: 2.8,
          }}
        >
          A CALMER TOMORROW
        </Text>
      </View>

      {/* Right side: Settings Gear + SOS Button */}
      <View className="flex-row items-center" style={{ gap: 10 }}>
        {showSettings && (
          <Pressable
            onPress={() => navigation.navigate('PatientSettingsScreen')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={8}
            className="p-1.5 rounded-full items-center justify-center"
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <IconSettings size={22} color={settingsIconColor} strokeWidth={1.8} />
          </Pressable>
        )}

        {/* SOS Button */}
        <Pressable
          onPress={handleSosPress}
          disabled={triggering}
          accessibilityRole="button"
          accessibilityLabel="Emergency SOS"
          className="flex-row items-center px-4 py-2 rounded-full border"
          style={({ pressed }) => [
            {
              backgroundColor: sosBg,
              borderColor: sosBorder,
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          {triggering ? (
            <ActivityIndicator size="small" color={sosTextColor} />
          ) : (
            <>
              <SosPhoneIcon color={sosTextColor} size={16} />
              <Text
                className="font-extrabold text-sm ml-1.5 tracking-wider"
                style={{ color: sosTextColor }}
              >
                SOS
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
};
