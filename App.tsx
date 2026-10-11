import 'react-native-gesture-handler';
import './global.css';
import React from 'react';
import messaging from '@react-native-firebase/messaging';
import * as Location from 'expo-location';

// Register background task at module-load time
import './src/utils/locationTask';
import { writeLocationPing } from './src/utils/geofenceUtils';

import AppShell from './src/AppShell';

// Register background message handler for FCM (must be defined at top level)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[FCM Background] Received remote message:', remoteMessage);

  if (remoteMessage.data?.type === 'LOCATION_REQUEST') {
    const patientId = typeof remoteMessage.data?.patientId === 'string' ? remoteMessage.data.patientId : undefined;
    if (!patientId) return;

    try {
      // Check/request foreground permissions inside background state (necessary on Android)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        await writeLocationPing({
          patientId,
          coords: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
          accuracyM: loc.coords.accuracy ?? undefined,
          source: 'background',
        });
        console.log('[FCM Background] Location ping successfully uploaded');
      } else {
        console.warn('[FCM Background] Foreground location permissions not granted');
      }
    } catch (err) {
      console.warn('[FCM Background] Failed to fetch/upload location:', err);
    }
  }
});

export default function App() {
  return <AppShell />;
}

