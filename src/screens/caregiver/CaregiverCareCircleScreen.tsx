import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Alert,
  Clipboard,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Path } from 'react-native-svg';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import type { CaregiverStackParams } from '../../types/navigation.types';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import {
  getCareCircleForPatient,
  getInviteCodesForPatient,
  generateInviteCode,
  revokeInviteCode,
  type CareCircleMember,
} from '../../services/familyService';
import { getSocket } from '../../services/socketClient';

type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverCareCircleScreen'>;

type RoleOption = {
  value: 'GUARDIAN' | 'FAMILY_CLOSE' | 'FAMILY_EXTENDED';
  label: string;
  desc: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'GUARDIAN',
    label: 'Guardian',
    desc: 'Primary family members with full read/write controls.',
  },
  {
    value: 'FAMILY_CLOSE',
    label: 'Close Family',
    desc: 'Trusted family with safety monitoring & routine viewing.',
  },
  {
    value: 'FAMILY_EXTENDED',
    label: 'Extended Family',
    desc: 'Distant family with weekly/daily digest views only.',
  },
];

// Generates a mock QR code grid based on invite code string
const MockQrCode = ({ code }: { code: string }) => {
  const size = 160;
  const padding = 10;
  const numGrid = 16;
  const dotSize = (size - padding * 2) / numGrid;

  // Stable pseudo-random grid based on the characters in the code
  const getDotActive = (row: number, col: number) => {
    // Top-left finder pattern
    if (row < 5 && col < 5) {
      if (row === 0 || row === 4 || col === 0 || col === 4) return true;
      if (row === 2 && col === 2) return true;
      return false;
    }
    // Top-right finder pattern
    if (row < 5 && col >= numGrid - 5) {
      const c = col - (numGrid - 5);
      if (row === 0 || row === 4 || c === 0 || c === 4) return true;
      if (row === 2 && c === 2) return true;
      return false;
    }
    // Bottom-left finder pattern
    if (row >= numGrid - 5 && col < 5) {
      const r = row - (numGrid - 5);
      if (r === 0 || r === 4 || col === 0 || col === 4) return true;
      if (r === 2 && col === 2) return true;
      return false;
    }

    // Pseudo-random dots for the rest
    const charCode = code.charCodeAt((row + col) % code.length) || 42;
    return (row * col * charCode) % 3 === 0;
  };

  const dots = [];
  for (let r = 0; r < numGrid; r++) {
    for (let c = 0; c < numGrid; c++) {
      if (getDotActive(r, c)) {
        dots.push(
          <Rect
            key={`${r}-${c}`}
            x={padding + c * dotSize}
            y={padding + r * dotSize}
            width={dotSize - 0.5}
            height={dotSize - 0.5}
            fill="#111827"
            rx={dotSize * 0.2}
          />
        );
      }
    }
  }

  return (
    <View style={styles.qrContainer}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background */}
        <Rect width={size} height={size} fill="#FFFFFF" rx={12} />
        {dots}
      </Svg>
    </View>
  );
};

