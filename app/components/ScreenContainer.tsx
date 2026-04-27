import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '../../packages/ui/theme/ThemeProvider';

/** Default: respect bottom + horizontal insets; top inset is handled by stack headers when shown. */
const DEFAULT_EDGES: Edge[] = ['bottom', 'left', 'right'];

type ScreenContainerProps = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Which edges apply safe-area padding (e.g. include `top` when `headerShown: false`). */
  edges?: Edge[];
};

export const ScreenContainer = ({ children, style, edges = DEFAULT_EDGES }: ScreenContainerProps) => {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.safeOuter,
        {
          backgroundColor: theme.colors.background
        }
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md
          },
          style
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeOuter: {
    flex: 1
  },
  inner: {
    flex: 1
  }
});
