/**
 * SureStep — src/screens/family/CareCircleInviteScreen.tsx
 * Screen for generating and sharing 6-digit Care Circle invitation codes.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FamilyStackParams } from '../../types/navigation.types';
import { generateCircleInvite } from '../../services/careCircleService';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

type Props = NativeStackScreenProps<FamilyStackParams, 'CareCircleInviteScreen'>;

export const CareCircleInviteScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { circleId } = route.params;

  const [role, setRole] = useState<'MEMBER' | 'CAREGIVER'>('MEMBER');
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (selectedRole = role) => {
    try {
      setGenerating(true);
      const res = await generateCircleInvite(circleId, selectedRole);
      setCode(res.code);
      setExpiresAt(res.expires_at);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to generate invitation code.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    void handleGenerate();
  }, [circleId]);

  const handleShare = async () => {
    if (!code) return;
    try {
      await Share.share({
        message: `Join my Care Circle on SureStep using invite code: ${code}. This code is valid for 72 hours.`,
      });
    } catch (err) {
      console.warn('Share error:', err);
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
          <Text style={styles.headerTitle}>Invite to Care Circle</Text>
          <Text style={styles.headerSubtitle}>Generate a 6-digit access code</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Role to Invite</Text>
        <View style={styles.roleToggleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'MEMBER' && styles.roleBtnActive]}
            onPress={() => {
              setRole('MEMBER');
              handleGenerate('MEMBER');
            }}
          >
            <Ionicons
              name="people-outline"
              size={18}
              color={role === 'MEMBER' ? '#0E7A67' : '#52605D'}
            />
            <Text style={[styles.roleBtnText, role === 'MEMBER' && styles.roleBtnTextActive]}>
              Family Member
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleBtn, role === 'CAREGIVER' && styles.roleBtnActive]}
            onPress={() => {
              setRole('CAREGIVER');
              handleGenerate('CAREGIVER');
            }}
          >
            <Ionicons
              name="medkit-outline"
              size={18}
              color={role === 'CAREGIVER' ? '#0E7A67' : '#52605D'}
            />
            <Text style={[styles.roleBtnText, role === 'CAREGIVER' && styles.roleBtnTextActive]}>
              Caregiver
            </Text>
          </TouchableOpacity>
        </View>

        {/* Code Display Box */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Invitation Code</Text>
          {generating ? (
            <ActivityIndicator size="large" color="#0E7A67" style={{ marginVertical: 16 }} />
          ) : (
            <Text style={styles.codeText}>{code || '------'}</Text>
          )}

          <Text style={styles.expiryText}>
            {expiresAt
              ? `Expires in 72 hours (${new Date(expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})`
              : 'Single-use code • 72-hour validity'}
          </Text>
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={18} color="#0E7A67" style={{ marginTop: 2 }} />
          <Text style={styles.noteCardText}>
            Patients, caregivers, and family members can enter this 6-digit code in their SureStep app. Once submitted, you'll see a join request under the People tab to accept them into your Care Circle.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.shareBtn, !code && { opacity: 0.6 }]}
          onPress={handleShare}
          disabled={!code || generating}
        >
          <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
          <Text style={styles.shareBtnText}>Share Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.regenerateBtn}
          onPress={() => handleGenerate()}
          disabled={generating}
        >
          <Ionicons name="refresh-outline" size={16} color="#0E7A67" />
          <Text style={styles.regenerateBtnText}>Generate New Code</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    padding: 20,
  },
  label: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#161E1C',
    marginBottom: 8,
  },
  roleToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    gap: 8,
  },
  roleBtnActive: {
    borderColor: '#0E7A67',
    backgroundColor: '#EBF5F3',
  },
  roleBtnText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#52605D',
  },
  roleBtnTextActive: {
    color: '#0E7A67',
    fontFamily: F.semiBold,
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
  },
  codeLabel: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#8A9592',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeText: {
    fontFamily: F.bold,
    fontSize: 36,
    color: '#0E7A67',
    letterSpacing: 6,
    marginVertical: 12,
  },
  expiryText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E7A67',
    borderRadius: 12,
    paddingVertical: 15,
    gap: 8,
    marginBottom: 12,
  },
  shareBtnText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  regenerateBtnText: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#0E7A67',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF5F3',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  noteCardText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#0E7A67',
    flex: 1,
    lineHeight: 18,
  },
});
