import React from 'react';
import Svg, {
  Circle, Path, Rect, Line, Ellipse, G,
} from 'react-native-svg';

type Props = { width?: number; height?: number };

/**
 * ActivitiesIllustration
 * A cheerful SVG hero: figure doing a stretch pose surrounded by
 * activity icons (dumbbell, puzzle piece, leaf/wave).
 */
export const ActivitiesIllustration = ({ width = 280, height = 160 }: Props) => (
  <Svg width={width} height={height} viewBox="0 0 280 160" fill="none">

    {/* ── Background blobs ───────────────────────────────────────── */}
    <Ellipse cx="60" cy="120" rx="52" ry="34" fill="#D1EAE6" opacity="0.6" />
    <Ellipse cx="220" cy="110" rx="44" ry="30" fill="#C7E6FF" opacity="0.5" />
    <Ellipse cx="140" cy="148" rx="80" ry="18" fill="#E8F4F2" opacity="0.7" />

    {/* ── Dumbbell (top-left) ────────────────────────────────────── */}
    <G opacity="0.85">
      <Rect x="18" y="38" width="8" height="20" rx="3" fill="#0E7A67" />
      <Rect x="44" y="38" width="8" height="20" rx="3" fill="#0E7A67" />
      <Rect x="26" y="43" width="18" height="10" rx="3" fill="#0E7A67" />
    </G>

    {/* ── Puzzle piece (top-right) ───────────────────────────────── */}
    <G opacity="0.85">
      <Path
        d="M232 30 h14 a2 2 0 0 1 2 2 v6 a4 4 0 0 0 0 8 v6 a2 2 0 0 1-2 2 h-14 a2 2 0 0 1-2-2 v-6 a4 4 0 0 0 0-8 v-6 a2 2 0 0 1 2-2z"
        fill="#3B9E8E"
      />
    </G>

    {/* ── Leaf / wave (bottom-left) ─────────────────────────────── */}
    <Path
      d="M30 130 Q45 110 60 125 Q50 140 30 130z"
      fill="#5EC8B5" opacity="0.7"
    />
    <Path
      d="M35 128 Q48 114 58 124"
      stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"
    />

    {/* ── Motion lines ──────────────────────────────────────────── */}
    <Line x1="90" y1="55" x2="105" y2="55" stroke="#0E7A67" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
    <Line x1="93" y1="63" x2="104" y2="63" stroke="#0E7A67" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
    <Line x1="178" y1="52" x2="192" y2="52" stroke="#3B9E8E" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
    <Line x1="178" y1="60" x2="189" y2="60" stroke="#3B9E8E" strokeWidth="2" strokeLinecap="round" opacity="0.25" />

    {/* ── Figure — head ─────────────────────────────────────────── */}
    <Circle cx="140" cy="36" r="13" fill="#F5C97A" />
    {/* hair */}
    <Path d="M127 34 Q128 22 140 23 Q152 22 153 34" fill="#4A3728" />
    {/* eyes */}
    <Circle cx="135" cy="36" r="1.8" fill="#4A3728" />
    <Circle cx="145" cy="36" r="1.8" fill="#4A3728" />
    {/* smile */}
    <Path d="M136 41 Q140 45 144 41" stroke="#4A3728" strokeWidth="1.4" strokeLinecap="round" fill="none" />

    {/* ── Figure — body ─────────────────────────────────────────── */}
    <Rect x="128" y="49" width="24" height="32" rx="8" fill="#0E7A67" />

    {/* ── Figure — arms (stretch pose) ──────────────────────────── */}
    {/* left arm raised */}
    <Path d="M128 55 L106 42" stroke="#F5C97A" strokeWidth="7" strokeLinecap="round" />
    {/* right arm raised */}
    <Path d="M152 55 L174 42" stroke="#F5C97A" strokeWidth="7" strokeLinecap="round" />

    {/* ── Figure — legs ─────────────────────────────────────────── */}
    {/* left leg */}
    <Path d="M134 81 L125 108" stroke="#0E7A67" strokeWidth="8" strokeLinecap="round" />
    {/* right leg */}
    <Path d="M146 81 L155 108" stroke="#0E7A67" strokeWidth="8" strokeLinecap="round" />
    {/* feet */}
    <Ellipse cx="122" cy="111" rx="8" ry="5" fill="#4A3728" />
    <Ellipse cx="158" cy="111" rx="8" ry="5" fill="#4A3728" />

    {/* ── Stars / sparkles ──────────────────────────────────────── */}
    <Path d="M200 35 l2 5 l5 2 l-5 2 l-2 5 l-2-5 l-5-2 l5-2z" fill="#FFD166" opacity="0.8" />
    <Path d="M78 72 l1.5 3.5 l3.5 1.5 l-3.5 1.5 l-1.5 3.5 l-1.5-3.5 l-3.5-1.5 l3.5-1.5z" fill="#FFD166" opacity="0.6" />
    <Circle cx="218" cy="75" r="3" fill="#FFD166" opacity="0.5" />
  </Svg>
);
