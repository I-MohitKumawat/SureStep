import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';


import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useTheme } from '../../theme/ThemeContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { AuthStackParams } from '../../types/navigation.types';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<AuthStackParams, 'WelcomeScreen'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { status, firebaseUser, logout, loginDevMode } = useAuth();

  // Mid-onboarding: Firebase session exists but DB profile not yet created
  const isOnboarding = status === 'no_role' || status === 'no_profile';

  return (
    <ScreenContainer
      edges={['top', 'bottom', 'left', 'right']}
      style={styles.container}
    >

      {(theme) => (
        <>

          {/* SKY BACKGROUND */}

          <LinearGradient
            colors={['#57CFF2', '#BFEFFF', theme.colors.background,]}
            locations={[0, 0.45, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradient}
          />

      {/* CONTENT */}
      <View style={styles.content}>

        {/* LOGO AREA */}
        <View style={styles.heroSection}>

          {/* PIN SHAPE */}
          <View style={styles.pinWrapper}>

            {/* Outer PIN */}
            <View style={styles.pinOuter}>

              {/* Inner Dark */}
              <View style={styles.pinInner}>

                {/* FACE */}
                <View style={styles.faceCircle}>
                  <View style={styles.eyesRow}>
                    <View style={styles.eye} />
                    <View style={styles.eye} />
                  </View>

                  <View style={styles.smile} />
                </View>
              </View>
            </View>

            {/* PIN DOT */}
            <View style={styles.pinDot} />
          </View>
          <Text style={styles.brandText}>
            SURESTEP
          </Text>

          <Text style={styles.secondaryText}>
            Your daily care companion
          </Text>
        </View>

        {/* BOTTOM SECTION */}
        <View style={styles.bottomSection}>

          {/* SLANTED SURFACE */}
          <View style={styles.slantBg} />

          {isOnboarding ? (
            // Mid-onboarding: user is Firebase-authenticated but hasn't finished DB setup
            <>
              <Pressable
                onPress={() => status === 'no_role'
                  ? navigation.navigate('RoleSelectionScreen')
                  : navigation.navigate('ProfileSetupScreen', { role: (firebaseUser ? 'PATIENT' : 'PATIENT') as any })
                }
                style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
              >
                <Text style={styles.ctaText}>
                  Continue as{' '}
                  <Text style={{ fontFamily: F.extraBold }}>{firebaseUser?.phoneNumber ?? 'your number'}</Text>
                </Text>
              </Pressable>
              <Pressable onPress={() => logout()} style={styles.signOutLink}>
                <Text style={styles.signOutLinkText}>Sign out / use a different number</Text>
              </Pressable>
            </>
          ) : (
            // Normal: show Sign In and Sign Up
            <>
              <Pressable
                onPress={() => navigation.navigate('PhoneAuthScreen', { mode: 'signin' })}
                style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
              >
                <Text style={styles.ctaText}>Sign In</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('PhoneAuthScreen', { mode: 'signup' })}
                style={({ pressed }) => [styles.ctaButtonOutline, pressed && styles.ctaPressed]}
              >
                <Text style={styles.ctaTextOutline}>Create Account</Text>
              </Pressable>


            </>
          )}

        </View>
      </View>
      </>
    )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
  },

  content: {
    flex: 1,
    justifyContent: 'space-between',
  },

  heroSection: {
    alignItems: 'center',
    paddingTop: 80,
  },

  pinWrapper: {
    alignItems: 'center',
    marginBottom: 35,
  },

  pinOuter: {
    width: 210,
    height: 210,
    borderRadius: 105,

    backgroundColor: '#45C8EE',

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowRadius: 24,
    elevation: 12,
  },

  pinInner: {
    width: 165,
    height: 165,
    borderRadius: 82.5,

    backgroundColor: '#2D2342',

    alignItems: 'center',
    justifyContent: 'center',
  },

  faceCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  eyesRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 12,
  },

  eye: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2D2342',
  },

  smile: {
    width: 40,
    height: 20,

    borderWidth: 6,
    borderTopWidth: 0,
    borderColor: '#2D2342',

    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  pinDot: {
    width: 28,
    height: 28,
    borderRadius: 14,

    backgroundColor: '#45C8EE',

    marginTop: 10,

    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowRadius: 10,
    elevation: 5,
  },

  brandText: {
    fontFamily: F.extraBold,
    fontSize: 28,

    color: '#2D2342',

    letterSpacing: 9,
  },

  bottomSection: {
    position: 'relative',

    paddingHorizontal: 28,
    paddingBottom: 42,
    paddingTop: 120,

    alignItems: 'center',
  },

  slantBg: {
    position: 'absolute',

    top: 40,
    left: -30,
    right: -30,
    bottom: -80,

    backgroundColor: C.primaryLight,

    transform: [{ rotate: '-6deg' }],

    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },

  ctaButton: {
    width: '100%',
    height: 62,

    borderRadius: 31,

    backgroundColor: C.primary,

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: C.primary,
    shadowOpacity: 0.22,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowRadius: 18,
    elevation: 8,

    marginBottom: 18,
  },

  ctaPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.90,
  },

  ctaText: {
    fontFamily: F.bold,
    fontSize: 20,
    letterSpacing: 2,
    color: '#FFFFFF',
  },

  ctaButtonOutline: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  ctaTextOutline: {
    fontFamily: F.bold,
    fontSize: 18,
    letterSpacing: 1.5,
    color: C.primary,
  },

    textWithLink: {
    color: C.primary,
    fontFamily: F.bold,
    textDecorationLine: 'underline',
    textAlign: "center",
  },

  secondaryText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textSecondary,
    textAlign: "center",
  },

  signOutLink: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  signOutLinkText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.primary,
    textDecorationLine: 'underline',
  },


});