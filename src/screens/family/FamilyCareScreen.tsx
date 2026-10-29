/**
 * SureStep — src/screens/family/FamilyCareScreen.tsx
 * Canonical Care Tab screen for Family members.
 * Implements "SCREEN 1 — CARE LANDING" visual language:
 * - Header: "Care" (no unnecessary subtitle)
 * - Warm background #FAF8F5, Botanical teal #0E7A67, dark text #161E1C
 * - Two clear primary paths: "Find a Caregiver" and "Post What You Need"
 * - Active Care Team list with notice period status
 * - Guarded by canonical permission: 'Search/Request Caregivers'
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FamilyStackParams } from '../../types/navigation.types';
import { useFamilyContext } from '../../context/FamilyContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import {
  fetchMyCaregivers,
  CaregiverListing,
} from '../../services/relationshipService';

type NavigationProp = NativeStackNavigationProp<FamilyStackParams>;

export const FamilyCareScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const { activePatient, activeCircle, isOwner, hasPermission } = useFamilyContext();

  const [activeCareTeam, setActiveCareTeam] = useState<CaregiverListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCareTeam = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchMyCaregivers();
      setActiveCareTeam(data || []);
    } catch (err) {
      console.warn('[FamilyCareScreen] loadCareTeam error:', err);
      setActiveCareTeam([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCareTeam();
  }, [loadCareTeam]);

  useFocusEffect(
    useCallback(() => {
      void loadCareTeam();
    }, [loadCareTeam])
  );

  // Searching/browsing caregivers is independent of Care Circles.
  // Posting care needs on behalf of a circle requires Owner or Search/Request Caregivers permission if in a circle.
  const canPostCareNeed = !activeCircle || isOwner || hasPermission('Search/Request Caregivers');

  const handleFindCaregiver = () => {
    navigation.navigate('CareDiscoveryScreen', {
      targetPatientId: activePatient?.id,
      targetPatientName: activePatient?.name,
    });
  };

  const handlePostCareNeed = () => {
    if (!canPostCareNeed) {
      Alert.alert(
        'Permission Required',
        'You do not have permission to post care needs in this Care Circle. Please contact the Circle Owner.'
      );
      return;
    }
    navigation.navigate('PostCareNeedScreen', {
      targetPatientId: activePatient?.id,
      targetPatientName: activePatient?.name,
    });
  };

  const handleViewRequests = () => {
    navigation.navigate('CareRequestsListScreen', {
      targetPatientId: activePatient?.id,
      targetPatientName: activePatient?.name,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Care</Text>
        <TouchableOpacity
          style={styles.requestsBtn}
          onPress={handleViewRequests}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="document-text-outline" size={20} color="#0E7A67" />
          <Text style={styles.requestsBtnText}>My Requests</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadCareTeam(true)} tintColor="#0E7A67" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Patient Context Banner if selected */}
        {activePatient && (
          <View style={styles.patientContextBanner}>
            <Ionicons name="person-circle-outline" size={20} color="#0E7A67" />
            <Text style={styles.patientContextText}>
              Coordinating care for <Text style={{ fontFamily: F.bold }}>{activePatient.name}</Text>
            </Text>
          </View>
        )}

        {/* Path 1: Find a Caregiver */}
        <View style={styles.actionCard}>
          <View style={styles.actionCardHeader}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="search" size={22} color="#0E7A67" />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionCardTitle}>Find a Caregiver</Text>
              <Text style={styles.actionCardSub}>Browse verified professionals who can help with care.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={handleFindCaregiver}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryActionBtnText}>Find a Caregiver</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Path 2: Post What You Need */}
        <View style={styles.actionCard}>
          <View style={styles.actionCardHeader}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="megaphone-outline" size={22} color="#0E7A67" />
            </View>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionCardTitle}>Post What You Need</Text>
              <Text style={styles.actionCardSub}>Describe the care schedule and let qualified caregivers reach out.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.secondaryActionBtn, !canPostCareNeed && styles.disabledBtn]}
            onPress={handlePostCareNeed}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryActionBtnText}>Post a Care Need</Text>
            <Ionicons name="arrow-forward" size={18} color="#0E7A67" />
          </TouchableOpacity>
        </View>

        {/* Active Care Team Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Care Team</Text>
          <Text style={styles.sectionCount}>{activeCareTeam.length} connected</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#0E7A67" />
          </View>
        ) : activeCareTeam.length === 0 ? (
          <View style={styles.emptyCareTeamCard}>
            <Ionicons name="heart-half-outline" size={32} color="#8A9592" />
            <Text style={styles.emptyCareTeamTitle}>No Active Caregivers</Text>
            <Text style={styles.emptyCareTeamDesc}>
              When you hire or assign a caregiver to {activePatient?.name ?? 'your care circle'}, they will appear here.
            </Text>
          </View>
        ) : (
          activeCareTeam.map((cg) => {
            const isNotice = (cg.status || '').toUpperCase() === 'NOTICE_PERIOD';
            return (
              <TouchableOpacity
                key={cg.id}
                style={styles.caregiverCard}
                onPress={() =>
                  navigation.navigate('CaregiverProfileScreen', {
                    caregiver: cg,
                    caregiverId: cg.id,
                    targetPatientId: activePatient?.id,
                    targetPatientName: activePatient?.name,
                  })
                }
                activeOpacity={0.8}
              >
                <View style={styles.caregiverAvatarWrap}>
                  {(cg.photoUrl || cg.profile_photo_url) ? (
                    <Image source={{ uri: cg.photoUrl || cg.profile_photo_url || '' }} style={styles.caregiverAvatar} />
                  ) : (
                    <View style={styles.caregiverAvatarFallback}>
                      <Text style={styles.avatarInitial}>
                        {cg.name ? cg.name.charAt(0).toUpperCase() : 'C'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.caregiverInfo}>
                  <Text style={styles.caregiverName}>{cg.name}</Text>
                  <Text style={styles.caregiverRole}>{cg.specialty || cg.professional_role || 'Care Specialist'}</Text>
                  {isNotice ? (
                    <View style={styles.noticeBadge}>
                      <Ionicons name="time-outline" size={12} color="#D97706" />
                      <Text style={styles.noticeBadgeText}>7-day notice period active</Text>
                    </View>
                  ) : (
                    <View style={styles.activeBadge}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activeBadgeText}>Active care contract</Text>
                    </View>
                  )}
                </View>

                <Ionicons name="chevron-forward" size={20} color="#8A9592" />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0D8',
    backgroundColor: '#FAF8F5',
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 24,
    color: '#161E1C',
  },
  requestsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    gap: 6,
  },
  requestsBtnText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: '#0E7A67',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  patientContextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5F3',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
  },
  patientContextText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#0E7A67',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    padding: 18,
    marginBottom: 16,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF5F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionCardTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: '#161E1C',
  },
  actionCardSub: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 3,
    lineHeight: 18,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E7A67',
    borderRadius: 12,
    paddingVertical: 13,
    gap: 8,
  },
  primaryActionBtnText: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#0E7A67',
    borderRadius: 12,
    paddingVertical: 13,
    gap: 8,
  },
  secondaryActionBtnText: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#0E7A67',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: '#161E1C',
  },
  sectionCount: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#52605D',
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyCareTeamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    padding: 24,
    alignItems: 'center',
  },
  emptyCareTeamTitle: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#161E1C',
    marginTop: 8,
  },
  emptyCareTeamDesc: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  caregiverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  caregiverAvatarWrap: {
    marginRight: 12,
  },
  caregiverAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  caregiverAvatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EBF5F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#0E7A67',
  },
  caregiverInfo: {
    flex: 1,
  },
  caregiverName: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#161E1C',
  },
  caregiverRole: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    marginTop: 2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0E7A67',
  },
  activeBadgeText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#0E7A67',
  },
  noticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  noticeBadgeText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#D97706',
  },
});
