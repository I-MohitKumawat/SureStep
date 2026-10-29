/**
 * SureStep — src/screens/family/CareCirclePermissionsScreen.tsx
 * Screen for Care Circle Owner to delegate canonical care permissions to a member.
 *
 * The 4 canonical delegatable permissions:
 *   1. Manage Member Permissions
 *   2. Manage Caregiver Relationships
 *   3. Search/Request Caregivers
 *   4. Manage Patient Memories
 *
 * Safe Zone management and Incident Resolution are non-delegable Owner-only capabilities.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FamilyStackParams } from '../../types/navigation.types';
import {
  listCircleMembers,
  updateMemberPermissions,
  CircleMember,
} from '../../services/careCircleService';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

type Props = NativeStackScreenProps<FamilyStackParams, 'CareCirclePermissionsScreen'>;

interface PermissionItem {
  key: string;
  title: string;
  description: string;
}

const DELEGATABLE_PERMISSIONS: PermissionItem[] = [
  {
    key: 'Search/Request Caregivers',
    title: 'Search & Request Caregivers',
    description: 'Allows searching for verified caregivers and posting care schedule requests.',
  },
  {
    key: 'Manage Caregiver Relationships',
    title: 'Manage Caregiver Contracts',
    description: 'Allows approving care proposals, setting assignments, and managing care agreements.',
  },
  {
    key: 'Manage Patient Memories',
    title: 'Manage Cherished Memories',
    description: 'Allows adding, editing, and deleting photos, videos, and stories for the patient.',
  },
  {
    key: 'Manage Member Permissions',
    title: 'Delegate Circle Permissions',
    description: 'Allows modifying access permissions for non-owner members of this circle.',
  },
];

export const CareCirclePermissionsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { circleId, memberId, memberName } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const fetchMember = async () => {
      try {
        const members = await listCircleMembers(circleId);
        const target = members.find((m) => m.id === memberId);
        if (active && target) {
          setPermissions(target.permissions || []);
        }
      } catch (err) {
        console.warn('Failed to load member permissions:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchMember();
    return () => {
      active = false;
    };
  }, [circleId, memberId]);

  const togglePermission = (permKey: string) => {
    setPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateMemberPermissions(circleId, memberId, permissions);
      Alert.alert('Permissions Updated', `Permissions for ${memberName} have been updated.`);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update permissions.');
    } finally {
      setSaving(false);
    }
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
          <Text style={styles.headerTitle}>Member Permissions</Text>
          <Text style={styles.headerSubtitle}>Configure access for {memberName}</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveHeaderBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving || loading}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#0E7A67" />
          ) : (
            <Text style={styles.saveHeaderText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0E7A67" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Owner Notice Card */}
          <View style={styles.noticeCard}>
            <Ionicons name="information-circle-outline" size={20} color="#0E7A67" />
            <Text style={styles.noticeCardText}>
              Safe Zone configuration and emergency incident resolution are non-delegable and
              remain exclusive to the Care Circle Owner.
            </Text>
          </View>

          {/* Permissions Toggles List */}
          <View style={styles.permList}>
            {DELEGATABLE_PERMISSIONS.map((item) => {
              const isEnabled = permissions.includes(item.key);
              return (
                <View key={item.key} style={styles.permItem}>
                  <View style={styles.permTextWrap}>
                    <Text style={styles.permTitle}>{item.title}</Text>
                    <Text style={styles.permDesc}>{item.description}</Text>
                  </View>
                  <Switch
                    value={isEnabled}
                    onValueChange={() => togglePermission(item.key)}
                    trackColor={{ false: '#E5E0D8', true: '#0E7A67' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              );
            })}
          </View>

          {/* Primary Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Permissions</Text>
            )}
          </TouchableOpacity>
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
  saveHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveHeaderText: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#0E7A67',
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
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF5F3',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  noticeCardText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#0E7A67',
    flex: 1,
    lineHeight: 18,
  },
  permList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    overflow: 'hidden',
    marginBottom: 24,
  },
  permItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  permTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  permTitle: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#161E1C',
    marginBottom: 4,
  },
  permDesc: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    lineHeight: 17,
  },
  saveBtn: {
    backgroundColor: '#0E7A67',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
