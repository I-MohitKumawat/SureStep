import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  size: number;
  outer: number;
  middle: number;
  inner: number;
  centerLabel: 'Stable' | 'At Risk';
  accent: string;
  track: string;
  warning: string;
};

function RingArc({
  size,
  radius,
  stroke,
  progress,
  color,
  trackColor
}: {
  size: number;
  radius: number;
  stroke: number;
  progress: number;
  color: string;
  trackColor: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <>
      <Circle cx={cx} cy={cy} r={radius} stroke={trackColor} strokeWidth={stroke} fill="none" />
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={dash}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </>
  );
}

export function ConcentricRings({
  size,
  outer,
  middle,
  inner,
  centerLabel,
  accent,
  track,
  warning
}: Props) {
  const stroke = 5;
  const rOuter = size * 0.38;
  const rMid = size * 0.28;
  const rInner = size * 0.18;
  const colorMid = middle < 0.55 ? warning : accent;
  const colorInner = inner < 0.45 ? warning : accent;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <RingArc
          size={size}
          radius={rOuter}
          stroke={stroke}
          progress={outer}
          color={accent}
          trackColor={track}
        />
        <RingArc
          size={size}
          radius={rMid}
          stroke={stroke}
          progress={middle}
          color={colorMid}
          trackColor={track}
        />
        <RingArc
          size={size}
          radius={rInner}
          stroke={stroke}
          progress={inner}
          color={colorInner}
          trackColor={track}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.centerLabel, { color: centerLabel === 'At Risk' ? warning : accent }]}>{centerLabel}</Text>
        <Text style={styles.legend}>7d · tasks · engagement</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  },
  centerLabel: {
    fontSize: 15,
    fontWeight: '700'
  },
  legend: {
    marginTop: 2,
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center'
  }
});
