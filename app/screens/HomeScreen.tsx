import React from 'react';
import { Button, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <ScreenContainer>
      <Text style={styles.heading}>Home</Text>
      <Text style={styles.body}>
        This is the initial SureStep mobile app shell. Navigation, roles, and feature modules will
        be wired in future tasks.
      </Text>
      <Button title="Go to details" onPress={() => navigation.navigate('Details')} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#111827'
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563'
  }
});

