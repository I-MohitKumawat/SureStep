import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useTheme } from '../../theme/ThemeContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { useAuth } from '../../hooks/useAuth';
import { useCaregiver } from '../../hooks/useCaregiver';
import { usePatientCareMode } from '../../hooks/usePatientCareMode';
import {
  fetchMyFamily,
  type FamilyMemberItem,
  type CaregiverListing,
} from '../../services/relationshipService';
import type { PatientStackParams } from '../../types/navigation.types';
import { HomeHeader } from '../../components/patient/home/HomeHeader';

type NavigationProp = NativeStackNavigationProp<PatientStackParams>;

export const PatientCareScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const { mode } = useTheme();
  const { user } = useAuth();
  const { isSelfManaged } = usePatientCareMode();
  const { caregivers, loading: loadingCaregivers, reloadCaregivers } = useCaregiver();

  const [familyMembers, setFamilyMembers] = useState<FamilyMemberItem[]>([]);
  const [loadingFamily, setLoadingFamily] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isDark = mode === 'dark';
  const patientId = user?.id || null;

  // Active caregivers (ACTIVE, CONFIRMED, or NOTICE_PERIOD)
  const activeCaregivers = caregivers.filter((c) => {
    const s = (c.status || '').toUpperCase();
    return s === 'ACTIVE' || s === 'CONFIRMED' || s === 'NOTICE_PERIOD';
  });
  const hasActiveCaregiver = activeCaregivers.length > 0;

  // Load family members (for Assisted view or family context)
  const loadFamilyData = useCallback(async () => {
    setLoadingFamily(true);
    try {
      const data = await fetchMyFamily();
      setFamilyMembers(data || []);
    } catch (err) {
      console.warn('[PatientCareScreen] loadFamilyData failed:', err);
    } finally {
      setLoadingFamily(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        reloadCaregivers(true),
        loadFamilyData(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [reloadCaregivers, loadFamilyData]);

  useEffect(() => {
    if (isFocused) {
      void reloadCaregivers(true);
      void loadFamilyData();
    }
  }, [isFocused, reloadCaregivers, loadFamilyData]);

  const handleFindCaregiver = () => {
    navigation.navigate('CareDiscoveryScreen' as any, {
      targetPatientId: user?.id,
      targetPatientName: user?.name,
    });
  };

  const handlePostWhatYouNeed = () => {
    navigation.navigate('PostCareNeedScreen' as any, {
      targetPatientId: user?.id,
      targetPatientName: user?.name,
    });
  };

  const handleViewInquiries = () => {
    navigation.navigate('CareRequestsListScreen' as any, {
      initialTab: 'ACTIVE',
      targetPatientId: user?.id,
      targetPatientName: user?.name,
    });
  };

  const handleViewCaregiverProfile = (caregiver: CaregiverListing) => {
    navigation.navigate('CaregiverProfileScreen' as any, {
      caregiver,
      caregiverId: caregiver.id,
      targetPatientId: user?.id,
      targetPatientName: user?.name,
    });
  };

  const handleManageCare = () => {
    navigation.navigate('PatientCareTeamScreen' as any);
  };

  const isLoading = (loadingCaregivers || loadingFamily) && !refreshing && activeCaregivers.length === 0 && familyMembers.length === 0;

  return (
    <ScreenContainer edges={['top', 'left', 'right']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {/* Top Header with SureStep Branding & SOS */}
        <HomeHeader patientId={patientId} />

        {/* Header: Care (No unnecessary subtitle) */}
        <View style={styles.titleSection}>
          <Text style={[styles.mainTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
            Care
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={[styles.loadingText, { color: isDark ? '#9EABA7' : '#52605D' }]}>
              Loading care information...
            </Text>
          </View>
        ) : isSelfManaged ? (
          /* ===================================================================
             1. SELF-MANAGED PATIENT EXPERIENCE
             =================================================================== */
          !hasActiveCaregiver ? (
            /* --- STATE A: Self-Managed, No Active Caregiver --- */
            <View style={styles.emptyContainer}>
              {/* Path 1: Find a Caregiver */}
              <View style={[styles.card, { backgroundColor: isDark ? '#1C2422' : '#FFFFFF' }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.iconCircleTeal}>
                    <Ionicons name="people-outline" size={28} color={C.primary} />
                  </View>
                  <View style={styles.cardHeaderTexts}>
                    <Text style={[styles.cardHeading, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
                      Find a Caregiver
                    </Text>
                    <Text style={[styles.cardText, { color: isDark ? '#9EABA7' : '#52605D' }]}>
                      Browse people who can help with care
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleFindCaregiver}
                  accessibilityRole="button"
                  accessibilityLabel="Find a Caregiver"
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Find a Caregiver →</Text>
                </Pressable>
              </View>

              {/* Path 2: Post What You Need */}
              <View style={[styles.card, { backgroundColor: isDark ? '#1C2422' : '#FFFFFF' }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.iconCircleTeal}>
                    <Ionicons name="document-text-outline" size={28} color={C.primary} />
                  </View>
                  <View style={styles.cardHeaderTexts}>
                    <Text style={[styles.cardHeading, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
                      Post What You Need
                    </Text>
                    <Text style={[styles.cardText, { color: isDark ? '#9EABA7' : '#52605D' }]}>
                      Tell caregivers what kind of help you're looking for
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={handlePostWhatYouNeed}
                  accessibilityRole="button"
                  accessibilityLabel="Post a Care Need"
                  style={({ pressed }) => [
                    styles.secondaryOutlineBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.secondaryOutlineBtnText}>Post a Care Need</Text>
                </Pressable>
              </View>

              {/* Path 3: My Requests Section */}
              <View style={styles.myRequestsSection}>
                <Text style={[styles.subSectionTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
                  My Requests
                </Text>
                <Pressable
                  onPress={handleViewInquiries}
                  accessibilityRole="button"
                  accessibilityLabel="View My Requests"
                  style={({ pressed }) => [
                    styles.inquiriesBanner,
                    { backgroundColor: isDark ? '#1C2422' : '#FFFFFF' },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View style={styles.inquiriesBannerLeft}>
                    <Ionicons name="time-outline" size={20} color={C.primary} style={{ marginRight: 10 }} />
                    <Text style={[styles.inquiriesBannerText, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
                      My Requests
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
                </Pressable>
              </View>
            </View>
          ) : (
            /* --- STATE B: Self-Managed, Has Active Caregiver(s) --- */
            <View style={styles.teamContainer}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
                    My Care Team
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: isDark ? '#9EABA7' : '#52605D' }]}>
                    {activeCaregivers.length === 1
                      ? '1 caregiver actively helping you'
                      : `${activeCaregivers.length} caregivers actively helping you`}
                  </Text>
                </View>
                <Pressable
                  onPress={handleFindCaregiver}
                  accessibilityRole="button"
                  accessibilityLabel="Find another caregiver"
                  style={({ pressed }) => [
                    styles.headerAddBtn,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Ionicons name="add" size={16} color={C.primary} />
                  <Text style={styles.headerAddBtnText}>Find More</Text>
                </Pressable>
              </View>

              {/* List of active caregiver cards */}
              {activeCaregivers.map((cg) => {
                const role = cg.professional_role || cg.specialty || 'Professional Caregiver';
                const photo = cg.photoUrl || cg.profile_photo_url;
                const initials = (cg.name || 'C')
                  .split(' ')
                  .map((p) => p[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <View
                    key={cg.id}
                    style={[styles.memberCard, { backgroundColor: isDark ? '#1C2422' : '#FFFFFF' }]}
                  >
                    <View style={styles.memberCardHeader}>
                      {photo ? (
                        <Image source={{ uri: photo }} style={styles.avatarImg} />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarFallbackText}>{initials}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.memberName, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
                          {cg.name}
                        </Text>
                        <Text style={[styles.memberRole, { color: isDark ? '#9EABA7' : '#52605D' }]}>
                          {role}
                        </Text>
                        <View style={styles.badgeRow}>
                          <View style={styles.activeBadge}>
                            <View style={styles.activeDot} />
                            <Text style={styles.activeBadgeText}>
                              {cg.status === 'NOTICE_PERIOD' ? 'Notice Period' : 'Active Caregiver'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.cardActionsRow}>
                      <Pressable
                        onPress={() => handleViewCaregiverProfile(cg)}
                        accessibilityRole="button"
                        accessibilityLabel={`View profile for ${cg.name}`}
                        style={({ pressed }) => [
                          styles.cardSecondaryBtn,
                          pressed && { opacity: 0.75 },
                        ]}
                      >
                        <Text style={styles.cardSecondaryBtnText}>View Profile</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleManageCare}
                        accessibilityRole="button"
                        accessibilityLabel={`Manage care arrangement for ${cg.name}`}
                        style={({ pressed }) => [
                          styles.cardManageBtn,
                          pressed && { opacity: 0.75 },
                        ]}
                      >
                        <Text style={styles.cardManageBtnText}>Manage</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}

              {/* View Sent Inquiries Link */}
              <Pressable
                onPress={handleViewInquiries}
                accessibilityRole="button"
                accessibilityLabel="View Care Inquiries"
                style={({ pressed }) => [
                  styles.inquiriesBanner,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={styles.inquiriesBannerLeft}>
                  <Ionicons name="mail-outline" size={18} color={C.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.inquiriesBannerText}>View Care Inquiries & History</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
              </Pressable>
            </View>
          )
        ) : (
          /* ===================================================================
             2. ASSISTED PATIENT EXPERIENCE (Strictly View-Only / Informational)
             =================================================================== */
          <View style={styles.assistedContainer}>
            {/* Reassuring Family Banner */}
            <View style={styles.peaceBanner}>
              <Ionicons name="heart" size={20} color={C.primary} style={{ marginRight: 10, marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.peaceBannerTitle}>Coordinated with Love</Text>
                <Text style={styles.peaceBannerDesc}>
                  Your family coordinates your care team so you can focus on enjoying your day.
                </Text>
              </View>
            </View>

            {/* Caregivers Section (if any assigned) */}
            {activeCaregivers.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
                  Caregivers Helping You
                </Text>
                {activeCaregivers.map((cg) => {
                  const role = cg.professional_role || cg.specialty || 'Caregiver';
                  const photo = cg.photoUrl || cg.profile_photo_url;
                  const initials = (cg.name || 'C')
                    .split(' ')
                    .map((p) => p[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <View
                      key={cg.id}
                      style={[styles.memberCard, { backgroundColor: isDark ? '#1C2422' : '#FFFFFF' }]}
                    >
                      <View style={styles.memberCardHeader}>
                        {photo ? (
                          <Image source={{ uri: photo }} style={styles.avatarImg} />
                        ) : (
                          <View style={styles.avatarFallback}>
                            <Text style={styles.avatarFallbackText}>{initials}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={[styles.memberName, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
                            {cg.name}
                          </Text>
                          <Text style={[styles.memberRole, { color: isDark ? '#9EABA7' : '#52605D' }]}>
                            {role}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Family Members Section */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
                Family Supporting You
              </Text>

              {familyMembers.length === 0 ? (
                <View style={[styles.emptyCardSubtle, { backgroundColor: isDark ? '#1C2422' : '#FFFFFF' }]}>
                  <Text style={[styles.emptyCardSubtleText, { color: isDark ? '#9EABA7' : '#52605D' }]}>
                    Your connected family members will appear here.
                  </Text>
                </View>
              ) : (
                familyMembers.map((member) => {
                  const initials = (member.name || 'F')
                    .split(' ')
                    .map((p) => p[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <View
                      key={member.id}
                      style={[styles.memberCard, { backgroundColor: isDark ? '#1C2422' : '#FFFFFF' }]}
                    >
                      <View style={styles.memberCardHeader}>
                        {member.photo_url ? (
                          <Image source={{ uri: member.photo_url }} style={styles.avatarImg} />
                        ) : (
                          <View style={styles.avatarFallbackFamily}>
                            <Text style={styles.avatarFallbackFamilyText}>{initials}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={[styles.memberName, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
                            {member.name}
                          </Text>
                          <Text style={[styles.memberRole, { color: isDark ? '#9EABA7' : '#52605D' }]}>
                            {member.relationship_type
                              ? member.relationship_type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
                              : 'Family Member'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  titleSection: {
    marginTop: 6,
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  mainTitle: {
    fontFamily: F.bold,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  subTitle: {
    fontFamily: F.regular,
    fontSize: 15,
    marginTop: 4,
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: F.medium,
    fontSize: 14,
  },
  emptyContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircleTeal: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardHeaderRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderTexts: {
    alignItems: 'center',
  },
  cardHeading: {
    fontFamily: F.bold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 6,
  },
  cardText: {
    fontFamily: F.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    borderRadius: 14,
    width: '100%',
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondaryOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: 14,
    width: '100%',
    paddingVertical: 13,
  },
  secondaryOutlineBtnText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.primary,
  },
  myRequestsSection: {
    marginTop: 8,
  },
  subSectionTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  inquiriesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  inquiriesBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inquiriesBannerText: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: C.primary,
  },
  teamContainer: {
    gap: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 18,
  },
  sectionSubtitle: {
    fontFamily: F.regular,
    fontSize: 13,
    marginTop: 2,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  headerAddBtnText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.primary,
    marginLeft: 4,
  },
  memberCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  memberCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E0D8',
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.primary,
  },
  avatarFallbackFamily: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackFamilyText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#6D28D9',
  },
  memberName: {
    fontFamily: F.bold,
    fontSize: 16,
  },
  memberRole: {
    fontFamily: F.regular,
    fontSize: 13,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F5EE',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0E7A67',
    marginRight: 5,
  },
  activeBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 11,
    color: '#0E7A67',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E0D8',
    marginVertical: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cardSecondaryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  cardSecondaryBtnText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textPrimary,
  },
  cardManageBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#E6F4F1',
  },
  cardManageBtnText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.primary,
  },
  assistedContainer: {
    gap: 18,
  },
  peaceBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E6F4F1',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C7EBE3',
  },
  peaceBannerTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#0E7A67',
    marginBottom: 2,
  },
  peaceBannerDesc: {
    fontFamily: F.regular,
    fontSize: 13,
    lineHeight: 18,
    color: '#28584E',
  },
  sectionWrap: {
    marginTop: 6,
    gap: 8,
  },
  emptyCardSubtle: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    alignItems: 'center',
  },
  emptyCardSubtleText: {
    fontFamily: F.regular,
    fontSize: 14,
  },
});
