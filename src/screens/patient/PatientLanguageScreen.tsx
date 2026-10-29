import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../theme/ThemeContext';
import { F } from '../../theme/fonts';
import { C } from '../../theme/colors';
import { updateMe } from '../../services/userService';
import type { PatientStackParams } from '../../types/navigation.types';
import { HomeHeader } from '../../components/patient/home/HomeHeader';

type Props = NativeStackScreenProps<PatientStackParams, 'PatientLanguageScreen'>;

interface LanguageOption {
  code: string;
  name: string;
  nativeName?: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'English', name: 'English' },
  { code: 'Hindi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'Kannada', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'Tamil', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'Telugu', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'Malayalam', name: 'Malayalam', nativeName: 'മലയാളം' },
];

export const PatientLanguageScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode } = useTheme();
  const { user, refreshUser } = useAuth();
  const isDark = mode === 'dark';

  const patientId = user?.id || null;
  const currentLang = user?.preferred_language || (user as any)?.language || 'English';

  const [selectedCode, setSelectedCode] = useState<string>(currentLang);
  const [saving, setSaving] = useState(false);

  const handleSelectLanguage = async (lang: LanguageOption) => {
    if (saving || lang.code === selectedCode) return;

    setSelectedCode(lang.code);
    setSaving(true);
    try {
      await updateMe({ preferred_language: lang.code });
      if (refreshUser) {
        await refreshUser();
      }
    } catch (err: any) {
      console.warn('[PatientLanguageScreen] Failed to save preferred language:', err);
      Alert.alert(
        'Language Update Notice',
        'Could not save your language preference to your account. Please check your network connection.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 8) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header + SOS */}
        <HomeHeader patientId={patientId} showSettings={false} />

        {/* Back Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back to Settings"
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={isDark ? '#F5F7F6' : '#161E1C'}
            />
            <Text style={[styles.backBtnText, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
              Settings
            </Text>
          </Pressable>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
            Language
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9EABA7' : '#52605D' }]}>
            Choose your preferred display language
          </Text>
        </View>

        {/* Language Options List */}
        <View
          style={[
            styles.listContainer,
            {
              backgroundColor: isDark ? '#1C2422' : '#FFFFFF',
              borderColor: isDark ? '#2C3835' : '#E5E0D8',
            },
          ]}
        >
          {SUPPORTED_LANGUAGES.map((lang, index) => {
            const isSelected = selectedCode.toLowerCase() === lang.code.toLowerCase();
            const isLast = index === SUPPORTED_LANGUAGES.length - 1;

            return (
              <React.Fragment key={lang.code}>
                <Pressable
                  onPress={() => handleSelectLanguage(lang)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${lang.name} ${lang.nativeName || ''}`}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <View style={styles.langNameContainer}>
                    <Text
                      style={[
                        styles.langName,
                        { color: isDark ? '#F5F7F6' : '#161E1C' },
                      ]}
                    >
                      {lang.name}
                    </Text>
                    {lang.nativeName ? (
                      <Text
                        style={[
                          styles.langNative,
                          { color: isDark ? '#9EABA7' : '#52605D' },
                        ]}
                      >
                        {lang.nativeName}
                      </Text>
                    ) : null}
                  </View>

                  {/* Selection Indicator */}
                  <View style={styles.checkContainer}>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={24} color={C.primary} />
                    ) : (
                      <View
                        style={[
                          styles.unselectedCircle,
                          { borderColor: isDark ? '#3D4A46' : '#D1D5DB' },
                        ]}
                      />
                    )}
                  </View>
                </Pressable>

                {!isLast && (
                  <View
                    style={[
                      styles.rowDivider,
                      { backgroundColor: isDark ? '#2C3835' : '#E5E0D8' },
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {saving && (
          <View style={styles.savingRow}>
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={[styles.savingText, { color: isDark ? '#9EABA7' : '#52605D' }]}>
              Saving preference...
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 8,
  },
  backBtnText: {
    fontFamily: F.medium,
    fontSize: 16,
    marginLeft: 2,
  },
  titleSection: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  title: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 15,
    marginTop: 4,
  },
  listContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  langNameContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  langName: {
    fontFamily: F.semiBold,
    fontSize: 17,
  },
  langNative: {
    fontFamily: F.regular,
    fontSize: 15,
  },
  checkContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  rowDivider: {
    height: 1,
    marginLeft: 18,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  savingText: {
    fontFamily: F.medium,
    fontSize: 13,
  },
});
