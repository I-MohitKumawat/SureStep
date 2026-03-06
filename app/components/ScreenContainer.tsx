import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

type ScreenContainerProps = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export const ScreenContainer: React.FC<ScreenContainerProps> = ({ children, style }) => {
  return <View style={[styles.container, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff'
  }
});

