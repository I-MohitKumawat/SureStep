/**
 * SureStep — src/screens/family/CareCircleManageScreen.tsx
 * Comprehensive settings and management for a specific Care Circle.
 * Allows Circle Owners to invite members, manage permissions, review join requests,
 * connect patients, or delete the circle.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FamilyStackParams } from '../../types/navigation.types';
import { useFamilyContext } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import {
  getCareCircleDetails,
  listCircleMembers,
  listCirclePatients,
  listJoinRequests,
  reviewJoinRequest,
  removeCircleMember,
  leaveCareCircle,
  deleteCareCircle,
  CareCircle,
  CircleMember,
  CirclePatient,
  JoinRequest,
} from '../../services/careCircleService';

type Props = NativeStackScreenProps<FamilyStackParams, 'CareCircleManageScreen'>;

export const CareCircleManageScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { circleId } = route.params;
  const { isOwner, reloadFamilyData } = useFamilyContext();
  const { user } = useAuth();

  const [circle, setCircle] = useState<CareCircle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [patients, setPatients] = useState<CirclePatient[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [circleRes, membersRes, patientsRes, requestsRes] = await Promise.all([
        getCareCircleDetails(circleId),
        listCircleMembers(circleId),
        listCirclePatients(circleId),
        isOwner ? listJoinRequests(circleId) : Promise.resolve([]),
      ]);
      setCircle(circleRes);
      setMembers(membersRes);
      setPatients(patientsRes);
      setJoinRequests(requestsRes);
    } catch (err) {
      console.warn('[CareCircleManageScreen] loadData error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [circleId, isOwner]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleReviewRequest = async (requestId: string, decision: 'ACCEPTED' | 'REJECTED') => {
    try {
      await reviewJoinRequest(circleId, requestId, decision);
      Alert.alert('Success', `Request has been ${decision.toLowerCase()}.`);
      void loadData(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to review join request.');
    }
  };

  const handleRemoveMember = (member: CircleMember) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.name} from this Care Circle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCircleMember(circleId, member.id);
              setMembers((prev) => prev.filter((m) => m.id !== member.id));
              Alert.alert('Removed', `${member.name} has been removed.`);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to remove member.');
            }
          },
        },
      ]
    );
  };

  const handleLeaveCircle = () => {
    Alert.alert(
      'Leave Care Circle',
      'Are you sure you want to leave this circle? You will lose access to its patients and safety alerts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveCareCircle(circleId);
              await reloadFamilyData();
              Alert.alert('Left Circle', 'You have left this care circle.');
              navigation.navigate('FamilyHomeScreen');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to leave circle.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteCircle = () => {
    Alert.alert(
      'Delete Care Circle',
      'This will permanently delete the care circle, remove all members, and detach safe zones. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCareCircle(circleId);
              await reloadFamilyData();
              Alert.alert('Deleted', 'Care Circle has been permanently deleted.');
              navigation.navigate('FamilyHomeScreen');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete circle.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{circle?.name ?? 'Care Circle'}</Text>
          <Text style={styles.headerSubtitle}>
            {isOwner ? 'You are the Circle Owner' : `Owner: ${circle?.owner_name ?? 'Owner'}`}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0E7A67" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#0E7A67" />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Invite Card */}
          <View style={styles.inviteCard}>
            <View style={styles.inviteIconWrap}>
              <Ionicons name="person-add-outline" size={22} color="#0E7A67" />
            </View>
            <View style={styles.inviteTextWrap}>
              <Text style={styles.inviteCardTitle}>Invite to Care Circle</Text>
              <Text style={styles.inviteCardSub}>Generate a 6-digit code for family members or caregivers.</Text>
            </View>
            <TouchableOpacity
              style={styles.inviteBtn}
              onPress={() => navigation.navigate('CareCircleInviteScreen', { circleId })}
            >
              <Text style={styles.inviteBtnText}>Invite</Text>
            </TouchableOpacity>
          </View>

          {/* Pending Join Requests (Owner only) */}
          {isOwner && joinRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Join Requests ({joinRequests.length})</Text>
              {joinRequests.map((req) => (
                <View key={req.id} style={styles.requestCard}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>{req.user_name}</Text>
                    <Text style={styles.requestRole}>Requesting role: {req.role_in_circle}</Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleReviewRequest(req.id, 'ACCEPTED')}
                    >
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleReviewRequest(req.id, 'REJECTED')}
                    >
                      <Ionicons name="close" size={16} color="#C93B2B" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Connected Patients Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>People Receiving Care</Text>
              <Text style={styles.sectionCount}>{patients.length}</Text>
            </View>

            {patients.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="person-outline" size={28} color="#8A9592" />
                <Text style={styles.emptyBoxText}>No patient linked to this circle yet.</Text>
              </View>
            ) : (
              patients.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.patientCard}
                  onPress={() =>
                    navigation.navigate('PatientOverviewScreen', {
                      patientId: p.id,
                      patientName: p.name,
                    })
                  }
                >
                  <View style={styles.patientAvatar}>
                    <Text style={styles.patientAvatarText}>
                      {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                    </Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{p.name}</Text>
                    <Text style={styles.patientSub}>Tap to view dashboard</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#8A9592" />
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Circle Members Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Circle Members</Text>
              <Text style={styles.sectionCount}>{members.length}</Text>
            </View>

            {members.map((m) => {
              const isCircleOwner = m.is_owner || m.role_in_circle === 'OWNER';
              const isCurrentUser = m.user_id === user?.id;

              return (
                <View key={m.id} style={styles.memberCard}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {m.name ? m.name.charAt(0).toUpperCase() : 'M'}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{m.name}</Text>
                      {isCircleOwner && (
                        <View style={styles.ownerBadge}>
                          <Text style={styles.ownerBadgeText}>Owner</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.memberRole}>{m.role_in_circle}</Text>
                  </View>

                  {/* Actions for Owner over other members */}
                  {isOwner && !isCircleOwner && (
                    <View style={styles.memberActionRow}>
                      <TouchableOpacity
                        style={styles.permBtn}
                        onPress={() =>
                          navigation.navigate('CareCirclePermissionsScreen', {
                            circleId,
                            memberId: m.id,
                            memberName: m.name,
                          })
                        }
                      >
                        <Ionicons name="shield-outline" size={16} color="#0E7A67" />
                        <Text style={styles.permBtnText}>Permissions</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeMemberBtn}
                        onPress={() => handleRemoveMember(m)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#C93B2B" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Circle Danger Actions */}
          <View style={styles.dangerSection}>
            {isOwner ? (
              <TouchableOpacity
                style={styles.dangerBtn}
                onPress={handleDeleteCircle}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color="#C93B2B" />
                <Text style={styles.dangerBtnText}>Delete This Care Circle</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.dangerBtn}
                onPress={handleLeaveCircle}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={18} color="#C93B2B" />
                <Text style={styles.dangerBtnText}>Leave Care Circle</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0D8',
    backgroundColor: '#FAF8F5',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#161E1C',
  },
  headerSubtitle: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 2,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    padding: 16,
    marginBottom: 20,
  },
  inviteIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inviteTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  inviteCardTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#161E1C',
  },
  inviteCardSub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    marginTop: 2,
  },
  inviteBtn: {
    backgroundColor: '#0E7A67',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteBtnText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#161E1C',
  },
  sectionCount: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#52605D',
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    padding: 24,
    alignItems: 'center',
  },
  emptyBoxText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 6,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    padding: 14,
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#161E1C',
  },
  requestRole: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0E7A67',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FDF2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    padding: 14,
    marginBottom: 8,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientAvatarText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#0E7A67',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#161E1C',
  },
  patientSub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    marginTop: 2,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    padding: 14,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0ECE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#52605D',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#161E1C',
  },
  ownerBadge: {
    backgroundColor: '#EBF5F3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ownerBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 10,
    color: '#0E7A67',
  },
  memberRole: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    marginTop: 2,
  },
  memberActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5F3',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  permBtnText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#0E7A67',
  },
  removeMemberBtn: {
    padding: 6,
  },
  dangerSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E0D8',
    paddingTop: 20,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5C6CB',
    backgroundColor: '#FFF8F8',
    gap: 8,
  },
  dangerBtnText: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#C93B2B',
  },
});
