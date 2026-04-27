import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';

type Props = NativeStackScreenProps<HomeStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.shell}>
      <View style={styles.fill}>
        {/* Teal angled base at bottom */}
        <View pointerEvents="none" style={styles.bottomShapeWrap}>
          <View style={styles.bottomShape} />
        </View>

        <View style={styles.content}>
          {/* Logo mark */}
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>👣</Text>
          </View>

          <Text style={styles.appName}>SURE STEP</Text>
          <Text style={styles.tagline}>Your daily care companion</Text>

          <Pressable
            onPress={() => navigation.navigate('PhoneAuth')}
            style={({ pressed }) => [styles.proceedButton, pressed && styles.proceedButtonPressed]}
          >
            <Text style={styles.proceedText}>Get Started</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  shell: {
    backgroundColor: C.bg,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  fill: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 120,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: C.primary,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  logoIcon: { fontSize: 42 },
  appName: {
    fontFamily: F.extraBold,
    fontSize: 26,
    color: C.textPrimary,
    letterSpacing: 3,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: F.regular,
    fontSize: 15,
    color: C.textSecondary,
    marginBottom: 40,
    letterSpacing: 0.2,
  },
  proceedButton: {
    backgroundColor: C.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  proceedButtonPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  proceedText: {
    fontFamily: F.bold,
    fontSize: 17,
    color: C.primaryText,
    letterSpacing: 0.3,
  },
  bottomShapeWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 260,
    overflow: 'hidden',
  },
  bottomShape: {
    position: 'absolute',
    left: -40,
    right: -40,
    bottom: -80,
    height: 240,
    transform: [{ rotate: '-7deg' }],
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: C.primaryLight,
  },
});
