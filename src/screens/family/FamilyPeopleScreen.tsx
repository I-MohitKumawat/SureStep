/**
 * SureStep — src/screens/family/FamilyPeopleScreen.tsx
 *
 * Screen for the "People" tab in the Family Bottom Navigation:
 *   - Lists patients under care (Ramesh, Savitri)
 *   - Care team & caregivers
 *   - Quick navigation into Patient Overview
 */
import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useFamilyContext } from '../../context/FamilyContext';
import type { FamilyStackParams } from '../../types/navigation.types';
import { F } from '../../theme/fonts';

const RAMESH_IMG = require('../../assets/images/ramesh.jpg');
const SAVITRI_IMG = require('../../assets/images/savitri.jpg');
const MEERA_IMG = require('../../assets/images/meera.jpg');

type NavigationProp = NativeStackNavigationProp<FamilyStackParams>;

export const FamilyPeopleScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { patient } = useFamilyContext();

  const primaryPatientId = patient?.id || '54b78bc7-4f1b-42ea-a6c5-343f8ac08959';
  const primaryPatientName = patient?.name || 'Ramesh';

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>People</Text>
          <Text style={styles.subtitle}>Family members and care circle</Text>
        </View>

        {/* Section 1: People you care for */}
        <Text style={styles.sectionTitle}>People you care for</Text>
        <View style={styles.cardList}>
          <Pressable
            onPress={() =>
              navigation.navigate('FamilyPatientOverviewScreen', {
                patientId: primaryPatientId,
                patientName: primaryPatientName,
              })
            }
            style={({ pressed }) => [styles.card, pressed && styles.pressedCard]}
          >
            <Image source={RAMESH_IMG} style={styles.avatar} />
            <View style={styles.infoCol}>
              <Text style={styles.name}>{primaryPatientName}</Text>
              <Text style={styles.role}>Father · At home</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>

          <Pressable
            onPress={() =>
              navigation.navigate('FamilyPatientOverviewScreen', {
                patientId: 'patient-savitri',
                patientName: 'Savitri',
              })
            }
            style={({ pressed }) => [styles.card, pressed && styles.pressedCard]}
          >
            <Image source={SAVITRI_IMG} style={styles.avatar} />
            <View style={styles.infoCol}>
              <Text style={styles.name}>Savitri</Text>
              <Text style={styles.role}>Mother · Active today</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>
        </View>

        {/* Section 2: Professional Caregivers */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Professional Caregivers</Text>
        <View style={styles.cardList}>
          <Pressable
            onPress={() =>
              navigation.navigate('CaregiverProfileScreen', {
                targetPatientId: primaryPatientId,
                targetPatientName: primaryPatientName,
              })
            }
            style={({ pressed }) => [styles.card, pressed && styles.pressedCard]}
          >
            <Image source={MEERA_IMG} style={styles.avatar} />
            <View style={styles.infoCol}>
              <Text style={styles.name}>Meera Sharma</Text>
              <Text style={styles.role}>Active Caregiver · Certified Nurse</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 20,
    marginTop: 4,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 27,
    fontWeight: '700',
    color: '#161E1C',
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 13.5,
    color: '#52605D',
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 19,
    fontWeight: '700',
    color: '#161E1C',
    marginBottom: 12,
  },
  cardList: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    resizeMode: 'cover',
  },
  infoCol: {
    flex: 1,
  },
  name: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 18,
    fontWeight: '700',
    color: '#161E1C',
    marginBottom: 2,
  },
  role: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
  },
  pressedCard: {
    opacity: 0.88,
  },
});

