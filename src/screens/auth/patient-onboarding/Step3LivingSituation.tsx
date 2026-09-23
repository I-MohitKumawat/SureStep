/**
 * SureStep — src/screens/auth/patient-onboarding/Step3LivingSituation.tsx
 * Step 3: Location / City and Living arrangement.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { OptionCard } from '../../../components/onboarding/OptionCard';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';
import type { OnboardingIntent } from '../../../types/navigation.types';

interface Step3Props {
  intent: OnboardingIntent;
  city: string;
  livingArrangement: string;
  onUpdate: (fields: { city?: string; livingArrangement?: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

const LIVING_ARRANGEMENTS = [
  { id: 'ALONE', title: 'Living Alone', desc: 'Independent household', icon: 'home-outline' as const },
  { id: 'WITH_SPOUSE', title: 'With Spouse / Partner', desc: 'Living with their partner', icon: 'heart-outline' as const },
  { id: 'WITH_FAMILY', title: 'With Family / Children', desc: 'Multi-generational home', icon: 'people-outline' as const },
  { id: 'WITH_CAREGIVER', title: 'With In-Home Caregiver', desc: 'Assisted by a personal aide', icon: 'medkit-outline' as const },
  { id: 'ASSISTED_LIVING', title: 'Assisted Living / Facility', desc: 'Residential senior community', icon: 'business-outline' as const },
  { id: 'OTHER', title: 'Other Arrangement', desc: 'Different living setup', icon: 'help-circle-outline' as const },
];

export const Step3LivingSituation: React.FC<Step3Props> = ({
  intent,
  city,
  livingArrangement,
  onUpdate,
  onNext,
  onBack,
}) => {
  const isSelf = intent === 'RECEIVING_CARE';
  const [detecting, setDetecting] = useState(false);

  const handleDetectLocation = async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please allow location permission to auto-detect your city.'
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const reverse = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (reverse && reverse.length > 0) {
        const item = reverse[0];
        const cityName =
          item.city || item.subregion || item.district || item.region || '';
        if (cityName) {
          onUpdate({ city: cityName });
        } else {
          Alert.alert('Notice', 'Could not determine city name. Please type manually.');
        }
      }
    } catch (err) {
      console.warn('Location detection notice:', err);
      Alert.alert('Location Notice', 'Could not detect location. Please type your city.');
    } finally {
      setDetecting(false);
    }
  };

  const isComplete = city.trim().length > 0 && livingArrangement.length > 0;

  return (
    <OnboardingLayout
      title={isSelf ? 'Where do you live?' : 'Where do they live?'}
      subtitle={
        isSelf
          ? 'Helps configure safe boundaries and localize emergency responses.'
          : 'Helps configure home safety zones and contextual care.'
      }
      currentStep={3}
      iconName="home"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >
      {/* City / Area */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>City or Area *</Text>
        <View style={s.inputRow}>
          <View style={s.inputContainer}>
            <Ionicons name="location-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="e.g., Bengaluru, Mumbai, Delhi"
              placeholderTextColor="#9CA3AF"
              value={city}
              onChangeText={(t) => onUpdate({ city: t })}
              autoCapitalize="words"
            />
          </View>
          <Pressable
            onPress={handleDetectLocation}
            disabled={detecting}
            style={({ pressed }) => [
              s.detectBtn,
              pressed && s.detectBtnPressed,
            ]}
          >
            {detecting ? (
              <ActivityIndicator size="small" color={C.primary} />
            ) : (
              <Ionicons name="locate" size={20} color={C.primary} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Living Arrangement */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Living Arrangement *</Text>
        <Text style={s.sectionHint}>
          {isSelf ? 'Who do you currently live with?' : 'Who lives in the home with them?'}
        </Text>
        <View style={s.cardGroup}>
          {LIVING_ARRANGEMENTS.map((arr) => (
            <OptionCard
              key={arr.id}
              title={arr.title}
              description={arr.desc}
              icon={arr.icon}
              selected={livingArrangement === arr.id}
              onPress={() => onUpdate({ livingArrangement: arr.id })}
            />
          ))}
        </View>
      </View>
    </OnboardingLayout>
  );
};

const s = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
    marginBottom: 4,
  },
  sectionHint: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 15,
    color: C.textPrimary,
  },
  detectBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#E0F5F0',
    borderWidth: 1.5,
    borderColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  cardGroup: {
    gap: 2,
  },
});
