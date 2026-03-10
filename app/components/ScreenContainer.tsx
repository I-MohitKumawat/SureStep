import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../packages/ui/theme/ThemeProvider';

type ScreenContainerProps = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export const ScreenContainer = ({ children, style }: ScreenContainerProps) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md
        },
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});

