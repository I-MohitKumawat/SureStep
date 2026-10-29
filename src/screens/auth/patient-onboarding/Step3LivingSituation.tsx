/**
 * SureStep — src/screens/auth/patient-onboarding/Step3LivingSituation.tsx
 * Step 3: Location / City and Living arrangement.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
  { id: 'ALONE', title: 'Living Independently', desc: 'Solo household', icon: 'home-outline' as const },
  { id: 'WITH_SPOUSE', title: 'With Spouse / Partner', desc: 'Living together at home', icon: 'heart-outline' as const },
  { id: 'WITH_FAMILY', title: 'With Family / Children', desc: 'Multi-generational household', icon: 'people-outline' as const },
  { id: 'WITH_CAREGIVER', title: 'With In-Home Caregiver', desc: 'Assisted daily by a care aide', icon: 'medkit-outline' as const },
  { id: 'ASSISTED_LIVING', title: 'Senior Living Community', desc: 'Residential assisted community', icon: 'business-outline' as const },
  { id: 'OTHER', title: 'Other Arrangement', desc: 'Custom living environment', icon: 'help-circle-outline' as const },
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
      title={isSelf ? 'Your Home & Living Setup' : 'Home & Living Setup'}
      subtitle={
        isSelf
          ? 'Helps us tailor your safe boundaries and localize nearby care support.'
          : 'Helps us set up home safety boundaries and emergency coverage.'
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
          <TouchableOpacity
            onPress={handleDetectLocation}
            disabled={detecting}
            activeOpacity={0.7}
            style={s.detectBtn}
          >
            {detecting ? (
              <ActivityIndicator size="small" color="#0E7A67" />
            ) : (
              <Ionicons name="locate" size={20} color="#0E7A67" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Living Arrangement */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Living Arrangement *</Text>
        <Text style={s.sectionHint}>
          {isSelf ? 'Who do you currently live with?' : 'Who lives at home with them?'}
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
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#161E1C',
    marginBottom: 4,
  },
  sectionHint: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
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
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 15,
    color: '#161E1C',
  },
  detectBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E6F4F1',
    borderWidth: 1.5,
    borderColor: '#C2E8E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardGroup: {
    gap: 2,
  },
});
