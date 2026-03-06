import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';

export const HomeScreen: React.FC = () => {
  return (
    <ScreenContainer>
      <Text style={styles.heading}>Home</Text>
      <Text style={styles.body}>
        This is the initial SureStep mobile app shell. Navigation, roles, and feature modules will
        be wired in future tasks.
      </Text>
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

