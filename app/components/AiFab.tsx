import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import type { HomeStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

/**
 * Centre FAB shown in every patient screen's bottom nav.
 * Navigates to AskAi screen on press — navigation is handled internally
 * via useNavigation so no prop threading is needed.
 */
export const AiFab: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  const navigation = useNavigation<Nav>();

  const handlePress = () => {
    if (onPress) { onPress(); return; }
    navigation.navigate('AskAi');
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      accessibilityLabel="Ask AI"
      accessibilityRole="button"
    >
      {/* Gemini-style 2×2 sparkle cluster */}
      <View style={styles.sparkleGrid}>
        <Text style={styles.sparkBig}>✦</Text>
        <Text style={styles.sparkSmall}>✦</Text>
        <Text style={styles.sparkSmall}>✦</Text>
        <Text style={styles.sparkTiny}>✦</Text>
      </View>
      <Text style={styles.label}>Ask AI</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderColor: C.surface,
    shadowColor: C.primary,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 14,
  },
  fabPressed: { transform: [{ scale: 0.92 }], opacity: 0.9 },
  sparkleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 28,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  sparkBig:   { fontSize: 13, color: '#fff', lineHeight: 14 },
  sparkSmall: { fontSize: 10, color: 'rgba(255,255,255,0.85)', lineHeight: 11 },
  sparkTiny:  { fontSize: 7,  color: 'rgba(255,255,255,0.60)', lineHeight: 8 },
  label: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#fff',
    letterSpacing: 0.5,
    marginTop: 3,
  },
});
