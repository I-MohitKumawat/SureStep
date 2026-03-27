import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';

import { useTheme } from '../../../packages/ui/theme/ThemeProvider';

import { useUserProfile } from '../context/userProfileContext';
import { ScreenContainer } from '../components/ScreenContainer';
import ProfileForm from '../components/ProfileForm';

export default function ProfileEdit({ navigation }) {
  const { activeRole, profileLoading, profile, saveProfile } = useUserProfile();
  const theme = useTheme();

  const role = profile?.role ?? activeRole;

  const formRef = React.useRef(null);
  const initials = profile?.fullName ? profile.fullName.trim().slice(0, 1).toUpperCase() : 'U';

  if (profileLoading) {
    return (
      <ScreenContainer>
        <Text>Loading…</Text>
      </ScreenContainer>
    );
  }

  if (!profile) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.topBackButton, { borderColor: theme.colors.borderSubtle }, pressed && { opacity: 0.85 }]}
          >
            <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>Back</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Profile not set up
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Start profile setup to edit your profile.
          </Text>
          <Pressable
            onPress={() => navigation.replace('ProfileSetup')}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.85 }
            ]}
          >
            <Text style={styles.primaryButtonText}>
              Start setup
            </Text>
          </Pressable>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderSubtle }]}>
            <View style={styles.topBar}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.85 }]}
              >
                <Text style={{ color: theme.colors.textPrimary, fontSize: 20 }}>←</Text>
              </Pressable>
              <Text style={[styles.editTitle, { color: theme.colors.textPrimary }]}>Edit Profile</Text>
              <Pressable
                onPress={() => formRef.current?.submit?.()}
                style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.85 }]}
              >
                <Text style={{ color: theme.colors.accent, fontSize: 20 }}>✓</Text>
              </Pressable>
            </View>

            <View style={styles.avatarWrap}>
              <View style={styles.avatarBox}>
                <View style={[styles.avatarCircle, { borderColor: theme.colors.borderSubtle }]}>
                  <Text style={[styles.avatarText, { color: theme.colors.textPrimary }]}>{initials}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Change profile photo"
                  onPress={() => {
                    // Photo editing not wired yet.
                  }}
                  style={({ pressed }) => [
                    styles.cameraButton,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.borderSubtle
                    },
                    pressed && { opacity: 0.85 }
                  ]}
                >
                  <View style={styles.cameraGlyph} pointerEvents="none">
                    <View style={styles.cameraTop} />
                    <View style={styles.cameraBody}>
                      <View style={styles.cameraLens} />
                    </View>
                  </View>
                </Pressable>
              </View>
            </View>

            <ProfileForm
              ref={formRef}
              role={role}
              initialValues={profile}
              showSubmitButton={false}
              onSubmit={async (draft) => {
                const saved = await saveProfile(draft);
                if (!saved) return;
                navigation.replace('ProfileView');
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  topBackButton: {
    alignSelf: 'flex-start',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    color: '#4b5563'
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '800'
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 22,
    fontWeight: '800'
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '800'
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    marginTop: 2
  },
  avatarBox: {
    position: 'relative',
    width: 86,
    height: 86
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800'
  },
  cameraButton: {
    position: 'absolute',
    // Anchor to the avatar container's south-east corner.
    // Negative offset makes the icon overlap the avatar by ~25% of its diameter.
    right: -8,
    bottom: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  cameraGlyph: {
    width: 18,
    height: 18
  },
  cameraTop: {
    position: 'absolute',
    left: 4,
    top: 2,
    width: 6,
    height: 3,
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 1,
    backgroundColor: 'transparent'
  },
  cameraBody: {
    position: 'absolute',
    left: 2,
    top: 5,
    width: 14,
    height: 10,
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  cameraLens: {
    width: 5,
    height: 5,
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 3,
    backgroundColor: 'transparent'
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10
  }
});

