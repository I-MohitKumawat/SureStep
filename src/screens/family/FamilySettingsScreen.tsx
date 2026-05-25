import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export const FamilySettingsScreen: React.FC = () => (
  <View style={s.wrap}>
    <Text style={s.emoji}>🚧</Text>
    <Text style={s.title}>FamilySettingsScreen</Text>
    <Text style={s.sub}>Coming soon</Text>
  </View>
);
const s = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F5F5' },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  sub:   { fontSize: 14, color: '#6B7280' },
});
