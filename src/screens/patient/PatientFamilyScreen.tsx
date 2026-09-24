import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { fetchMyFamily, type FamilyMemberItem } from '../../services/relationshipService';

function formatRelationshipType(type: string): string {
  switch (type) {
    case 'FAMILY_CLOSE':
      return 'Close Family';
    case 'FAMILY_EXTENDED':
      return 'Family Member';
    case 'GUARDIAN':
      return 'Primary Guardian';
    default:
      return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export const PatientFamilyScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const [members, setMembers] = useState<FamilyMemberItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFamily = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMyFamily();
      setMembers(data);
    } catch (err) {
      console.warn('[PatientFamilyScreen] loadFamily failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      void loadFamily();
    }
  }, [isFocused, loadFamily]);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadFamily} colors={[C.primary]} tintColor={C.primary} />
        }
      >
        {/* -- Header --------------------------------------------------- */}
        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerOverline}>CARE CIRCLE</Text>
            <Text style={styles.headerTitle}>Your Family</Text>
          </View>
        </View>

        {/* -- Content -------------------------------------------------- */}
        {loading && members.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>Loading family members...</Text>
          </View>
        ) : members.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.iconCircleTeal}>
              <Ionicons name="people-outline" size={38} color={C.primary} />
            </View>
            <Text style={styles.emptyTitle}>No family members connected yet</Text>
            <Text style={styles.emptyDescription}>
              Your family members can connect to your care circle using an invite code to stay updated on your daily well-being.
            </Text>
            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color={C.primary} style={{ marginTop: 1 }} />
              <Text style={styles.infoBoxText}>
                When family members link their account, you will see them here with their contact details.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <View style={styles.subtleNoticeBanner}>
              <Ionicons name="shield-checkmark" size={15} color={C.primary} style={{ marginRight: 6 }} />
              <Text style={styles.subtleNoticeText}>
                These family members have access to your safety check-ins and care updates.
              </Text>
            </View>

            {members.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberHeaderRow}>
                  <View style={styles.avatarWrap}>
                    {member.photo_url ? (
                      <Image source={{ uri: member.photo_url }} style={styles.avatarImage} />
                    ) : (
                      <Ionicons name="person-circle" size={54} color={C.primary} />
                    )}
                  </View>

                  <View style={styles.memberMeta}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberRole}>{formatRelationshipType(member.relationship_type)}</Text>
                  </View>

                  <View style={styles.connectedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#065F46" style={{ marginRight: 3 }} />
                    <Text style={styles.connectedBadgeText}>Connected</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 96,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  headerOverline: {
    fontFamily: F.bold,
    fontSize: 11,
    color: C.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 24,
    color: C.textPrimary,
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    alignItems: 'center',
  },
  iconCircleTeal: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: C.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  emptyDescription: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  infoBoxText: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 12.5,
    color: '#166534',
    lineHeight: 18,
  },
  listContainer: {
    gap: 12,
  },
  subtleNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 4,
  },
  subtleNoticeText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#166534',
    flex: 1,
  },
  memberCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  memberHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  memberMeta: {
    flex: 1,
  },
  memberName: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.textPrimary,
  },
  memberRole: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  connectedBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 11,
    color: '#065F46',
  },
});
