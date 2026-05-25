import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export const OrientationCheckGame: React.FC = () => (
  <View style={s.wrap}><Text style={s.t}>Orientation Check</Text><Text>Coming soon</Text></View>
);
const s = StyleSheet.create({ wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' }, t: { fontSize: 20, fontWeight: '700', marginBottom: 8 } });
