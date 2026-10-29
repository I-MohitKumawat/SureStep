/**
 * SureStep — src/screens/family/JoinCareCircleScreen.tsx
 * Screen for entering a 6-digit invitation code to join an existing Care Circle.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FamilyStackParams } from '../../types/navigation.types';
import { useFamilyContext } from '../../context/FamilyContext';
import { redeemCircleInvite } from '../../services/careCircleService';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

type Props = NativeStackScreenProps<any>;

export const JoinCareCircleScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { reloadFamilyData } = useFamilyContext();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleJoin = async () => {
    const trimmed = code.trim();
    if (!/^[0-9]{6}$/.test(trimmed)) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit invitation code.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await redeemCircleInvite(trimmed);
      try {
        await reloadFamilyData();
      } catch (_) {}
      Alert.alert(
        'Request Submitted',
        res?.message || 'Your request to join the Care Circle has been submitted to the Circle Owner for approval.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Invalid or expired invitation code.';
      Alert.alert('Unable to Join', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
          <Text style={styles.headerTitle}>Join Care Circle</Text>
          <Text style={styles.headerSubtitle}>Enter 6-digit invite code</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>6-Digit Code</Text>
        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={(val) => setCode(val.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="123456"
          placeholderTextColor="#8A9592"
          maxLength={6}
          keyboardType="number-pad"
          autoCorrect={false}
          autoFocus
        />

        <Text style={styles.hint}>
          Ask the Care Circle Owner for their 6-digit invitation code. Codes are valid for 72 hours.
        </Text>

        <TouchableOpacity
          style={[styles.joinBtn, (submitting || code.trim().length !== 6) && { opacity: 0.6 }]}
          onPress={handleJoin}
          disabled={submitting || code.trim().length !== 6}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.joinBtnText}>Submit Join Request</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  codeInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: F.bold,
    fontSize: 24,
    color: '#0E7A67',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 12,
  },
  hint: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    lineHeight: 18,
    marginBottom: 28,
  },
  joinBtn: {
    backgroundColor: '#0E7A67',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
