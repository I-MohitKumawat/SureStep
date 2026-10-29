/**
 * SureStep — src/screens/family/CreateCareCircleScreen.tsx
 * Allows a family user to create a new Care Circle.
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
import { createCareCircle } from '../../services/careCircleService';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

type Props = NativeStackScreenProps<FamilyStackParams, 'CreateCareCircleScreen'>;

export const CreateCareCircleScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { reloadFamilyData, setActiveCircleId } = useFamilyContext();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter a name for your Care Circle.');
      return;
    }

    try {
      setSubmitting(true);
      const newCircle = await createCareCircle(trimmed);
      if (newCircle?.id) {
        setActiveCircleId(newCircle.id);
      }
      await reloadFamilyData();
      Alert.alert('Circle Created', `"${trimmed}" has been created successfully.`);
      navigation.goBack();
    } catch (err: any) {
      const errCode = err?.response?.data?.code || err?.code || '';
      const errMsg = err?.response?.data?.error || err?.message || '';
      if (
        errCode === 'ACTIVE_CIRCLE_EXISTS' ||
        errMsg.includes('already') ||
        errMsg.includes('active Care Circle') ||
        errMsg.includes('active Circle')
      ) {
        await reloadFamilyData();
        Alert.alert('Active Circle Loaded', 'Your active Care Circle has been retrieved.');
        navigation.goBack();
      } else {
        Alert.alert('Error', errMsg || 'Failed to create Care Circle.');
      }
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
          <Text style={styles.headerTitle}>Create Care Circle</Text>
          <Text style={styles.headerSubtitle}>Set up a trusted circle for your family</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Circle Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Ramesh’s Care Circle, Patel Family"
          placeholderTextColor="#8A9592"
          autoFocus
        />

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#0E7A67" />
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoTitle}>Owner Authority</Text>
            <Text style={styles.infoDesc}>
              As creator, you will be the Circle Owner. You will be able to configure Safe Zones,
              invite family & caregivers, and delegate care permissions.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createBtn, submitting && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.createBtnText}>Create Circle</Text>
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
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: F.medium,
    fontSize: 15,
    color: '#161E1C',
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EBF5F3',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 28,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#0E7A67',
    marginBottom: 2,
  },
  infoDesc: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    lineHeight: 18,
  },
  createBtn: {
    backgroundColor: '#0E7A67',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
