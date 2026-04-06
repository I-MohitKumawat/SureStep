import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '../../../packages/ui/theme/ThemeProvider';
import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  const lavender = '#BFA2DB';
  const bg = '#F6F5F8';

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={[styles.shell, { backgroundColor: bg }]}>
      <Pressable
        onPress={() => navigation.replace('PhoneAuth')}
        style={styles.pressableFill}
      >
        {/* Bottom lavender angled base */}
        <View pointerEvents="none" style={[styles.bottomShapeWrap]}>
          <View style={[styles.bottomShape, { backgroundColor: lavender }]} />
        </View>

        <View style={styles.content}>
          <View style={[styles.logoBox, { backgroundColor: lavender }]}>
            <Text style={styles.logoText}>logo</Text>
          </View>

          <Text style={[styles.appName, { color: '#111827' }]}>SURE STEP</Text>
          <Text style={[styles.welcome, { color: '#374151' }]}>Welcome</Text>
        </View>
      </Pressable>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  pressableFill: {
    flex: 1
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 64
  },
  logoBox: {
    width: 104,
    height: 104,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18
  },
  logoText: {
    color: 'rgba(17, 24, 39, 0.75)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2.2,
    marginBottom: 10
  },
  welcome: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3
  },
  bottomShapeWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 280,
    overflow: 'hidden'
  },
  bottomShape: {
    position: 'absolute',
    left: -40,
    right: -40,
    bottom: -80,
    height: 260,
    transform: [{ rotate: '-8deg' }],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24
  }
});

