import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../packages/ui/theme/ThemeProvider';

type Props = {
  values: number[];
  /** 0–100 */
  max?: number;
};

export function Sparkline({ values, max = 100 }: Props) {
  const theme = useTheme();
  const heights = values.map((v) => Math.max(4, (v / max) * 36));

  return (
    <View style={styles.row}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            i < heights.length - 1 ? styles.barSpacing : null,
            {
              height: h,
              backgroundColor: theme.colors.accent,
              opacity: 0.35 + (i / Math.max(1, heights.length - 1)) * 0.55
            }
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 40
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 4
  },
  barSpacing: {
    marginRight: 4
  }
});
