import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

/** Decorative layers never consume layout space or intercept touches. */
export function CareBackground({ background = '#FAF8F5', height = 280 }: { background?: string; height?: number }) {
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      <LinearGradient
        colors={['#57CFF2', '#BFEFFF', background]}
        locations={[0, 0.45, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}
      />
      <View className="absolute -right-[38px] top-[12px] h-[148px] w-[148px] rounded-full bg-white/15" />
      <View className="absolute -right-[13px] top-[37px] h-[98px] w-[98px] rounded-full border border-white/40" />
    </View>
  );
}

export function CareFooterBackground() {
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      <Svg width="100%" height="100%" viewBox="0 0 360 100" preserveAspectRatio="none">
        <Path d="M0 24 C65 8 113 25 181 14 C255 2 320 -5 360 18 V100 H0Z" fill="#B1F3DA" />
        <Path d="M0 37 C85 14 150 34 232 21 S330 17 360 12" fill="none" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={1} />
      </Svg>
    </View>
  );
}
