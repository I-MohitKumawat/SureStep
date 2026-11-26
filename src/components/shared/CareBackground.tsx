import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';

export type CareBackgroundVariant = 'coastal' | 'mint' | 'lavender' | 'morning' | 'ocean' | 'bloom';

const palettes: Record<CareBackgroundVariant, readonly [string, string, string]> = {
  coastal: ['#57CFF2', '#BFEFFF', '#B1F3DA'],
  mint: ['#8ADCC4', '#D8F5E9', '#BCEBDB'],
  lavender: ['#C5B4E5', '#ECE3F8', '#DDD3F2'],
  morning: ['#F5D6AD', '#FCEBDA', '#F5E1C7'],
  ocean: ['#80CFE2', '#D2F1F1', '#B4E8DF'],
  bloom: ['#C3DFCE', '#E5F0D9', '#D3E8CD'],
};

/** Decorative layers never consume layout space or intercept touches. */
export function CareBackground({
  background = '#FAF8F5',
  height = 280,
  variant = 'coastal',
}: {
  background?: string;
  height?: number;
  variant?: CareBackgroundVariant;
}) {
  const [top, middle] = palettes[variant];
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      <LinearGradient
        colors={[top, middle, background]}
        locations={[0, 0.45, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}
      />
      {variant === 'coastal' ? (
        <>
          <View className="absolute -right-[38px] top-[12px] h-[148px] w-[148px] rounded-full bg-white/15" />
          <View className="absolute -right-[13px] top-[37px] h-[98px] w-[98px] rounded-full border border-white/40" />
        </>
      ) : (
        <View className="absolute left-0 right-0 top-0" style={{ height }}>
          <Svg width="100%" height="100%" viewBox="0 0 360 280" preserveAspectRatio="xMidYMin slice">
            {variant === 'mint' && (
              <>
                <Ellipse cx={16} cy={75} rx={65} ry={112} rotation={-35} originX={16} originY={75} fill="white" opacity={0.22} />
                <Ellipse cx={344} cy={12} rx={63} ry={110} rotation={35} originX={344} originY={12} fill="white" opacity={0.26} />
              </>
            )}
            {variant === 'lavender' && (
              <>
                <Circle cx={28} cy={12} r={78} fill="white" opacity={0.22} />
                <Circle cx={350} cy={142} r={78} fill="white" opacity={0.22} />
                <Circle cx={288} cy={25} r={22} fill="white" opacity={0.35} />
                <Circle cx={325} cy={57} r={7} fill="white" opacity={0.6} />
              </>
            )}
            {variant === 'morning' && (
              <>
                {[65, 91, 117].map((r) => (
                  <Circle key={r} cx={344} cy={12} r={r} fill="none" stroke="white" strokeWidth={1.5} opacity={0.55} />
                ))}
                <Circle cx={344} cy={12} r={48} fill="#FFF7DD" opacity={0.65} />
              </>
            )}
            {variant === 'ocean' && (
              <>
                <Path d="M0 65 Q90 5 180 65 T360 54 V0 H0Z" fill="white" opacity={0.24} />
                <Path d="M0 98 Q90 38 180 98 T360 87 M0 121 Q90 61 180 121 T360 110" stroke="white" strokeWidth={1.5} fill="none" opacity={0.45} />
              </>
            )}
            {variant === 'bloom' && (
              <>
                <Path d="M360 0 C220 -40 212 110 360 104Z M360 72 C248 62 240 190 360 174Z M0 0 C110 14 98 110 0 85Z" fill="white" opacity={0.3} />
                <Path d="M360 0 Q298 80 360 174 M0 0 Q55 40 0 85" stroke="white" strokeWidth={1.5} fill="none" opacity={0.55} />
              </>
            )}
          </Svg>
        </View>
      )}
    </View>
  );
}

export function CareFooterBackground({ variant = 'coastal' }: { variant?: CareBackgroundVariant } = {}) {
  const fill = palettes[variant][2];
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      <Svg width="100%" height="100%" viewBox="0 0 360 100" preserveAspectRatio="none">
        <Path
          d={
            variant === 'ocean'
              ? 'M0 24 Q90 -6 180 24 T360 18 V100 H0Z'
              : variant === 'lavender'
                ? 'M0 28 Q70 0 145 17 Q255 42 360 8 V100 H0Z'
                : 'M0 24 C65 8 113 25 181 14 C255 2 320 -5 360 18 V100 H0Z'
          }
          fill={fill}
        />
        <Path d="M0 37 C85 14 150 34 232 21 S330 17 360 12" fill="none" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={1} />
      </Svg>
    </View>
  );
}
