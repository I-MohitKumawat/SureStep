import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useTheme } from '../../theme/ThemeContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { useAuth } from '../../hooks/useAuth';
import type { PatientStackParams } from '../../types/navigation.types';
import { type CaregiverListing, mapCaregiverRow } from '../../services/relationshipService';

type NavigationProp = NativeStackNavigationProp<PatientStackParams, 'CareNeedResponsesScreen'>;

interface InterestedCaregiver {
  id: string;
  name: string;
  role: string;
  dementiaExperience: string;
  location: string;
  availability: string;
  skills: string[];
  message: string;
  photoUrl: string;
}

const SAMPLE_RESPONSES: InterestedCaregiver[] = [
  {
    id: 'cg_meera_sharma',
    name: 'Meera Sharma',
    role: 'Professional Caregiver',
    dementiaExperience: '3 years (dementia)',
    location: 'Bengaluru',
    availability: 'Mon – Fri',
    skills: ['Daily activities', 'Personal care'],
    message: 'I have experience supporting older adults with dementia and enjoy helping them stay active.',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'cg_kavita_nair',
    name: 'Kavita Nair',
    role: 'Professional Caregiver',
    dementiaExperience: '2 years (dementia)',
    location: 'Bengaluru',
    availability: 'Mon – Sat',
    skills: ['Companionship', 'Medication assistance'],
    message: 'I am patient and caring, and I enjoy spending time with seniors.',
    photoUrl: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'cg_ramesh_kumar',
    name: 'Ramesh Kumar',
    role: 'Professional Caregiver',
    dementiaExperience: '4 years (dementia)',
    location: 'Bengaluru',
    availability: 'Mon – Sun',
    skills: ['Mobility support', 'Daily activities'],
    message: 'I have worked with seniors with dementia and can assist with daily routines and mobility.',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
];

export const CareNeedResponsesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { mode } = useTheme();
  const { user } = useAuth();
  const isDark = mode === 'dark';

  const [selectedCaregiverId, setSelectedCaregiverId] = useState<string>(SAMPLE_RESPONSES[0].id);

  const handleViewProfile = (caregiver: InterestedCaregiver) => {
    const listing: CaregiverListing = mapCaregiverRow({
      id: caregiver.id,
      name: caregiver.name,
      professionalRole: caregiver.role,
      dementiaExperienceYears: 3,
      yearsOfExperience: 6,
      serviceCity: caregiver.location,
      photoUrl: caregiver.photoUrl,
      careCapabilities: caregiver.skills,
      fullBio: caregiver.message,
      availabilityTypes: [caregiver.availability],
    });

    navigation.navigate('CaregiverProfileScreen', {
      caregiver: listing,
      caregiverId: caregiver.id,
      targetPatientId: user?.id,
      targetPatientName: user?.name,
    });
  };

  const handleChooseCaregiver = () => {
    const chosen = SAMPLE_RESPONSES.find((c) => c.id === selectedCaregiverId);
    Alert.alert(
      'Caregiver Selected',
      `You have expressed interest in ${chosen?.name || 'this caregiver'}. They will receive your notification to coordinate next steps.`,
      [
        {
          text: 'View My Requests',
          onPress: () => {
            navigation.navigate('CareRequestsListScreen', {
              initialTab: 'ACTIVE',
              targetPatientId: user?.id,
              targetPatientName: user?.name,
            });
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']} style={styles.screen}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={22} color={isDark ? '#F5F7F6' : '#111827'} />
          <Text style={[styles.backText, { color: isDark ? '#F5F7F6' : '#111827' }]}>Back</Text>
        </Pressable>

        <Text style={styles.brandTitle}>SureStep</Text>

        {/* Persistent SOS Pill */}
        <View style={styles.sosPill}>
          <Ionicons name="call" size={14} color="#DC2626" style={{ marginRight: 4 }} />
          <Text style={styles.sosText}>SOS</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.mainHeading, { color: isDark ? '#F5F7F6' : '#111827' }]}>
            Responses
          </Text>
        </View>

        {/* Original Care Need Summary Card */}
        <View style={[styles.needContextCard, { backgroundColor: isDark ? '#1C2422' : '#FFFFFF' }]}>
          <View style={styles.contextTopRow}>
            <View style={styles.calendarIconCircle}>
              <Ionicons name="calendar-outline" size={22} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contextTitle, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                Morning care for Ramesh
              </Text>
              <Text style={[styles.contextMeta, { color: isDark ? '#9EABA7' : '#52605D' }]}>
                Bengaluru · Weekdays · 8:00 AM – 12:00 PM
              </Text>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>Dementia experience</Text>
            </View>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>Daily activities</Text>
            </View>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>Companionship</Text>
            </View>
          </View>
        </View>

        {/* Section Header: Caregivers Interested */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#F5F7F6' : '#111827' }]}>
            Caregivers interested
          </Text>
          <Text style={[styles.responseCount, { color: isDark ? '#9EABA7' : '#6B7280' }]}>
            {SAMPLE_RESPONSES.length} responses
          </Text>
        </View>

        {/* List of responses */}
        <View style={styles.responsesList}>
          {SAMPLE_RESPONSES.map((cg) => {
            const isSelected = selectedCaregiverId === cg.id;
            return (
              <Pressable
                key={cg.id}
                onPress={() => setSelectedCaregiverId(cg.id)}
                style={[
                  styles.responseCard,
                  {
                    backgroundColor: isDark ? '#1C2422' : '#FFFFFF',
                    borderColor: isSelected ? C.primary : '#E5E0D8',
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.cardTopRow}>
                  <Image source={{ uri: cg.photoUrl }} style={styles.avatarImg} />
                  <View style={styles.cardHeaderInfo}>
                    <Text style={[styles.cgName, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                      {cg.name}
                    </Text>
                    <Text style={[styles.cgRole, { color: isDark ? '#9EABA7' : '#52605D' }]}>
                      {cg.role}
                    </Text>

                    <View style={styles.metaRow}>
                      <Ionicons name="ribbon-outline" size={14} color={C.primary} style={{ marginRight: 3 }} />
                      <Text style={[styles.metaText, { color: isDark ? '#9EABA7' : '#52605D' }]}>
                        {cg.dementiaExperience}
                      </Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={14} color={C.primary} style={{ marginRight: 3 }} />
                      <Text style={[styles.metaText, { color: isDark ? '#9EABA7' : '#52605D' }]}>
                        {cg.location} · {cg.availability}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Skill Pills */}
                <View style={styles.skillsRow}>
                  {cg.skills.map((skill) => (
                    <View key={skill} style={styles.skillPill}>
                      <Text style={styles.skillPillText}>{skill}</Text>
                    </View>
                  ))}
                </View>

                {/* Message */}
                <Text style={[styles.messageText, { color: isDark ? '#BAC7C4' : '#4B5563' }]}>
                  "{cg.message}"
                </Text>

                {/* Card Actions */}
                <View style={styles.cardActionRow}>
                  <Pressable
                    onPress={() => handleViewProfile(cg)}
                    style={styles.viewProfileBtn}
                  >
                    <Text style={styles.viewProfileBtnText}>View Profile</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Primary Action Button */}
        <Pressable
          onPress={handleChooseCaregiver}
          accessibilityRole="button"
          accessibilityLabel="Choose Caregiver"
          style={({ pressed }) => [
            styles.chooseBtn,
            pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
          ]}
        >
          <Text style={styles.chooseBtnText}>Choose Caregiver →</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontFamily: F.medium,
    fontSize: 15,
  },
  brandTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: C.primary,
  },
  sosPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE8E7',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  sosText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#DC2626',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  mainHeading: {
    fontFamily: F.bold,
    fontSize: 26,
    lineHeight: 32,
  },
  needContextCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    marginBottom: 20,
  },
  contextTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  calendarIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextTitle: {
    fontFamily: F.bold,
    fontSize: 16,
  },
  contextMeta: {
    fontFamily: F.regular,
    fontSize: 13,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: '#E6F4F1',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  tagText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 18,
  },
  responseCount: {
    fontFamily: F.medium,
    fontSize: 13,
  },
  responsesList: {
    gap: 14,
    marginBottom: 24,
  },
  responseCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E0D8',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cgName: {
    fontFamily: F.bold,
    fontSize: 16,
  },
  cgRole: {
    fontFamily: F.regular,
    fontSize: 13,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    fontFamily: F.medium,
    fontSize: 12,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  skillPill: {
    backgroundColor: '#E6F4F1',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  skillPillText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.primary,
  },
  messageText: {
    fontFamily: F.regular,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewProfileBtn: {
    borderWidth: 1,
    borderColor: C.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  viewProfileBtnText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.primary,
  },
  chooseBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  chooseBtnText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
