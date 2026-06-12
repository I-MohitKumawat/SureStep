import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
export const InviteAcceptScreen: React.FC = () => (
  <View style={s.wrap}>
    <Ionicons name="construct-outline" size={48} color="#6B7280" style={{ marginBottom: 16 }} />
    <Text style={s.title}>InviteAcceptScreen</Text>
    <Text style={s.sub}>Coming soon</Text>
  </View>
);
const s = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F5F5' },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  sub:   { fontSize: 14, color: '#6B7280' },
});
