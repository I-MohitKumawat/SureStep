import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { F } from '../../theme/fonts';

export type AlertProgressStatus = 'new' | 'acknowledged' | 'responding' | 'resolved';

interface StatusProgressionProps {
  status: AlertProgressStatus;
  themeColor: string; // The primary color for active states (e.g., urgent: red, warning: orange, resolved: teal)
}

export const StatusProgression: React.FC<StatusProgressionProps> = ({ status, themeColor }) => {
  const steps = [
    { key: 'new', label: 'New' },
    { key: 'acknowledged', label: 'Acknowledged' },
    { key: 'responding', label: 'Responding' },
    { key: 'resolved', label: 'Resolved' },
  ];

  // Determine active step index
  const getActiveIndex = () => {
    switch (status) {
      case 'new': return 0;
      case 'acknowledged': return 1;
      case 'responding': return 2;
      case 'resolved': return 3;
      default: return 0;
    }
  };

  const activeIndex = getActiveIndex();

  return (
    <View style={styles.container}>
      {/* Segmented Progress Lines */}
      <View style={styles.linesRow}>
        {steps.map((step, index) => {
          const isActive = index <= activeIndex;
          return (
            <View
              key={`line-${step.key}`}
              style={[
                styles.segmentLine,
                isActive ? { backgroundColor: themeColor } : styles.segmentLineInactive,
              ]}
            />
          );
        })}
      </View>

      {/* Labels Row */}
      <View style={styles.labelsRow}>
        {steps.map((step, index) => {
          const isActive = index <= activeIndex;
          return (
            <Text
              key={`label-${step.key}`}
              style={[
                styles.label,
                isActive ? [styles.labelActive, { color: themeColor }] : styles.labelInactive,
              ]}
            >
              {step.label}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  linesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 6,
  },
  segmentLine: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  segmentLineInactive: {
    backgroundColor: '#E5E7EB', // light gray
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    letterSpacing: 0.1,
  },
  labelActive: {
    fontFamily: F.bold,
  },
  labelInactive: {
    fontFamily: F.regular,
    color: '#9CA3AF', // muted gray
  },
});
