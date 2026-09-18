/**
 * SureStep — src/navigation/RoleNavigator.tsx
 * Reads auth status and mounts the correct role-scoped navigator tree.
 * TDD Section 3.3.
 *
 * Replaces the monolithic RootNavigator. A patient can NEVER navigate to
 * a caregiver screen because those routes do not exist in their navigator.
 */
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator }      from './AuthNavigator';
import { PatientNavigator }   from './PatientNavigator';
import { CaregiverNavigator } from './CaregiverNavigator';
import { FamilyNavigator }    from './FamilyNavigator';
import { DoctorNavigator }    from './DoctorNavigator';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';

export const RoleNavigator: React.FC = () => {
  const {
    status,
    user,
    activeRole,
    networkError,
    networkErrorMessage,
    isRetrying,
    retryAuth,
    logout,
  } = useAuth();

  const [loadDuration, setLoadDuration] = useState(0);

  useEffect(() => {
    if (status !== 'loading' || networkError) {
      setLoadDuration(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status, networkError]);

  // Still loading stored tokens or resolving backend session
  if (status === 'loading') {
    if (networkError) {
      return (
        <View style={s.container}>
          <View style={s.card}>
            <View style={s.iconBubble}>
              <Text style={s.iconText}>⚠️</Text>
            </View>
            <Text style={s.title}>Connection Delayed</Text>
            <Text style={s.subtitle}>
              We verified your phone number, but could not load your SureStep account from the server.
            </Text>

            {networkErrorMessage ? (
              <View style={s.badge}>
                <Text style={s.badgeText}>{networkErrorMessage}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={retryAuth}
              disabled={isRetrying}
              style={({ pressed }) => [
                s.retryBtn,
                isRetrying && s.retryBtnDisabled,
                pressed && !isRetrying && s.retryBtnPressed,
              ]}
            >
              {isRetrying ? (
                <View style={s.btnInner}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={s.retryBtnText}>Retrying Connection...</Text>
                </View>
              ) : (
                <Text style={s.retryBtnText}>Retry Connection</Text>
              )}
            </Pressable>

            <Pressable
              onPress={logout}
              disabled={isRetrying}
              style={({ pressed }) => [
                s.secondaryBtn,
                pressed && s.secondaryBtnPressed,
              ]}
            >
              <Text style={s.secondaryBtnText}>Sign Out / Switch Account</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    // Active connecting phase (NOT in error)
    let loadingMessage = 'Signing you in...';
    if (loadDuration >= 12) {
      loadingMessage = 'Waking up secure services...\nThank you for your patience.';
    } else if (loadDuration >= 5) {
      loadingMessage = 'Connecting to SureStep server...';
    }

    return (
      <View style={s.container}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={s.activeLoadingText}>{loadingMessage}</Text>
      </View>
    );
  }

  if (status === 'unauthenticated' || status === 'no_role' || status === 'no_profile') {
    return <AuthNavigator />;
  }

  // status === 'authenticated': resolve role from backend domain context first, fallback to user.role
  const resolvedRole = (activeRole && activeRole !== 'NEW_USER' ? activeRole : user?.role);
  console.log(`[RoleNavigator] Mounting navigator for resolvedRole: "${resolvedRole}", status: "${status}"`);

  switch (resolvedRole) {
    case 'PATIENT':   return <PatientNavigator />;
    case 'CAREGIVER': return <CaregiverNavigator />;
    case 'FAMILY':    return <FamilyNavigator />;
    case 'DOCTOR':    return <DoctorNavigator />;
    default:          return <AuthNavigator />;
  }
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    paddingHorizontal: 24,
  },
  activeLoadingText: {
    fontFamily: F.medium,
    fontSize: 15,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 22,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    fontFamily: F.bold,
    fontSize: 18,
    color: C.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    marginBottom: 20,
  },
  badgeText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#B91C1C',
  },
  retryBtn: {
    width: '100%',
    height: 48,
    backgroundColor: C.primary,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  retryBtnDisabled: {
    opacity: 0.7,
  },
  retryBtnPressed: {
    backgroundColor: C.primaryDark,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.borderMid,
  },
  secondaryBtnPressed: {
    backgroundColor: C.surfaceAlt,
  },
  secondaryBtnText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textSecondary,
  },
});
