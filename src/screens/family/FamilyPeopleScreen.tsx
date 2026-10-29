/**
 * SureStep — src/screens/family/FamilyPeopleScreen.tsx
 * Canonical People tab:
 *   - Associated Patients (with navigation to Patient Overview)
 *   - Care Circle Tenancy (Owner status, Member roster)
 *   - Delegated Permissions Management (4 canonical permissions)
 *   - 6-digit Invite Code generation & Join Request approvals
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useFamilyContext } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import {
  listJoinRequests,
  reviewJoinRequest,
  removeCircleMember,
  type JoinRequest,
  type CircleMember,
} from '../../services/careCircleService';
import type { FamilyStackParams } from '../../types/navigation.types';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

type NavigationProp = NativeStackNavigationProp<FamilyStackParams>;

export const FamilyPeopleScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const {
    activeCircle,
    patients,
    careCircle,
    isOwner,
    hasPermission,
    refresh,
    setActivePatientId,
  } = useFamilyContext();

  const [refreshing, setRefreshing] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const canManagePermissions = isOwner || hasPermission('Manage Member Permissions');

  const loadRequests = useCallback(async () => {
    if (!activeCircle || !canManagePermissions) return;
    setLoadingRequests(true);
    try {
      const reqs = await listJoinRequests(activeCircle.id);
      setJoinRequests(reqs.filter((r) => r.status === 'PENDING'));
    } finally {
      setLoadingRequests(false);
    }
  }, [activeCircle, canManagePermissions]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      void loadRequests();
    }, [refresh, loadRequests])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    await loadRequests();
    setRefreshing(false);
  };

  const handleReviewRequest = async (requestId: string, decision: 'ACCEPTED' | 'REJECTED') => {
    if (!activeCircle) return;
    try {
      await reviewJoinRequest(activeCircle.id, requestId, decision);
      Alert.alert('Success', `Join request ${decision.toLowerCase()}.`);
      void handleRefresh();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error?.message || 'Failed to review request.');
    }
  };

  const handleRemoveMember = (member: CircleMember) => {
    if (!activeCircle) return;
    if (member.is_owner) {
      Alert.alert('Cannot Remove', 'The Circle Owner cannot be removed from the Care Circle.');
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.name} from the Care Circle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCircleMember(activeCircle.id, member.id);
              Alert.alert('Removed', `${member.name} has been removed.`);
              void refresh();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error?.message || 'Failed to remove member.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>People</Text>
          <Text style={styles.headerSub}>Patients and Care Circle members</Text>
        </View>

        {activeCircle && canManagePermissions && (
          <Pressable
            style={styles.inviteHeaderBtn}
            onPress={() => navigation.navigate('CareCircleInviteScreen', { circleId: activeCircle.id })}
          >
            <Ionicons name="person-add" size={16} color="#0E7A67" style={{ marginRight: 4 }} />
            <Text style={styles.inviteHeaderBtnText}>Invite</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {!activeCircle ? (
          /* State A Empty State */
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people" size={32} color="#0E7A67" />
            </View>
            <Text style={styles.emptyTitle}>No Active Care Circle</Text>
            <Text style={styles.emptySub}>
              Care Circles allow family and caregivers to coordinate together. Create a circle or join with an invite code.
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('CreateCareCircleScreen')}
            >
              <Text style={styles.primaryBtnText}>Create a Care Circle</Text>
            </Pressable>
            <Pressable
              style={styles.outlineBtn}
              onPress={() => navigation.navigate('JoinCareCircleScreen')}
            >
              <Text style={styles.outlineBtnText}>Join an Existing Circle</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* ─── Pending Join Requests (Owner or Manage Member Permissions) ── */}
            {canManagePermissions && joinRequests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending Join Requests ({joinRequests.length})</Text>
                {joinRequests.map((req) => (
                  <View key={req.id} style={styles.requestCard}>
                    <View style={styles.requestInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.requestName}>{req.user_name || 'New Member'}</Text>
                        {(req.role_requested || req.role_in_circle) ? (
                          <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                            <Text style={{ fontFamily: F.bold, fontSize: 10, color: '#92400E' }}>
                              {req.role_requested || req.role_in_circle}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.requestPhone}>{req.user_phone || 'Requesting entry'}</Text>
                    </View>
                    <View style={styles.requestActions}>
                      <Pressable
                        style={[styles.reviewBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => handleReviewRequest(req.id, 'ACCEPTED')}
                      >
                        <Text style={styles.reviewBtnText}>Accept</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.reviewBtn, { backgroundColor: '#EF4444', marginLeft: 8 }]}
                        onPress={() => handleReviewRequest(req.id, 'REJECTED')}
                      >
                        <Text style={styles.reviewBtnText}>Decline</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ─── Section 1: Connected Patients ────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Patients</Text>
                <Text style={styles.countBadge}>{patients.length} connected</Text>
              </View>

              {patients.length === 0 ? (
                <View style={styles.noDataCard}>
                  <Text style={styles.noDataText}>No patients linked to this Care Circle yet.</Text>
                </View>
              ) : (
                patients.map((p) => (
                  <Pressable
                    key={p.id}
                    style={styles.patientRow}
                    onPress={() => {
                      setActivePatientId(p.id);
                      navigation.navigate('PatientOverviewScreen', {
                        patientId: p.id,
                        patientName: p.name,
                      });
                    }}
                  >
                    {p.photo_url ? (
                      <Image source={{ uri: p.photo_url }} style={styles.patientPhoto} />
                    ) : (
                      <View style={styles.patientFallback}>
                        <Text style={styles.patientInitial}>{p.name[0]?.toUpperCase()}</Text>
                      </View>
                    )}

                    <View style={styles.patientMeta}>
                      <Text style={styles.patientName}>{p.name}</Text>
                      <Text style={styles.patientSub}>
                        {p.relationship_label || 'Loved one'} • {p.care_mode === 'SELF' ? 'Self-care' : 'Assisted'}
                      </Text>
                    </View>

                    <Feather name="chevron-right" size={20} color="#9CA3AF" />
                  </Pressable>
                ))
              )}
            </View>

            {/* ─── Section 2: Care Circle Members ───────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Care Circle Roster</Text>
                  <Text style={styles.circleContextName}>{activeCircle.name}</Text>
                </View>
                {canManagePermissions && (
                  <Pressable
                    style={styles.addMemberBtn}
                    onPress={() => navigation.navigate('CareCircleInviteScreen', { circleId: activeCircle.id })}
                  >
                    <Feather name="plus" size={16} color="#0E7A67" style={{ marginRight: 4 }} />
                    <Text style={styles.addMemberBtnText}>Add</Text>
                  </Pressable>
                )}
              </View>

              {careCircle.map((member) => {
                const roleLabel = member.is_owner
                  ? 'Owner'
                  : member.role_in_circle === 'CAREGIVER'
                  ? 'Professional Caregiver'
                  : 'Family Member';

                return (
                  <Pressable
                    key={member.id}
                    style={styles.memberCard}
                    onPress={() => {
                      if (canManagePermissions && !member.is_owner && member.user_id !== user?.id) {
                        navigation.navigate('CareCirclePermissionsScreen', {
                          circleId: activeCircle.id,
                          memberId: member.id,
                          memberName: member.name,
                        });
                      }
                    }}
                  >
                    {member.photo_url ? (
                      <Image source={{ uri: member.photo_url }} style={styles.memberAvatar} />
                    ) : (
                      <View style={styles.memberFallback}>
                        <Text style={styles.memberInitial}>{member.name[0]?.toUpperCase()}</Text>
                      </View>
                    )}

                    <View style={styles.memberMeta}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        {member.is_owner && (
                          <View style={styles.ownerBadge}>
                            <Text style={styles.ownerBadgeText}>Owner</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.memberRole}>{roleLabel}</Text>
                    </View>

                    {canManagePermissions && !member.is_owner && member.user_id !== user?.id ? (
                      <View style={styles.permissionActionWrap}>
                        <Ionicons name="shield-checkmark-outline" size={18} color="#0E7A67" />
                        <Feather name="chevron-right" size={18} color="#9CA3AF" style={{ marginLeft: 6 }} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
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
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FAF8F5',
  },
  headerTitle: {
    fontFamily: F.extraBold,
    fontSize: 24,
    color: '#161E1C',
  },
  headerSub: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 2,
  },
  inviteHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  inviteHeaderBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#0E7A67',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
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
    color: '#161E1C',
  },
  circleContextName: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    marginTop: 2,
  },
  countBadge: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#52605D',
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  addMemberBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#0E7A67',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  patientPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
  },
  patientFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  patientInitial: {
    fontFamily: F.bold,
    fontSize: 20,
    color: '#0E7A67',
  },
  patientMeta: {
    flex: 1,
  },
  patientName: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#161E1C',
  },
  patientSub: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 2,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
  },
  memberFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  memberInitial: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#4B5563',
  },
  memberMeta: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#161E1C',
  },
  ownerBadge: {
    backgroundColor: '#E6F4F1',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  ownerBadgeText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#0E7A67',
  },
  memberRole: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 2,
  },
  permissionActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#92400E',
  },
  requestPhone: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
  },
  reviewBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  reviewBtnText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  noDataCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#52605D',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 20,
    color: '#161E1C',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#52605D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#0E7A67',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  outlineBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#0E7A67',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#0E7A67',
  },
});
