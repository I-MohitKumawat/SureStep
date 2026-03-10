import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';

export const DetailsScreen: React.FC = () => {
  return (
    <ScreenContainer>
      <Text style={styles.heading}>Details</Text>
      <Text style={styles.body}>Placeholder detail screen for stack navigation.</Text>
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

