import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

interface MapFallbackProps {
  latitude?: number;
  longitude?: number;
  patientName?: string;
  errorMsg?: string;
}

export const MapFallback: React.FC<MapFallbackProps> = ({
  latitude,
  longitude,
  patientName = 'Patient',
  errorMsg,
}) => {
  const handleOpenExternal = () => {
    const lat = latitude ?? 12.9716;
    const lng = longitude ?? 77.5946;
    const url = `https://maps.google.com/maps?daddr=${lat},${lng}`;
    void Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.title}>Interactive Map Disabled</Text>
        
        <Text style={styles.description}>
          {errorMsg || 
            'The native Google Maps SDK requires a valid API key configured in the Android manifest and a rebuilt binary. The app is running in safe mode to prevent crashes.'}
        </Text>

        {latitude !== undefined && longitude !== undefined ? (
          <View style={styles.coordsCard}>
            <Text style={styles.coordsTitle}>Current Coords (Live)</Text>
            <Text style={styles.coordsValue}>Lat: {latitude.toFixed(6)}</Text>
            <Text style={styles.coordsValue}>Lng: {longitude.toFixed(6)}</Text>
          </View>
        ) : (
          <View style={styles.coordsCard}>
            <Text style={styles.coordsTitle}>Location Status</Text>
            <Text style={styles.coordsValue}>Signal lost or patient offline</Text>
          </View>
        )}

        <Pressable
          onPress={handleOpenExternal}
          style={({ pressed }) => [
            styles.button,
            pressed && { opacity: 0.85 }
          ]}
        >
          <Text style={styles.buttonText}>Open in Google Maps App ↗</Text>
        </Pressable>

        <Text style={styles.tipText}>
          Tip: Set EXPO_PUBLIC_DISABLE_NATIVE_MAPS=true in your .env to bypass map checks or rebuild the app with a valid Google Maps key.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 16,
    minHeight: 320,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 8,
  },
  description: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  coordsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  coordsTitle: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  coordsValue: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  button: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  tipText: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 14,
  },
});
