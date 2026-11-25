import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/ThemeContext';

/** Default: respect bottom + horizontal insets; top inset is handled by stack headers when shown. */
const DEFAULT_EDGES: Edge[] = ['bottom', 'left', 'right'];

type ScreenContainerProps = {
  children: ReactNode | ((theme: any) => ReactNode);
  style?: ViewStyle | ViewStyle[];
  className?: string;
  /** Which edges apply safe-area padding (e.g. include `top` when `headerShown: false`). */
  edges?: Edge[];
};

export const ScreenContainer = ({ children, style, className, edges = DEFAULT_EDGES }: ScreenContainerProps) => {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[
        { flex: 1 },
        {
          backgroundColor: theme.colors.background
        }
      ]}
    >
      <View
        className={`flex-1 ${className ?? ''}`}
        style={[
          {
            flex: 1,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md
          },
          style
        ]}
      >
        {typeof children === 'function'
          ? children(theme)
          : children}
      </View>
    </SafeAreaView>
  );
};