export const CaregiverCareCircleScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patientId, patientName } = route.params;

  const [activeTab, setActiveTab] = useState<'members' | 'invites'>('members');
  const [members, setMembers] = useState<CareCircleMember[]>([]);
  const [inviteCodes, setInviteCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Modal states
  const [genModalVisible, setGenModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'GUARDIAN' | 'FAMILY_CLOSE' | 'FAMILY_EXTENDED'>('FAMILY_CLOSE');
  const [newInvite, setNewInvite] = useState<{ code: string; expires_at: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        getCareCircleForPatient(patientId),
        getInviteCodesForPatient(patientId),
      ]);
      setMembers(membersRes.data?.data?.members || []);
      setInviteCodes(invitesRes.data?.data?.inviteCodes || []);
    } catch (err) {
      console.error('[CaregiverCareCircle] Failed to load data:', err);
      Alert.alert('Error', 'Failed to load Care Circle members.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRelationshipChange = (data: any) => {
      console.log('[CaregiverCareCircleScreen] relationship:change event received', data);
      void loadData();
    };

    socket.on('relationship:change', handleRelationshipChange);

    return () => {
      socket.off('relationship:change', handleRelationshipChange);
    };
  }, [loadData]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateInviteCode(patientId, selectedRole);
      const invite = res.data?.data?.invite;
      if (invite) {
        setNewInvite(invite);
        // Refresh invites list in background
        const invitesRes = await getInviteCodesForPatient(patientId);
        setInviteCodes(invitesRes.data?.data?.inviteCodes || []);
      }
    } catch (err) {
      console.error('[CaregiverCareCircle] Generate failed:', err);
      Alert.alert('Error', 'Failed to generate invite code.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (code: string) => {
    Alert.alert(
      'Revoke Invite Code',
      `Are you sure you want to revoke code ${code}? It will immediately become inactive.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeInviteCode(code);
              // Refresh invites list
              const invitesRes = await getInviteCodesForPatient(patientId);
              setInviteCodes(invitesRes.data?.data?.inviteCodes || []);
              Alert.alert('Success', 'Invite code has been revoked.');
            } catch (err) {
              console.error('[CaregiverCareCircle] Revoke failed:', err);
              Alert.alert('Error', 'Failed to revoke invite code.');
            }
          },
        },
      ]
    );
  };

  const handleCopyCode = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Copied', 'Invite code copied to clipboard!');
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt).getTime() < Date.now();

  return (
    <ScreenContainer edges={['top', 'bottom']} style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{patientName}'s Care Circle</Text>
          <Text style={styles.headerSubtitle}>Manage family access and invite codes</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabItem, activeTab === 'members' && styles.tabItemActive]}
          onPress={() => setActiveTab('members')}
        >
          <Ionicons
            name="people-outline"
            size={18}
            color={activeTab === 'members' ? C.primary : '#6B7280'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabLabel, activeTab === 'members' && styles.tabLabelActive]}>Members</Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, activeTab === 'invites' && styles.tabItemActive]}
          onPress={() => setActiveTab('invites')}
        >
          <Ionicons
            name="key-outline"
            size={18}
            color={activeTab === 'invites' ? C.primary : '#6B7280'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabLabel, activeTab === 'invites' && styles.tabLabelActive]}>Invite Codes</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'members' ? (
            <>
              {members.length === 0 ? (
                <Text style={styles.emptyText}>No family members linked to this patient yet.</Text>
              ) : (
                members.map((member) => (
                  <View key={member.id} style={styles.memberCard}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {(member.name || 'F')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberRole}>{member.relationship_type.replace('_', ' ')}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        member.status === 'CONFIRMED' ? styles.statusBadgeActive : styles.statusBadgePending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          member.status === 'CONFIRMED' ? styles.statusBadgeTextActive : styles.statusBadgeTextPending,
                        ]}
                      >
                        {member.status.toLowerCase()}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </>
          ) : (
            <>
              {/* Generate Invite Button */}
              <Pressable
                style={styles.generateButton}
                onPress={() => {
                  setNewInvite(null);
                  setGenModalVisible(true);
                }}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.generateButtonText}>Generate Invite Code</Text>
              </Pressable>

              {inviteCodes.length === 0 ? (
                <Text style={styles.emptyText}>No invite codes generated yet.</Text>
              ) : (
                inviteCodes.map((code) => {
                  const expired = isExpired(code.expires_at);
                  const used = !!code.used_at;
                  let statusText = 'Active';
                  let statusStyle = styles.codeActive;
                  let statusTextStyle = styles.codeTextActive;

                  if (used) {
                    statusText = 'Used';
                    statusStyle = styles.codeUsed;
                    statusTextStyle = styles.codeTextUsed;
                  } else if (expired) {
                    statusText = 'Expired';
                    statusStyle = styles.codeExpired;
                    statusTextStyle = styles.codeTextExpired;
                  }

                  return (
                    <View key={code.id} style={styles.codeCard}>
                      <View style={styles.codeHeader}>
                        <Text style={styles.codeVal}>{code.code}</Text>
                        <View style={[styles.codeBadge, statusStyle]}>
                          <Text style={[styles.codeBadgeText, statusTextStyle]}>{statusText}</Text>
                        </View>
                      </View>

                      <View style={styles.codeDetails}>
                        <Text style={styles.detailText}>
                          Role: <Text style={styles.detailVal}>{code.relationship_type.replace('_', ' ')}</Text>
                        </Text>
                        <Text style={styles.detailText}>
                          Expires:{' '}
                          <Text style={styles.detailVal}>
                            {new Date(code.expires_at).toLocaleDateString()}
                          </Text>
                        </Text>
                        {used && (
                          <Text style={styles.detailText}>
                            Used:{' '}
                            <Text style={styles.detailVal}>
                              {new Date(code.used_at).toLocaleDateString()}
                            </Text>
                          </Text>
                        )}
                      </View>

                      <View style={styles.codeActions}>
                        <Pressable
                          style={styles.iconButton}
                          onPress={() => handleCopyCode(code.code)}
                        >
                          <Ionicons name="copy-outline" size={16} color="#4B5563" />
                          <Text style={styles.iconButtonText}>Copy</Text>
                        </Pressable>
                        {!used && !expired && (
                          <Pressable
                            style={[styles.iconButton, styles.revokeBtn]}
                            onPress={() => handleRevoke(code.code)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#DC2626" />
                            <Text style={[styles.iconButtonText, styles.revokeText]}>Revoke</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Modal: Generate Invite Code */}
      <Modal
        visible={genModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGenModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate Invite</Text>
              <Pressable onPress={() => setGenModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            {newInvite ? (
              <View style={styles.inviteResultContainer}>
                <Text style={styles.inviteResultSubtitle}>Share this code or QR code with the family member:</Text>
                
                <Text style={styles.inviteBigCode}>{newInvite.code}</Text>

                <MockQrCode code={newInvite.code} />

                <Text style={styles.inviteExpiryNote}>
                  Expires on {new Date(newInvite.expires_at).toLocaleString()}
                </Text>

                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={() => handleCopyCode(newInvite.code)}
                >
                  <Text style={styles.modalPrimaryBtnText}>Copy Code</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.inviteFormContainer}>
                <Text style={styles.formLabel}>Select Family Role:</Text>
                {ROLE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.roleSelectCard,
                      selectedRole === opt.value && styles.roleSelectCardActive,
                    ]}
                    onPress={() => setSelectedRole(opt.value)}
                  >
                    <View style={styles.radioRow}>
                      <View
                        style={[
                          styles.radioCircle,
                          selectedRole === opt.value && styles.radioCircleActive,
                        ]}
                      >
                        {selectedRole === opt.value && <View style={styles.radioDot} />}
                      </View>
                      <Text
                        style={[
                          styles.roleLabel,
                          selectedRole === opt.value && styles.roleLabelActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </View>
                    <Text style={styles.roleDesc}>{opt.desc}</Text>
                  </Pressable>
                ))}

                <Pressable
                  style={[styles.modalPrimaryBtn, generating && { opacity: 0.8 }]}
                  onPress={handleGenerate}
                  disabled={generating}
                >
                  {generating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalPrimaryBtnText}>Generate Invite</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: F.bold,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: F.regular,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: C.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: F.semiBold,
  },
  tabLabelActive: {
    color: C.primary,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontFamily: F.regular,
    marginTop: 32,
    fontSize: 15,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: C.primary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: F.bold,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: F.semiBold,
  },
  memberRole: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: F.regular,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: F.semiBold,
  },
  statusBadgeTextActive: {
    color: '#065F46',
  },
  statusBadgeTextPending: {
    color: '#D97706',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: F.semiBold,
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
    marginBottom: 10,
  },
  codeVal: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    color: C.primary,
    fontFamily: F.bold,
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  codeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: F.semiBold,
  },
  codeActive: {
    backgroundColor: '#E0F2FE',
  },
  codeTextActive: {
    color: '#0369A1',
  },
  codeUsed: {
    backgroundColor: '#D1FAE5',
  },
  codeTextUsed: {
    color: '#065F46',
  },
  codeExpired: {
    backgroundColor: '#F3F4F6',
  },
  codeTextExpired: {
    color: '#6B7280',
  },
  codeDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: F.regular,
    marginBottom: 4,
  },
  detailVal: {
    color: '#374151',
    fontWeight: '500',
    fontFamily: F.medium,
  },
  codeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
    fontFamily: F.medium,
    marginLeft: 4,
  },
  revokeBtn: {
    borderColor: '#FCA5A5',
  },
  revokeText: {
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: F.bold,
  },
  inviteFormContainer: {
    marginTop: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: F.semiBold,
    marginBottom: 12,
  },
  roleSelectCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  roleSelectCardActive: {
    borderColor: C.primary,
    backgroundColor: C.primaryLight,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioCircleActive: {
    borderColor: C.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
  },
  roleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    fontFamily: F.semiBold,
  },
  roleLabelActive: {
    color: C.primary,
  },
  roleDesc: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: F.regular,
    marginLeft: 26,
  },
  modalPrimaryBtn: {
    backgroundColor: C.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: F.semiBold,
  },
  inviteResultContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  inviteResultSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: F.regular,
    textAlign: 'center',
    marginBottom: 16,
  },
  inviteBigCode: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 6,
    color: C.primary,
    fontFamily: F.bold,
    textAlign: 'center',
    marginBottom: 16,
  },
  qrContainer: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  inviteExpiryNote: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: F.regular,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
});
