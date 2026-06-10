import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { F } from '../../theme/fonts';

const getFullPhotoUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const rootUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api/v1')
    .replace('/api/v1', '');
  return `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface MemberMarkerProps {
  name: string;
  photoUrl: string | null;
  role: 'PATIENT' | 'CAREGIVER' | 'FAMILY';
}

export const MemberMarkerContent = React.memo(({ name, photoUrl, role }: MemberMarkerProps) => {
  let ringColor = '#3B82F6'; // Blue for patient
  let innerBg = '#DBEAFE';
  
  if (role === 'CAREGIVER') {
    ringColor = '#10B981'; // Emerald
    innerBg = '#D1FAE5';
  } else if (role === 'FAMILY') {
    ringColor = '#8B5CF6'; // Purple
    innerBg = '#EDE9FE';
  }

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const resolvedPhoto = getFullPhotoUrl(photoUrl);

  return (
    <View style={styles.patientMarkerContainer}>
      <View style={[styles.patientAvatarRing, { borderColor: ringColor }]}>
        <View style={[styles.patientAvatarBlue, { backgroundColor: innerBg }]}>
          {resolvedPhoto ? (
            <Image source={{ uri: resolvedPhoto }} style={styles.markerAvatarImage} />
          ) : (
            <Text style={[styles.markerInitials, { color: ringColor }]}>{initials}</Text>
          )}
        </View>
      </View>
      <View style={[styles.patientNameCapsule, { backgroundColor: ringColor }]}>
        <Text style={styles.patientNameCapsuleText} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  patientMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1.5 },
    elevation: 3,
  },
  patientAvatarBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  markerAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  markerInitials: {
    fontFamily: F.bold,
    fontSize: 13,
  },
  patientNameCapsule: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1.5,
  },
  patientNameCapsuleText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
});
